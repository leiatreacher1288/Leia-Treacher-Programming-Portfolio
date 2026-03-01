# results/admin.py
from django.contrib import admin

from .models import ExamResult, OMRImportSession


@admin.register(ExamResult)
class ExamResultAdmin(admin.ModelAdmin):
    list_display = [
        "student_display",
        "exam",
        "variant",
        "score",
        "submitted_at",
        "import_source",
    ]
    list_filter = ["exam", "variant", "import_source", "submitted_at"]
    search_fields = ["student__name", "student__student_id", "exam__title"]
    readonly_fields = [
        "grading_details",
        "import_metadata",
        "submitted_at",
        "graded_at",
    ]

    fieldsets = (
        (
            "Basic Information",
            {"fields": ("exam", "variant", "student", "submitted_at")},
        ),
        (
            "Grading Results",
            {
                "fields": (
                    "score",
                    "total_questions",
                    "correct_answers",
                    "incorrect_answers",
                    "unanswered",
                    "graded_at",
                )
            },
        ),
        ("Raw Data", {"fields": ("raw_responses", "grading_details")}),
        (
            "Import Information",
            {"fields": ("import_source", "imported_by", "import_metadata")},
        ),
    )

    @admin.display(description="Student")
    def student_display(self, obj):
        return f"{obj.student.display_name} ({obj.student.display_id})"


@admin.register(OMRImportSession)
class OMRImportSessionAdmin(admin.ModelAdmin):
    list_display = [
        "exam",
        "imported_by",
        "file_name",
        "status",
        "successful_imports",
        "failed_imports",
        "created_at",
    ]
    list_filter = ["status", "file_format", "created_at"]
    search_fields = ["exam__title", "file_name", "imported_by__username"]
    readonly_fields = [
        "created_at",
        "completed_at",
        "validation_errors",
        "import_errors",
        "warnings",
    ]

    fieldsets = (
        (
            "Import Details",
            {"fields": ("exam", "imported_by", "file_name", "file_format")},
        ),
        (
            "Status",
            {
                "fields": (
                    "status",
                    "total_records",
                    "successful_imports",
                    "failed_imports",
                )
            },
        ),
        (
            "Errors and Warnings",
            {"fields": ("validation_errors", "import_errors", "warnings")},
        ),
        ("Timestamps", {"fields": ("created_at", "completed_at")}),
    )
