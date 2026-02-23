from rest_framework import serializers
from .models import (
    MedicalCard, Encounter, EncounterDiagnosis,
    # Prescription, PrescriptionItem,
    Allergy, ChronicDisease, VaccinationEvent
)


class MedicalCardDetailSerializer(serializers.ModelSerializer):
    """Bemor o'zi uchun"""
    class Meta:
        model = MedicalCard
        fields = '__all__'
        read_only_fields= ["card_number"]


class MedicalCardAdminSerializer(serializers.ModelSerializer):
    """ADMIN UCHUN"""
    class Meta:
        model = MedicalCard
        fields = '__all__'


class EncounterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Encounter
        fields = '__all__'


class EncounterDiagnosisSerializer(serializers.ModelSerializer):
    class Meta:
        model = EncounterDiagnosis
        fields = '__all__'


# class PrescriptionSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Prescription
#         fields = '__all__'
#
#
# class PrescriptionItemSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = PrescriptionItem
#         fields = '__all__'
#         ref_name = "DaftarPrescriptionItem"


class AllergySerializer(serializers.ModelSerializer):
    class Meta:
        model = Allergy
        fields = '__all__'


class ChronicDiseaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChronicDisease
        fields = '__all__'


class VaccinationEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = VaccinationEvent
        fields = '__all__'