"""
Global Settings Models for ExamVault
===================================
Flexible system for storing and managing global configuration.
Supports JSON values for complex configurations like marking schemes and exam formats.
"""

from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone

User = get_user_model()


class GlobalSetting(models.Model):
    """
    Flexible key-value store for global application settings.
    Supports complex configurations through JSON storage.
    """

    SETTING_TYPES = [
        ("marking-scheme", "Marking Scheme"),
        ("exam-format", "Exam Format"),
        ("system-config", "System Configuration"),
        ("ui-config", "UI Configuration"),
    ]

    # Setting identification
    key = models.CharField(max_length=100, help_text="Unique setting identifier")
    setting_type = models.CharField(max_length=20, choices=SETTING_TYPES)
    name = models.CharField(max_length=100, help_text="Human-readable setting name")
    description = models.TextField(blank=True, help_text="Setting description")

    # Setting value (stored as JSON for flexibility)
    value = models.JSONField(default=dict, help_text="Setting configuration as JSON")

    # Metadata
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="created_settings"
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="updated_settings"
    )
    updated_at = models.DateTimeField(auto_now=True)

    # Status
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(
        default=False, help_text="Is this the default configuration for this type?"
    )

    class Meta:
        unique_together = ["key", "setting_type"]
        ordering = ["setting_type", "name"]
        verbose_name = "Global Setting"
        verbose_name_plural = "Global Settings"

    def __str__(self):
        return f"{self.get_setting_type_display()}: {self.name}"

    def save(self, *args, **kwargs):
        """Ensure only one default per setting type"""
        if self.is_default:
            # Remove default flag from other settings of same type
            GlobalSetting.objects.filter(
                setting_type=self.setting_type, is_default=True
            ).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)


class MarkingScheme(models.Model):
    """
    Predefined marking scheme configurations.
    Links to GlobalSetting for storage but provides structured access.
    """

    global_setting = models.OneToOneField(
        GlobalSetting, on_delete=models.CASCADE, primary_key=True
    )

    # Quick access properties (derived from global_setting.value)
    @property
    def grade_boundaries(self):
        """Get grade boundaries from the setting value"""
        return self.global_setting.value.get("grade_boundaries", {})

    @property
    def negative_marking(self):
        """Get negative marking rules"""
        return self.global_setting.value.get("negative_marking", {})

    @property
    def pass_threshold(self):
        """Get pass threshold percentage"""
        return self.global_setting.value.get("pass_threshold", 50)

    @property
    def weight_distribution(self):
        """Get weight distribution rules"""
        return self.global_setting.value.get("weight_distribution", {})

    def __str__(self):
        return f"Marking Scheme: {self.global_setting.name}"


class ExamFormat(models.Model):
    """
    Predefined exam format templates.
    Links to GlobalSetting for storage but provides structured access.
    """

    global_setting = models.OneToOneField(
        GlobalSetting, on_delete=models.CASCADE, primary_key=True
    )

    # Quick access properties (derived from global_setting.value)
    @property
    def sections(self):
        """Get exam sections configuration"""
        return self.global_setting.value.get("sections", [])

    @property
    def time_limits(self):
        """Get time limit configuration"""
        return self.global_setting.value.get("time_limits", {})

    @property
    def question_distribution(self):
        """Get question distribution rules"""
        return self.global_setting.value.get("question_distribution", {})

    @property
    def exam_structure(self):
        """Get overall exam structure"""
        return self.global_setting.value.get("exam_structure", {})

    def __str__(self):
        return f"Exam Format: {self.global_setting.name}"


class PrivacyAuditLog(models.Model):
    """
    Audit log for privacy-related actions performed by administrators.
    Tracks user data exports, archiving, deletion, and other privacy actions.
    """

    ACTION_TYPES = [
        ("user_archived", "User Archived"),
        ("user_deleted", "User Deleted"),
        ("data_exported", "Data Exported"),
        ("user_anonymized", "User Anonymized"),
        ("user_search", "User Search"),
        ("data_access", "Data Access"),
        ("privacy_settings_changed", "Privacy Settings Changed"),
    ]

    # Action details
    action = models.CharField(max_length=50, choices=ACTION_TYPES)
    description = models.TextField(help_text="Human-readable description of the action")

    # User information
    admin_user = models.CharField(
        max_length=100, help_text="Admin who performed the action"
    )
    user_email = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Email of affected user (if applicable)",
    )

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Privacy Audit Log"
        verbose_name_plural = "Privacy Audit Logs"

    def __str__(self):
        return f"{self.get_action_display()}: {self.description} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"
