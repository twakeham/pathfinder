from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from . import views

urlpatterns = [
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', views.register, name='register'),
    path('invite/create/', views.create_admin_invite, name='create_invite'),
    path('invite/register/', views.register_admin_with_invite, name='register_with_invite'),
    path('password-reset/request/', views.request_password_reset, name='password_reset_request'),
    path('password-reset/perform/', views.perform_password_reset, name='password_reset_perform'),
    path('me/', views.me, name='me'),
]
