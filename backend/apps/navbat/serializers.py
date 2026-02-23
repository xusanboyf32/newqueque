# apps/navbat/serializers.py
from datetime import datetime, timedelta

from django.utils import timezone
from rest_framework import serializers

from .models import (
    Specialty, Doctor, DoctorSchedule,
    AppointmentSlot, SlotStatus,
    Appointment, AppointmentStatus,
)


# ---------------------- BASIC (LIST/CHOICE) ----------------------

class SpecialtySerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialty
        fields = ("id", "name", "slug", "is_active")


class DoctorListSerializer(serializers.ModelSerializer):
    specialty_name = serializers.CharField(source="specialty.name", read_only=True)

    class Meta:
        model = Doctor
        fields = (
            "id",
            "full_name",
            "slug",
            "specialty",
            "specialty_name",
            "room_number",
            "address",
            "is_active",
        )


class DoctorScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorSchedule
        fields = ("work_start", "work_end", "slot_minutes", "is_active")


class DoctorDetailSerializer(serializers.ModelSerializer):
    specialty = SpecialtySerializer(read_only=True)
    schedule = DoctorScheduleSerializer(read_only=True)

    class Meta:
        model = Doctor
        fields = (
            "id",
            "full_name",
            "slug",
            "specialty",
            "room_number",
            "address",
            "is_active",
            "schedule",
        )


# ---------------------- SLOTS ----------------------

class AppointmentSlotSerializer(serializers.ModelSerializer):
    """
    Slot ro'yxati uchun.
    end_time DBda yo'q — schedule.slot_minutes orqali hisoblab beramiz.
    """
    end_time = serializers.SerializerMethodField()

    class Meta:
        model = AppointmentSlot
        fields = ("id", "date", "start_time", "end_time", "status")

    def get_end_time(self, obj):
        # slot_minutes doctor.schedule dan olinadi
        slot_minutes = getattr(getattr(obj.doctor, "schedule", None), "slot_minutes", 15)
        dt = datetime.combine(obj.date, obj.start_time)
        dt_end = dt + timedelta(minutes=slot_minutes)
        return dt_end.time()


# ---------------------- APPOINTMENTS ----------------------

class AppointmentDetailSerializer(serializers.ModelSerializer):
    """
    Userga chiqadigan yakuniy natija:
    Doktor, manzil, xona, kun/sana, vaqt.
    """
    date = serializers.DateField(source="slot.date", read_only=True)
    start_time = serializers.TimeField(source="slot.start_time", read_only=True)

    specialty = serializers.CharField(source="slot.doctor.specialty.name", read_only=True)
    doctor = serializers.CharField(source="slot.doctor.full_name", read_only=True)
    room_number = serializers.CharField(source="slot.doctor.room_number", read_only=True)
    address = serializers.CharField(source="slot.doctor.address", read_only=True)

    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Appointment
        fields = (
            "id",
            "status",
            "username",
            "first_name",
            "last_name",
            "date",
            "start_time",
            "specialty",
            "doctor",
            "room_number",
            "address",
            "created_at",
        )


class AppointmentCreateSerializer(serializers.Serializer):
    """
    Navbat olish: user faqat slot_id yuboradi.
    Pro yondashuv: validation + slotni bandligini tekshirish shu yerda.
    """
    slot_id = serializers.UUIDField()

    def validate(self, attrs):
        request = self.context.get("request")
        user = getattr(request, "user", None)

        # Profil majburiy (pro oqim): ism, familiya, telefon bo'lmasa navbat berilmaydi
        # phone_number Profile'da, ism/familiya User'da.
        if user:
            phone = getattr(getattr(user, "profile", None), "phone_number", None)
            if not user.first_name or not user.last_name or not phone:
                raise serializers.ValidationError({
                    "detail": "Navbat olish uchun profilni to'ldiring (ism, familiya, telefon)."
                })

        try:
            slot = (AppointmentSlot.objects
                    .select_related("doctor", "doctor__specialty", "doctor__schedule")
                    .get(id=attrs["slot_id"]))
        except AppointmentSlot.DoesNotExist:
            raise serializers.ValidationError({"slot_id": "Bunday slot topilmadi"})

        if slot.status != SlotStatus.FREE:
            raise serializers.ValidationError({"slot_id": "Bu vaqt band"})

        # Bugun bo'lsa o'tgan vaqtlarni band qilishga ruxsat bermaymiz
        today = timezone.localdate()
        now_time = timezone.localtime().time()
        if slot.date == today and slot.start_time <= now_time:
            raise serializers.ValidationError({"slot_id": "Bu vaqt o'tib ketgan"})

        attrs["slot_obj"] = slot
        return attrs


class AppointmentCancelSerializer(serializers.Serializer):
    """
    Bekor qilish uchun (oddiy).
    """
    appointment_id = serializers.UUIDField()

    def validate(self, attrs):
        request = self.context.get("request")
        user = getattr(request, "user", None)

        try:
            appt = (Appointment.objects
                    .select_related("slot", "slot__doctor")
                    .get(id=attrs["appointment_id"], user=user))
        except Appointment.DoesNotExist:
            raise serializers.ValidationError({"appointment_id": "Navbat topilmadi"})

        if appt.status != AppointmentStatus.BOOKED:
            raise serializers.ValidationError({"appointment_id": "Bu navbatni bekor qilib bo'lmaydi"})

        attrs["appointment_obj"] = appt
        return attrs
