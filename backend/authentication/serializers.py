from rest_framework import serializers
from .models import CustomUser
import phonenumbers
import hashlib
from django.core.cache import cache

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=12)
    confirm_password = serializers.CharField(write_only=True, min_length=12)

    class Meta:
        model = CustomUser
        fields = ['email', 'first_name', 'last_name', 'phone_number', 'password', 'confirm_password']
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
            'phone_number': {'required': True},
        }

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords must match."})
        try:
            parsed = phonenumbers.parse(data['phone_number'], None)
            if not phonenumbers.is_valid_number(parsed):
                raise serializers.ValidationError({"phone_number": "Invalid phone number format. Use E.164 format (e.g., +1234567890)."})
        except phonenumbers.NumberParseException:
            raise serializers.ValidationError({"phone_number": "Invalid phone number format. Use E.164 format (e.g., +1234567890)."})
        if CustomUser.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({"email": "This email is already registered."})
        phone_hash = hashlib.sha256(data['phone_number'].encode('utf-8')).hexdigest()
        if CustomUser.objects.filter(phone_number_hash=phone_hash).exists():
            raise serializers.ValidationError({"phone_number": "This phone number is already registered."})
        return data

    def create(self, validated_data):
        # Store user data in cache instead of creating user immediately
        validated_data.pop('confirm_password')
        cache_key = f"pending_user_{validated_data['email']}"
        cache.set(cache_key, validated_data, timeout=600)  # 10-minute expiry
        return validated_data

class VerifyCodeSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6, min_length=6)

    def validate(self, data):
        cache_key = f"pending_user_{data['email']}"
        user_data = cache.get(cache_key)
        if not user_data:
            raise serializers.ValidationError({"email": "No pending registration found or session expired."})
        code_key = f"verification_code_{data['email']}"
        stored_code = cache.get(code_key)
        if not stored_code or stored_code != data['code']:
            raise serializers.ValidationError({"code": "Invalid or expired verification code."})
        return data


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate_email(self, value):
        return value.lower()
    
    def validate(self, data):
        return data
    

class LoginVerifyCodeSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6, min_length=6)

    def validate_code(self, value):
        if not value.isdigit():
            raise serializers.ValidationError('Code must be a 6-digit number.')
        return value.strip()
    
    def validate_email(self, value):
        if not CustomUser.objects.filter(email__iexact=value.lower()).exists():
            raise serializers.ValidationError('User not found.')
        return value.lower()
    
    def validate(self, data):
        return data