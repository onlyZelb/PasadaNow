from django.db import models


class FareConfig(models.Model):
    base_fare        = models.DecimalField(max_digits=8, decimal_places=2, default=15.0)
    per_km_rate      = models.DecimalField(max_digits=8, decimal_places=2, default=8.0)
    minimum_fare     = models.DecimalField(max_digits=8, decimal_places=2, default=15.0)
    booking_fee      = models.DecimalField(max_digits=8, decimal_places=2, default=0.0)
    surge_multiplier = models.DecimalField(max_digits=4, decimal_places=2, default=1.0)
    surge_enabled    = models.BooleanField(
                           default=False,
                           db_column='surge_active',
                       )
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'fare_config'
        managed  = False

    @classmethod
    def get_config(cls):
        config, _ = cls.objects.get_or_create(pk=1)
        return config

    def to_dict(self):
        return {
            'base_fare':        float(self.base_fare),
            'per_km_rate':      float(self.per_km_rate),
            'minimum_fare':     float(self.minimum_fare),
            'booking_fee':      float(self.booking_fee),
            'surge_multiplier': float(self.surge_multiplier),
            'surge_enabled':    self.surge_enabled,
            'updated_at':       self.updated_at.isoformat(),
        }