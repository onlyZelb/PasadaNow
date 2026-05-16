import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import FareConfig


class FareConfigView(APIView):
    permission_classes = [AllowAny]   # drivers + commuters read without auth

    def get(self, request):
        config = FareConfig.get_config()
        return Response(config.to_dict())

    def post(self, request):
        """Admin saves new fare config."""
        config = FareConfig.get_config()

        fields = [
            'base_fare', 'per_km_rate', 'minimum_fare',
            'booking_fee', 'surge_multiplier', 'surge_enabled',
        ]
        for field in fields:
            if field in request.data:
                setattr(config, field, request.data[field])

        config.save()
        return Response(config.to_dict())