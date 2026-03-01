from django.contrib import admin

from .models import ExamFormat, GlobalSetting, MarkingScheme, PrivacyAuditLog


@admin.register(GlobalSetting)
class GlobalSettingAdmin(admin.ModelAdmin):
    list_display = [
        "key",
        "setting_type",
        "name",
        "is_active",
        "is_default",
        "created_at",
    ]
    list_filter = ["setting_type", "is_active", "is_default", "created_at"]
    search_fields = ["key", "name", "description"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(MarkingScheme)
class MarkingSchemeAdmin(admin.ModelAdmin):
    list_display = ["global_setting", "grade_boundaries", "pass_threshold"]
    readonly_fields = ["global_setting"]


@admin.register(ExamFormat)
class ExamFormatAdmin(admin.ModelAdmin):
    list_display = ["global_setting", "sections", "time_limits"]
    readonly_fields = ["global_setting"]


@admin.register(PrivacyAuditLog)
class PrivacyAuditLogAdmin(admin.ModelAdmin):
    list_display = ["action", "admin_user", "user_email", "description", "created_at"]
    list_filter = ["action", "created_at"]
    search_fields = ["admin_user", "user_email", "description"]
    readonly_fields = ["created_at"]
    ordering = ["-created_at"]

    def has_add_permission(self, request):
        # Prevent manual creation of audit logs
        return False

    def has_change_permission(self, request, obj=None):
        # Prevent editing of audit logs
        return False
