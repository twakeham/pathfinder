from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.utils import timezone
import secrets


class User(AbstractUser):
    """Custom user model based on Django's AbstractUser with role support."""

    class Roles(models.TextChoices):
        ADMIN = "admin", "Admin"
        INSTRUCTOR = "instructor", "Instructor"
        USER = "user", "User"

    role: str = models.CharField(
        max_length=32,
        choices=Roles.choices,
        default=Roles.USER,
        help_text="Role used for permissions and feature access",
    )

    # Profile fields
    department: str | None = models.CharField(max_length=100, blank=True, null=True)
    avatar_url: str | None = models.URLField(blank=True, null=True)


class AdminInvite(models.Model):
    """Invite token to allow creating accounts via a one-time code, for any role."""

    code = models.CharField(max_length=64, unique=True, db_index=True)
    email = models.EmailField(blank=True, null=True)
    role = models.CharField(
        max_length=32,
        choices=User.Roles.choices,
        default=User.Roles.USER,
        help_text="Role assigned to the invited account",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="created_admin_invites"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(blank=True, null=True)
    invited_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="admin_invite"
    )

    @property
    def is_used(self) -> bool:
        return self.used_at is not None

    @property
    def is_expired(self) -> bool:
        return timezone.now() >= self.expires_at

    def mark_used(self, user: 'User') -> None:
        self.invited_user = user
        self.used_at = timezone.now()
        self.save(update_fields=["invited_user", "used_at"])

    @staticmethod
    def generate_code() -> str:
        return secrets.token_urlsafe(32)

    def __str__(self) -> str:  # pragma: no cover
        status = "used" if self.is_used else ("expired" if self.is_expired else "active")
        return f"AdminInvite({self.code[:6]}…, {self.role}, {status})"


class PasswordReset(models.Model):
    """Password reset token for a user with expiry and usage tracking."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="password_resets",
    )
    code = models.CharField(max_length=64, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(blank=True, null=True)

    @property
    def is_used(self) -> bool:
        return self.used_at is not None

    @property
    def is_expired(self) -> bool:
        return timezone.now() >= self.expires_at

    def mark_used(self) -> None:
        self.used_at = timezone.now()
        self.save(update_fields=["used_at"])

    @staticmethod
    def generate_code() -> str:
        return secrets.token_urlsafe(32)

    def __str__(self) -> str:  # pragma: no cover
        status = "used" if self.is_used else ("expired" if self.is_expired else "active")
        return f"PasswordReset({self.user_id}, {status})"
