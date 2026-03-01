from django.conf import settings
from django.db import models

# questions/models.py
from courses.models import Course


class QuestionBank(models.Model):
    """Question bank for organizing questions by course/topic"""

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="question_banks"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_banks",
        null=True,  # Temporarily nullable for migration
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.title} - {self.course.code}"


class Question(models.Model):
    """Individual question (always multiple choice)"""

    bank = models.ForeignKey(
        QuestionBank,
        on_delete=models.CASCADE,
        related_name="questions",
        null=True,  # Temporarily nullable for migration
        blank=True,
    )
    prompt = models.TextField()  # The question text
    # For multiple choice questions
    choices = models.JSONField(default=list, blank=True)
    correct_answer = models.JSONField(
        default=list, blank=True
    )  # Can be list for multi-answer

    # Metadata
    points = models.DecimalField(max_digits=5, decimal_places=2, default=1.0)
    difficulty = models.IntegerField(
        choices=[(1, "Easy"), (2, "Medium"), (3, "Hard")], null=True, blank=True
    )
    tags = models.JSONField(default=list, blank=True)
    explanation = models.TextField(
        blank=True, help_text="Explanation shown after answering"
    )

    # NEW FIELDS for partial credit support
    partial_credit_enabled = models.BooleanField(
        default=True,
        help_text="Whether partial credit is allowed for multi-answer questions",
    )
    incorrect_penalty = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0.0,
        help_text="Penalty for incorrect selections in partial credit (0-1)",
    )

    # Tracking
    created_at = models.DateTimeField(
        auto_now_add=True, null=True
    )  # Nullable for existing records
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_questions",
        null=True,  # Temporarily nullable for migration
        blank=True,
    )

    class Meta:
        ordering = ["bank", "created_at"]

    def __str__(self):
        return f"MCQ: {self.prompt[:50]}..."

    # Add properties to make it compatible with the tests
    @property
    def text(self):
        """Alias for prompt to maintain compatibility"""
        return self.prompt

    @property
    def course(self):
        """Get course through bank for compatibility"""
        return self.bank.course if self.bank else None

    @property
    def answer_choices(self):
        """Alias for choices to maintain compatibility"""
        # Convert list format to dict format expected by tests
        if isinstance(self.choices, list):
            return {chr(65 + i): choice for i, choice in enumerate(self.choices)}
        return self.choices

    @property
    def is_multi_answer(self):
        """Check if this question allows multiple answers"""
        if isinstance(self.correct_answer, list):
            return len(self.correct_answer) > 1
        return False
