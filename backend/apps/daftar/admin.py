# apps/daftar/admin.py

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import (
    MedicalCard,
    Encounter,
    EncounterDiagnosis,
    # Prescription,
    # PrescriptionItem,
    Allergy,
    ChronicDisease,
    VaccinationEvent,
)


# ==================== INLINE CLASSES ====================

class AllergyInline(admin.TabularInline):
    """MedicalCard ichida allergiyalar"""
    model = Allergy
    extra = 0
    fields = ['allergen', 'severity', 'reaction', 'noted_at']
    verbose_name = 'Allergiya'
    verbose_name_plural = 'Allergiyalar'


class ChronicDiseaseInline(admin.TabularInline):
    """MedicalCard ichida surunkali kasalliklar"""
    model = ChronicDisease
    extra = 0
    fields = ['name', 'diagnosed_at', 'status', 'note']
    verbose_name = 'Surunkali kasallik'
    verbose_name_plural = 'Surunkali kasalliklar'


class EncounterDiagnosisInline(admin.TabularInline):
    """Encounter ichida tashxislar"""
    model = EncounterDiagnosis
    extra = 1
    fields = ['disease_name', 'icd10', 'is_primary']
    verbose_name = 'Tashxis'
    verbose_name_plural = 'Tashxislar'


# class PrescriptionItemInline(admin.TabularInline):
#     """Prescription ichida dorilar"""
#     model = PrescriptionItem
#     extra = 1
#     fields = ['medication_name', 'dosage', 'frequency', 'duration_days']
#     verbose_name = 'Dori'
#     verbose_name_plural = 'Dorilar'


# class PrescriptionInline(admin.StackedInline):
#     """Encounter ichida retseptlar"""
#     model = Prescription
#     extra = 0
#     fields = ['note']
#     show_change_link = True  # Link bilan ochish
#     verbose_name = 'Retsept'
#     verbose_name_plural = 'Retseptlar'


# ==================== MEDICAL CARD ====================

@admin.register(MedicalCard)
class MedicalCardAdmin(admin.ModelAdmin):
    """
    Tibbiy daftarcha - eng muhim model
    """

    list_display = [
        'card_number',
        'patient_name',
        'birth_date',
        'age',
        'phone',
        'blood_group',
        'encounters_count',
        'created_at',
    ]

    list_filter = [
        'blood_group',
        'created_at',
        'birth_date',
    ]

    search_fields = [
        'card_number',
        'first_name',
        'last_name',
        'phone',
        'patient_profile__user__phone_number',
        'patient_profile__user__email',
        'patient_profile__user__first_name',
        'patient_profile__user__last_name',

    ]

    readonly_fields = [
        'slug',
        'created_at',
        'updated_at',
        'encounters_count',
        'allergies_list',
        'chronic_diseases_list',
        'profile_link',
    ]

    ordering = ['-created_at']

    date_hierarchy = 'created_at'

    list_per_page = 25

    fieldsets = (
        ('Daftarcha ma\'lumoti', {
            'fields': (
                'card_number',
                'slug',
                'patient_profile',
                'profile_link',
            )
        }),
        ('Shaxsiy ma\'lumot', {
            'fields': (
                'first_name',
                'last_name',
                'birth_date',
                'phone',
                'blood_group',
            )
        }),
        ('Tibbiy tarix', {
            'fields': (
                'encounters_count',
                'allergies_list',
                'chronic_diseases_list',
            ),
            'classes': ('collapse',),
        }),
        ('Vaqtlar', {
            'fields': (
                'created_at',
                'updated_at',
            ),
            'classes': ('collapse',),
        }),
    )

    inlines = [AllergyInline, ChronicDiseaseInline]

    # Custom methods

    def patient_name(self, obj):
        """Bemor to'liq ismi"""
        return f"{obj.last_name} {obj.first_name}"

    patient_name.short_description = 'Bemor'
    patient_name.admin_order_field = 'last_name'

    def age(self, obj):
        """Yosh hisoblash"""
        if obj.birth_date:
            today = timezone.localdate()
            age = today.year - obj.birth_date.year
            if (today.month, today.day) < (obj.birth_date.month, obj.birth_date.day):
                age -= 1
            return f"{age} yosh"
        return '-'

    age.short_description = 'Yoshi'

    def encounters_count(self, obj):
        """Nechta qabul bo'lgan"""
        count = obj.encounters.count()
        if count > 0:
            url = reverse('admin:daftar_encounter_changelist') + f'?card__id__exact={obj.id}'
            return format_html(
                '<a href="{}" style="font-weight: bold;">{} ta qabul</a>',
                url,
                count
            )
        return format_html('<span style="color: gray;">Qabul yo\'q</span>')

    encounters_count.short_description = 'Qabullar'

    def allergies_list(self, obj):
        """Allergiyalar ro'yxati"""
        allergies = obj.allergies.all()
        if allergies:
            items = [
                f"<li><strong>{a.allergen}</strong> - {a.severity or 'nomalum'}</li>"
                for a in allergies
            ]
            return format_html(
                '<ul style="margin: 0; padding-left: 20px;">{}</ul>',
                ''.join(items)
            )
        return format_html('<span style="color: gray;">Allergiya yo\'q</span>')

    allergies_list.short_description = 'Allergiyalar'

    def chronic_diseases_list(self, obj):
        """Surunkali kasalliklar"""
        diseases = obj.chronic_diseases.all()
        if diseases:
            items = [
                f"<li><strong>{d.name}</strong> - {d.status or 'kuzatuvda'}</li>"
                for d in diseases
            ]
            return format_html(
                '<ul style="margin: 0; padding-left: 20px;">{}</ul>',
                ''.join(items)
            )
        return format_html('<span style="color: gray;">Surunkali kasallik yo\'q</span>')

    chronic_diseases_list.short_description = 'Surunkali kasalliklar'
