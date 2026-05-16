import bcrypt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from .models import Commuter


@api_view(['GET'])
@authentication_classes([])
@permission_classes([])
def debug_view(request):
    try:
        count = Commuter.objects.count()
        return Response({'status': 'ok', 'count': count})
    except Exception as e:
        return Response({'error': str(e)}, status=500)


def _get_username(request):
    auth = request.auth
    if isinstance(auth, dict):
        return auth.get('sub')
    return None


def _profile_response(commuter):
    return {
        'username':      commuter.username,
        'full_name':     commuter.full_name or '',
        'fullName':      commuter.full_name or '',
        'age':           commuter.age or '',
        'phone':         commuter.phone or '',
        'email':         commuter.email or '',
        'address':       commuter.address or '',
        'profile_photo': commuter.profile_photo or '',
    }


class CommuterProfileView(APIView):
    def get(self, request):
        try:
            username = _get_username(request)
            if not username:
                return Response({'detail': 'no username in token'}, status=401)
            commuter = Commuter.objects.get(username=username)
            return Response(_profile_response(commuter))
        except Commuter.DoesNotExist:
            return Response({'detail': 'commuter not found'}, status=404)
        except Exception as e:
            return Response({'detail': str(e)}, status=500)

    def patch(self, request):
        try:
            username = _get_username(request)
            if not username:
                return Response({'detail': 'no username in token'}, status=401)
            commuter = Commuter.objects.get(username=username)

            field_map = {
                'fullName':     'full_name',
                'full_name':    'full_name',
                'age':          'age',
                'phone':        'phone',
                'email':        'email',
                'address':      'address',
                'profilePhoto': 'profile_photo',
            }

            updated = []
            for key, model_field in field_map.items():
                if key in request.data:
                    setattr(commuter, model_field, request.data[key])
                    if model_field not in updated:
                        updated.append(model_field)

            if not updated:
                return Response({'detail': 'no valid fields'}, status=400)

            commuter.save(update_fields=[*updated, 'updated_at'])
            return Response(_profile_response(commuter))
        except Commuter.DoesNotExist:
            return Response({'detail': 'commuter not found'}, status=404)
        except Exception as e:
            return Response({'detail': str(e)}, status=500)


class CommuterChangePasswordView(APIView):
    def post(self, request):
        try:
            username = _get_username(request)
            if not username:
                return Response({'detail': 'no username in token'}, status=401)

            current_password = request.data.get('current_password')
            new_password = request.data.get('new_password')

            if not current_password or not new_password:
                return Response({'detail': 'Both fields are required.'}, status=400)

            if len(new_password) < 6:
                return Response({'detail': 'Password must be at least 6 characters.'}, status=400)

            commuter = Commuter.objects.get(username=username)

            # Spring Boot uses BCrypt — verify with bcrypt directly
            if not bcrypt.checkpw(
                current_password.encode('utf-8'),
                commuter.password.encode('utf-8')
            ):
                return Response({'detail': 'Current password is incorrect.'}, status=400)

            # Hash new password with BCrypt so Spring Boot can still read it
            hashed = bcrypt.hashpw(
                new_password.encode('utf-8'),
                bcrypt.gensalt()
            ).decode('utf-8')

            commuter.password = hashed
            commuter.save(update_fields=['password'])
            return Response({'message': 'Password changed successfully.'})
        except Commuter.DoesNotExist:
            return Response({'detail': 'Commuter not found.'}, status=404)
        except Exception as e:
            return Response({'detail': str(e)}, status=500)