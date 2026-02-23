# apps/navbat/views.py
from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

from .models import Specialty, Doctor, Appointment, DoctorSchedule,     AppointmentSlot,     SlotStatus, AppointmentStatus


from .serializers import (
    SpecialtySerializer,
    DoctorListSerializer,
    DoctorDetailSerializer,
    AppointmentSlotSerializer,
    AppointmentCreateSerializer,
    AppointmentDetailSerializer,
    AppointmentCancelSerializer,
)
from .services import (
    ensure_week_slots,
    list_available_week_slots,   # agar sizning services.py da nomi list_available_week_slots bo'lsa
    book_slot,
    cancel_appointment,
)


# -------------------- SPECIALTIES --------------------

class SpecialtyListAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        qs = Specialty.objects.filter(is_active=True).order_by("name")
        data = SpecialtySerializer(qs, many=True).data
        return Response(data, status=status.HTTP_200_OK)


# -------------------- DOCTORS --------------------

class DoctorListAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        specialty_id = request.query_params.get("specialty_id")

        qs = Doctor.objects.filter(is_active=True, specialty__is_active=True).select_related("specialty")
        if specialty_id:
            qs = qs.filter(specialty_id=specialty_id)

        qs = qs.order_by("full_name")
        data = DoctorListSerializer(qs, many=True).data
        return Response(data, status=status.HTTP_200_OK)


class DoctorDetailAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, doctor_id: int):
        doctor = get_object_or_404(
            Doctor.objects.select_related("specialty").prefetch_related("slots"),
            id=doctor_id,
            is_active=True
        )
        # schedule OneToOne bo'lgani uchun serializer ichida o'qiladi (bor bo'lsa)
        data = DoctorDetailSerializer(doctor).data
        return Response(data, status=status.HTTP_200_OK)


# -------------------- WEEK SLOTS --------------------

class DoctorWeekSlotsAPIView(APIView):
    """
    GET /api/doctors/<doctor_id>/week-slots/
    - bugundan boshlab 7 kun
    - yakshanba dam: slot yaratilmaydi => ro'yxatda chiqmaydi
    - bugun: eski vaqtlar chiqmaydi
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, doctor_id: int):
        doctor = get_object_or_404(Doctor, id=doctor_id, is_active=True)

        # 7 kunlik slotlar bazada bo'lsin
        ensure_week_slots(doctor=doctor, days=7)

        # faqat bo'sh slotlar (bugun filter bilan)
        qs = list_available_week_slots(doctor=doctor, days=7)

        data = AppointmentSlotSerializer(qs, many=True).data
        return Response(data, status=status.HTTP_200_OK)


# -------------------- APPOINTMENTS --------------------

class AppointmentCreateAPIView(APIView):
    """
    POST /api/appointments/
    body: {"slot_id": "..."}
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = AppointmentCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        slot_id = serializer.validated_data["slot_id"]

        try:
            appt = book_slot(user=request.user, slot_id=slot_id)
        except ValueError as e:
            code = str(e)
            if code == "SLOT_NOT_FREE":
                return Response({"detail": "Bu vaqt band"}, status=status.HTTP_409_CONFLICT)
            if code == "SLOT_EXPIRED":
                return Response({"detail": "Bu vaqt o'tib ketgan"}, status=status.HTTP_400_BAD_REQUEST)
            return Response({"detail": "Navbat olishda xatolik"}, status=status.HTTP_400_BAD_REQUEST)

        out = AppointmentDetailSerializer(appt).data
        return Response(out, status=status.HTTP_201_CREATED)


class MyAppointmentsAPIView(APIView):
    """
    GET /api/appointments/my/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = (Appointment.objects
              .filter(user=request.user)
              .select_related("slot", "slot__doctor", "slot__doctor__specialty")
              .order_by("-created_at"))

        data = AppointmentDetailSerializer(qs, many=True).data
        return Response(data, status=status.HTTP_200_OK)


class AppointmentCancelAPIView(APIView):
    """
    POST /api/appointments/cancel/
    body: {"appointment_id": "..."}
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = AppointmentCancelSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        appointment_id = serializer.validated_data["appointment_id"]

        try:
            appt = cancel_appointment(user=request.user, appointment_id=appointment_id)
        except ValueError as e:
            code = str(e)
            if code == "APPOINTMENT_NOT_CANCELABLE":
                return Response({"detail": "Bu navbatni bekor qilib bo'lmaydi"}, status=status.HTTP_400_BAD_REQUEST)
            return Response({"detail": "Bekor qilishda xatolik"}, status=status.HTTP_400_BAD_REQUEST)

        out = AppointmentDetailSerializer(appt).data
        return Response(out, status=status.HTTP_200_OK)



