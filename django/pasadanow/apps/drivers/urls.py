from django.urls import path
from .views import (
    DriverMeView,
    DriverProfileUpdateView,
    DriverChangePasswordView,
    DriverPhotoView,
    DriverStatusView,
    AvailableDriversView,
    AcceptRideView,
    CompleteRideView,
    DeclineRideView,
    PendingRideView,
    DriverLocationView,
    CommuterLocationView,
)

urlpatterns = [
    path('me',                                          DriverMeView.as_view()),
    path('me/profile',                                  DriverProfileUpdateView.as_view()),
    path('me/change-password',                          DriverChangePasswordView.as_view()),
    path('me/photo',                                    DriverPhotoView.as_view()),
    path('me/status',                                   DriverStatusView.as_view()),
    path('me/location',                                 DriverLocationView.as_view()),
    path('available',                                   AvailableDriversView.as_view()),
    path('rides/pending',                               PendingRideView.as_view()),
    path('rides/<int:ride_id>/accept',                  AcceptRideView.as_view()),
    path('rides/<int:ride_id>/complete',                CompleteRideView.as_view()),
    path('rides/<int:ride_id>/decline',                 DeclineRideView.as_view()),
    path('rides/<int:ride_id>/driver-location',         DriverLocationView.as_view()),
    path('rides/<int:ride_id>/commuter-location',       CommuterLocationView.as_view()),
]