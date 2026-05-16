from django.apps import AppConfig

class DriversConfig(AppConfig):
    name = 'pasadanow.apps.drivers'
    label = 'drivers'

    def ready(self):
        from django.db import connection
        try:
            with connection.cursor() as cursor:
                cursor.execute("UPDATE drivers SET is_online = false")
        except Exception:
            pass