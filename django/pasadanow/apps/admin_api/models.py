from django.db import models


class FareConfig(models.Model):
    base_fare        = models.DecimalField(max_digits=8, decimal_places=2, default=40.00)
    per_km_rate      = models.DecimalField(max_digits=8, decimal_places=2, default=10.00)
    minimum_fare     = models.DecimalField(max_digits=8, decimal_places=2, default=40.00)
    booking_fee      = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    surge_multiplier = models.DecimalField(max_digits=4, decimal_places=2, default=1.00)
    surge_active     = models.BooleanField(default=False)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "fare_config"

    @classmethod
    def get_solo(cls):
        """Always returns the single config row, creating it if missing."""
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
        