# apps/daftar/signals.py  (yoki sizdagi medical/signals.py qayerda bo'lsa o'sha)
from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.accounts.models import User, PatientProfile
from .models import MedicalCard

import uuid


@receiver(post_save, sender=User)
def create_patient_profile_for_user(sender, instance, created, **kwargs):
    """
    User ro'yxatdan o'tganda PATIENT bo'lsa PatientProfile yaratadi
    """
    if created and instance.role == "PATIENT":
        PatientProfile.objects.get_or_create(user=instance)


@receiver(post_save, sender=PatientProfile)
def create_medical_card_for_profile(sender, instance, created, **kwargs):
    """
    PatientProfile yaratilganda MedicalCard (daftar) yaratadi
    """
    if created:
        card_number = f"MC-{uuid.uuid4().hex[:8].upper()}"

        MedicalCard.objects.get_or_create(
            patient_profile=instance,   # ✅ MUHIM: user emas!
            defaults={
                "card_number": card_number,
                "first_name": instance.user.first_name or "",
                "last_name": instance.user.last_name or "",
                "phone": instance.user.phone_number or "",
                # sizda User modelda date_of_birth bor edi:
                "birth_date": instance.user.date_of_birth,
            }
        )