# +++++++++++++++++++++++++++++++++++++++++++++++++++++++
    def profile_link(self, obj):
        if getattr(obj, "patient_profile", None):
            url = reverse('admin:accounts_patientprofile_change', args=[obj.patient_profile.id])
            return format_html('<a href="{}" target="_blank">👤 Profilni ko\'rish</a>', url)
        return '-'

    profile_link.short_description = 'Profil'


# +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    # def profile_link(self, obj):
    #     """Profile ga link"""
    #     if obj.profile:
    #         url = reverse('admin:accounts_profile_change', args=[obj.profile.id])
    #         return format_html(
    #             '<a href="{}" target="_blank">👤 Profile ni ko\'rish</a>',
    #             url
    #         )
    #     return '-'
    #
    # profile_link.short_description = 'Profile'


# ==================== ENCOUNTER ====================

@admin.register(Encounter)
class EncounterAdmin(admin.ModelAdmin):
    """
    Qabul holatlari
    """

    list_display = [
        'patient_info',
        'reason',
        'came_at',
        'diagnoses_count',
        'prescriptions_count',
        'created_at',
    ]

    list_filter = [
        'came_at',
        'created_at',
    ]

    search_fields = [
        'reason',
        'complaint',
        'card__first_name',
        'card__last_name',
        'card__card_number',
    ]

    readonly_fields = [
        'slug',
        'created_at',
        'updated_at',
        'diagnoses_summary',
        'prescriptions_summary',
        'card_link',
    ]

    ordering = ['-came_at']

    date_hierarchy = 'came_at'

    list_per_page = 30

    fieldsets = (
        ('Bemor', {
            'fields': (
                'card',
                'card_link',
            )
        }),
        ('Qabul ma\'lumoti', {
            'fields': (
                'came_at',
                'reason',
                'complaint',
                'examination',
                'general_note',
            )
        }),
        ('Tashxis va retsept', {
            'fields': (
                'diagnoses_summary',
                'prescriptions_summary',
            ),
            'classes': ('collapse',),
        }),
        ('Texnik', {
            'fields': (
                'slug',
                'created_at',
                'updated_at',
            ),
            'classes': ('collapse',),
        }),
    )

    # inlines = [EncounterDiagnosisInline, PrescriptionInline]
    inlines = [EncounterDiagnosisInline]

    # Custom methods

    def patient_info(self, obj):
        """Bemor ma'lumoti"""
        card = obj.card
        return format_html(
            '<strong>{} {}</strong><br/><small>{}</small>',
            card.last_name,
            card.first_name,
            card.card_number
        )

    patient_info.short_description = 'Bemor'
    patient_info.admin_order_field = 'card__last_name'

    def diagnoses_count(self, obj):
        """Tashxislar soni"""
        count = obj.diagnoses.count()
        if count > 0:
            return format_html(
                '<span style="background-color: #2196F3; color: white; '
                'padding: 2px 8px; border-radius: 10px;">{} ta</span>',
                count
            )
        return format_html('<span style="color: gray;">-</span>')

    diagnoses_count.short_description = 'Tashxislar'

    def prescriptions_count(self, obj):
        try:
            count = obj.prescriptions.count()
        except AttributeError:
            return format_html('<span style="color:gray;">—</span>')
        if count > 0:
            return format_html(
                '<span style="background:#4CAF50;color:white;padding:2px 8px;border-radius:10px;">{} ta</span>',
                count
            )
        return format_html('<span style="color:gray;">—</span>')

    prescriptions_count.short_description = 'Retseptlar'

    def diagnoses_summary(self, obj):
        """Tashxislar qisqacha"""
        diagnoses = obj.diagnoses.all()
        if diagnoses:
            items = []
            for d in diagnoses:
                primary = '⭐ ' if d.is_primary else ''
                icd = f' ({d.icd10})' if d.icd10 else ''
                items.append(f"<li>{primary}<strong>{d.disease_name}</strong>{icd}</li>")
            return format_html(
                '<ul style="margin: 0; padding-left: 20px;">{}</ul>',
                ''.join(items)
            )
        return format_html('<span style="color: gray;">Tashxis qo\'yilmagan</span>')

    diagnoses_summary.short_description = 'Tashxislar'

    def prescriptions_summary(self, obj):
        """Retseptlar qisqacha"""
        prescriptions = obj.prescriptions.all()
        if prescriptions:
            items = []
            for p in prescriptions:
                item_count = p.items.count()
                items.append(
                    f"<li>Retsept #{p.id} - {item_count} ta dori</li>"
                )
            return format_html(
                '<ul style="margin: 0; padding-left: 20px;">{}</ul>',
                ''.join(items)
            )
        return format_html('<span style="color: gray;">Retsept yo\'q</span>')

    prescriptions_summary.short_description = 'Retseptlar'

    def card_link(self, obj):
        """Daftarchaga link"""
        url = reverse('admin:daftar_medicalcard_change', args=[obj.card.id])
        return format_html(
            '<a href="{}" target="_blank">📋 Daftarchani ko\'rish</a>',
            url
        )

    card_link.short_description = 'Tibbiy daftarcha'


