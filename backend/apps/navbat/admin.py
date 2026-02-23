# apps/navbat/admin.py

from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count, Q
from django.utils import timezone
from .models import (
    Specialty,
    Doctor,
    DoctorSchedule,
    AppointmentSlot,
    Appointment,
)


# ==================== SPECIALTY ====================

@admin.register(Specialty)
class SpecialtyAdmin(admin.ModelAdmin):
    """
    Mutaxassisliklar (Oftalmolagiya, Stomatologiya, etc.)
    """

    list_display = [
        'name',
        'slug',
        'doctors_count',
        'is_active_badge',
        'created_at',
    ]

    list_filter = [
        'is_active',
        'created_at',
    ]

    search_fields = [
        'name',
        'slug',
    ]

    readonly_fields = [
        'slug',
        'created_at',
        'updated_at',
        'doctors_count',
    ]

    # prepopulated_fields = {
    #     'slug': ('name',)  # name yozilganda slug avtomatik
    # }

    ordering = ['name']

    # Custom methods

    def doctors_count(self, obj):
        """Nechta shifokor bor"""
        count = obj.doctors.filter(is_active=True).count()
        return f"{count} ta"

    doctors_count.short_description = 'Shifokorlar'

    def is_active_badge(self, obj):
        """Faol/faol emas - rangli"""
        if obj.is_active:
            return format_html(
                '<span style="background-color: green; color: white; '
                'padding: 3px 10px; border-radius: 3px;">✓ Faol</span>'
            )
        return format_html(
            '<span style="background-color: red; color: white; '
            'padding: 3px 10px; border-radius: 3px;">✗ Faol emas</span>'
        )

    is_active_badge.short_description = 'Holat'


# ==================== DOCTOR SCHEDULE (INLINE) ====================

class DoctorScheduleInline(admin.StackedInline):
    """
    Shifokor sahifasida ish vaqti.
    StackedInline = vertikal (TimeField uchun qulay)
    """
    model = DoctorSchedule
    extra = 0
    max_num = 1

    fields = [
        'work_start',
        'work_end',
        'slot_minutes',
        'is_active',
    ]

    verbose_name = 'Ish vaqti'
    verbose_name_plural = 'Ish vaqti'


# ==================== DOCTOR ====================

@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    """
    Shifokorlar
    """

    list_display = [
        'full_name',
        'specialty_link',
        'room_number',
        'schedule_info',
        'slots_stats',
        'is_active_badge',
    ]

    list_filter = [
        'specialty',
        'is_active',
        'created_at',
    ]

    search_fields = [
        'full_name',
        'slug',
        'specialty__name',
        'room_number',
        'address',
    ]

    readonly_fields = [
        'slug',
        'created_at',
        'updated_at',
        'slots_stats',
        'slug',
    ]

    # prepopulated_fields = {
    #     'slug': ('full_name',)
    # }

    ordering = ['full_name']

    fieldsets = (
        ('Asosiy ma\'lumot', {
            'fields': (
                'full_name',
                'slug',
                'specialty',
            )
        }),
        ('Qabul joyi', {
            'fields': (
                'room_number',
                'address',
            )
        }),
        ('Holat', {
            'fields': (
                'is_active',
                'slots_stats',
            )
        }),
        ('Vaqtlar', {
            'fields': (
                'created_at',
                'updated_at',
            ),
            'classes': ('collapse',),
        }),
    )

    inlines = [DoctorScheduleInline]

    # Custom methods

    def specialty_link(self, obj):
        """Mutaxassislik (link bilan)"""
        url = f"/admin/navbat/specialty/{obj.specialty.id}/change/"
        return format_html(
            '<a href="{}">{}</a>',
            url,
            obj.specialty.name
        )

    specialty_link.short_description = 'Mutaxassislik'
    specialty_link.admin_order_field = 'specialty__name'

    def schedule_info(self, obj):
        """Ish vaqti qisqacha"""
        if hasattr(obj, 'schedule') and obj.schedule:
            sched = obj.schedule
            return f"{sched.work_start.strftime('%H:%M')} - {sched.work_end.strftime('%H:%M')} ({sched.slot_minutes} min)"
        return format_html('<span style="color: red;">Belgilanmagan</span>')

    schedule_info.short_description = 'Ish vaqti'

    def slots_stats(self, obj):
        """Bugungi slotlar statistikasi"""
        today = timezone.localdate()

        total = obj.slots.filter(date=today).count()
        booked = obj.slots.filter(date=today, status='BOOKED').count()
        free = total - booked

        if total == 0:
            return "Slotlar yaratilmagan"

        percentage = (booked / total) * 100 if total > 0 else 0

        return format_html(
            '<div style="width: 200px;">'
            '<div style="background-color: #e0e0e0; border-radius: 5px; overflow: hidden;">'
            '<div style="background-color: #4caf50; width: {}%; padding: 5px; color: white; text-align: center;">'
            '{}/{} ({}%)'
            '</div>'
            '</div>'
            '<small>Band: {} | Bo\'sh: {}</small>'
            '</div>',
            percentage,
            booked, total, percentage,
            booked, free
        )

    slots_stats.short_description = 'Bugun (Band/Jami)'

    def is_active_badge(self, obj):
        """Faol/faol emas"""
        if obj.is_active:
            return format_html(
                '<span style="background-color: green; color: white; '
                'padding: 3px 10px; border-radius: 3px;">✓ Faol</span>'
            )
        return format_html(
            '<span style="background-color: red; color: white; '
            'padding: 3px 10px; border-radius: 3px;">✗ Faol emas</span>'
        )

    is_active_badge.short_description = 'Holat'


