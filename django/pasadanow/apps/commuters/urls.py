from django.urls import path
from .views import CommuterProfileView, CommuterChangePasswordView, debug_view

urlpatterns = [
    path('me/profile', CommuterProfileView.as_view()),
    path('me/change-password', CommuterChangePasswordView.as_view()),
    path('debug', debug_view),
]