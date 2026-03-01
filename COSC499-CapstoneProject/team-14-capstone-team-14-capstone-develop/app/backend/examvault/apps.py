"""
Django app configuration for ExamVault
=====================================
Configuration for the main ExamVault application including global settings.
"""

from django.apps import AppConfig


class ExamvaultConfig(AppConfig):
    """Configuration for the ExamVault app"""

    default_auto_field = "django.db.models.BigAutoField"
    name = "examvault"
    verbose_name = "ExamVault Global Settings"
