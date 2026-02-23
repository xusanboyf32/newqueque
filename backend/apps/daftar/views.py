from django.db.models import Prefetch
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    MedicalCard, Encounter, EncounterDiagnosis,
    # Prescription, PrescriptionItem,
    Allergy, ChronicDisease, VaccinationEvent,
)
from .serializers import (
    MedicalCardDetailSerializer, MedicalCardAdminSerializer,
    EncounterSerializer, EncounterDiagnosisSerializer,
    # PrescriptionSerializer, PrescriptionItemSerializer,
    AllergySerializer, ChronicDiseaseSerializer, VaccinationEventSerializer,
)
from .permissions import IsAdminCRUDPatientReadOwn


class RoleQuerysetMixin:
    owner_lookup = None

    def is_admin(self):
        u = self.request.user
        return bool(u and u.is_authenticated and (u.is_staff or u.is_superuser))

    def filter_for_patient(self, qs):
        return qs.filter(**{self.owner_lookup: self.request.user})

    def get_queryset(self):
        qs = super().get_queryset()
        if self.is_admin():
            return qs
        return self.filter_for_patient(qs)


class AdminCRUDPatientReadOnlyMixin:
    def _check_admin(self, request):
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({"detail": "Sizga ruxsat yo'q."}, status=status.HTTP_403_FORBIDDEN)
        return None

    def create(self, request, *args, **kwargs):
        err = self._check_admin(request)
        return err or super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        err = self._check_admin(request)
        return err or super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        err = self._check_admin(request)
        return err or super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        err = self._check_admin(request)
        return err or super().destroy(request, *args, **kwargs)


# ── MedicalCard ──────────────────────────────────────────────────

class MedicalCardViewSet(AdminCRUDPatientReadOnlyMixin, RoleQuerysetMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsAdminCRUDPatientReadOwn]
    queryset = MedicalCard.objects.all()
    owner_lookup = "patient_profile__user"

    def get_queryset(self):
        qs = (MedicalCard.objects
              .select_related("patient_profile", "patient_profile__user")
              .prefetch_related(
                  "allergies",
                  "chronic_diseases",
                  "vaccinations",
                  # Prefetch(
                  #     "encounters",
                  #     queryset=Encounter.objects.prefetch_related(
                  #         "diagnoses",
                  #         Prefetch(
                  #             "daftar_prescriptions",
                  #             queryset=Prescription.objects.prefetch_related("items")
                  #         )
                  #     ).order_by("-came_at")
                  # )
              ))
        if self.is_admin():
            return qs
        return qs.filter(patient_profile__user=self.request.user)

    def get_serializer_class(self):
        if self.is_admin():
            return MedicalCardAdminSerializer
        return MedicalCardDetailSerializer

    @action(detail=False, methods=["get"], url_path="me")
    def me(self, request):
        card = self.get_queryset().first()
        if not card:
            return Response({"detail": "Daftarcha topilmadi."}, status=status.HTTP_404_NOT_FOUND)
        return Response(self.get_serializer(card).data)


# ── Encounter ────────────────────────────────────────────────────

class EncounterViewSet(AdminCRUDPatientReadOnlyMixin, RoleQuerysetMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsAdminCRUDPatientReadOwn]
    serializer_class = EncounterSerializer
    queryset = Encounter.objects.all()
    owner_lookup = "card__patient_profile__user"

    def get_queryset(self):
        qs = (Encounter.objects
              .select_related("card", "card__patient_profile", "card__patient_profile__user")
              .prefetch_related(
                  "diagnoses",
                  # Prefetch(
                  #     "daftar_prescriptions",
                  #     queryset=Prescription.objects.prefetch_related("items")
                  # )
              )
              .order_by("-came_at"))
        if self.is_admin():
            return qs
        return qs.filter(card__patient_profile__user=self.request.user)


# ── Allergy ──────────────────────────────────────────────────────

class AllergyViewSet(AdminCRUDPatientReadOnlyMixin, RoleQuerysetMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsAdminCRUDPatientReadOwn]
    serializer_class = AllergySerializer
    queryset = Allergy.objects.all()
    owner_lookup = "card__patient_profile__user"

    def get_queryset(self):
        qs = (Allergy.objects
              .select_related("card", "card__patient_profile", "card__patient_profile__user")
              .order_by("-created_at"))
        if self.is_admin():
            return qs
        return qs.filter(card__patient_profile__user=self.request.user)


