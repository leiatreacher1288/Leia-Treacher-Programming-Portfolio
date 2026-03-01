# app/backend/courses/models.py
from __future__ import annotations

from datetime import timedelta

from django.conf import settings
from django.core.validators import MaxLengthValidator
from django.db import models
from django.utils import timezone


# ────────────────────────────────────────────────────────────────
# Course
# ────────────────────────────────────────────────────────────────
class Course(models.Model):
    # ── Core fields ────────────────────────────────────────────
    code = models.CharField(
        max_length=20,  # Keep database field at 20 for backwards compatibility
        validators=[
            MaxLengthValidator(10, message="Course code must be 10 characters or less")
        ],
        help_text="Course code (max 10 characters)",
    )
    name = models.CharField(max_length=120)  # e.g. “Intro to Algorithms”
    description = models.TextField(blank=True)
    term = models.CharField(max_length=30)  # e.g. “Fall 2025”
    banner = models.ImageField(upload_to="course_banners", blank=True)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    # ── Instructor & creator tracking ──────────────────────────
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="courses_created",
        null=True,
        blank=True,
        help_text="User who originally created the course",
    )

    # Optional display‑name override
    instructor = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Optional display name for the main instructor "
        "if different from creator.name",
    )

    instructors = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through="CourseInstructor",
        related_name="courses",
        blank=True,
    )

    # ── NEW: per‑role default access (editable via Save Permissions) ──
    default_sec_access = models.CharField(
        max_length=7,
        choices=[("FULL", "Full"), ("LIMITED", "Limited"), ("NONE", "None")],
        default="LIMITED",
        help_text="Default access for newly invited Secondary Instructors",
    )
    default_ta_access = models.CharField(
        max_length=7,
        choices=[("FULL", "Full"), ("LIMITED", "Limited"), ("NONE", "None")],
        default="LIMITED",
        help_text="Default access for newly invited TAs",
    )
    default_oth_access = models.CharField(
        max_length=7,
        choices=[("FULL", "Full"), ("LIMITED", "Limited"), ("NONE", "None")],
        default="NONE",
        help_text="Default access for newly invited Other‑role instructors",
    )

    last_edited = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-last_edited"]

    # ── Save override ─────────────────────────────────────────
    def save(self, *args, **kwargs):
        """
        • Always update `last_edited`.
        • On first save, if `creator` exists, create MAIN CourseInstructor row.
        """
        is_new = self.pk is None
        self.last_edited = timezone.now()
        super().save(*args, **kwargs)

        if is_new and self.creator:
            CourseInstructor.objects.get_or_create(
                course=self,
                user=self.creator,
                defaults={
                    "role": CourseInstructor.Role.MAIN,
                    "access": CourseInstructor.Access.FULL,
                    "accepted": True,
                },
            )

    # ── Helpers ───────────────────────────────────────────────
    def __str__(self):
        return f"{self.code} — {self.term}"

    @property
    def primary_instructor(self) -> str | None:
        """
        1. explicit text override
        2. creator.name / creator.email
        3. first MAIN CourseInstructor
        4. first instructor of any role
        """
        if self.instructor:
            return self.instructor
        if self.creator:
            return getattr(self.creator, "name", None) or self.creator.email

        main_link = self.course_instructors.filter(
            role=CourseInstructor.Role.MAIN
        ).first()
        if main_link:
            return main_link.user.name

        any_link = self.course_instructors.first()
        return any_link.user.name if any_link else None

    def get_instructors_by_role(self) -> dict[str, list["CourseInstructor"]]:
        out: dict[str, list["CourseInstructor"]] = {}
        for ci in self.course_instructors.select_related("user"):
            out.setdefault(ci.role, []).append(ci)
        return out


# ────────────────────────────────────────────────────────────────
# Through model: Course ↔ Instructor
# ────────────────────────────────────────────────────────────────
class CourseInstructor(models.Model):
    class Role(models.TextChoices):
        MAIN = "MAIN", "Main Instructor"
        SEC = "SEC", "Secondary Instructor"
        TA = "TA", "Teaching Assistant"
        OTH = "OTH", "Other Instructor"

    class Access(models.TextChoices):
        FULL = "FULL", "Full Access"
        LIMITED = "LIMITED", "Limited Access (View Only)"
        NONE = "NONE", "No Access"

    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="course_instructors",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="course_roles",
    )

    role = models.CharField(max_length=4, choices=Role.choices)
    access = models.CharField(max_length=7, choices=Access.choices, default=Access.FULL)

    invited_at = models.DateTimeField(default=timezone.now)
    accepted = models.BooleanField(default=False)

    class Meta:
        unique_together = ("course", "user")
        ordering = ["role", "user__name"]

    def __str__(self):
        return f"[{self.course.code}] {self.get_role_display()} — {self.user.email}"


