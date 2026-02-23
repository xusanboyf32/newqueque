from rest_framework import permissions


class IsAdminCRUDPatientReadOwn(permissions.BasePermission):
    """
    Admin: CRUD (Create, Read, Update, Delete)
    Patient: Faqat o'zinikini READ (ko'rish)
    """

    def has_permission(self, request, view):
        # Autentifikatsiya qilingan bo'lishi shart
        if not request.user or not request.user.is_authenticated:
            return False

        # Admin: hamma narsa ruxsat
        if request.user.is_staff or request.user.is_superuser:
            return True

        # Patient: faqat GET (read) ruxsat
        if request.method in permissions.SAFE_METHODS:  # GET, HEAD, OPTIONS
            return True

        # POST, PUT, PATCH, DELETE - patient uchun yo'q
        return False

    def has_object_permission(self, request, view, obj):
        # Admin: hamma object ga ruxsat
        if request.user.is_staff or request.user.is_superuser:
            return True

        # Patient: faqat o'ziniki
        # obj har xil bo'lishi mumkin: MedicalCard, Encounter, etc.
        if hasattr(obj, 'profile'):
            # MedicalCard, Allergy, ChronicDisease, VaccinationEvent
            return obj.profile.user == request.user
        elif hasattr(obj, 'card'):
            # Encounter
            return obj.card.profile.user == request.user
        elif hasattr(obj, 'encounter'):
            # EncounterDiagnosis, Prescription
            return obj.encounter.card.profile.user == request.user
        elif hasattr(obj, 'prescription'):
            # PrescriptionItem
            return obj.prescription.encounter.card.profile.user == request.user

        return False