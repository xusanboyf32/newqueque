# apps/navbat/models.py
import uuid
from datetime import time
from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.mixins import TimeStampMixin, SlugMixin, UUIDMixin


class Specialty(TimeStampMixin, SlugMixin):
    """
    Soha: koz, oyoq, suyak, teri...
    Masalan Ko'zi og'risa ko'z doktorga yozilish uchun doktorni tanledi
    """

    name = models.CharField(max_length=120, unique=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Doctor(TimeStampMixin, SlugMixin):
    """Doktor: soha + qabul joyi (xona, manzil)
    Doktorni tanledi ichida osha sohasiga qarab
    """
    full_name = models.CharField(max_length=150)
    specialty = models.ForeignKey(Specialty, on_delete=models.PROTECT, related_name="doctors")

    room_number = models.CharField(max_length=50, blank=True, default="")
    address = models.CharField(max_length=255, blank=True, default="")

    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.full_name} ({self.specialty.name})"


class DoctorSchedule(TimeStampMixin):
    """
    Doktor ish vaqti (har kuni bir xil deb olamiz):
    08:00 - 18:00, slot=15 min
    """
    doctor = models.OneToOneField(Doctor, on_delete=models.CASCADE, related_name="schedule")
    work_start = models.TimeField(default=time(8, 0))
    work_end = models.TimeField(default=time(18, 0))
    slot_minutes = models.PositiveSmallIntegerField(default=15)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.doctor.full_name}: {self.work_start}-{self.work_end}"


class SlotStatus(models.TextChoices):
    FREE = "FREE", "Free"
    BOOKED = "BOOKED", "Booked"


class AppointmentSlot(TimeStampMixin):
    """
    User tanlaydigan vaqtlar:
    faqat start_time saqlanadi (end_time = start_time + 15 min)
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name="slots")
    date = models.DateField()
    start_time = models.TimeField()

    status = models.CharField(max_length=10, choices=SlotStatus.choices, default=SlotStatus.FREE)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["doctor", "date", "start_time"], name="uniq_doctor_slot"),
        ]
        ordering = ["date", "start_time"]

    def __str__(self):
        return f"{self.doctor.full_name} {self.date} {self.start_time}"


class AppointmentStatus(models.TextChoices):
    BOOKED = "BOOKED", "Booked"
    CANCELED = "CANCELED", "Canceled"


class Appointment(TimeStampMixin):
    """
    User navbati:
    - user slotni tanlaydi -> Appointment yaratiladi
    - bekor qilsa -> status=CANCELED, slot yana FREE bo'ladi
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="navbat_appointments")
    slot = models.OneToOneField(AppointmentSlot, on_delete=models.PROTECT, related_name="appointment")

    status = models.CharField(max_length=10, choices=AppointmentStatus.choices, default=AppointmentStatus.BOOKED)

    def __str__(self):
        return f"{self.user_id} -> {self.slot} ({self.status})"
