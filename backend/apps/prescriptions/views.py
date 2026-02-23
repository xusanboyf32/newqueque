from rest_framework import generics, views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Medication, Prescription
from .serializers import (
    MedicationSerializer,
    PrescriptionListSerializer,
    PrescriptionDetailSerializer,
    PrescriptionCreateSerializer,
    BarcodeScanSerializer,
)


class MedicationListView(generics.ListAPIView):
    """
    GET /api/prescriptions/medications/
    Dori bazasi — qidiruv bilan
    """
    serializer_class   = MedicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Medication.objects.filter(is_active=True)
        q  = self.request.query_params.get('q')
        if q:
            qs = qs.filter(name__icontains=q)
        return qs


class MyPrescriptionsView(generics.ListAPIView):
    """
    GET /api/prescriptions/my/
    Bemorning o'z retseptlari
    """
    serializer_class   = PrescriptionListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Prescription.objects.filter(
            patient=self.request.user
        ).select_related('doctor', 'doctor__specialty').prefetch_related('items')


class PrescriptionDetailView(generics.RetrieveAPIView):
    """
    GET /api/prescriptions/<id>/
    Retsept batafsil
    """
    serializer_class   = PrescriptionDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        obj = Prescription.objects.filter(
            id=self.kwargs['pk'],
            patient=self.request.user
        ).select_related(
            'doctor', 'doctor__specialty', 'patient'
        ).prefetch_related('items__medication').first()

        if not obj:
            from rest_framework.exceptions import NotFound
            raise NotFound('Retsept topilmadi')
        return obj


class PrescriptionCreateView(generics.CreateAPIView):
    """
    POST /api/prescriptions/create/
    Retsept yaratish (doktor)
    """
    serializer_class   = PrescriptionCreateSerializer
    permission_classes = [IsAuthenticated]


class BarcodeScanView(views.APIView):
    """
    POST /api/prescriptions/scan/
    Body: { "barcode": "1234567890123" }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = BarcodeScanSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        barcode = serializer.validated_data['barcode']

        try:
            prescription = Prescription.objects.select_related(
                'doctor', 'doctor__specialty', 'patient'
            ).prefetch_related('items__medication').get(barcode=barcode)
        except Prescription.DoesNotExist:
            return Response({'error': 'Retsept topilmadi'}, status=404)

        data = PrescriptionDetailSerializer(prescription).data
        return Response({'success': True, 'prescription': data})