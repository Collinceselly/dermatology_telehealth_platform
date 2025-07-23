from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.custom_login, name='custom_login'),
    path('verify-otp/', views.verify_otp, name='verify_otp'),
    path('protected/', views.protected_view, name='protected'),
    path('protected/', views.protected_api, name='protected_api'),
    path('register/', views.register, name='register'),
    path('verify-code/', views.verify_code, name='verify_code'),
]