# +++++++++++++++++++++++++++++++++++++++++++++++++++++++


# -------------------- FRONTEND COMPAT VIEWS --------------------
# Frontend /api/appointments/ va /api/departments/ kutadi
# Bu view lar mavjud slot-based tizimni frontend formatiga moslashtiradi

from datetime import datetime, timedelta, time as time_type
from django.utils import timezone


class WeekScheduleAPIView(APIView):
    """
    GET /api/appointments/week-schedule/?doctor=1&start_date=2026-02-21
    Frontend BookingFlow Step 2 — kunlarni ko'rsatish
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        doctor_id = request.query_params.get('doctor')
        start_date_str = request.query_params.get('start_date')

        if not doctor_id:
            return Response({'error': 'doctor parametri kerak'}, status=400)

        doctor = get_object_or_404(
            Doctor.objects.select_related('specialty', 'schedule'),
            id=doctor_id, is_active=True
        )

        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date() if start_date_str else timezone.now().date()
        except ValueError:
            start_date = timezone.now().date()

        # schedule mavjudligini tekshirish
        schedule = getattr(doctor, 'schedule', None)
        work_start = schedule.work_start if schedule else time_type(9, 0)
        work_end = schedule.work_end if schedule else time_type(18, 0)
        slot_minutes = schedule.slot_minutes if schedule else 15

        # Total slotlar soni
        total_minutes = (
            datetime.combine(start_date, work_end) -
            datetime.combine(start_date, work_start)
        ).seconds // 60
        total_slots = total_minutes // slot_minutes

        weekdays_uz = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba']
        schedule_list = []

        for i in range(7):
            day = start_date + timedelta(days=i)

            # Band slotlar soni
            booked = AppointmentSlot.objects.filter(
                doctor=doctor,
                date=day,
                status=SlotStatus.BOOKED
            ).count()

            available = max(0, total_slots - booked)

            schedule_list.append({
                'date': str(day),
                'weekday': day.strftime('%A'),
                'weekday_uz': weekdays_uz[day.weekday()],
                'display': day.strftime('%d.%m.%Y'),
                'total_slots': total_slots,
                'available_slots': available,
                'is_full': available == 0,
            })

        return Response({
            'doctor': {
                'id': doctor.id,
                'name': doctor.full_name,
                'specialization': doctor.specialty.name if doctor.specialty else '',
            },
            'schedule': schedule_list
        })


class AvailableSlotsAPIView(APIView):
    """
    GET /api/appointments/available-slots/?doctor=1&date=2026-02-21
    Frontend BookingFlow Step 3 — vaqtlarni ko'rsatish
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        doctor_id = request.query_params.get('doctor')
        date_str = request.query_params.get('date')

        if not doctor_id or not date_str:
            return Response({'error': 'doctor va date kerak'}, status=400)

        doctor = get_object_or_404(
            Doctor.objects.select_related('schedule'),
            id=doctor_id, is_active=True
        )

        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': "Noto'g'ri sana formati"}, status=400)

        # ensure_week_slots — slotlar bazada bo'lsin
        ensure_week_slots(doctor=doctor, days=14)

        # O'sha kungi barcha slotlar
        slots_qs = AppointmentSlot.objects.filter(
            doctor=doctor,
            date=target_date
        ).order_by('start_time')

        now_time = timezone.localtime().time()
        today = timezone.now().date()

        schedule = getattr(doctor, 'schedule', None)
        slot_minutes = schedule.slot_minutes if schedule else 15

        slots = []
        for slot in slots_qs:
            is_available = slot.status == SlotStatus.FREE

            # Bugun bo'lsa o'tgan vaqtlar
            if target_date == today and slot.start_time <= now_time:
                is_available = False

            end_dt = datetime.combine(target_date, slot.start_time) + timedelta(minutes=slot_minutes)

            slots.append({
                'time': slot.start_time.strftime('%H:%M'),
                'time_obj': str(slot.start_time),  # frontend selTime uchun
                'end_time': end_dt.time().strftime('%H:%M'),
                'display': f"{slot.start_time.strftime('%H:%M')} - {end_dt.time().strftime('%H:%M')}",
                'is_available': is_available,
                'slot_id': str(slot.id),  # booking uchun kerak
            })

        return Response({
            'doctor': {'id': doctor.id},
            'date': str(target_date),
            'slots': slots,
            'total_slots': len(slots),
            'available_slots': sum(1 for s in slots if s['is_available']),
        })


