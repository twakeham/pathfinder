from urllib.parse import parse_qs

from asgiref.sync import sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.authentication import JWTAuthentication


def _get_user_from_token(token: str):
    try:
        jwt_auth = JWTAuthentication()
        validated = jwt_auth.get_validated_token(token)
        return jwt_auth.get_user(validated)
    except Exception:
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # Parse token from query string: ?token=...
        try:
            query_string = scope.get('query_string', b'').decode()
            params = parse_qs(query_string)
            token_list = params.get('token') or []
            token = token_list[0] if token_list else None
        except Exception:
            token = None
        if token:
            user = await sync_to_async(_get_user_from_token)(token)
            scope['user'] = user
        return await super().__call__(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    return JWTAuthMiddleware(inner)
