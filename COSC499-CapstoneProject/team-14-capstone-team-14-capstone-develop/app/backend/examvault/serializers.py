"""
Serializers for Global Settings API
==================================
Handles serialization of settings data for the admin interface.
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from courses.models import Course
from exams.models import Exam

from .models import ExamFormat, GlobalSetting, MarkingScheme, PrivacyAuditLog

User = get_user_model()


class GlobalSettingSerializer(serializers.ModelSerializer):
    """Serializer for basic global settings CRUD"""

    created_by_name = serializers.CharField(source="created_by.name", read_only=True)
    updated_by_name = serializers.CharField(source="updated_by.name", read_only=True)

    class Meta:
        model = GlobalSetting
        fields = [
            "id",
            "key",
            "setting_type",
            "name",
            "description",
            "value",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_by",
            "updated_by_name",
            "updated_at",
            "is_active",
            "is_default",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "created_by_name",
            "updated_by_name",
        ]


class MarkingSchemeSerializer(serializers.ModelSerializer):
    """Serializer for marking scheme configurations"""

    name = serializers.CharField(source="global_setting.name")
    description = serializers.CharField(
        source="global_setting.description", required=False
    )
    is_default = serializers.BooleanField(source="global_setting.is_default")
    is_active = serializers.BooleanField(source="global_setting.is_active")
    created_by_name = serializers.CharField(
        source="global_setting.created_by.name", read_only=True
    )

    # Marking scheme specific fields
    grade_boundaries = serializers.JSONField()
    negative_marking = serializers.JSONField()
    pass_threshold = serializers.FloatField()
    weight_distribution = serializers.JSONField()

    class Meta:
        model = MarkingScheme
        fields = [
            "global_setting",
            "name",
            "description",
            "is_default",
            "is_active",
            "created_by_name",
            "grade_boundaries",
            "negative_marking",
            "pass_threshold",
            "weight_distribution",
        ]

    def create(self, validated_data):
        """Create marking scheme with embedded global setting"""
        global_setting_data = {
            "key": f"marking-scheme-{validated_data['global_setting']['name'].lower().replace(' ', '-')}",
            "setting_type": "marking-scheme",
            "name": validated_data["global_setting"]["name"],
            "description": validated_data["global_setting"].get("description", ""),
            "is_default": validated_data["global_setting"].get("is_default", False),
            "is_active": validated_data["global_setting"].get("is_active", True),
            "value": {
                "grade_boundaries": validated_data.get("grade_boundaries", {}),
                "negative_marking": validated_data.get("negative_marking", {}),
                "pass_threshold": validated_data.get("pass_threshold", 50),
                "weight_distribution": validated_data.get("weight_distribution", {}),
            },
        }

        global_setting = GlobalSetting.objects.create(**global_setting_data)
        return MarkingScheme.objects.create(global_setting=global_setting)


class ExamFormatSerializer(serializers.ModelSerializer):
    """Serializer for exam format templates"""

    name = serializers.CharField(source="global_setting.name")
    description = serializers.CharField(
        source="global_setting.description", required=False
    )
    is_default = serializers.BooleanField(source="global_setting.is_default")
    is_active = serializers.BooleanField(source="global_setting.is_active")
    created_by_name = serializers.CharField(
        source="global_setting.created_by.name", read_only=True
    )

    # Exam format specific fields
    sections = serializers.JSONField()
    time_limits = serializers.JSONField()
    question_distribution = serializers.JSONField()
    exam_structure = serializers.JSONField()

    class Meta:
        model = ExamFormat
        fields = [
            "global_setting",
            "name",
            "description",
            "is_default",
            "is_active",
            "created_by_name",
            "sections",
            "time_limits",
            "question_distribution",
            "exam_structure",
        ]

    def create(self, validated_data):
        """Create exam format with embedded global setting"""
        global_setting_data = {
            "key": f"exam-format-{validated_data['global_setting']['name'].lower().replace(' ', '-')}",
            "setting_type": "exam-format",
            "name": validated_data["global_setting"]["name"],
            "description": validated_data["global_setting"].get("description", ""),
            "is_default": validated_data["global_setting"].get("is_default", False),
            "is_active": validated_data["global_setting"].get("is_active", True),
            "value": {
                "sections": validated_data.get("sections", []),
                "time_limits": validated_data.get("time_limits", {}),
                "question_distribution": validated_data.get(
                    "question_distribution", {}
                ),
                "exam_structure": validated_data.get("exam_structure", {}),
            },
        }

        global_setting = GlobalSetting.objects.create(**global_setting_data)
        return ExamFormat.objects.create(global_setting=global_setting)


class AdminCourseOverviewSerializer(serializers.ModelSerializer):
    """Serializer for admin course overview with creator info"""

    creator_name = serializers.CharField(source="creator.name", read_only=True)
    creator_email = serializers.CharField(source="creator.email", read_only=True)
    instructor_count = serializers.SerializerMethodField()
    student_count = serializers.SerializerMethodField()
    exam_count = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id",
            "code",
            "name",
            "description",
            "term",
            "created_at",
            "updated_at",
            "creator",
            "creator_name",
            "creator_email",
            "instructor_count",
            "student_count",
            "exam_count",
        ]

    def get_instructor_count(self, obj):
        """Get number of instructors for this course"""
        return obj.course_instructors.filter(accepted=True).count()

    def get_student_count(self, obj):
        """Get number of students enrolled"""
        return obj.enrolled_students.filter(is_active=True).count()

    def get_exam_count(self, obj):
        """Get number of exams in this course"""
        return Exam.objects.filter(course=obj).count()


class AdminExamOverviewSerializer(serializers.ModelSerializer):
    """Serializer for admin exam overview with creator info"""

    course_name = serializers.CharField(source="course.name", read_only=True)
    course_code = serializers.CharField(source="course.code", read_only=True)
    creator_name = serializers.CharField(source="created_by.name", read_only=True)
    creator_email = serializers.CharField(source="created_by.email", read_only=True)
    variant_count = serializers.SerializerMethodField()

    class Meta:
        model = Exam
        fields = [
            "id",
            "title",
            "description",
            "created_at",
            "updated_at",
            "course",
            "course_name",
            "course_code",
            "created_by",
            "creator_name",
            "creator_email",
            "variant_count",
            "scheduled_date",
            "time_limit",
        ]

    def get_variant_count(self, obj):
        """Get number of variants for this exam"""
        return obj.variants.count()


class PrivacyAuditLogSerializer(serializers.ModelSerializer):
    """Serializer for privacy audit logs"""

    action_display = serializers.CharField(source="get_action_display", read_only=True)
    created_at_formatted = serializers.SerializerMethodField()

    class Meta:
        model = PrivacyAuditLog
        fields = [
            "id",
            "action",
            "action_display",
            "description",
            "admin_user",
            "user_email",
            "created_at",
            "created_at_formatted",
        ]
        read_only_fields = ["id", "created_at", "created_at_formatted"]

    def get_created_at_formatted(self, obj):
        """Format created_at for display"""
        return obj.created_at.strftime("%Y-%m-%d %H:%M:%S")
