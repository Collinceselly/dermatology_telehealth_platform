from django.urls import path
from . import views

urlpatterns = [   
    # path('protected-api/', views.protected_view, name='protected_api'),
    path('protected/', views.protected_api, name='protected'),

    # User Registration endpoints
    path('register/', views.register, name='register'),
    # path('verify-otp/', views.verify_otp, name='verify_otp'),
    path('verify-code/', views.verify_code, name='verify_code'),

    #User Login endpoints
    path('login/', views.login, name='login'),
    path('login-otp/', views.verify_login_otp, name='login_otp'),
    # path('admin-login', views.custom_login, name='custom_login'),

    # CSRF token endpoint
    path('get-csrf/', views.get_csrf_token, name='get_csrf_token'),
]