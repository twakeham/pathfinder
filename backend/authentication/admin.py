from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.contrib.admin import SimpleListFilter

from .models import User


class ApprovalStatusFilter(SimpleListFilter):
    title = "Approval status"
    parameter_name = "approval"

    def lookups(self, request, model_admin):
        return (
            ("pending", "Pending approval"),
            ("active", "Active"),
        )

    def queryset(self, request, queryset):
        value = self.value()
        if value == "pending":
            return queryset.filter(is_active=False)
        if value == "active":
            return queryset.filter(is_active=True)
        return queryset


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    """Admin panel configuration for the custom User model."""

    # Fields and sections
    fieldsets = (
        *DjangoUserAdmin.fieldsets,
        ("Application Roles", {"fields": ("role", "department", "avatar_url")}),
    )

    add_fieldsets = (
        *DjangoUserAdmin.add_fieldsets,
        (
            "Application Roles",
            {
                "classes": ("wide",),
                "fields": ("role", "department", "avatar_url"),
            },
        ),
    )

    readonly_fields = ("last_login", "date_joined")

    # List configuration
    list_display = (
        "username",
        "email",
        "first_name",
        "last_name",
        "role",
        "is_active",
        "is_staff",
        "is_superuser",
        "last_login",
    )
    list_filter = (
        ApprovalStatusFilter,
        "role",
        "is_active",
        "is_staff",
        "is_superuser",
        "groups",
    )
    search_fields = ("username", "email", "first_name", "last_name")
    ordering = ("-date_joined",)

    # Bulk actions
    actions = ["approve_users", "deactivate_users"]

    def approve_users(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f"Approved {updated} user(s).")

    approve_users.short_description = "Approve selected users (activate accounts)"

    def deactivate_users(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"Deactivated {updated} user(s).")

    deactivate_users.short_description = "Deactivate selected users"
