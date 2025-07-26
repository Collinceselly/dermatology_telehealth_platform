# /home/collince/Dermatology_telehealth_platform/backend/authentication/views.py
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
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from .serializers import UserRegisterSerializer, VerifyCodeSerializer, LoginSerializer, LoginVerifyCodeSerializer
from .models import CustomUser
import random
import string
from django.core.cache import cache
import africastalking
import logging
from django.middleware.csrf import get_token
from datetime import timedelta

logger = logging.getLogger(__name__)

def generate_otp_code(length=6):
    code = ''.join(random.choices(string.digits, k=length))
    logger.debug(f"Generated OTP: {code}")
    return code

@api_view(['GET'])
def get_csrf_token(request):
    return Response({'csrfToken': get_token(request)})

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
# @otp_required
def protected_api(request):
    logger.debug(f"ProtectedAPI: User={request.user.email if request.user.is_authenticated else 'None'}, Cookies={request.COOKIES}")
    return Response({'message': f'Hello, {request.user.email}! You are authenticated.'})

@api_view(['POST'])
def register(request):
    logger.debug(f"Register: Received data={request.data}")
    serializer = UserRegisterSerializer(data=request.data)
    if not serializer.is_valid():
        logger.debug(f"Register failed: {serializer.errors}")
        return Response(serializer.errors, status=400)
    
    user_data = serializer.save()
    email = user_data['email'].lower()
    logger.debug(f"Register: Validated email={email}, UserData={user_data | {'password': '[REDACTED]'}}")
    
    code = generate_otp_code()
    cache_key = f"verification_code_{email}"
    pending_key = f"pending_user_{email}"
    
    cache.set(cache_key, code, timeout=1800)
    cache.set(pending_key, user_data, timeout=1800)
    cached_code = cache.get(cache_key)
    cached_user_data = cache.get(pending_key)
    
    logger.debug(f"Register: Email={email}, OTP={code}, CachedCode={cached_code}, CachedUserData={cached_user_data | {'password': '[REDACTED]'}}")
    
    if cached_code != code or cached_user_data != user_data:
        logger.error(f"Register: Cache set failed for {email}. CachedCode={cached_code}, CachedUserData={cached_user_data}")
        return Response({"error": "Failed to store registration data in cache"}, status=500)
    
    try:
        send_mail(
            'Your Registration Verification Code',
            f'Your verification code is: {code}',
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
        logger.debug(f"Register: Email sent to {email}")
    except Exception as e:
        logger.error(f"Register: Email failed for {email}: {str(e)}")
        return Response({"error": "Failed to send email"}, status=500)
    
    if settings.AFRICASTALKING_USERNAME and settings.AFRICASTALKING_API_KEY:
        try:
            africastalking.initialize(settings.AFRICASTALKING_USERNAME, settings.AFRICASTALKING_API_KEY)
            sms = africastalking.SMS
            sms.send(f"Your registration verification code is: {code}", [user_data['phone_number']], settings.AFRICASTALKING_SENDER_ID)
            logger.debug(f"Register: SMS sent to {user_data['phone_number']}")
        except Exception as e:
            logger.error(f"Register: SMS failed for {user_data['phone_number']}: {str(e)}")
    
    return Response({"message": "Verification code sent to email and phone.", "email": email}, status=200)

@api_view(['POST'])
def verify_code(request):
    logger.debug(f"VerifyCode: Received data={request.data}")
    serializer = VerifyCodeSerializer(data=request.data)
    if not serializer.is_valid():
        logger.debug(f"VerifyCode failed: {serializer.errors}")
        return Response(serializer.errors, status=400)
    
    email = serializer.validated_data['email'].lower()
    code = serializer.validated_data['code'].strip()
    cache_key = f"pending_user_{email}"
    verification_cache_key = f"verification_code_{email}"
    
    user_data = cache.get(cache_key)
    stored_code = cache.get(verification_cache_key)
    logger.debug(f"VerifyCode: Email={email}, Code={code}, StoredCode={stored_code}, UserData={user_data}")
    
    if user_data is None or stored_code is None:
        logger.debug(f"VerifyCode failed: Cache miss for {email}")
        return Response({"error": "No pending registration found. Please register again."}, status=400)
    
    if code != stored_code:
        logger.debug(f"VerifyCode failed: Code mismatch for {email}")
        return Response({"error": "Invalid verification code."}, status=400)
    
    try:
        user = CustomUser.objects.create_user(
            email=user_data['email'],
            password=user_data['password'],
            first_name=user_data['first_name'],
            last_name=user_data['last_name'],
            phone_number=user_data['phone_number'],
            is_active=True,
            is_staff=False,
            is_superuser=False,
        )
        cache.delete(cache_key)
        cache.delete(verification_cache_key)
        logger.debug(f"VerifyCode: User created for {email}")
        return Response({
            'message': 'Verification successful. Please log in.',
            'user': {
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            },
            'redirect': '/login/'
        }, status=201)
    except Exception as e:
        logger.error(f"VerifyCode: User creation failed for {email}: {str(e)}")
        return Response({"error": "Failed to create user"}, status=500)

@api_view(['POST'])
def login(request):
    logger.debug(f"Login: Received data={request.data}")
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        logger.debug(f"Login failed: {serializer.errors}")
        return Response(serializer.errors, status=400)
    
    email = serializer.validated_data['email'].lower()
    password = serializer.validated_data['password']
    user = authenticate(request, username=email, password=password)
    
    if user is None:
        logger.debug(f"Login failed: Invalid credentials for {email}")
        return Response({"error": "Invalid email or password"}, status=401)
    
    if user.is_staff or user.is_superuser:
        logger.debug(f"Login: Admin user {email} redirected to admin panel")
        return Response({"message": "Admin users should log in via admin panel"}, status=403)
    
    # Generate and store OTP
    device, created = StaticDevice.objects.get_or_create(user=user, name='static')
    device.token_set.all().delete()
    otp_code = generate_otp_code()
    StaticToken.objects.create(device=device, token=otp_code)
    
    # Store OTP in cache for additional security
    cache_key = f"login_otp_{email}"
    cache.set(cache_key, otp_code, timeout=1800)  # 30 minutes
    cached_otp = cache.get(cache_key)
    logger.debug(f"Login: Email={email}, OTP={otp_code}, CachedOTP={cached_otp}")
    
    if cached_otp != otp_code:
        logger.error(f"Login: Cache set failed for {email}")
        return Response({"error": "Failed to store OTP"}, status=500)
    
    # Send OTP via email
    try:
        send_mail(
            'Your Login OTP',
            f'Your one-time code is: {otp_code}',
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
        logger.debug(f"Login: Email sent to {email}")
    except Exception as e:
        logger.error(f"Login: Email failed for {email}: {str(e)}")
        return Response({"error": "Failed to send OTP email"}, status=500)
    
    # Send OTP via SMS
    if settings.AFRICASTALKING_USERNAME and settings.AFRICASTALKING_API_KEY:
        try:
            africastalking.initialize(settings.AFRICASTALKING_USERNAME, settings.AFRICASTALKING_API_KEY)
            sms = africastalking.SMS
            sms.send(f"Your login OTP is: {otp_code}", [user.phone_number], settings.AFRICASTALKING_SENDER_ID)
            logger.debug(f"Login: SMS sent to {user.phone_number}")
        except Exception as e:
            logger.error(f"Login: SMS failed for {user.phone_number}: {str(e)}")
    
    # Log user in to maintain session
    # login(request, user, backend='django.contrib.auth.backends.ModelBackend')
    
    return Response({
        "message": "OTP sent to email and phone.",
        "email": email,
        "redirect": "/login-otp/"
    }, status=200)

@api_view(['POST'])
def verify_login_otp(request):
    logger.debug(f"VerifyLoginOTP: Received data={request.data}")
    serializer = LoginVerifyCodeSerializer(data=request.data)
    if not serializer.is_valid():
        logger.debug(f"VerifyLoginOTP failed: {serializer.errors}")
        return Response(serializer.errors, status=400)
    
    email = serializer.validated_data['email'].lower()
    code = serializer.validated_data['code'].strip()
    cache_key = f"login_otp_{email}"
    
    user = CustomUser.objects.filter(email=email).first()
    if not user:
        logger.debug(f"VerifyLoginOTP failed: No user found for {email}")
        return Response({"error": "User not found"}, status=400)
    
    stored_otp = cache.get(cache_key)
    device = StaticDevice.objects.filter(user=user).first()
    logger.debug(f"VerifyLoginOTP: Email={email}, Code={code}, StoredOTP={stored_otp}")
    
    if stored_otp is None or not device or not device.verify_token(code):
        logger.debug(f"VerifyLoginOTP failed: Invalid OTP or cache miss for {email}")
        return Response({"error": "Invalid OTP"}, status=400)
    
    # Clear OTP
    cache.delete(cache_key)
    device.token_set.filter(token=code).delete()
    
    # Generate JWT tokens
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)
    logger.debug(f"VerifyLoginOTP: JWT generated for {email}")
    
    response = Response({
        "message": "Login successful",
        "user": {
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
        },
        "redirect": "/patient-dashboard/"
    }, status=200)

    response.set_cookie(
        key='access_token',
        value=access_token,
        httponly=True,
        secure=settings.JWT_COOKIE_SECURE, # True in production
        samesite='Lax',
        path='/',
        max_age=5 * 60 # 5 Minutes
    )

    response.set_cookie(
        key='refresh_token',
        value=refresh_token,
        httponly=True,
        secure=settings.JWT_COOKIE_SECURE, # True for production
        samesite='Lax',
        path='/',
        max_age=24 * 60 * 60 # 1 day
    )

    return response


# The logout view when invoked deletes the access and refresh tokens from the cookies thereby completely logging out a user and preventing access to the endpoints untill a new login is made.
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        refresh_token = request.COOKIES.get('refresh_token')
        if not refresh_token:
            logger.debug("Logout: No refresh token provided")
            return Response({"error": "No refresh token provided"}, status=400)
        
        token = RefreshToken(refresh_token)
        token.blacklist()
        logger.debug(f"Logout: Refresh token blacklisted for user {request.user.email}")
        
        response = Response({"message": "Successfully logged out"}, status=200)
        response.delete_cookie('access_token', path='/')
        response.delete_cookie('refresh_token', path='/')
        return response
    except TokenError as e:
        logger.error(f"Logout failed: {str(e)}")
        return Response({"error": "Failed to log out"}, status=400)
    


# A view that serves the funcitonality of extending the user session by issuing a new access_token when the current one expires, using a long-lived refresh_token preventing frequent logouts and allowing seamless session continuation
class CustomTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get('refresh_token')
        if not refresh_token:
            logger.debug("TokenRefresh: No refresh token provided in cookies")
            return Response({"error": "No refresh token provided"}, status=400)
        
        try:
             # Create a mutable copy of request data
             data = dict(request.data)
             data['refresh'] = refresh_token
             request._full_data = data # Update request data
             response = super().post(request, *args, **kwargs)
            
             if response.status_code == 200:
                new_access_token = response.data.get('access')
                logger.debug(f"TokenRefresh: New access token generated for {request.user.email if request.user.is_authenticated else 'anonymous'}, Accesstoken={new_access_token[:10]}...")
                response.set_cookie(
                    key='access_token',
                    value=new_access_token,
                    httponly=True,
                    secure=settings.JWT_COOKIE_SECURE,
                    samesite='Lax',
                    path='/',
                    max_age=5 * 60
                )
                # Handle refresh token rotation
                if settings.SIMPLE_JWT.get('ROTATE_REFRESH_TOKENS', False):
                    new_refresh_token = response.data.get('refresh')
                    if new_refresh_token:
                        logger.debug(f"TokenRefresh: New refresh token generated for {request.user.email if request.user.is_authenticated else 'anonymous'}, RefreshToken={new_refresh_token[:10]}...")
                        response.set_cookie(
                            key='refresh_token',
                            value=new_refresh_token,
                            httponly=True,
                            secure=settings.JWT_COOKIE_SECURE,
                            samesite='Lax',
                            path='/',
                            max_age=24 * 60 * 60
                        )
             return response
        except InvalidToken as e:
            logger.error(f"TokenRefresh failed: Invalid token {refresh_token[:10]}... - {str(e)}")
            return Response({"error": str(e)}, status=401)
        except TokenError as e:
            logger.error(f"TokenRefresh failed: {str(e)}")
            return Response({"error": str(e)}, status=401)