# ==================== ENCOUNTER DIAGNOSIS ====================

@admin.register(EncounterDiagnosis)
class EncounterDiagnosisAdmin(admin.ModelAdmin):
    """
    Tashxislar
    """

    list_display = [
        'disease_name',
        'icd10',
        'is_primary_badge',
        'encounter_info',
        'created_at',
    ]

    list_filter = [
        'is_primary',
        'created_at',
    ]

    search_fields = [
        'disease_name',
        'icd10',
        'encounter__card__first_name',
        'encounter__card__last_name',
    ]

    readonly_fields = ['created_at', 'updated_at']

    ordering = ['-created_at']

    list_per_page = 50

    # Custom methods

    def is_primary_badge(self, obj):
        """Asosiy tashxis belgisi"""
        if obj.is_primary:
            return format_html(
                '<span style="background-color: #FF9800; color: white; '
                'padding: 3px 10px; border-radius: 3px;">⭐ Asosiy</span>'
            )
        return format_html('<span style="color: gray;">Qo\'shimcha</span>')

    is_primary_badge.short_description = 'Turi'

    def encounter_info(self, obj):
        """Qabul ma'lumoti"""
        enc = obj.encounter
        return format_html(
            '<strong>{}</strong><br/><small>{}</small>',
            enc.reason,
            enc.came_at.strftime('%d.%m.%Y %H:%M')
        )

    encounter_info.short_description = 'Qabul'


