"""
Authentication API Views
"""
from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer

from .serializers import PatientProfileSerializer

class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register/

    Ro'yxatdan o'tish (Sign Up)
    Har kim ro'yxatdan o'tishi mumkin
    """

    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # JWT token yaratish
        refresh = RefreshToken.for_user(user)

        return Response({
            'message': 'Muvaffaqiyatli ro\'yxatdan o\'tdingiz!',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """
    POST /api/auth/login/

    Tizimga kirish (Sign In)
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']

        # JWT token yaratish
        refresh = RefreshToken.for_user(user)

        return Response({
            'message': 'Xush kelibsiz!',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """
    POST /api/auth/logout/

    Tizimdan chiqish
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()  # Token blacklist ga qo'shish

            return Response({
                'message': 'Muvaffaqiyatli chiqdingiz!'
            }, status=status.HTTP_200_OK)
        except Exception:
            return Response({
                'error': 'Token noto\'g\'ri'
            }, status=status.HTTP_400_BAD_REQUEST)


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)




# +++++++++++++++++++++++ADMIN PANEL UCHUN KERAKLI API LAR YOZILDI +++++++++++++++++++++++++++++++++++++++


"""
DOCTOR DASHBOARD API
Backend ma'lumotlarni tayyorlaydi, Frontend ko'rsatadi

JOYLASH: backend/apps/accounts/views.py ga qo'shing
Yoki yangi apps/dashboard/ yarating
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Count, Q
from datetime import datetime, timedelta


class DoctorDashboardView(APIView):
    """
    GET /api/dashboard/doctor/

    Doktor dashboard uchun barcha ma'lumotlar

    Frontend bu ma'lumotlarni olib, chiroyli ko'rsatadi
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Faqat doktor ko'rishi mumkin
        if not user.is_admin_doctor or not hasattr(user, 'doctor_profile'):
            return Response({
                'error': 'Faqat doktor uchun!'
            }, status=403)

        doctor = user.doctor_profile
        today = timezone.now().date()

        # ========================================
        # 1. STATISTIKA
        # ========================================

        # Bugungi navbatlar
        today_appointments = doctor.appointments.filter(
            appointment_date=today,
            status__in=['PENDING', 'CONFIRMED']
        ).count()

        # Bugungi yakunlangan navbatlar (bemorlar)
        today_completed = doctor.appointments.filter(
            appointment_date=today,
            status='COMPLETED'
        ).count()

        # Bugungi yozilgan retseptlar
        today_prescriptions = doctor.prescriptions.filter(
            created_at__date=today
        ).count()

        # Umumiy bemorlar (oxirgi 30 kun)
        last_month = today - timedelta(days=30)
        total_patients = doctor.appointments.filter(
            appointment_date__gte=last_month
        ).values('patient').distinct().count()

        # ========================================
        # 2. BUGUNGI NAVBATLAR
        # ========================================

        from apps.appointments.models import Appointment
        from apps.appointments.serializers import AppointmentListSerializer

        upcoming_appointments = Appointment.objects.filter(
            doctor=doctor,
            appointment_date=today,
            status__in=['PENDING', 'CONFIRMED']
        ).select_related('patient').order_by('appointment_time')[:10]

        upcoming_list = []
        for apt in upcoming_appointments:
            upcoming_list.append({
                'id': apt.id,
                'time': apt.appointment_time.strftime('%H:%M'),
                'patient_name': apt.patient.get_full_name(),
                'patient_phone': apt.patient.phone_number,
                'queue_number': apt.queue_number,
                'complaint': apt.complaint,
                'status': apt.status
            })

        # ========================================
        # 3. OXIRGI BEMORLAR (yaqinda ko'rilganlar)
        # ========================================

        recent_patients = Appointment.objects.filter(
            doctor=doctor,
            status='COMPLETED'
        ).select_related('patient').order_by('-appointment_date', '-appointment_time')[:5]

        recent_list = []
        for apt in recent_patients:
            # Bu bemorning oxirgi retsepti
            last_prescription = doctor.prescriptions.filter(
                patient=apt.patient
            ).order_by('-created_at').first()

            recent_list.append({
                'patient_id': apt.patient.id,
                'patient_name': apt.patient.get_full_name(),
                'date': apt.appointment_date.strftime('%d.%m.%Y'),
                'diagnosis': last_prescription.diagnosis if last_prescription else None,
                'prescription_number': last_prescription.prescription_number if last_prescription else None
            })

        # ========================================
        # 4. OXIRGI RETSEPTLAR
        # ========================================

        from apps.prescriptions.models import Prescription

        recent_prescriptions = Prescription.objects.filter(
            doctor=doctor
        ).select_related('patient').order_by('-created_at')[:10]

        prescriptions_list = []
        for rx in recent_prescriptions:
            prescriptions_list.append({
                'id': rx.id,
                'prescription_number': rx.prescription_number,
                'patient_name': rx.patient.get_full_name(),
                'diagnosis': rx.diagnosis,
                'status': rx.get_status_display(),
                'created_at': rx.created_at.strftime('%d.%m.%Y %H:%M'),
                'items_count': rx.items.count()
            })

        # ========================================
        # 5. HAFTALIK STATISTIKA (Chart uchun)
        # ========================================

        week_stats = []
        for i in range(7):
            date = today - timedelta(days=i)
            count = doctor.appointments.filter(
                appointment_date=date,
                status='COMPLETED'
            ).count()

            week_stats.append({
                'date': date.strftime('%d.%m'),
                'day': ['Yak', 'Du', 'Se', 'Chor', 'Pay', 'Ju', 'Shan'][date.weekday()],
                'count': count
            })

        week_stats.reverse()  # Eskilardan yangigacha

        # ========================================
        # 6. OYLIK STATISTIKA
        # ========================================

        # Hozirgi oy
        month_start = today.replace(day=1)
        month_appointments = doctor.appointments.filter(
            appointment_date__gte=month_start,
            appointment_date__lte=today
        ).count()

        month_prescriptions = doctor.prescriptions.filter(
            created_at__date__gte=month_start,
            created_at__date__lte=today
        ).count()

        # ========================================
        # RESPONSE
        # ========================================

        return Response({
            # Doktor ma'lumotlari
            'doctor': {
                'name': doctor.user.get_full_name(),
                'specialization': doctor.specialization,
                'room': doctor.room_number,
                'photo': request.build_absolute_uri(doctor.photo.url) if doctor.photo else None,
                'rating': float(doctor.rating),
            },

            # Bugungi statistika
            'today': {
                'appointments': today_appointments,
                'completed': today_completed,
                'prescriptions': today_prescriptions,
            },

            # Umumiy statistika
            'overall': {
                'total_patients': total_patients,
                'month_appointments': month_appointments,
                'month_prescriptions': month_prescriptions,
            },

            # Navbatlar
            'upcoming_appointments': upcoming_list,

            # Oxirgi bemorlar
            'recent_patients': recent_list,

            # Oxirgi retseptlar
            'recent_prescriptions': prescriptions_list,

            # Haftalik chart uchun
            'week_stats': week_stats,
        })


class PatientDashboardView(APIView):
    """
    GET /api/dashboard/patient/

    Bemor dashboard uchun ma'lumotlar
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Faqat bemor ko'rishi mumkin
        if not user.is_patient:
            return Response({
                'error': 'Faqat bemor uchun!'
            }, status=403)

        today = timezone.now().date()

        # ========================================
        # 1. KELGUSI NAVBATLAR
        # ========================================

        from apps.appointments.models import Appointment

        upcoming = Appointment.objects.filter(
            patient=user,
            appointment_date__gte=today,
            status__in=['PENDING', 'CONFIRMED']
        ).select_related('doctor', 'doctor__user', 'doctor__department').order_by('appointment_date',
                                                                                  'appointment_time')[:5]

        upcoming_list = []
        for apt in upcoming:
            upcoming_list.append({
                'id': apt.id,
                'doctor_name': apt.doctor.user.get_full_name(),
                'department': apt.doctor.department.name_uz,
                'date': apt.appointment_date.strftime('%d.%m.%Y'),
                'time': apt.appointment_time.strftime('%H:%M'),
                'room': apt.doctor.room_number,
                'queue_number': apt.queue_number,
                'days_until': (apt.appointment_date - today).days
            })

        # ========================================
        # 2. OXIRGI RETSEPTLAR
        # ========================================

        from apps.prescriptions.models import Prescription

        prescriptions = Prescription.objects.filter(
            patient=user
        ).select_related('doctor', 'doctor__user').prefetch_related('items__medication').order_by('-created_at')[:5]

        prescriptions_list = []
        for rx in prescriptions:
            prescriptions_list.append({
                'id': rx.id,
                'prescription_number': rx.prescription_number,
                'doctor_name': rx.doctor.user.get_full_name(),
                'diagnosis': rx.diagnosis,
                'status': rx.get_status_display(),
                'created_at': rx.created_at.strftime('%d.%m.%Y'),
                'valid_until': rx.valid_until.strftime('%d.%m.%Y'),
                'is_expired': rx.is_expired,
                'medications_count': rx.items.count()
            })

        # ========================================
        # 3. TIBBIY DAFTAR (Profil)
        # ========================================

        profile = user.patient_profile

        medical_info = {
            'blood_type': profile.blood_type,
            'allergies': profile.allergies,
            'chronic_diseases': profile.chronic_diseases,
        }

        # ========================================
        # 4. STATISTIKA
        # ========================================

        total_appointments = Appointment.objects.filter(
            patient=user
        ).count()

        completed_appointments = Appointment.objects.filter(
            patient=user,
            status='COMPLETED'
        ).count()

        total_prescriptions = Prescription.objects.filter(
            patient=user
        ).count()

        # ========================================
        # RESPONSE
        # ========================================

        return Response({
            'patient': {
                'name': user.get_full_name(),
                'phone': user.phone_number,
                'date_of_birth': user.date_of_birth,
            },

            'upcoming_appointments': upcoming_list,
            'recent_prescriptions': prescriptions_list,
            'medical_info': medical_info,

            'stats': {
                'total_appointments': total_appointments,
                'completed_appointments': completed_appointments,
                'total_prescriptions': total_prescriptions,
            }
        })


# ============================================
# QANDAY ISHLATISH (Frontend):
# ============================================

"""
REACT MISOL:

// 1. Ma'lumotlarni olish
const fetchDashboard = async () => {
  const response = await api.get('/api/dashboard/doctor/');
  return response.data;
};

// 2. Ko'rsatish
const DoctorDashboard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchDashboard().then(setData);
  }, []);

  if (!data) return <Loading />;

  return (
    <div>
      {/* Statistika */}
      <div className="stats">
        <StatCard 
          title="Bugungi navbatlar"
          value={data.today.appointments}
          icon="calendar"
        />
        <StatCard 
          title="Bemorlar"
          value={data.today.completed}
          icon="users"
        />
        <StatCard 
          title="Retseptlar"
          value={data.today.prescriptions}
          icon="prescription"
        />
      </div>

      {/* Navbatlar */}
      <div className="appointments">
        <h2>Bugungi navbatlar</h2>
        {data.upcoming_appointments.map(apt => (
          <AppointmentCard key={apt.id} appointment={apt} />
        ))}
      </div>

      {/* Chart */}
      <div className="chart">
        <LineChart data={data.week_stats} />
      </div>
    </div>
  );
};
"""




# YANGI — shu bilan almashtiring:
class UpdateProfileView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PatientProfileSerializer

    def get_object(self):
        from .models import PatientProfile
        profile, _ = PatientProfile.objects.get_or_create(user=self.request.user)
        return profile

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

