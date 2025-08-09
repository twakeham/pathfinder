from typing import Set

from rest_framework.permissions import BasePermission
from rest_framework.request import Request


class RolePermission(BasePermission):
    """Base permission that allows access only to users with specific roles."""

    required_roles: Set[str] = set()

    def has_permission(self, request: Request, view) -> bool:
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False

        role = getattr(user, "role", None)
        if not role:
            return False

        return role in self.required_roles


class IsAdmin(RolePermission):
    required_roles = {"admin"}


class IsInstructor(RolePermission):
    required_roles = {"instructor"}


class IsUser(RolePermission):
    required_roles = {"user"}


class IsAdminOrInstructor(RolePermission):
    required_roles = {"admin", "instructor"}
