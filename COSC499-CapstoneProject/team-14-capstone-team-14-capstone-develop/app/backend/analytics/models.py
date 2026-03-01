from django.conf import settings  # Add this import

# analytics/models.py
from django.db import models

from exams.models import Exam, Variant
from questions.models import Question


class QuestionPerformance(models.Model):
    """
    Tracks how often a question is missed across all variants / exams.
    """

    question = models.OneToOneField(
        Question, on_delete=models.CASCADE, related_name="performance"
    )
    total_attempts = models.PositiveIntegerField(default=0)
    incorrect_attempts = models.PositiveIntegerField(default=0)

    @property
    def miss_rate(self) -> float:
        if self.total_attempts == 0:
            return 0.0
        return self.incorrect_attempts / self.total_attempts

    def __str__(self):
        return f"Q{self.question.id} miss rate: {self.miss_rate:.2%}"


class SimilarityCheck(models.Model):
    """
    A record of a similarity scan between two students’ answer sets.
    High similarity scores may signal potential collusion.
    """

    exam_variant = models.ForeignKey(
        Variant, on_delete=models.CASCADE, related_name="similarity_checks"
    )
    student_a_id = models.CharField(max_length=32)  # pseudonymised ID
    student_b_id = models.CharField(max_length=32)
    similarity_score = models.DecimalField(
        max_digits=5, decimal_places=2
    )  # e.g., 92.45 %
    flagged = models.BooleanField(
        default=False
    )  # True if score over a chosen threshold
    checked_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        flag = "⚠️" if self.flagged else ""
        return (
            f"{flag} Similarity {self.similarity_score}% – "
            f"{self.student_a_id} vs {self.student_b_id}"
        )


class ScoreDistribution(models.Model):
    """
    Aggregated statistics for an entire exam (all variants combined).
    Stored as a single row per exam/date run so analyses can be cached.
    """

    exam = models.ForeignKey(
        Exam, on_delete=models.CASCADE, related_name="score_distributions"
    )
    mean = models.DecimalField(max_digits=5, decimal_places=2)
    median = models.DecimalField(max_digits=5, decimal_places=2)
    std_dev = models.DecimalField(max_digits=5, decimal_places=2)
    histogram_json = models.JSONField()  # store bucketed histogram data
    generated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Scores for Exam {self.exam.id} ({self.generated_at.date()})"


# analytics/models.py - Updated SimilarityFlag model


# ... other models ...


class SimilarityFlag(models.Model):
    """
    Stores detected similarity flags between student exam results
    """

    STATUS_CHOICES = [
        ("pending", "Pending Review"),
        ("reviewed", "Reviewed"),
        ("dismissed", "Dismissed"),
        ("confirmed", "Confirmed Violation"),
    ]

    SEVERITY_CHOICES = [
        ("low", "Low Risk"),
        ("medium", "Medium Risk"),
        ("high", "High Risk"),
    ]

    exam = models.ForeignKey(
        "exams.Exam", on_delete=models.CASCADE, related_name="similarity_flags"
    )
    variant = models.ForeignKey(
        "exams.Variant", on_delete=models.CASCADE, null=True, blank=True
    )
    student1 = models.ForeignKey(
        "courses.Student",
        on_delete=models.CASCADE,
        related_name="similarity_flags_as_student1",
    )
    student2 = models.ForeignKey(
        "courses.Student",
        on_delete=models.CASCADE,
        related_name="similarity_flags_as_student2",
    )
    similarity_score = models.DecimalField(
        max_digits=5, decimal_places=2, help_text="Similarity percentage between 0-100"
    )
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default="low")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    flagged_questions = models.JSONField(
        default=list, help_text="List of question numbers with identical answers"
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # Changed from 'auth.User'
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_similarity_flags",
    )
    notes = models.TextField(blank=True, help_text="Review notes or comments")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-similarity_score", "-created_at"]
        unique_together = ["exam", "student1", "student2"]

    def __str__(self):
        return f"{self.exam.title} - {self.student1.name} & {self.student2.name} ({self.similarity_score}%)"

    def save(self, *args, **kwargs):
        # Auto-set severity based on similarity score
        if self.similarity_score >= 90:
            self.severity = "high"
        elif self.similarity_score >= 80:
            self.severity = "medium"
        else:
            self.severity = "low"

        # Ensure student1 and student2 are ordered consistently
        if (
            self.student1_id
            and self.student2_id
            and self.student1_id > self.student2_id
        ):
            self.student1, self.student2 = self.student2, self.student1

        super().save(*args, **kwargs)
