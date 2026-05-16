from django.urls import path, include

urlpatterns = [
    path('api/drivers/',   include('pasadanow.apps.drivers.urls')),
    path('api/earnings/',  include('pasadanow.apps.earnings.urls')),
    path('api/admin/',     include('pasadanow.apps.admin_api.urls')),
    path('api/commuters/', include('pasadanow.apps.commuters.urls')),
    path('api/',           include('pasadanow.apps.fare.urls')),  # ← fixed
]