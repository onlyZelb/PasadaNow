from rest_framework import serializers
from .models import Driver, Ride
from django.db import connection


class DriverSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Driver
        fields = [
            'id', 'username', 'full_name', 'phone',
            'email', 'license_no', 'plate_no', 'toda_no',
            'profile_photo', 'is_online', 'verified_status',
            'created_at', 'updated_at'
        ]


class RideSerializer(serializers.ModelSerializer):
    driver_name   = serializers.SerializerMethodField()
    commuter_name = serializers.SerializerMethodField()

    class Meta:
        model  = Ride
        fields = [
            'id', 'commuter_id', 'commuter_name',
            'driver', 'driver_name',
            'pickup_location', 'destination',
            'fare', 'distance_km', 'status', 'created_at',
        ]

    def get_driver_name(self, obj):
        if obj.driver:
            return obj.driver.full_name or obj.driver.username
        return None

    def get_commuter_name(self, obj):
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT full_name, username FROM commuters WHERE id = %s",
                [obj.commuter_id]
            )
            row = cursor.fetchone()
        if row:
            return row[0] or row[1]
        return None