class AppointmentCreateFrontendView(APIView):
    """
    POST /api/appointments/create/
    Frontend yuboradi: {doctor, appointment_date, appointment_time, complaint}
    Backend slot_id topib navbat yaratadi
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        doctor_id = request.data.get('doctor')
        date_str = request.data.get('appointment_date')
        time_str = request.data.get('appointment_time')

        if not all([doctor_id, date_str, time_str]):
            return Response({'error': 'doctor, appointment_date, appointment_time kerak'}, status=400)

        doctor = get_object_or_404(Doctor, id=doctor_id, is_active=True)

        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            # "HH:MM" yoki "HH:MM:SS" formatini qabul qilish
            target_time = datetime.strptime(time_str[:5], '%H:%M').time()
        except ValueError:
            return Response({'error': "Noto'g'ri sana yoki vaqt formati"}, status=400)

        # Slotni topish
        slot = AppointmentSlot.objects.filter(
            doctor=doctor,
            date=target_date,
            start_time=target_time,
            status=SlotStatus.FREE
        ).first()

        if not slot:
            return Response({'appointment_time': ["Bu vaqt allaqachon band yoki mavjud emas!"]}, status=400)

        # O'tgan vaqt tekshiruvi
        if target_date == timezone.now().date():
            if target_time <= timezone.localtime().time():
                return Response({'appointment_time': ["O'tgan vaqtga navbat ololmaysiz!"]}, status=400)

        try:
            appt = book_slot(user=request.user, slot_id=slot.id)
        except ValueError as e:
            code = str(e)
            if code == 'SLOT_NOT_FREE':
                return Response({'appointment_time': ['Bu vaqt band']}, status=409)
            if code == 'SLOT_EXPIRED':
                return Response({'appointment_time': ["O'tgan vaqt"]}, status=400)
            return Response({'error': 'Xatolik yuz berdi'}, status=400)

        # Frontend kutgan formatda javob
        schedule = getattr(doctor, 'schedule', None)
        slot_minutes = schedule.slot_minutes if schedule else 15
        end_dt = datetime.combine(target_date, target_time) + timedelta(minutes=slot_minutes)

        return Response({
            'id': str(appt.id),
            'queue_number': 1,  # navbat modeli queue_number saqlamaydi, 1 qaytaramiz
            'doctor': doctor_id,
            'doctor_name': doctor.full_name,
            'appointment_date': date_str,
            'appointment_time': time_str,
            'end_time': end_dt.time().strftime('%H:%M:%S'),
            'status': 'PENDING',
            'status_display': 'Kutilmoqda',
        }, status=201)


class MyAppointmentsFrontendView(APIView):
    """
    GET /api/appointments/my/?future=true&status=PENDING
    Frontend AppointmentsPage uchun
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = (Appointment.objects
              .filter(user=request.user)
              .select_related('slot', 'slot__doctor', 'slot__doctor__specialty')
              .order_by('slot__date', 'slot__start_time'))

        # future filter
        if request.query_params.get('future') == 'true':
            qs = qs.filter(slot__date__gte=timezone.now().date())

        # status filter — PENDING=BOOKED, CANCELLED=CANCELED
        status_map = {
            'PENDING': AppointmentStatus.BOOKED,
            'CONFIRMED': AppointmentStatus.BOOKED,
            'CANCELLED': AppointmentStatus.CANCELED,
        }
        status_filter = request.query_params.get('status')
        if status_filter and status_filter in status_map:
            qs = qs.filter(status=status_map[status_filter])

        results = []
        for appt in qs:
            slot = appt.slot
            doctor = slot.doctor
            schedule = getattr(doctor, 'schedule', None)
            slot_minutes = schedule.slot_minutes if schedule else 15
            end_dt = datetime.combine(slot.date, slot.start_time) + timedelta(minutes=slot_minutes)

            # Status mapping — frontend STATUS_CFG bilan mos
            st = 'PENDING' if appt.status == AppointmentStatus.BOOKED else 'CANCELLED'

            # time_until hisoblash
            appt_dt = datetime.combine(slot.date, slot.start_time)
            appt_dt_aware = timezone.make_aware(appt_dt)
            now = timezone.now()
            is_past = appt_dt_aware < now
            time_until = None
            if not is_past:
                delta = appt_dt_aware - now
                time_until = {
                    'days': delta.days,
                    'hours': delta.seconds // 3600,
                    'minutes': (delta.seconds % 3600) // 60,
                    'total_minutes': delta.total_seconds() / 60,
                }

            results.append({
                'id': str(appt.id),
                'queue_number': 1,
                'patient': request.user.id,
                'patient_name': f"{request.user.first_name} {request.user.last_name}".strip(),
                'doctor': doctor.id,
                'doctor_name': doctor.full_name,
                'doctor_room': doctor.room_number,
                'department_name': doctor.specialty.name if doctor.specialty else '',
                'appointment_date': str(slot.date),
                'appointment_time': slot.start_time.strftime('%H:%M:%S'),
                'end_time': end_dt.time().strftime('%H:%M:%S'),
                'duration_minutes': slot_minutes,
                'status': st,
                'status_display': 'Kutilmoqda' if st == 'PENDING' else 'Bekor qilindi',
                'complaint': '',
                'notes': '',
                'is_today': slot.date == timezone.now().date(),
                'is_past': is_past,
                'time_until': time_until,
                'created_at': str(appt.created_at),
                'updated_at': str(appt.created_at),
            })

        return Response(results)


