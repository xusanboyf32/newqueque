
"""
Django Signals
User yaratilganda avtomatik PatientProfile yaratish
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, PatientProfile


@receiver(post_save, sender=User)
def create_patient_profile(sender, instance, created, **kwargs):
    """Yangi PATIENT yaratilganda avtomatik profil yaratish"""
    if created and instance.role == 'PATIENT':
        PatientProfile.objects.create(user=instance)

#
# from django.db.models.signals import post_save
# from django.dispatch import receiver
# from .models import PatientProfile
#
# @receiver(post_save, sender=PatientProfile)
# def sync_blood_type_to_medical_card(sender, instance, **kwargs):
#     try:
#         card = instance.medical_card  # MedicalCard dan related_name
#         if instance.blood_type:
#             card.blood_group = instance.blood_type
#             card.save(update_fields=['blood_group'])
#     except Exception:
#         pass