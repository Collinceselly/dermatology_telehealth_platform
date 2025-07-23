# /home/collince/Dermatology_telehealth_platform/backend/authentication/custom_admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
# from two_factor.admin import AdminSiteOTPRequiredMixin
from .models import CustomUser

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ['email', 'first_name', 'last_name', 'is_active', 'is_staff', 'is_verified']
    list_filter = ['is_active', 'is_staff', 'is_verified']
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['email']
    readonly_fields = ('date_joined', 'last_login')
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'phone_number')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_verified', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'phone_number', 'password1', 'password2'),
        }),
    )

class CustomAdminSite(admin.AdminSite):
    def has_permission(self, request):
        user = request.user
        if not user.is_authenticated:
            return False
        return user.is_active and user.is_staff and user.get_is_verified()

custom_admin_site = CustomAdminSite(name='custom_admin')
custom_admin_site.register(CustomUser, CustomUserAdmin)