# ────────────────────────────────────────────────────────────────
# Student  (unchanged)
# ────────────────────────────────────────────────────────────────
class Student(models.Model):
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="enrolled_students"
    )

    name = models.CharField(max_length=255)
    preferred_name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Student's preferred name (optional)",
    )
    email = models.EmailField(blank=True, null=True)
    student_id = models.CharField(max_length=50)
    created_at = models.DateTimeField(default=timezone.now)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="student_enrollments",
    )

    is_anonymous = models.BooleanField(default=False)
    anonymous_id = models.CharField(max_length=50, blank=True, null=True)

    enrolled_at = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True)
    dropped_at = models.DateTimeField(null=True, blank=True)

    section = models.CharField(max_length=20, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = ("course", "student_id")
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.student_id}) — {self.course.code}"

    def save(self, *args, **kwargs):
        if self.is_anonymous and not self.anonymous_id:
            import uuid

            self.anonymous_id = f"ANON_{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    @property
    def display_name(self):
        """Returns preferred name if set and not anonymous, otherwise falls back to name"""
        if self.is_anonymous:
            return f"Student {self.anonymous_id}"
        return self.preferred_name or self.name  # UPDATED

    @property
    def effective_name(self):
        if self.preferred_name and self.name:
            # Replace first name only
            name_parts = self.name.split(" ", 1)
            if len(name_parts) > 1:
                return f"{self.preferred_name} {name_parts[1]}"
            return self.preferred_name
        return self.name

    @property
    def display_id(self):
        return self.anonymous_id if self.is_anonymous else self.student_id


class CourseExportHistory(models.Model):
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="export_history"
    )
    job_id = models.CharField(max_length=36, unique=True)
    exported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    file_size = models.BigIntegerField()
    file_path = models.CharField(
        max_length=255, blank=True
    )  # IMPORTANT: This stores the file location
    export_format = models.CharField(
        max_length=10, default="zip"
    )  # IMPORTANT: This stores the format type
    status = models.CharField(
        max_length=20,
        choices=[
            ("processing", "Processing"),
            ("completed", "Completed"),
            ("failed", "Failed"),
        ],
    )

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(
                days=30
            )  # 30 days retention as requested
        super().save(*args, **kwargs)

    @property
    def file_size_display(self):
        """Return human-readable file size"""
        size = float(self.file_size)
        for unit in ["B", "KB", "MB", "GB"]:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"

    @property
    def format_display(self):
        """Return user-friendly format name"""
        format_names = {
            "zip": "Raw Data (ZIP)",
            "pdf": "PDF Archive",
            "docx": "DOCX Archive",
            "csv": "CSV Archive",
        }
        return format_names.get(self.export_format, "Archive")


class CourseActivity(models.Model):
    """Track all activities in a course for collaboration"""

    class ActivityType(models.TextChoices):
        # Course operations
        COURSE_CREATED = "course_created", "Course Created"
        COURSE_UPDATED = "course_updated", "Course Updated"

        # Exam operations
        EXAM_CREATED = "exam_created", "Exam Created"
        EXAM_UPDATED = "exam_updated", "Exam Updated"
        EXAM_DELETED = "exam_deleted", "Exam Deleted"
        EXAM_EXPORTED = "exam_exported", "Exam Exported"

        # Variant/Question operations
        VARIANTS_GENERATED = "variants_generated", "Variants Generated"
        QUESTIONS_ADDED = "questions_added", "Questions Added to Exam"
        QUESTIONS_REMOVED = "questions_removed", "Questions Removed from Exam"

        # Student operations
        STUDENT_ADDED = "student_added", "Student Added"
        STUDENT_REMOVED = "student_removed", "Student Removed"

        # Instructor operations
        INSTRUCTOR_ADDED = "instructor_added", "Instructor Added"
        INSTRUCTOR_REMOVED = "instructor_removed", "Instructor Removed"

        # Other operations
        RESULTS_IMPORTED = "results_imported", "Results Imported"
        QUESTION_BANK_ADDED = "question_bank_added", "Question Bank Added"
        QUESTION_BANK_REMOVED = "question_bank_removed", "Question Bank Removed"
        SECTION_UPDATED = "section_updated", "Exam Section Updated"

    course = models.ForeignKey(
        "Course", on_delete=models.CASCADE, related_name="activities"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True
    )
    activity_type = models.CharField(max_length=50, choices=ActivityType.choices)
    description = models.TextField()
    entity_type = models.CharField(max_length=50, null=True)  # 'exam', 'student', etc.
    entity_id = models.IntegerField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["course", "-created_at"]),
        ]
