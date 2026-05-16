from django.apps import AppConfig

class FareAppConfig(AppConfig):                    # ← rename class
    default_auto_field = 'django.db.models.BigAutoField'
    name  = 'pasadanow.apps.fare'                  # ← match other apps
    label = 'fare'