import os

# Configure settings before importing Django/Channels modules
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import path

django_asgi_app = get_asgi_application()

# Import middleware and consumers only after Django apps are ready
from .ws_auth import JWTAuthMiddlewareStack  # noqa: E402
from chat.consumers import ChatConsumer  # noqa: E402

# Placeholder websocket routes; to be replaced by chat app consumers
websocket_urlpatterns = [
    path('ws/chat/<int:conversation_id>/', ChatConsumer.as_asgi()),
]

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    # Prefer JWT via query param; fall back to Django session auth if needed
    'websocket': JWTAuthMiddlewareStack(URLRouter(websocket_urlpatterns)),
})
