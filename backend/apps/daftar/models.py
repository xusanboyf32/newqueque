# apps/medical/models.py
from django.conf import settings
from django.db import models
from django.utils import timezone
from apps.mixins import TimeStampMixin, SlugMixin
from apps.accounts.models import PatientProfile



class MedicalCard(TimeStampMixin, SlugMixin):
    patient_profile = models.OneToOneField(
        PatientProfile,
        on_delete=models.CASCADE,
        related_name='medical_card',
        verbose_name='Bemor profili'
    )

    card_number = models.CharField(max_length=32, unique=True, verbose_name="Daftarcha raqami")
    # ++++++++++++++++++++++++++++++++++++++++++
    # card number avto unique ozgarmas qiymat beriladi
    import uuid

    def save(self, *args, **kwargs):
        if not self.card_number:
            self.card_number = uuid.uuid4().hex[:12].upper()
        super().save(*args, **kwargs)

# +++++++++++++++++++++++++++++++++++++++++++++++++++++++
    # Snapshot (avto to'ladi)
    first_name = models.CharField(max_length=100, verbose_name="Ism")
    last_name = models.CharField(max_length=100, verbose_name="Familiya")
    birth_date = models.DateField(null=True, blank=True, verbose_name="Tugilgan sana")
    phone = models.CharField(max_length=32, blank=True, default="", verbose_name="Telefon raqam")

    blood_group = models.CharField(max_length=3, blank=True, default="", verbose_name="Qon guruhi")

    class Meta:
        verbose_name = "Tibbiy daftarcha"
        verbose_name_plural = "Tibbiy daftarchalar"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.card_number} - {self.last_name} {self.first_name}"


# ✅ ASOSIY: eng ko‘p qo‘shiladigan narsa
class Encounter(TimeStampMixin, SlugMixin):
    card = models.ForeignKey(
        MedicalCard,
        on_delete=models.CASCADE,
        related_name="encounters",
        verbose_name="Tibbiy daftarcha"
    )

    came_at = models.DateTimeField(default=timezone.now, verbose_name="Kelgan vaqti")
    reason = models.CharField(max_length=200, verbose_name="Kelish sababi")  # tomoq, isitma...
    complaint = models.TextField(blank=True, default="", verbose_name="Shikoyat")
    examination = models.TextField(blank=True, default="", verbose_name="Korik natijasi")
    general_note = models.TextField(blank=True, default="", verbose_name="Umumiy izoh")

    class Meta:
        verbose_name = "Qabul holati"
        verbose_name_plural = "Qabul holatlari"
        ordering = ["-came_at"]

    def __str__(self):
        return f"{self.reason} ({self.came_at.date()})"


class EncounterDiagnosis(TimeStampMixin):

    encounter = models.ForeignKey(
        Encounter,
        on_delete=models.CASCADE,
        related_name="diagnoses",
        verbose_name="Qabul holati"
    )

    disease_name = models.CharField(max_length=200, verbose_name="Kasallik nomi")
    icd10 = models.CharField(max_length=16, blank=True, default="", verbose_name="ICD-10 kodi")
    is_primary = models.BooleanField(default=False, verbose_name="Asosiy tashxis")

    class Meta:
        verbose_name = "Tashxis"
        verbose_name_plural = "Tashxislar"
        ordering = ["-created_at"]


    def __str__(self):
        return self.disease_name


class Prescription(TimeStampMixin):
    encounter = models.ForeignKey(
        Encounter,
        on_delete=models.CASCADE,
        related_name="daftar_prescriptions",
        verbose_name="Qabul holati"
    )
    note = models.TextField(blank=True, default="", verbose_name="Umumiy korsatma")

    class Meta:
        verbose_name = "Retsept"
        verbose_name_plural = "Retseptlar"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Retsept #{self.id}"


class PrescriptionItem(TimeStampMixin):
    prescription = models.ForeignKey(
        Prescription,
        on_delete=models.CASCADE,
        related_name="items",
        verbose_name="Retsept"
    )

    medication_name = models.CharField(max_length=150, verbose_name="Dori nomi")
    dosage = models.CharField(max_length=100, blank=True, default="", verbose_name="Doza")
    frequency = models.CharField(max_length=100, blank=True, default="", verbose_name="Qabul qilish tezligi")
    duration_days = models.IntegerField(null=True, blank=True, verbose_name="Davomiyligi (kun)")

    class Meta:
        verbose_name = "Retsept bandi"
        verbose_name_plural = "Retsept bandlari"
        ordering = ["-created_at"]

    def __str__(self):
        return self.medication_name


# ✅ OPTIONAL bo‘limlar (hamma bemorda bo‘lmaydi)
class Allergy(TimeStampMixin):
    card = models.ForeignKey(
        MedicalCard,
        on_delete=models.CASCADE,
        related_name="allergies",
        verbose_name="Tibbiy daftarcha"
    )

    allergen = models.CharField(max_length=150, verbose_name="Allergen")
    reaction = models.CharField(max_length=255, blank=True, default="", verbose_name="Reaksiya")
    severity = models.CharField(max_length=50, blank=True, default="", verbose_name="Ogirlik darajasi")
    noted_at = models.DateField(null=True, blank=True, verbose_name="Qayd etilgan sana")

    class Meta:
        verbose_name = "Allergiya"
        verbose_name_plural = "Allergiyalar"
        ordering = ["-created_at"]

    def __str__(self):
        return self.allergen


class ChronicDisease(TimeStampMixin):
    card = models.ForeignKey(
        MedicalCard,
        on_delete=models.CASCADE,
        related_name="chronic_diseases",
        verbose_name="Tibbiy daftarcha"
    )

    name = models.CharField(max_length=150, verbose_name="Kasallik nomi")
    diagnosed_at = models.DateField(null=True, blank=True, verbose_name="Aniqlangan sana")
    status = models.CharField(max_length=50, blank=True, default="", verbose_name="Holati")
    note = models.TextField(blank=True, default="", verbose_name="Izoh")

    class Meta:
        verbose_name = "Surunkali kasallik"
        verbose_name_plural = "Surunkali kasalliklar"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class VaccinationEvent(TimeStampMixin):
    card = models.ForeignKey(
        MedicalCard,
        on_delete=models.CASCADE,
        related_name="vaccinations",
        verbose_name="Tibbiy daftarcha"
    )

    came_at = models.DateTimeField(default=timezone.now, verbose_name="Kelgan vaqti")
    vaccine_name = models.CharField(max_length=150, verbose_name="Vaksina nomi")
    dose = models.CharField(max_length=50, blank=True, default="", verbose_name="Doza")
    lot_number = models.CharField(max_length=80, blank=True, default="", verbose_name="Partiya raqami")
    note = models.CharField(max_length=255, blank=True, default="", verbose_name="Izoh")

    class Meta:
        verbose_name = "Vaksina yozuvi"
        verbose_name_plural = "Vaksina yozuvlari"
        ordering = ["-came_at"]

    def __str__(self):
        return f"{self.vaccine_name} - {self.came_at.date()}"