# ==================== DOCTOR SCHEDULE ====================

@admin.register(DoctorSchedule)
class DoctorScheduleAdmin(admin.ModelAdmin):
    """
    Shifokorlar ish vaqti (alohida sahifa)
    """

    list_display = [
        'doctor',
        'work_start',
        'work_end',
        'slot_minutes',
        'total_slots_per_day',
        'is_active',
    ]

    list_filter = [
        'is_active',
        'slot_minutes',
        'created_at',
    ]

    search_fields = [
        'doctor__full_name',
        'doctor__specialty__name',
    ]

    readonly_fields = [
        'created_at',
        'updated_at',
        'total_slots_per_day',
    ]

    ordering = ['doctor__full_name']

    # Custom method

    def total_slots_per_day(self, obj):
        """Kuniga nechta slot"""
        from datetime import datetime, timedelta

        start = datetime.combine(timezone.localdate(), obj.work_start)
        end = datetime.combine(timezone.localdate(), obj.work_end)

        total_minutes = (end - start).seconds // 60
        slots = total_minutes // obj.slot_minutes

        return f"{slots} ta slot"

    total_slots_per_day.short_description = 'Kuniga slotlar'


# ==================== APPOINTMENT SLOT ====================

@admin.register(AppointmentSlot)
class AppointmentSlotAdmin(admin.ModelAdmin):
    """
    Vaqt slotlari
    """

    list_display = [
        'id_short',
        'doctor_name',
        'date',
        'start_time',
        'status_badge',
        'appointment_info',
        'created_at',
    ]

    list_filter = [
        'status',
        'date',
        'doctor',
        'created_at',
    ]

    search_fields = [
        'id',
        'doctor__full_name',
    ]

    readonly_fields = [
        'id',
        'created_at',
        'updated_at',
    ]

    date_hierarchy = 'date'

    ordering = ['-date', 'start_time']

    list_per_page = 50

    # Custom methods

    def id_short(self, obj):
        """UUID qisqartma"""
        return str(obj.id)[:8]

    id_short.short_description = 'ID'

    def doctor_name(self, obj):
        """Shifokor ismi"""
        return obj.doctor.full_name

    doctor_name.short_description = 'Shifokor'
    doctor_name.admin_order_field = 'doctor__full_name'

    def status_badge(self, obj):
        """Status rangli"""
        colors = {
            'FREE': 'green',
            'BOOKED': 'orange',
        }
        color = colors.get(obj.status, 'gray')

        return format_html(
            '<span style="background-color: {}; color: white; '
            'padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_status_display()
        )

    status_badge.short_description = 'Status'

    def appointment_info(self, obj):
        """Kim band qilgan"""
        if obj.status == 'BOOKED' and hasattr(obj, 'appointment'):
            appt = obj.appointment
            user = appt.user
            return format_html(
                '<a href="/admin/navbat/appointment/{}/change/">{}</a>',
                appt.id,
                user.get_full_name() or user.username
            )
        return '-'

    appointment_info.short_description = 'Bemor'


