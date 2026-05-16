from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.db import connection
from pasadanow.apps.drivers.models import Ride
from pasadanow.apps.drivers.serializers import RideSerializer
from .models import FareConfig


class AllUsersView(APIView):
    """
    Returns all drivers + commuters WITHOUT photo blobs to keep the
    response small and avoid 431 Request Header Fields Too Large errors.
    Photos are fetched separately via /users/<id>/photos.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        users = []

        # ── Drivers ────────────────────────────────────────────────────────
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id, username, full_name, phone, email,
                       age, address,
                       'driver' AS role, verified_status, created_at,
                       license_no, plate_no, toda_no, is_online
                FROM drivers
                ORDER BY created_at DESC
            """)
            columns = [col[0] for col in cursor.description]
            drivers = [dict(zip(columns, row)) for row in cursor.fetchall()]
        users.extend(drivers)

        # ── Commuters ──────────────────────────────────────────────────────
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id, username, full_name, phone, email,
                       age, address,
                       'commuter' AS role, verified_status, created_at
                FROM commuters
                ORDER BY created_at DESC
            """)
            columns = [col[0] for col in cursor.description]
            commuters = [dict(zip(columns, row)) for row in cursor.fetchall()]
        users.extend(commuters)

        return Response(users)


class UserPhotosView(APIView):
    """
    Returns only the photo blobs for a single driver.
    Called lazily by the frontend when the driver modal is opened.
    """
    permission_classes = [AllowAny]

    def get(self, request, user_id):
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT photo_license, photo_plate, photo_toda, profile_photo
                FROM drivers
                WHERE id = %s
            """, [user_id])
            row = cursor.fetchone()

        if not row:
            return Response({'error': 'Driver not found'}, status=404)

        return Response({
            'photo_license': row[0],
            'photo_plate':   row[1],
            'photo_toda':    row[2],
            'profile_photo': row[3],
        })


class VerifyUserView(APIView):
    permission_classes = [AllowAny]

    def patch(self, request, user_id):
        action = request.data.get('action')
        role   = request.data.get('role', 'driver')

        if action not in ['verified', 'rejected']:
            return Response(
                {'error': 'action must be verified or rejected'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if role == 'commuter':
            with connection.cursor() as cursor:
                cursor.execute("""
                    UPDATE commuters SET verified_status = %s
                    WHERE id = %s
                    RETURNING id, username, verified_status
                """, [action, user_id])
                row = cursor.fetchone()
                if not row:
                    return Response(
                        {'error': 'Commuter not found'}, status=404)
            return Response({
                'id':              row[0],
                'username':        row[1],
                'verified_status': row[2],
            })

        # ── Driver ─────────────────────────────────────────────────────────
        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE drivers SET verified_status = %s
                WHERE id = %s
                RETURNING id, username, verified_status,
                          license_no, plate_no, toda_no
            """, [action, user_id])
            row = cursor.fetchone()
            if not row:
                return Response({'error': 'Driver not found'}, status=404)

        return Response({
            'id':              row[0],
            'username':        row[1],
            'verified_status': row[2],
            'license_no':      row[3],
            'plate_no':        row[4],
            'toda_no':         row[5],
        })


class AllRidesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        rides = Ride.objects.all().order_by('-created_at')
        return Response(RideSerializer(rides, many=True).data)


class FareConfigView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        cfg = FareConfig.get_solo()
        return Response(self._serialize(cfg))

    def patch(self, request):
        cfg = FareConfig.get_solo()
        fields = [
            'base_fare', 'per_km_rate', 'minimum_fare',
            'booking_fee', 'surge_multiplier', 'surge_active',
        ]
        for f in fields:
            if f in request.data:
                setattr(cfg, f, request.data[f])
        cfg.save()
        return Response(self._serialize(cfg))

    def _serialize(self, cfg):
        return {
            'base_fare':        float(cfg.base_fare),
            'per_km_rate':      float(cfg.per_km_rate),
            'minimum_fare':     float(cfg.minimum_fare),
            'booking_fee':      float(cfg.booking_fee),
            'surge_multiplier': float(cfg.surge_multiplier),
            'surge_active':     cfg.surge_active,
            'updated_at':       cfg.updated_at.isoformat() if cfg.updated_at else None,
        }