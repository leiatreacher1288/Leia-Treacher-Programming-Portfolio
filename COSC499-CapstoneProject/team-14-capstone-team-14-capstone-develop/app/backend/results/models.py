from django.contrib.auth import get_user_model

# results/models.py
from django.db import models

from courses.models import Student
from exams.models import Exam, Variant

User = get_user_model()


class ExamResult(models.Model):
    """
    Stores the result of a student's exam attempt.
    Links to the specific variant they took.
    """

    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name="results")
    variant = models.ForeignKey(
        Variant, on_delete=models.CASCADE, related_name="results"
    )
    student = models.ForeignKey(
        Student, on_delete=models.CASCADE, related_name="exam_results"
    )

    # Raw responses
    raw_responses = models.JSONField(help_text="Student's raw responses as submitted")

    # Grading results
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    total_questions = models.PositiveIntegerField()
    correct_answers = models.PositiveIntegerField(default=0)
    incorrect_answers = models.PositiveIntegerField(default=0)
    unanswered = models.PositiveIntegerField(default=0)

    # Points tracking - NEW FIELDS
    total_points_possible = models.DecimalField(
        max_digits=7,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Total points possible in the exam",
    )

    total_points_earned = models.DecimalField(
        max_digits=7,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Total points earned by the student",
    )

    # Detailed grading info
    grading_details = models.JSONField(
        default=dict, help_text="Detailed grading info per question"
    )

    # Metadata
    submitted_at = models.DateTimeField(auto_now_add=True)
    graded_at = models.DateTimeField(null=True, blank=True)
    imported_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="imported_results"
    )

    # For audit trail
    import_source = models.CharField(
        max_length=50,
        choices=[
            ("manual", "Manual Entry"),
            ("omr_csv", "OMR CSV Import"),
            ("omr_txt", "OMR Text Import"),
            ("api", "API Import"),
        ],
        default="manual",
    )
    import_metadata = models.JSONField(
        default=dict, help_text="Store original import data for audit"
    )

    class Meta:
        unique_together = ["exam", "student", "submitted_at"]
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"{self.student.display_name} - {self.exam.title} - {self.score}%"

    @property
    def percentage_score(self):
        # Just return the score that was already calculated and saved!
        return float(self.score) if self.score is not None else 0.0


class OMRImportSession(models.Model):
    """
    Tracks an OMR import session for batch processing and error recovery.
    """

    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name="omr_imports")
    imported_by = models.ForeignKey(User, on_delete=models.CASCADE)

    # Import details
    file_name = models.CharField(max_length=255)
    file_format = models.CharField(
        max_length=10, choices=[("csv", "CSV"), ("txt", "TXT/Aiken")]
    )
    total_records = models.PositiveIntegerField(default=0)
    successful_imports = models.PositiveIntegerField(default=0)
    failed_imports = models.PositiveIntegerField(default=0)

    # Status tracking
    status = models.CharField(
        max_length=20,
        choices=[
            ("pending", "Pending"),
            ("validating", "Validating"),
            ("processing", "Processing"),
            ("completed", "Completed"),
            ("failed", "Failed"),
        ],
        default="pending",
    )

    # Validation and error tracking
    validation_errors = models.JSONField(default=list)
    import_errors = models.JSONField(default=list)
    warnings = models.JSONField(default=list)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"OMR Import for {self.exam.title} - {self.status}"
