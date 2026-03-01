# courses/serializers.py
from django.db.models import Avg
from rest_framework import serializers

from .models import Course, CourseInstructor, Student


class ImportedQuestionSerializer(serializers.Serializer):
    prompt = serializers.CharField()
    choices = serializers.DictField()
    correct_answer = serializers.ListField(child=serializers.CharField())
    difficulty = serializers.CharField(required=False, allow_blank=True)
    tags = serializers.ListField(child=serializers.CharField(), required=False)
    explanation = serializers.CharField(required=False, allow_blank=True)


class CSVUploadSerializer(serializers.Serializer):
    """Serializer for CSV file upload"""

    csv_file = serializers.FileField()

    def validate_csv_file(self, value):
        if not value.name.endswith(".csv"):
            raise serializers.ValidationError("File must be a CSV file")
        return value


class RemoveInstructorSerializer(serializers.Serializer):
    """Serializer for removing instructor from course"""

    instructor_id = serializers.IntegerField(required=False)
    instructor_email = serializers.EmailField(required=False)

    def validate(self, data):
        if not data.get("instructor_id") and not data.get("instructor_email"):
            raise serializers.ValidationError(
                "Either instructor_id or instructor_email is required"
            )
        return data


# ────────────────────────────────────────────────────────────────
# INSTRUCTORS
# ────────────────────────────────────────────────────────────────
class CourseInstructorSerializer(serializers.ModelSerializer):
    """
    Single instructor row for Course Settings.
    """

    id = serializers.IntegerField(source="user.id", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    name = serializers.CharField(source="user.name", read_only=True)

    class Meta:
        model = CourseInstructor
        fields = [
            "id",
            "email",
            "name",
            "role",  # MAIN / SEC / TA / OTH
            "access",  # FULL / LIMITED / NONE
            "accepted",
            "invited_at",
        ]
        read_only_fields = ["id", "email", "name", "invited_at"]


# ────────────────────────────────────────────────────────────────
# STUDENTS
# ────────────────────────────────────────────────────────────────
class StudentSerializer(serializers.ModelSerializer):
    """Serializer for Student with computed overall_score."""

    display_name = serializers.CharField(read_only=True)
    display_id = serializers.CharField(read_only=True)
    overall_score = serializers.SerializerMethodField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    effective_name = serializers.CharField(read_only=True)

    class Meta:
        model = Student
        fields = [
            "id",
            "student_id",
            "display_id",
            "name",
            "preferred_name",
            "effective_name",
            "display_name",
            "email",
            "section",
            "is_active",
            "enrolled_at",
            "created_at",
            "dropped_at",
            "notes",
            "is_anonymous",
            "anonymous_id",
            "overall_score",
        ]
        read_only_fields = [
            "id",
            "display_id",
            "display_name",
            "effective_name",
            "enrolled_at",
            "created_at",
            "anonymous_id",
            "overall_score",
        ]

    def get_overall_score(self, obj):
        # Placeholder – replace with real logic later
        return 0


# ────────────────────────────────────────────────────────────────
# COURSES  (base / create / update)
# ────────────────────────────────────────────────────────────────
class CourseSerializer(serializers.ModelSerializer):
    exam_count = serializers.SerializerMethodField()
    student_count = serializers.SerializerMethodField()
    instructor_count = serializers.SerializerMethodField()

    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    instructor = serializers.CharField(allow_blank=True, required=False)

    # NEW — expose per‑role default access (write‑able)
    default_sec_access = serializers.ChoiceField(
        choices=CourseInstructor.Access.choices, required=False
    )
    default_ta_access = serializers.ChoiceField(
        choices=CourseInstructor.Access.choices, required=False
    )
    default_oth_access = serializers.ChoiceField(
        choices=CourseInstructor.Access.choices, required=False
    )

    class Meta:
        model = Course
        fields = [
            "id",
            "code",
            "name",
            "description",
            "term",
            "banner",
            "instructors",  # legacy m2m (ignored by UI)
            "instructor",
            "instructor_count",
            "exam_count",
            "student_count",
            "default_sec_access",  # ← added
            "default_ta_access",  # ← added
            "default_oth_access",  # ← added
            "created_at",
            "updated_at",
            "last_edited",
        ]
        read_only_fields = [
            "last_edited",
            "instructors",
            "created_at",
            "updated_at",
        ]

    # ── counters ───────────────────────────────────────────────
    def get_instructor_count(self, obj):
        return obj.course_instructors.count()

    def get_exam_count(self, obj):
        return obj.exams.count() if hasattr(obj, "exams") else 0

    def get_student_count(self, obj):
        return obj.enrolled_students.filter(is_active=True).count()

    def validate_code(self, value):
        if len(value) > 10:
            raise serializers.ValidationError(
                "Course code must be 10 characters or less"
            )
        return value


# ────────────────────────────────────────────────────────────────
# COURSE DETAIL
# ────────────────────────────────────────────────────────────────
class CourseDetailSerializer(CourseSerializer):
    """
    Detailed view:
     • full instructor roster
     • main_instructor convenience
     • exam / bank / student counts
    """

    instructors = CourseInstructorSerializer(
        source="course_instructors", many=True, read_only=True
    )
    main_instructor = serializers.CharField(source="primary_instructor", read_only=True)

    exam_count = serializers.SerializerMethodField()
    question_bank_count = serializers.SerializerMethodField()
    student_count = serializers.SerializerMethodField()

    class Meta(CourseSerializer.Meta):
        fields = [
            *CourseSerializer.Meta.fields,
            "instructors",
            "main_instructor",
            "exam_count",
            "question_bank_count",
            "student_count",
        ]

    # ── extra counters ─────────────────────────────────────────
    def get_exam_count(self, obj):
        return obj.exams.count()

    def get_question_bank_count(self, obj):
        return obj.question_banks.count()

    def get_student_count(self, obj):
        return obj.enrolled_students.filter(is_active=True).count()


# ────────────────────────────────────────────────────────────────
# COURSE LIST  (for dashboard)
# ────────────────────────────────────────────────────────────────
class CourseListSerializer(serializers.ModelSerializer):
    instructors = CourseInstructorSerializer(
        source="course_instructors", many=True, read_only=True
    )
    instructor_count = serializers.SerializerMethodField()
    exam_count = serializers.SerializerMethodField()
    student_count = serializers.SerializerMethodField()
    avg_score = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id",
            "code",
            "name",
            "description",
            "term",
            "banner",
            "instructors",
            "instructor_count",
            "exam_count",
            "student_count",
            "avg_score",
            "last_edited",
        ]
        read_only_fields = fields

    # ── helper counters ────────────────────────────────────────
    def get_instructor_count(self, obj):
        return obj.course_instructors.count()

    def get_exam_count(self, obj):
        return obj.exams.count()

    def get_student_count(self, obj):
        return obj.enrolled_students.filter(is_active=True).count()

    def get_avg_score(self, obj):
        from results.models import ExamResult

        # score column stores the percentage score
        result = ExamResult.objects.filter(exam__course=obj).aggregate(
            avg_score=Avg("score")
        )
        return round(result["avg_score"] or 0, 1)


# courses/serializers.py
class CourseExportSerializer(serializers.Serializer):
    """Serializer for course export configuration"""

    question_banks = serializers.BooleanField(default=True)
    exams = serializers.BooleanField(default=True)
    students = serializers.BooleanField(default=True)
    results = serializers.BooleanField(default=True)
    date_range_enabled = serializers.BooleanField(default=False)
    date_from = serializers.DateField(required=False, allow_null=True)
    date_to = serializers.DateField(required=False, allow_null=True)
    anonymize_students = serializers.BooleanField(default=False)
    format = serializers.ChoiceField(
        choices=["zip", "pdf", "docx", "csv"], default="zip"
    )
