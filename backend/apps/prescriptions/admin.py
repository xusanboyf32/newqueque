# apps/prescriptions/admin.py
from django.contrib import admin
from .models import Medication, Prescription, PrescriptionItem


# ── DORI BAZASI ───────────────────────────────────────────────────
@admin.register(Medication)
class MedicationAdmin(admin.ModelAdmin):
    list_display  = ['name', 'price_per_pack', 'units_per_pack', 'unit', 'is_active']
    list_editable = ['price_per_pack', 'units_per_pack', 'is_active']
    search_fields = ['name']
    list_filter   = ['is_active', 'unit']
    ordering      = ['name']


# ── RETSEPT ITEM (inline) ─────────────────────────────────────────
# O'zgartiring:
class PrescriptionItemInline(admin.TabularInline):
    model   = PrescriptionItem
    extra   = 1
    fields  = [
        'medication',
        'doses_per_day', 'duration_days',
        'unit_price', 'units_per_pack', 'pack_unit', 'measure_type',
        'note',
    ]
    readonly_fields = ['unit_price', 'units_per_pack', 'pack_unit', 'measure_type']
#
# ── RETSEPT ───────────────────────────────────────────────────────
@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    list_display   = ['id', 'patient', 'doctor', 'diagnosis', 'barcode', 'valid_until', 'created_at']
    list_filter    = ['created_at', 'doctor']
    search_fields  = ['patient__first_name', 'patient__last_name', 'diagnosis', 'barcode']
    readonly_fields = ['barcode', 'created_at']
    ordering       = ['-created_at']
    inlines        = [PrescriptionItemInline]