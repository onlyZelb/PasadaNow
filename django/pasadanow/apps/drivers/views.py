import bcrypt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import NotFound, PermissionDenied
from .models import Driver, Ride
from .serializers import DriverSerializer, RideSerializer


def get_driver(username):
    try:
        return Driver.objects.get(username=username)
    except Driver.DoesNotExist:
        raise NotFound('Driver not found')


def get_username(request):
    auth = request.auth
    if isinstance(auth, dict):
        return auth.get('sub')
    return None


def _profile_response(driver):
    """Single source of truth — every profile endpoint returns this."""
    return {
        'username':        driver.username,
        'full_name':       driver.full_name,
        'phone':           driver.phone,
        'email':           driver.email,
        'age':             driver.age,
        'address':         driver.address,
        'plate_number':    driver.plate_no,
        'license_number':  driver.license_no,
        'organization':    driver.toda_no,
        'profile_photo':   driver.profile_photo,
        'photo_license':   driver.photo_license,
        'photo_plate':     driver.photo_plate,
        'photo_toda':      driver.photo_toda,
        'is_online':       driver.is_online,
        'verified_status': driver.verified_status,
    }


class DriverMeView(APIView):
    def get(self, request):
        driver = get_driver(get_username(request))
        return Response(_profile_response(driver))


class DriverProfileUpdateView(APIView):
    def get(self, request):
        driver = get_driver(get_username(request))
        return Response(_profile_response(driver))

    def patch(self, request):
        driver = get_driver(get_username(request))

        # ── Validation ────────────────────────────────────────────────────
        errors = {}

        if 'full_name' in request.data:
            v = str(request.data['full_name']).strip()
            if v and len(v) < 2:
                errors['full_name'] = 'Full name must be at least 2 characters.'

        if 'age' in request.data:
            v = str(request.data['age']).strip()
            if v:
                if not v.isdigit():
                    errors['age'] = 'Age must be a number.'
                elif not (16 <= int(v) <= 80):
                    errors['age'] = 'Age must be between 16 and 80.'

        if 'phone' in request.data:
            v = str(request.data['phone']).strip()
            if v:
                digits = v.replace('+', '')
                if not digits.isdigit() or len(digits) < 10:
                    errors['phone'] = 'Enter a valid phone number (min 10 digits).'

        if 'email' in request.data:
            v = str(request.data['email']).strip()
            if v and '@' not in v:
                errors['email'] = 'Enter a valid email address.'

        if 'address' in request.data:
            v = str(request.data['address']).strip()
            if v and len(v) < 5:
                errors['address'] = 'Address must be at least 5 characters.'

        if errors:
            return Response({'errors': errors}, status=400)
        # ─────────────────────────────────────────────────────────────────

        field_map = {
            'full_name':      'full_name',
            'phone':          'phone',
            'email':          'email',
            'age':            'age',
            'address':        'address',
            'plate_no':       'plate_no',
            'plate_number':   'plate_no',
            'license_no':     'license_no',
            'license_number': 'license_no',
            'toda_no':        'toda_no',
            'organization':   'toda_no',
            'profilePhoto':   'profile_photo',
            'photoLicense':   'photo_license',
            'photoPlate':     'photo_plate',
            'photoToda':      'photo_toda',
        }

        updated_fields = []
        for incoming_key, model_field in field_map.items():
            if incoming_key in request.data:
                setattr(driver, model_field, request.data[incoming_key])
                if model_field not in updated_fields:
                    updated_fields.append(model_field)

        if not updated_fields:
            return Response({'detail': 'No valid fields provided.'}, status=400)

        driver.save(update_fields=[*updated_fields, 'updated_at'])
        return Response(_profile_response(driver))


class DriverChangePasswordView(APIView):
    def post(self, request):
        try:
            username = get_username(request)
            if not username:
                return Response({'detail': 'no username in token'}, status=401)

            current_password = request.data.get('current_password')
            new_password = request.data.get('new_password')

            if not current_password or not new_password:
                return Response({'detail': 'Both fields are required.'}, status=400)

            if len(new_password) < 6:
                return Response({'detail': 'Password must be at least 6 characters.'}, status=400)

            driver = get_driver(username)

            # Spring Boot uses BCrypt — verify with bcrypt directly
            if not bcrypt.checkpw(
                current_password.encode('utf-8'),
                driver.password.encode('utf-8')
            ):
                return Response({'detail': 'Current password is incorrect.'}, status=400)

            # Hash new password with BCrypt so Spring Boot can still read it
            hashed = bcrypt.hashpw(
                new_password.encode('utf-8'),
                bcrypt.gensalt()
            ).decode('utf-8')

            driver.password = hashed
            driver.save(update_fields=['password'])
            return Response({'message': 'Password changed successfully.'})
        except Exception as e:
            return Response({'detail': str(e)}, status=500)


