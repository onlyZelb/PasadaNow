from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum
from datetime import date
from pasadanow.apps.drivers.models import Driver
from .models import Earning
from .serializers import EarningSerializer


class EarningsListView(APIView):
    def get(self, request):
        username = request.auth.get("sub") if isinstance(request.auth, dict) else None
        if not username:
            return Response({"error": "Unauthorized"}, status=401)
        try:
            driver = Driver.objects.get(username=username)
        except Driver.DoesNotExist:
            return Response({"error": "Driver not found"}, status=404)
        earnings = Earning.objects.filter(driver=driver).order_by("-created_at")
        return Response(EarningSerializer(earnings, many=True).data)


class EarningsSummaryView(APIView):
    def get(self, request):
        username = request.auth.get("sub") if isinstance(request.auth, dict) else None
        if not username:
            return Response({"error": "Unauthorized"}, status=401)
        try:
            driver = Driver.objects.get(username=username)
        except Driver.DoesNotExist:
            return Response({"error": "Driver not found"}, status=404)
        today     = date.today()
        all_time  = Earning.objects.filter(driver=driver).aggregate(total=Sum("amount"))["total"] or 0
        today_sum = Earning.objects.filter(driver=driver, date=today).aggregate(total=Sum("amount"))["total"] or 0
        return Response({"today": float(today_sum), "all_time": float(all_time)})