class AppointmentCancelFrontendView(APIView):
    """
    POST /api/appointments/<pk>/cancel/
    Frontend AptCard bekor qilish tugmasi
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        appt = get_object_or_404(
            Appointment,
            id=pk,
            user=request.user
        )

        if appt.status != AppointmentStatus.BOOKED:
            return Response({'error': "Bu navbatni bekor qilib bo'lmaydi!"}, status=400)

        try:
            appt = cancel_appointment(user=request.user, appointment_id=appt.id)
        except ValueError:
            return Response({'error': "Bekor qilishda xatolik"}, status=400)

        return Response({
            'message': 'Navbat bekor qilindi!',
            'appointment': {'id': str(appt.id), 'status': 'CANCELLED'}
        })


class DepartmentListFrontendView(APIView):
    """
    GET /api/departments/
    Frontend Bo'limlar bo'limi uchun — Specialty lar qaytariladi
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        specialties = Specialty.objects.filter(is_active=True).order_by('name')
        results = []
        for sp in specialties:
            doctors_count = Doctor.objects.filter(specialty=sp, is_active=True).count()
            results.append({
                'id': sp.id,
                'name': sp.name,
                'name_uz': sp.name,
                'name_ru': sp.name,
                'icon': '🏥',
                'color': '#00c8aa',
                'order': 0,
                'active_doctors_count': doctors_count,
                'is_active': sp.is_active,
            })
        return Response(results)


class DepartmentDoctorsFrontendView(APIView):
    """
    GET /api/departments/<pk>/doctors/
    Frontend doktorlar ro'yxati uchun
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        specialty = get_object_or_404(Specialty, id=pk, is_active=True)
        doctors = Doctor.objects.filter(
            specialty=specialty, is_active=True
        ).select_related('specialty', 'schedule')

        results = []
        for doc in doctors:
            schedule = getattr(doc, 'schedule', None)
            work_start = schedule.work_start if schedule else time_type(9, 0)
            work_end = schedule.work_end if schedule else time_type(18, 0)

            results.append({
                'id': doc.id,
                'name': doc.full_name,
                'full_name': doc.full_name,
                'specialization': specialty.name,
                'room_number': doc.room_number,
                'working_hours_start': str(work_start),
                'working_hours_end': str(work_end),
                'working_hours_display': f"{str(work_start)[:5]}–{str(work_end)[:5]}",
                'rating': None,
                'years_of_experience': None,
                'consultation_fee': 0,
                'is_active': doc.is_active,
                'is_available_today': True,
                'department_name': specialty.name,
            })
        return Response({'doctors': results})
