from rest_framework import serializers
from .models import Medication, Prescription, PrescriptionItem


# ==================== MEDICATION ====================

class MedicationSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Medication
        fields = ['id', 'name', 'price_per_pack', 'units_per_pack', 'unit', 'measure_type', 'is_active']


# ==================== BARCODE HELPER ====================

def generate_barcode_base64(barcode_value):
    try:
        import barcode
        from barcode.writer import ImageWriter
        import io, base64

        EAN    = barcode.get_barcode_class('ean13')
        ean    = EAN(barcode_value, writer=ImageWriter())
        buffer = io.BytesIO()
        ean.write(buffer, options={
            'write_text':    True,
            'module_height': 15,
            'module_width':  0.8,
            'quiet_zone':    4,
        })
        buffer.seek(0)
        return f"data:image/png;base64,{base64.b64encode(buffer.getvalue()).decode('utf-8')}"
    except Exception:
        return None


# ==================== PRESCRIPTION ITEM ====================
class PrescriptionItemSerializer(serializers.ModelSerializer):
    total_doses_needed = serializers.ReadOnlyField()
    packs_needed       = serializers.ReadOnlyField()
    total_price        = serializers.ReadOnlyField()
    medication_name    = serializers.CharField(source='medication.name', read_only=True)  # ← QO'SHILDI

    class Meta:
        model  = PrescriptionItem
        fields = [
            'id', 'medication', 'medication_name',  # ← medication_name qaytdi (lekin modeldan emas, FK dan)
            'doses_per_day', 'duration_days',
            'unit_price', 'units_per_pack', 'pack_unit',
            'measure_type',
            'total_doses_needed', 'packs_needed', 'total_price',
            'note',
        ]

class PrescriptionItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = PrescriptionItem
        fields = [
            'medication',
            # 'medication_name',
            # 'frequency', 'duration',
            'doses_per_day', 'duration_days',
            'note',
        ]


# ==================== PRESCRIPTION LIST ====================

class PrescriptionListSerializer(serializers.ModelSerializer):
    doctor_name      = serializers.CharField(source='doctor.full_name', read_only=True)
    doctor_specialty = serializers.CharField(source='doctor.specialty.name', read_only=True)
    items_count      = serializers.IntegerField(source='items.count', read_only=True)
    total_cost       = serializers.SerializerMethodField()

    def get_total_cost(self, obj):
        return sum(item.total_price for item in obj.items.all())

    class Meta:
        model  = Prescription
        fields = [
            'id', 'diagnosis', 'doctor_name', 'doctor_specialty',
            'items_count', 'total_cost',
            'barcode', 'valid_until', 'created_at',
        ]


# ==================== PRESCRIPTION DETAIL ====================

class PrescriptionDetailSerializer(serializers.ModelSerializer):
    items            = PrescriptionItemSerializer(many=True, read_only=True)
    doctor_name      = serializers.CharField(source='doctor.full_name', read_only=True)
    doctor_specialty = serializers.CharField(source='doctor.specialty.name', read_only=True)
    patient_name     = serializers.SerializerMethodField()
    total_cost       = serializers.SerializerMethodField()
    barcode_image    = serializers.SerializerMethodField()

    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}".strip()

    def get_total_cost(self, obj):
        return sum(item.total_price for item in obj.items.all())

    def get_barcode_image(self, obj):
        return generate_barcode_base64(obj.barcode)  # ← helper funksiyaga chiqarildi

    class Meta:
        model  = Prescription
        fields = [
            'id', 'diagnosis',
            'doctor_name', 'doctor_specialty', 'patient_name',
            'barcode', 'barcode_image',
            'valid_until', 'created_at',
            'items', 'total_cost',
        ]


# ==================== PRESCRIPTION CREATE ====================

class PrescriptionCreateSerializer(serializers.ModelSerializer):
    items = PrescriptionItemCreateSerializer(many=True)

    class Meta:
        model  = Prescription
        fields = ['patient', 'doctor', 'diagnosis', 'valid_until', 'items']

    def validate_items(self, value):
        # Kamida bitta dori bo'lishi shart
        if not value:
            raise serializers.ValidationError("Kamida bitta dori kiritilishi kerak.")
        return value

    def create(self, validated_data):
        items_data   = validated_data.pop('items')
        prescription = Prescription.objects.create(**validated_data)
        for item_data in items_data:
            # medication_name avtomatik to'ldiriladi agar kiritilmagan bo'lsa
            # if not item_data.get('medication_name') and item_data.get('medication'):
            #     item_data['medication_name'] = item_data['medication'].name
            PrescriptionItem.objects.create(prescription=prescription, **item_data)
        return prescription


# ==================== BARCODE SCAN ====================

class BarcodeScanSerializer(serializers.Serializer):
    barcode = serializers.CharField(max_length=13, min_length=8)

    def validate_barcode(self, value):
        # Faqat raqamlardan iborat bo'lishi kerak
        if not value.isdigit():
            raise serializers.ValidationError("Barcode faqat raqamlardan iborat bo'lishi kerak.")
        return value