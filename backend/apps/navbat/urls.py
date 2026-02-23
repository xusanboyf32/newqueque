from django.urls import path
from .views import (
    SpecialtyListAPIView,
    DoctorListAPIView,
    DoctorDetailAPIView,
    DoctorWeekSlotsAPIView,
    AppointmentCreateAPIView,
    MyAppointmentsAPIView,
    AppointmentCancelAPIView,
    # Frontend compat
    WeekScheduleAPIView,
    AvailableSlotsAPIView,
    AppointmentCreateFrontendView,
    MyAppointmentsFrontendView,
    AppointmentCancelFrontendView,
    DepartmentListFrontendView,
    DepartmentDoctorsFrontendView,
)

app_name = "navbat"

urlpatterns = [
    # ── Eski yo'llar (o'zgarishsiz) ──
    path("specialties/", SpecialtyListAPIView.as_view(), name="specialty-list"),
    path("doctors/", DoctorListAPIView.as_view(), name="doctor-list"),
    path("doctors/<int:doctor_id>/", DoctorDetailAPIView.as_view(), name="doctor-detail"),
    path("doctors/<int:doctor_id>/week-slots/", DoctorWeekSlotsAPIView.as_view(), name="doctor-week-slots"),
    path("appointments/", AppointmentCreateAPIView.as_view(), name="appointment-create"),
    path("appointments/my/", MyAppointmentsAPIView.as_view(), name="my-appointments"),
    path("appointments/cancel/", AppointmentCancelAPIView.as_view(), name="appointment-cancel"),

    # ── Frontend uchun yangi yo'llar ──
    path("week-schedule/",   WeekScheduleAPIView.as_view(),             name="week-schedule"),
    path("available-slots/", AvailableSlotsAPIView.as_view(),           name="available-slots"),
    path("create/",          AppointmentCreateFrontendView.as_view(),   name="frontend-create"),
    path("my/",              MyAppointmentsFrontendView.as_view(),       name="frontend-my"),
    path("<str:pk>/cancel/", AppointmentCancelFrontendView.as_view(),   name="frontend-cancel"),
]