# ==================== APPOINTMENT ====================

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    """
    Navbatlar
    """

    list_display = [
        'id_short',
        'user_name',
        'doctor_info',
        'appointment_datetime',
        'status_badge',
        'created_at',
    ]

    list_filter = [
        'status',
        'slot__date',
        'slot__doctor',
        'created_at',
    ]

    search_fields = [
        'id',
        'user__username',
        'user__first_name',
        'user__last_name',
        'slot__doctor__full_name',
    ]

    readonly_fields = [
        'id',
        'created_at',
        'updated_at',
        'appointment_details',
    ]

    date_hierarchy = 'created_at'

    ordering = ['-created_at']

    list_per_page = 50

    fieldsets = (
        ('Asosiy', {
            'fields': (
                'id',
                'user',
                'slot',
            )
        }),
        ('Status', {
            'fields': (
                'status',
            )
        }),
        ('Ma\'lumot', {
            'fields': (
                'appointment_details',
            )
        }),
        ('Vaqtlar', {
            'fields': (
                'created_at',
                'updated_at',
            ),
            'classes': ('collapse',),
        }),
    )

    # Custom methods

    def id_short(self, obj):
        """UUID qisqartma"""
        return str(obj.id)[:8]

    id_short.short_description = 'ID'

    def user_name(self, obj):
        """Bemor ismi"""
        full_name = obj.user.get_full_name()
        if full_name:
            return f"{full_name} ({obj.user.username})"
        return obj.user.username

    user_name.short_description = 'Bemor'
    user_name.admin_order_field = 'user__username'

    def doctor_info(self, obj):
        """Shifokor + Mutaxassislik"""
        doctor = obj.slot.doctor
        return format_html(
            '<strong>{}</strong><br/><small>{}</small>',
            doctor.full_name,
            doctor.specialty.name
        )

    doctor_info.short_description = 'Shifokor'

    def appointment_datetime(self, obj):
        """Sana va vaqt"""
        return format_html(
            '<strong>{}</strong><br/><small>{}</small>',
            obj.slot.date.strftime('%d.%m.%Y'),
            obj.slot.start_time.strftime('%H:%M')
        )

    appointment_datetime.short_description = 'Sana/Vaqt'
    appointment_datetime.admin_order_field = 'slot__date'

    def status_badge(self, obj):
        """Status rangli"""
        colors = {
            'BOOKED': 'green',
            'CANCELED': 'red',
        }
        color = colors.get(obj.status, 'gray')

        return format_html(
            '<span style="background-color: {}; color: white; '
            'padding: 3px 10px; border-radius: 3px; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display()
        )

    status_badge.short_description = 'Status'

    def appointment_details(self, obj):
        """Batafsil ma'lumot"""
        doctor = obj.slot.doctor

        html = f"""
        <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px; font-weight: bold;">Bemor:</td>
                <td style="padding: 8px;">{obj.user.get_full_name() or obj.user.username}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px; font-weight: bold;">Shifokor:</td>
                <td style="padding: 8px;">{doctor.full_name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px; font-weight: bold;">Mutaxassislik:</td>
                <td style="padding: 8px;">{doctor.specialty.name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px; font-weight: bold;">Sana:</td>
                <td style="padding: 8px;">{obj.slot.date.strftime('%d.%m.%Y')}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px; font-weight: bold;">Vaqt:</td>
                <td style="padding: 8px;">{obj.slot.start_time.strftime('%H:%M')}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px; font-weight: bold;">Xona:</td>
                <td style="padding: 8px;">{doctor.room_number or '-'}</td>
            </tr>
            <tr>
                <td style="padding: 8px; font-weight: bold;">Manzil:</td>
                <td style="padding: 8px;">{doctor.address or '-'}</td>
            </tr>
        </table>
        """

        return format_html(html)

    appointment_details.short_description = 'Navbat ma\'lumotlari'


# ==================== CUSTOM ACTIONS ====================

@admin.action(description='Tanlangan navbatlarni bekor qilish')
def cancel_appointments(modeladmin, request, queryset):
    """Bir nechta navbatni bekor qilish"""
    updated = 0
    for appointment in queryset.filter(status='BOOKED'):
        appointment.status = 'CANCELED'
        appointment.save()

        # Slotni bo'shatish
        slot = appointment.slot
        slot.status = 'FREE'
        slot.save()

        updated += 1

    modeladmin.message_user(
        request,
        f"{updated} ta navbat bekor qilindi va slotlar bo'shatildi."
    )


# Appointment admin'ga action qo'shish
AppointmentAdmin.actions = [cancel_appointments]