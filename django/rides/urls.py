from django.urls import path
from . import views

urlpatterns = [
    path('fare/', views.calculate_fare),
]