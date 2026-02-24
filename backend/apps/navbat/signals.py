# apps/navbat/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Doctor, DoctorSchedule


@receiver(post_save, sender=Doctor)
def create_doctor_schedule(sender, instance: Doctor, created: bool, **kwargs):
    """
    Doctor yaratilganda DoctorSchedule avtomatik yaratiladi.
    Agar schedule allaqachon bor bo‘lsa — tegmaydi (siz o‘zgartirgan bo‘lsangiz ham saqlanadi).
    """
    if not created:
        return

    # Schedule yo‘q bo‘lsa yaratamiz (defaultlar avtomatik tushadi: 08:00-18:00, 15 min)
    DoctorSchedule.objects.get_or_create(doctor=instance)