from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html

from .models import User


# Custom admin interface for our User model
class UserAdmin(BaseUserAdmin):
    """Custom admin for User model."""

    ordering = ["id"]
    list_display = [
        "email",
        "name",
        "role",
        "is_active",
        "is_staff",
        "is_superuser",
        "mfa_enabled",
        "created_at",
        "last_login",
    ]
    list_filter = [
        "role",
        "is_active",
        "is_staff",
        "is_superuser",
        "mfa_enabled",
        "created_at",
    ]
    search_fields = ["email", "name", "role"]
    list_per_page = 25

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal Info", {"fields": ("name", "role")}),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Security", {"fields": ("mfa_enabled",)}),
        ("Timestamps", {"fields": ("created_at", "last_login")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "name", "role", "password1", "password2"),
            },
        ),
    )

    readonly_fields = ["created_at", "last_login"]

    # Custom methods for better display
    def status_badge(self, obj):
        """Display user status with colored badge"""
        base_style = (
            "padding: 2px 8px; border-radius: 4px; " "font-size: 12px; color: white;"
        )

        if not obj.is_active:
            style = f"background-color: #dc3545; {base_style}"
            return format_html(f'<span style="{style}">Inactive</span>')
        elif obj.is_staff:
            style = f"background-color: #28a745; {base_style}"
            return format_html(f'<span style="{style}">Admin</span>')
        else:
            style = f"background-color: #007bff; {base_style}"
            return format_html(f'<span style="{style}">Active</span>')

    status_badge.short_description = "Status"

    # Bulk actions
    actions = ["approve_users", "deactivate_users", "activate_users"]

    def approve_users(self, request, queryset):
        """Bulk approve selected users"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f"{updated} users were successfully approved.")

    approve_users.short_description = "Approve selected users"

    def deactivate_users(self, request, queryset):
        """Bulk deactivate selected users"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f"{updated} users were successfully deactivated.")

    deactivate_users.short_description = "Deactivate selected users"

    def activate_users(self, request, queryset):
        """Bulk activate selected users"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f"{updated} users were successfully activated.")

    activate_users.short_description = "Activate selected users"

    def get_readonly_fields(self, request, obj=None):
        """Make date_joined readonly."""
        return ("date_joined",) if obj else ()


admin.site.register(User, UserAdmin)

# Customize admin site header and title
admin.site.site_header = "ExamVault Administration"
admin.site.site_title = "ExamVault Admin"
admin.site.index_title = "Welcome to ExamVault Administration"
