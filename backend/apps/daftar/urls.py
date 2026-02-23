# apps/medical/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    MedicalCardViewSet,
    EncounterViewSet,
    AllergyViewSet,
    ChronicDiseaseViewSet,
    VaccinationEventViewSet,
    EncounterDiagnosisViewSet,
    # PrescriptionViewSet,
    # PrescriptionItemViewSet,
)

router = DefaultRouter()
router.register(r"medical-cards", MedicalCardViewSet, basename="medical-cards")
router.register(r"encounters", EncounterViewSet, basename="encounters")
router.register(r"allergies", AllergyViewSet, basename="allergies")
router.register(r"chronic-diseases", ChronicDiseaseViewSet, basename="chronic-diseases")
router.register(r"vaccinations", VaccinationEventViewSet, basename="vaccinations")

# ixtiyoriy: admin uchun juda qulay CRUD endpointlar
router.register(r"diagnoses", EncounterDiagnosisViewSet, basename="diagnoses")
# router.register(r"prescriptions", PrescriptionViewSet, basename="prescriptions")
# router.register(r"prescription-items", PrescriptionItemViewSet, basename="prescription-items")

urlpatterns = [
    path("", include(router.urls)),
]
