from django.db import models


class Commuter(models.Model):
    username      = models.CharField(max_length=50, unique=True)
    password      = models.CharField(max_length=255)
    full_name     = models.CharField(max_length=100, blank=True, null=True)
    age           = models.CharField(max_length=10,  blank=True, null=True)
    phone         = models.CharField(max_length=20,  blank=True, null=True)
    email         = models.CharField(max_length=100, blank=True, null=True)
    address       = models.CharField(max_length=255, blank=True, null=True)
    profile_photo = models.TextField(blank=True, null=True)
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'commuters'
        managed  = False