# ==================== PRESCRIPTION ====================

# @admin.register(Prescription)
# class PrescriptionAdmin(admin.ModelAdmin):
#     """
#     Retseptlar (Daftar ichidagi - QR kodsiz)
#     """
#
#     list_display = [
#         'prescription_id',
#         'encounter_info',
#         'items_count',
#         'created_at',
#     ]
#
#     list_filter = ['created_at']
#
#     search_fields = [
#         'note',
#         'encounter__card__first_name',
#         'encounter__card__last_name',
#     ]
#
#     readonly_fields = [
#         'created_at',
#         'updated_at',
#         'items_list',
#     ]
#
#     ordering = ['-created_at']
#
#     fieldsets = (
#         ('Asosiy', {
#             'fields': (
#                 'encounter',
#                 'note',
#             )
#         }),
#         ('Dorilar', {
#             'fields': (
#                 'items_list',
#             ),
#         }),
#         ('Vaqtlar', {
#             'fields': (
#                 'created_at',
#                 'updated_at',
#             ),
#             'classes': ('collapse',),
#         }),
#     )

    # inlines = [PrescriptionItemInline]

    # Custom methods

    # def prescription_id(self, obj):
    #     """Retsept ID"""
    #     return f"Retsept #{obj.id}"
    #
    # prescription_id.short_description = 'ID'
    #
    # def encounter_info(self, obj):
    #     """Qabul ma'lumoti"""
    #     enc = obj.encounter
    #     card = enc.card
    #     return format_html(
    #         '<strong>{} {}</strong><br/>'
    #         '<small>{} - {}</small>',
    #         card.last_name,
    #         card.first_name,
    #         enc.reason,
    #         enc.came_at.strftime('%d.%m.%Y')
    #     )
    #
    # encounter_info.short_description = 'Bemor / Qabul'
    #
    # def items_count(self, obj):
    #     """Dorilar soni"""
    #     count = obj.items.count()
    #     if count > 0:
    #         return format_html(
    #             '<span style="background-color: #4CAF50; color: white; '
    #             'padding: 2px 8px; border-radius: 10px;">{} ta dori</span>',
    #             count
    #         )
    #     return format_html('<span style="color: gray;">Bo\'sh</span>')
    #
    # items_count.short_description = 'Dorilar'
    #
    # def items_list(self, obj):
    #     """Dorilar ro'yxati"""
    #     items = obj.items.all()
    #     if items:
    #         rows = []
    #         for item in items:
    #             rows.append(
    #                 f"<tr>"
    #                 f"<td style='padding: 5px;'><strong>{item.medication_name}</strong></td>"
    #                 f"<td style='padding: 5px;'>{item.dosage or '-'}</td>"
    #                 f"<td style='padding: 5px;'>{item.frequency or '-'}</td>"
    #                 f"<td style='padding: 5px;'>{item.duration_days or '-'} kun</td>"
    #                 f"</tr>"
    #             )
    #         return format_html(
    #             '<table style="width: 100%; border-collapse: collapse;">'
    #             '<thead><tr style="background-color: #f5f5f5;">'
    #             '<th style="padding: 5px; text-align: left;">Dori</th>'
    #             '<th style="padding: 5px; text-align: left;">Doza</th>'
    #             '<th style="padding: 5px; text-align: left;">Qabul</th>'
    #             '<th style="padding: 5px; text-align: left;">Muddat</th>'
    #             '</tr></thead>'
    #             '<tbody>{}</tbody>'
    #             '</table>',
    #             ''.join(rows)
    #         )
    #     return format_html('<span style="color: gray;">Dori yo\'q</span>')
    #
    # items_list.short_description = 'Dorilar ro\'yxati'
