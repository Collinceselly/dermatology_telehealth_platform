from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from django.contrib import messages
from django_otp.plugins.otp_static.models import StaticDevice, StaticToken
from django.core.mail import send_mail
from django.conf import settings
from django_otp.decorators import otp_required
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import UserRegisterSerializer, VerifyCodeSerializer
from .models import CustomUser
import random
import string
from django.core.cache import cache
import africastalking

def generate_otp_code(length=6):
    return ''.join(random.choices(string.digits, k=length))

def custom_login(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')
        user = authenticate(request, username=email, password=password)
        if user is not None:
            if user.is_staff or user.is_superuser:
                login(request, user)
                return redirect('admin:index')
            device, created = StaticDevice.objects.get_or_create(user=user, name='static')
            device.token_set.all().delete()
            otp_code = generate_otp_code()
            StaticToken.objects.create(device=device, token=otp_code)
            send_mail(
                'Your Login OTP',
                f'Your one-time code is: {otp_code}',
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
            if settings.AFRICASTALKING_USERNAME and settings.AFRICASTALKING_API_KEY:
                africastalking.initialize(settings.AFRICASTALKING_USERNAME, settings.AFRICASTALKING_API_KEY)
                sms = africastalking.SMS
                sms.send(f"Your login OTP is: {otp_code}", [user.phone_number], settings.AFRICASTALKING_SENDER_ID)
            login(request, user, backend='django.contrib.auth.backends.ModelBackend')
            return redirect('verify_otp')
        else:
            messages.error(request, 'Invalid email or password.')
    return render(request, 'authentication/login.html')

def verify_otp(request):
    if request.method == 'POST':
        otp_code = request.POST.get('otp_code')
        user = request.user
        if user.is_authenticated:
            device = StaticDevice.objects.filter(user=user).first()
            if device and device.verify_token(otp_code):
                device.token_set.filter(token=otp_code).delete()
                return redirect('protected')
            else:
                messages.error(request, 'Invalid OTP code.')
    return render(request, 'authentication/verify_otp.html')

@otp_required
def protected_view(request):
    return render(request, 'authentication/protected.html', {'user': request.user})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
@otp_required
def protected_api(request):
    return Response({'message': f'Hello, {request.user.email}! You are 2FA authenticated.'})

@api_view(['POST'])
def register(request):
    serializer = UserRegisterSerializer(data=request.data)
    if serializer.is_valid():
        user_data = serializer.save()
        email = user_data['email']
        code = generate_otp_code()
        cache_key = f"verification_code_{email}"
        cache.set(cache_key, code, timeout=600)  # 10-minute expiry
        # Send verification code via email
        send_mail(
            'Your Registration Verification Code',
            f'Your verification code is: {code}',
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
        # Send verification code via SMS
        if settings.AFRICASTALKING_USERNAME and settings.AFRICASTALKING_API_KEY:
            africastalking.initialize(settings.AFRICASTALKING_USERNAME, settings.AFRICASTALKING_API_KEY)
            sms = africastalking.SMS
            sms.send(f"Your registration verification code is: {code}", [user_data['phone_number']], settings.AFRICASTALKING_SENDER_ID)
        return Response({"message": "Verification code sent to email and phone.", "email": email}, status=200)
    return Response(serializer.errors, status=400)

@api_view(['POST'])
def verify_code(request):
    serializer = VerifyCodeSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        cache_key = f"pending_user_{email}"
        user_data = cache.get(cache_key)
        if not user_data:
            return Response({"error": "No pending registration found or session expired."}, status=400)
        user = CustomUser.objects.create_user(
            email=user_data['email'],
            password=user_data['password'],
            first_name=user_data['first_name'],
            last_name=user_data['last_name'],
            phone_number=user_data['phone_number'],
            is_active=True,  # Activate user after verification
            is_staff=False,
            is_superuser=False,
        )
        cache.delete(cache_key)
        cache.delete(f"verification_code_{email}")
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            },
            'redirect': '/login/'
        }, status=201)
    return Response(serializer.errors, status=400)