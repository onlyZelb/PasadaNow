import base64
import jwt
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed


class SimpleUser:
    def __init__(self, username):
        self.username = username
        self.is_authenticated = True


class JwtCookieAuthentication(BaseAuthentication):
    def authenticate(self, request):
        # Try Authorization: Bearer <token> header first
        token = None

        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]

        # Fall back to cookie
        if not token:
            token = request.COOKIES.get('jwt')

        if not token:
            return None

        try:
            key_bytes = base64.b64decode(settings.JWT_SECRET)
            payload   = jwt.decode(token, key_bytes, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token has expired')
        except jwt.InvalidTokenError as e:
            raise AuthenticationFailed(f'Invalid token: {str(e)}')

        user = SimpleUser(payload.get('sub'))
        return (user, payload)