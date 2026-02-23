from django.urls import path
from . import views

urlpatterns = [
    path('my/',           views.MyPrescriptionsView.as_view()),
    path('medications/',  views.MedicationListView.as_view()),
    path('create/',       views.PrescriptionCreateView.as_view()),
    path('scan/',         views.BarcodeScanView.as_view()),
    path('<int:pk>/',     views.PrescriptionDetailView.as_view()),
]
