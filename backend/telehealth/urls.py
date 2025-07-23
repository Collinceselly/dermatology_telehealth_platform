"""
URL configuration for telehealth project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from authentication.models import CustomUser
from authentication.custom_admin import custom_admin_site


# Import urlpatterns from django-two-factor-auth explicitly
# from two_factor.urls import urlpatterns as two_factor_urls

# --- CRITICAL FOR ADMIN 2FA ENFORCEMENT ---
# Import the custom AdminSite provided by django-two-factor-auth
# from two_factor.admin import AdminSiteOTPRequired

# Replace Django's default admin.site with the 2FA-enabled version
# admin.site.__class__ = AdminSiteOTPRequired
# --- END CRITICAL FOR ADMIN 2FA ENFORCEMENT ---


# urlpatterns = [
#     path('admin/', admin.site.urls),
#     path('', include(two_factor_urls, namespace='two_factor')),
#     path('api/', include('rest_framework.urls')),
# ]

urlpatterns = [
    path('admin/', custom_admin_site.urls),
    # path('two_factor/', include(two_factor_urls, namespace='two_factor')),
    # path('accounts/', include('django.contrib.auth.urls')),
    # path('api/', include('rest_framework.urls')),
    path('user/', include('authentication.urls')),
]
