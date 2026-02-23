# config/urls.py

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse
from django.views.generic import RedirectView

from apps.navbat import views as nav_views

from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi


schema_view = get_schema_view(
    openapi.Info(
        title="Education Platform API",
        default_version="v1",
        description="Professional API documentation",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="contact@medical.local"),
        license=openapi.License(name="BSD License"),

    ),
    public=True,
    permission_classes=[permissions.AllowAny],

# ✅ JWT BEARER TOKEN NI QO'SHISH
    authentication_classes=[],  # Default authentication'ni o'chirish

)

# +++++++++++++++++++++++++++++++++++++++++++++++++++++
def home_view(request):
    return HttpResponse("""
    <h1>Backend API ishlayapti!</h1>
    <ul>
        <li><a href="/admin/">Admin Panel</a></li>
        <li><a href="/api/auth/login/">Login API</a></li>
        <li><a href="/swagger/">API Documentation</a></li>
    </ul>
    """)
# +++++++++++++++++++++++++++++++++++++++++++++++++++++

urlpatterns = [
    path('', home_view),
    path('admin/', admin.site.urls),

    # Auth
    path('api/auth/', include(('apps.accounts.urls', 'auth'), namespace='auth')),

    # path('api/appointments/', include('apps.navbat.urls')),  # navbat app ni appointments ga ulash

    path('api/daftar/', include('apps.daftar.urls')),
    path('api/prescriptions/', include('apps.prescriptions.urls')),

    path('api/navbat/', include('apps.navbat.urls')),
    # path('api/appointments/', include('apps.navbat.urls')),


    path("api/appointments/week-schedule/", nav_views.WeekScheduleAPIView.as_view()),
    path("api/appointments/available-slots/", nav_views.AvailableSlotsAPIView.as_view()),
    path("api/appointments/create/", nav_views.AppointmentCreateFrontendView.as_view()),
    path("api/appointments/my/", nav_views.MyAppointmentsFrontendView.as_view()),
    path("api/appointments/<str:pk>/cancel/", nav_views.AppointmentCancelFrontendView.as_view()),


    path('api/ai/', include('apps.ai_assistant.urls')),

    path("swagger/", schema_view.with_ui("swagger", cache_timeout=0), name="schema-swagger-ui"),
    path("redoc/", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"),
]



# Media files (development)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)