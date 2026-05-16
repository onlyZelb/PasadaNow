from django.db import models
from pasadanow.apps.drivers.models import Driver, Ride


class Earning(models.Model):
    driver     = models.ForeignKey(Driver, on_delete=models.CASCADE, db_column='driver_id')
    ride       = models.ForeignKey(Ride,   on_delete=models.CASCADE, db_column='ride_id')
    amount     = models.DecimalField(max_digits=8, decimal_places=2)
    date       = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'earnings'
        managed  = False