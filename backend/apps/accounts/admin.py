"""
Django Admin Panel
Superadmin uchun chiroyli interface
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, PatientProfile


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom User Admin"""

    list_display = ['phone_number', 'get_full_name', 'role', 'is_active', 'created_at']
    list_filter = ['role', 'is_active', 'is_staff', 'created_at']
    search_fields = ['phone_number', 'first_name', 'last_name', 'email']
    ordering = ['-created_at']

    fieldsets = (
        ('Asosiy ma\'lumotlar', {
            'fields': ('phone_number', 'password')
        }),
        ('Shaxsiy ma\'lumotlar', {
            'fields': ('first_name', 'last_name', 'email', 'date_of_birth')
        }),
        ('Ruxsatnomalar', {
            'fields': ('role', 'is_active', 'is_staff', 'is_superuser')
        }),
        ('Muhim sanalar', {
            'fields': ('last_login', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    add_fieldsets = (
        ('Yangi foydalanuvchi', {
            'classes': ('wide',),
            'fields': (
                'phone_number', 'first_name', 'last_name',
                'role', 'password1', 'password2'
            ),
        }),
    )

    readonly_fields = ['created_at', 'updated_at', 'last_login']

    def get_full_name(self, obj):
        return obj.get_full_name()

    get_full_name.short_description = 'Ism Familiya'


@admin.register(PatientProfile)
class PatientProfileAdmin(admin.ModelAdmin):
    """Bemor Profili Admin"""

    list_display = ['get_patient_name', 'get_phone', 'gender', 'blood_type', 'updated_at']
    list_filter = ['gender', 'blood_type', 'created_at']
    search_fields = ['user__first_name', 'user__last_name', 'user__phone_number']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Bemor', {
            'fields': ('user',)
        }),
        ('Shaxsiy', {
            'fields': ('gender', 'address')
        }),
        ('Tibbiy', {
            'fields': ('blood_type', 'allergies', 'chronic_diseases')
        }),
        ('Doktor eslatmalari', {
            'fields': ('notes',)
        }),
    )

    def get_patient_name(self, obj):
        return obj.user.get_full_name()

    get_patient_name.short_description = 'Bemor'

    def get_phone(self, obj):
        return obj.user.phone_number

    get_phone.short_description = 'Telefon'


# Admin site customization
admin.site.site_header = "Poliklinika Boshqaruv Tizimi"
admin.site.site_title = "Poliklinika Admin"
admin.site.index_title = "Boshqaruv Paneli"

 # JWT tokenlarni yashirish
try:
    from rest_framework_simplejwt.token_blacklist.models import (
        OutstandingToken, BlacklistedToken
    )
    admin.site.unregister(OutstandingToken)
    admin.site.unregister(BlacklistedToken)
except Exception:
    pass
