from django.shortcuts import render
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.db import transaction

from .models import AdminInvite, PasswordReset

User = get_user_model()


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def register(request):
    """Register a new user account; requires admin approval (is_active=False)."""
    data = request.data or {}

    email = (data.get("email") or "").strip().lower()
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    first_name = (data.get("first_name") or "").strip()
    last_name = (data.get("last_name") or "").strip()
    role = (data.get("role") or User.Roles.USER).strip() if hasattr(User, "Roles") else "user"

    if not username or not email or not password:
        return Response({"detail": "username, email, and password are required."}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({"detail": "Username already taken."}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=email).exists():
        return Response({"detail": "Email already in use."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        validate_password(password)
    except ValidationError as exc:
        return Response({"detail": exc.messages}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        role=role if role in getattr(User.Roles, "values", []) else getattr(User.Roles, "USER", "user"),
    )

    # Require admin approval: keep inactive until approved
    user.is_active = False
    user.save(update_fields=["is_active"])

    return Response({"id": user.id, "username": user.username, "email": user.email, "is_active": user.is_active}, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([permissions.IsAdminUser])
def create_admin_invite(request):
    """Create an invite code for any role (default: user) valid for 48 hours."""
    email = (request.data.get("email") or "").strip().lower() or None
    role = (request.data.get("role") or getattr(User.Roles, "USER", "user")).strip()
    if hasattr(User, "Roles") and role not in [c for c, _ in User.Roles.choices]:
        role = getattr(User.Roles, "USER", "user")

    code = AdminInvite.generate_code()
    invite = AdminInvite.objects.create(
        code=code,
        email=email,
        role=role,
        created_by=request.user,
        expires_at=timezone.now() + timezone.timedelta(hours=48),
    )

    return Response({"code": invite.code, "role": invite.role, "expires_at": invite.expires_at}, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def register_admin_with_invite(request):
    """Register a user using a valid invite code; activates depending on role (admins active)."""
    data = request.data or {}
    code = (data.get("code") or "").strip()
    email = (data.get("email") or "").strip().lower()
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not all([code, email, username, password]):
        return Response({"detail": "code, email, username, password are required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        invite = AdminInvite.objects.get(code=code)
    except AdminInvite.DoesNotExist:
        return Response({"detail": "Invalid invite code."}, status=status.HTTP_400_BAD_REQUEST)

    if invite.is_used:
        return Response({"detail": "Invite already used."}, status=status.HTTP_400_BAD_REQUEST)

    if invite.is_expired:
        return Response({"detail": "Invite expired."}, status=status.HTTP_400_BAD_REQUEST)

    if invite.email and invite.email != email:
        return Response({"detail": "Invite email does not match."}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({"detail": "Username already taken."}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=email).exists():
        return Response({"detail": "Email already in use."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        validate_password(password)
    except ValidationError as exc:
        return Response({"detail": exc.messages}, status=status.HTTP_400_BAD_REQUEST)

    is_admin = invite.role == getattr(User.Roles, "ADMIN", "admin")

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        role=invite.role,
        is_active=True if is_admin else False,
        is_staff=True if is_admin else False,
        is_superuser=True if is_admin else False,
    )

    invite.mark_used(user)

    return Response({"id": user.id, "username": user.username, "email": user.email, "role": user.role, "is_active": user.is_active}, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def request_password_reset(request):
    """Request a password reset token; in production, email this token to the user."""
    email = (request.data.get("email") or "").strip().lower()
    if not email:
        return Response({"detail": "email is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # Do not reveal existence; return 200
        return Response({"detail": "If the email exists, a reset link has been sent."}, status=status.HTTP_200_OK)

    # Create token valid for 1 hour
    reset = PasswordReset.objects.create(
        user=user,
        code=PasswordReset.generate_code(),
        expires_at=timezone.now() + timezone.timedelta(hours=1),
    )

    # TODO: send email with code
    return Response({"detail": "If the email exists, a reset link has been sent.", "code": reset.code}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def perform_password_reset(request):
    """Reset password using a valid token and new password."""
    code = (request.data.get("code") or "").strip()
    password = request.data.get("password") or ""

    if not code or not password:
        return Response({"detail": "code and password are required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        reset = PasswordReset.objects.select_related("user").get(code=code)
    except PasswordReset.DoesNotExist:
        return Response({"detail": "Invalid code."}, status=status.HTTP_400_BAD_REQUEST)

    if reset.is_used:
        return Response({"detail": "Code already used."}, status=status.HTTP_400_BAD_REQUEST)

    if reset.is_expired:
        return Response({"detail": "Code expired."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        validate_password(password, user=reset.user)
    except ValidationError as exc:
        return Response({"detail": exc.messages}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        reset.user.set_password(password)
        reset.user.save(update_fields=["password"])
        reset.mark_used()

    return Response({"detail": "Password has been reset."}, status=status.HTTP_200_OK)


@api_view(["GET", "PATCH"])
@permission_classes([permissions.IsAuthenticated])
def me(request):
    """Get or update current user's profile info."""
    u = request.user

    if request.method == "GET":
        return Response({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "first_name": getattr(u, "first_name", ""),
            "last_name": getattr(u, "last_name", ""),
            "role": getattr(u, "role", None),
            "department": getattr(u, "department", None),
            "avatar_url": getattr(u, "avatar_url", None),
            "is_staff": getattr(u, "is_staff", False),
            "is_superuser": getattr(u, "is_superuser", False),
        }, status=status.HTTP_200_OK)

    data = request.data or {}

    email = (data.get("email") or u.email or "").strip().lower()
    first_name = (data.get("first_name") or u.first_name or "").strip()
    last_name = (data.get("last_name") or u.last_name or "").strip()
    department = (data.get("department") or getattr(u, "department", None)) or None
    avatar_url = (data.get("avatar_url") or getattr(u, "avatar_url", None)) or None

    if email and User.objects.exclude(pk=u.pk).filter(email=email).exists():
        return Response({"detail": "Email already in use."}, status=status.HTTP_400_BAD_REQUEST)

    # Update fields
    u.email = email
    u.first_name = first_name
    u.last_name = last_name
    if hasattr(u, "department"):
        u.department = department
    if hasattr(u, "avatar_url"):
        u.avatar_url = avatar_url
    u.save()

    return Response({
        "id": u.id,
        "username": u.username,
        "email": u.email,
        "first_name": u.first_name,
        "last_name": u.last_name,
        "role": getattr(u, "role", None),
        "department": getattr(u, "department", None),
        "avatar_url": getattr(u, "avatar_url", None),
        "is_staff": getattr(u, "is_staff", False),
        "is_superuser": getattr(u, "is_superuser", False),
    }, status=status.HTTP_200_OK)
