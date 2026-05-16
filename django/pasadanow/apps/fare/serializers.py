from rest_framework import serializers
from .models import FareConfig

class FareConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model  = FareConfig
        fields = '__all__'