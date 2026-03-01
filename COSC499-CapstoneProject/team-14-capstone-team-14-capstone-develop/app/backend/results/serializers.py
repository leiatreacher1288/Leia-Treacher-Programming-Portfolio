# results/serializers.py
from rest_framework import serializers

from .models import ExamResult, OMRImportSession


class ExamResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.display_name", read_only=True)
    student_id = serializers.CharField(source="student.display_id", read_only=True)
    variant_label = serializers.CharField(
        source="variant.version_label", read_only=True
    )
    percentage_score = serializers.DecimalField(
        max_digits=5, decimal_places=2, read_only=True
    )

    # Add these new fields
    total_points_possible = serializers.DecimalField(
        max_digits=7, decimal_places=2, read_only=True
    )
    total_points_earned = serializers.DecimalField(
        max_digits=7, decimal_places=2, read_only=True
    )

    class Meta:
        model = ExamResult
        fields = [
            "id",
            "exam",
            "variant",
            "variant_label",
            "student",
            "student_name",
            "student_id",
            "raw_responses",
            "score",
            "percentage_score",
            "total_questions",
            "correct_answers",
            "incorrect_answers",
            "unanswered",
            "grading_details",
            "submitted_at",
            "graded_at",
            "import_source",
            "total_points_possible",
            "total_points_earned",  # NEW FIELDS
        ]
        read_only_fields = [
            "score",
            "total_questions",
            "correct_answers",
            "incorrect_answers",
            "unanswered",
            "grading_details",
            "graded_at",
            "total_points_possible",
            "total_points_earned",
        ]


class OMRImportSerializer(serializers.Serializer):
    """Serializer for OMR import requests"""

    file = serializers.FileField()
    format = serializers.ChoiceField(choices=["csv", "txt"])

    # Optional mapping configuration
    field_mapping = serializers.JSONField(
        required=False, help_text="Custom field mapping for CSV columns"
    )


class OMRValidationResultSerializer(serializers.Serializer):
    """Serializer for validation results"""

    valid = serializers.BooleanField()
    total_records = serializers.IntegerField()
    valid_records = serializers.IntegerField()
    errors = serializers.ListField(child=serializers.DictField())
    warnings = serializers.ListField(child=serializers.DictField())
    preview = serializers.ListField(
        child=serializers.DictField(), help_text="Preview of first few valid records"
    )


class OMRImportSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = OMRImportSession
        fields = "__all__"
        read_only_fields = ["imported_by", "created_at", "completed_at"]
