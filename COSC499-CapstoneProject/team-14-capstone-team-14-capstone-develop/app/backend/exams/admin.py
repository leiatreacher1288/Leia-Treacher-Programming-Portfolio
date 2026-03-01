from django.contrib import admin

from .models import (
    Course,
    Exam,
    ExamExportHistory,
    StudentVariantAssignment,
    Variant,
    VariantQuestion,
)

admin.site.register(Course)


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "exam_type",
        "course",
        "created_by",
        "num_variants",
        "questions_per_variant",
        "created_at",
    ]
    list_filter = ["exam_type", "course", "created_at"]
    search_fields = ["title", "description"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(Variant)
class VariantAdmin(admin.ModelAdmin):
    list_display = [
        "version_label",
        "exam",
        "created_at",
        "is_locked",
        "docx_exported",
        "pdf_exported",
    ]
    list_filter = ["exam", "created_at", "is_locked"]
    search_fields = ["version_label", "exam__title"]


@admin.register(VariantQuestion)
class VariantQuestionAdmin(admin.ModelAdmin):
    list_display = ["variant", "question", "order"]
    list_filter = ["variant__exam", "variant"]
    search_fields = ["question__prompt", "variant__version_label"]


@admin.register(ExamExportHistory)
class ExamExportHistoryAdmin(admin.ModelAdmin):
    list_display = [
        "exam",
        "exported_by",
        "export_format",
        "exported_at",
    ]
    list_filter = ["export_format", "exported_at", "exam"]
    readonly_fields = ["exported_at"]


@admin.register(StudentVariantAssignment)
class StudentVariantAssignmentAdmin(admin.ModelAdmin):
    list_display = [
        "student",
        "exam",
        "variant",
        "assigned_at",
        "seating_info",
        "is_active",
    ]
    list_filter = [
        "exam",
        "variant",
        "assigned_at",
        "is_active",
        "student__course",
    ]
    search_fields = [
        "student__name",
        "student__student_id",
        "exam__title",
        "variant__version_label",
    ]
    readonly_fields = ["assigned_at"]

    fieldsets = (
        ("Assignment", {"fields": ("student", "exam", "variant", "assigned_by")}),
        (
            "Seating Information",
            {"fields": ("seat_number", "row_number"), "classes": ("collapse",)},
        ),
        ("Status", {"fields": ("is_active", "notes")}),
        ("Metadata", {"fields": ("assigned_at",), "classes": ("collapse",)}),
    )

    def seating_info(self, obj):
        return obj.seating_info

    seating_info.short_description = "Seating"
