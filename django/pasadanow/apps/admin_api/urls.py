from django.urls import path
from .views import (
    AllUsersView,
    VerifyUserView,
    AllRidesView,
    UserPhotosView,
    FareConfigView,
)

urlpatterns = [
    path('users',                      AllUsersView.as_view()),
    path('users/<int:user_id>/verify', VerifyUserView.as_view()),
    path('users/<int:user_id>/photos', UserPhotosView.as_view()),
    path('rides',                      AllRidesView.as_view()),
    path('fare-config',                FareConfigView.as_view()),  # GET + PATCH
]