# ── ChronicDisease ───────────────────────────────────────────────

class ChronicDiseaseViewSet(AdminCRUDPatientReadOnlyMixin, RoleQuerysetMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsAdminCRUDPatientReadOwn]
    serializer_class = ChronicDiseaseSerializer
    queryset = ChronicDisease.objects.all()
    owner_lookup = "card__patient_profile__user"

    def get_queryset(self):
        qs = (ChronicDisease.objects
              .select_related("card", "card__patient_profile", "card__patient_profile__user")
              .order_by("-created_at"))
        if self.is_admin():
            return qs
        return qs.filter(card__patient_profile__user=self.request.user)


# ── VaccinationEvent ─────────────────────────────────────────────

class VaccinationEventViewSet(AdminCRUDPatientReadOnlyMixin, RoleQuerysetMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsAdminCRUDPatientReadOwn]
    serializer_class = VaccinationEventSerializer
    queryset = VaccinationEvent.objects.all()
    owner_lookup = "card__patient_profile__user"

    def get_queryset(self):
        qs = (VaccinationEvent.objects
              .select_related("card", "card__patient_profile", "card__patient_profile__user")
              .order_by("-came_at"))
        if self.is_admin():
            return qs
        return qs.filter(card__patient_profile__user=self.request.user)


# ── EncounterDiagnosis ───────────────────────────────────────────

class EncounterDiagnosisViewSet(AdminCRUDPatientReadOnlyMixin, RoleQuerysetMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsAdminCRUDPatientReadOwn]
    serializer_class = EncounterDiagnosisSerializer
    queryset = EncounterDiagnosis.objects.all()
    owner_lookup = "encounter__card__patient_profile__user"

    def get_queryset(self):
        qs = (EncounterDiagnosis.objects
              .select_related(
                  "encounter", "encounter__card",
                  "encounter__card__patient_profile",
                  "encounter__card__patient_profile__user"
              )
              .order_by("-created_at"))
        if self.is_admin():
            return qs
        return qs.filter(encounter__card__patient_profile__user=self.request.user)


# ── Prescription ─────────────────────────────────────────────────

# class PrescriptionViewSet(AdminCRUDPatientReadOnlyMixin, RoleQuerysetMixin, viewsets.ModelViewSet):
#     permission_classes = [IsAuthenticated, IsAdminCRUDPatientReadOwn]
#     serializer_class = PrescriptionSerializer
#     queryset = Prescription.objects.all()
#     owner_lookup = "encounter__card__patient_profile__user"
#
#     def get_queryset(self):
#         qs = (Prescription.objects
#               .select_related(
#                   "encounter", "encounter__card",
#                   "encounter__card__patient_profile",
#                   "encounter__card__patient_profile__user"
#               )
#               .prefetch_related("items")
#               .order_by("-created_at"))
#         if self.is_admin():
#             return qs
#         return qs.filter(encounter__card__patient_profile__user=self.request.user)
#
#
# ── PrescriptionItem ─────────────────────────────────────────────
#
# class PrescriptionItemViewSet(AdminCRUDPatientReadOnlyMixin, RoleQuerysetMixin, viewsets.ModelViewSet):
#     permission_classes = [IsAuthenticated, IsAdminCRUDPatientReadOwn]
#     serializer_class = PrescriptionItemSerializer
#     queryset = PrescriptionItem.objects.all()
#     owner_lookup = "prescription__encounter__card__patient_profile__user"

    # def get_queryset(self):
    #     qs = (PrescriptionItem.objects
    #           .select_related(
    #               "prescription",
    #               "prescription__encounter",
    #               "prescription__encounter__card",
    #               "prescription__encounter__card__patient_profile",
    #               "prescription__encounter__card__patient_profile__user",
    #           )
    #           .order_by("-created_at"))
    #     if self.is_admin():
    #         return qs
    #     return qs.filter(prescription__encounter__card__patient_profile__user=self.request.user)



