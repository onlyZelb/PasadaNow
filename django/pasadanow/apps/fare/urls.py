from django.urls import path
from .views import FareConfigView

urlpatterns = [
    path('fare-config', FareConfigView.as_view()),
]