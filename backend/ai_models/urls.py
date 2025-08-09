from django.urls import path
from .views import ChatGenerateView

urlpatterns = [
    path('chat/generate/', ChatGenerateView.as_view(), name='ai-chat-generate'),
]