class DriverPhotoView(APIView):
    def patch(self, request):
        driver = get_driver(get_username(request))
        photo_type = request.data.get('type', 'profile')
        image_data = request.data.get('image')

        if not image_data:
            return Response({'detail': 'No image provided.'}, status=400)

        field_map = {
            'profile': 'profile_photo',
            'license': 'photo_license',
            'plate':   'photo_plate',
            'toda':    'photo_toda',
        }
        field = field_map.get(photo_type)
        if not field:
            return Response({'detail': 'Invalid photo type.'}, status=400)

        setattr(driver, field, image_data)
        driver.save(update_fields=[field, 'updated_at'])
        return Response({'detail': 'Photo updated.', 'field': field})


class DriverStatusView(APIView):
    def patch(self, request):
        driver    = get_driver(get_username(request))
        is_online = request.data.get('is_online')
        if is_online is None:
            return Response({'error': 'is_online field required'}, status=400)
        driver.is_online = is_online
        driver.save(update_fields=['is_online', 'updated_at'])
        return Response({'username': driver.username, 'is_online': driver.is_online})


class AvailableDriversView(APIView):
    def get(self, request):
        drivers = Driver.objects.filter(is_online=True, verified_status='verified')
        return Response(DriverSerializer(drivers, many=True).data)


class AcceptRideView(APIView):
    def patch(self, request, ride_id):
        driver = get_driver(get_username(request))
        if driver.verified_status != 'verified':
            raise PermissionDenied('Your account is not verified yet')
        try:
            ride = Ride.objects.get(id=ride_id, status='pending')
        except Ride.DoesNotExist:
            raise NotFound('Ride not found or already taken')
        ride.driver = driver
        ride.status = 'accepted'
        ride.save(update_fields=['driver_id', 'status', 'updated_at'])
        return Response(RideSerializer(ride).data)


class CompleteRideView(APIView):
    def patch(self, request, ride_id):
        driver = get_driver(get_username(request))
        try:
            ride = Ride.objects.get(id=ride_id, driver=driver, status='accepted')
        except Ride.DoesNotExist:
            raise NotFound('Ride not found or not yours')
        ride.status = 'completed'
        ride.save(update_fields=['status', 'updated_at'])
        from pasadanow.apps.earnings.models import Earning
        Earning.objects.create(driver=driver, ride=ride, amount=ride.fare)
        return Response(RideSerializer(ride).data)


class DeclineRideView(APIView):
    def patch(self, request, ride_id):
        driver = get_driver(get_username(request))
        try:
            ride = Ride.objects.get(id=ride_id, driver_id=driver.id, status='pending')
        except Ride.DoesNotExist:
            raise NotFound('Ride not found or not assigned to you')
        ride.driver = None
        ride.status = 'declined'
        ride.save(update_fields=['driver_id', 'status', 'updated_at'])
        return Response({'detail': 'Ride declined.'})


class PendingRideView(APIView):
    def get(self, request):
        driver = get_driver(get_username(request))
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT
                        r.id,
                        r.pickup_location,
                        r.destination,
                        r.fare,
                        r.distance_km,
                        r.pickup_lat,
                        r.pickup_lng,
                        r.dropoff_lat,
                        r.dropoff_lng,
                        r.status,
                        COALESCE(c.full_name, c.username, 'Passenger') AS commuter_name,
                        c.username AS commuter_username
                    FROM rides r
                    LEFT JOIN commuters c ON c.id = r.commuter_id
                    WHERE r.status = 'pending'
                      AND r.driver_id = %s
                    ORDER BY r.created_at ASC
                    LIMIT 1
                """, [driver.id])
                row = cursor.fetchone()

            if not row:
                return Response({})

            cols = [
                'id', 'pickup_location', 'destination', 'fare',
                'distance_km', 'pickup_lat', 'pickup_lng',
                'dropoff_lat', 'dropoff_lng', 'status',
                'commuter_name', 'commuter_username',
            ]
            data = dict(zip(cols, row))

            # Normalise types so Flutter parses them correctly
            data['fare']        = float(data['fare'] or 0)
            data['distance_km'] = float(data['distance_km'] or 0)
            data['pickup_lat']  = float(data['pickup_lat'] or 0)
            data['pickup_lng']  = float(data['pickup_lng'] or 0)
            data['dropoff_lat'] = float(data['dropoff_lat'] or 0)
            data['dropoff_lng'] = float(data['dropoff_lng'] or 0)

            return Response(data)

        except Exception:
            return Response({})


class DriverLocationView(APIView):
    def post(self, request, ride_id=None):
        from django.db import connection
        driver = get_driver(get_username(request))
        lat = request.data.get('lat')
        lng = request.data.get('lng')
        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE rides SET driver_lat = %s, driver_lng = %s,
                updated_at = NOW()
                WHERE driver_id = %s AND status IN ('accepted','ongoing')
            """, [lat, lng, driver.id])
        return Response({'status': 'ok'})

    def patch(self, request, ride_id=None):
        return self.post(request, ride_id)


class CommuterLocationView(APIView):
    def get(self, request, ride_id):
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT commuter_lat, commuter_lng
                FROM rides WHERE id = %s
            """, [ride_id])
            row = cursor.fetchone()
            if not row or row[0] is None:
                return Response({})
        return Response({'lat': row[0], 'lng': row[1]})