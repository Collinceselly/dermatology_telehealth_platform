from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
import phonenumbers
from django.core.exceptions import ValidationError
from fernet_fields import EncryptedCharField
import hashlib

def validate_phone_number(value):
  try:
    parsed = phonenumbers.parse(value, None)
    if not phonenumbers.is_valid_number(parsed):
      raise ValidationError('Invalid phone number format. Use E.164 format (e.g., +1234567890).')
  except phonenumbers.NumberParseException:
    raise ValidationError('Invalid phone number format. Use E.164 format (e.g., +1234567890).')


class CustomUserManager(BaseUserManager):
  def create_user(self, email, password=None, **extra_fields):
    if not email:
      raise ValueError('The email field must be set')
    email = self.normalize_email(email)
    user = self.model(email=email, **extra_fields)
    user.set_password(password)
    user.save(using=self._db)
    return user
  
  def create_superuser(self, email, password=None, **extra_fields):
    extra_fields.setdefault('is_staff', True)
    extra_fields.setdefault('is_superuser', True)
    extra_fields.setdefault('is_active', True)

    if extra_fields.get('is_staff') is not True:
      raise ValueError('Superuser must have is_staff=True.')
    if extra_fields.get('is_superuser') is not True:
      raise ValueError('Superuser must have is_superuser=True.')
    
    return self.create_user(email, password, **extra_fields)
  

class CustomUser(AbstractBaseUser, PermissionsMixin):
  email = models.EmailField(unique=True)
  first_name = models.CharField(max_length=50)
  last_name = models.CharField(max_length=50)
  phone_number = EncryptedCharField(max_length=20, validators=[validate_phone_number])
  phone_number_hash = models.CharField(max_length=255, unique=True, editable=False, null=True) # SHA-256 hash
  is_active = models.BooleanField(default=False) # For email verification
  is_staff = models.BooleanField(default=False)
  date_joined = models.DateTimeField(auto_now_add=True)

  objects = CustomUserManager()

  USERNAME_FIELD = 'email'
  REQUIRED_FIELDS = ['first_name', 'last_name', 'phone_number']

  def save(self, *args, **kwargs):
    # Compute SHA-256 hash of phone_number for uniqueness
    if self.phone_number:
      self.phone_number_hash = hashlib.sha256(self.phone_number.encode('utf-8')).hexdigest()
    super().save(*args, **kwargs)

  def __str__(self):
    return self.email