#
#
# ==================== PRESCRIPTION ITEM ====================

# @admin.register(PrescriptionItem)
# class PrescriptionItemAdmin(admin.ModelAdmin):
#     """
#     Dorilar
#     """
#
#     list_display = [
#         'medication_name',
#         'dosage',
#         'frequency',
#         'duration_days',
#         'prescription_info',
#     ]
#
#     list_filter = ['created_at']
#
#     search_fields = [
#         'medication_name',
#         'prescription__encounter__card__first_name',
#         'prescription__encounter__card__last_name',
#     ]
#
#     readonly_fields = ['created_at', 'updated_at']
#
#     ordering = ['-created_at']
#
#     Custom method
    #
    # def prescription_info(self, obj):
    #     """Qaysi retsept"""
    #     return f"Retsept #{obj.prescription.id}"
    #
    # prescription_info.short_description = 'Retsept'


# ==================== ALLERGY ====================

@admin.register(Allergy)
class AllergyAdmin(admin.ModelAdmin):
    """
    Allergiyalar
    """

    list_display = [
        'allergen',
        'severity_badge',
        'reaction',
        'patient_info',
        'noted_at',
    ]

    list_filter = [
        'severity',
        'noted_at',
        'created_at',
    ]

    search_fields = [
        'allergen',
        'reaction',
        'card__first_name',
        'card__last_name',
    ]

    readonly_fields = ['created_at', 'updated_at']

    ordering = ['-created_at']

    # Custom methods

    def severity_badge(self, obj):
        """Ogirlik darajasi rangli"""
        if not obj.severity:
            return '-'

        colors = {
            'engil': 'green',
            'o\'rta': 'orange',
            'og\'ir': 'red',
        }
        color = 'gray'
        for key in colors:
            if key in obj.severity.lower():
                color = colors[key]
                break

        return format_html(
            '<span style="background-color: {}; color: white; '
            'padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.severity
        )

    severity_badge.short_description = 'Darajasi'

    def patient_info(self, obj):
        """Bemor"""
        card = obj.card
        return f"{card.last_name} {card.first_name}"

    patient_info.short_description = 'Bemor'


# ==================== CHRONIC DISEASE ====================

@admin.register(ChronicDisease)
class ChronicDiseaseAdmin(admin.ModelAdmin):
    """
    Surunkali kasalliklar
    """

    list_display = [
        'name',
        'status',
        'diagnosed_at',
        'patient_info',
        'created_at',
    ]

    list_filter = [
        'status',
        'diagnosed_at',
        'created_at',
    ]

    search_fields = [
        'name',
        'note',
        'card__first_name',
        'card__last_name',
    ]

    readonly_fields = ['created_at', 'updated_at']

    ordering = ['-created_at']

    # Custom method

    def patient_info(self, obj):
        """Bemor"""
        card = obj.card
        return f"{card.last_name} {card.first_name}"

    patient_info.short_description = 'Bemor'


# ==================== VACCINATION EVENT ====================

@admin.register(VaccinationEvent)
class VaccinationEventAdmin(admin.ModelAdmin):
    """
    Vaksina yozuvlari
    """

    list_display = [
        'vaccine_name',
        'dose',
        'came_at',
        'patient_info',
        'lot_number',
    ]

    list_filter = [
        'vaccine_name',
        'came_at',
        'created_at',
    ]

    search_fields = [
        'vaccine_name',
        'lot_number',
        'note',
        'card__first_name',
        'card__last_name',
    ]

    readonly_fields = ['created_at', 'updated_at']

    ordering = ['-came_at']

    date_hierarchy = 'came_at'

    # Custom method

    def patient_info(self, obj):
        """Bemor"""
        card = obj.card
        return f"{card.last_name} {card.first_name}"

    patient_info.short_description = 'Bemor'

