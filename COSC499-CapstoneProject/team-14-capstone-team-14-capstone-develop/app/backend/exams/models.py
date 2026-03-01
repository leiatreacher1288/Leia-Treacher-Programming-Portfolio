from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone

from courses.models import Course
from questions.models import Question

User = get_user_model()


class Exam(models.Model):
    """Exam/Quiz that contains questions from question banks"""

    EXAM_TYPES = [
        ("quiz", "Quiz"),
        ("midterm", "Midterm"),
        ("final", "Final Exam"),
        ("practice", "Practice Test"),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    exam_type = models.CharField(max_length=20, choices=EXAM_TYPES, default="quiz")
    scheduled_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="exams", null=True, blank=True
    )

    # Exam settings
    time_limit = models.IntegerField(
        help_text="Time limit in minutes, 0 for unlimited",
        default=0,
        validators=[MinValueValidator(0)],
    )

    # Variant generation settings
    num_variants = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(26)],
        help_text="Number of variants to generate",
    )
    questions_per_variant = models.IntegerField(
        default=20,
        validators=[MinValueValidator(1)],
        help_text="Number of questions per variant",
    )

    # Randomization settings
    randomize_questions = models.BooleanField(default=False)
    randomize_choices = models.BooleanField(default=True)
    show_answers_after = models.BooleanField(
        default=True, help_text="Show correct answers after submission"
    )

    # Difficulty distribution (percentages)
    easy_percentage = models.IntegerField(
        default=30, validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    medium_percentage = models.IntegerField(
        default=50, validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    hard_percentage = models.IntegerField(
        default=20, validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    unknown_percentage = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Percentage of questions with unknown difficulty.",
    )

    # Question selection settings
    question_budget = models.IntegerField(
        default=200, help_text="Total question pool size to draw from"
    )

    # Availability
    available_from = models.DateTimeField(null=True, blank=True)
    available_until = models.DateTimeField(null=True, blank=True)

    # Questions - Many to Many allows reusing questions
    questions = models.ManyToManyField(
        Question, through="ExamQuestion", related_name="exams"
    )

    # Mandatory questions
    mandatory_questions = models.ManyToManyField(
        Question, related_name="mandatory_in_exams", blank=True
    )

    # Tracking
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_exams",
        null=True,
        blank=True,
    )

    weight = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.0,
        help_text="Percentage of course grade this exam counts for",
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    required_to_pass = models.BooleanField(
        default=False, help_text="Is this exam required to pass the course?"
    )

    # Allow question reuse
    allow_reuse = models.BooleanField(
        default=False, help_text="Allow question reuse between variants"
    )

    # NEW: Exam-wide instructions and formatting
    exam_instructions = models.TextField(
        blank=True, help_text="Instructions shown at the top of the exam"
    )
    footer_text = models.CharField(
        max_length=500, blank=True, help_text="Footer text for the exam document"
    )
    academic_integrity_statement = models.TextField(
        blank=True, help_text="Custom academic integrity statement"
    )
    include_academic_integrity = models.BooleanField(
        default=True, help_text="Include academic integrity statement in exam"
    )

    marking_scheme = models.JSONField(
        default=dict, help_text="Marking scheme configuration for this exam"
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} - {self.course.code if self.course else 'No Course'}"

    @property
    def total_points(self):
        """Calculate total points for the exam"""
        return sum(
            eq.points or eq.question.points for eq in self.examquestion_set.all()
        )

    @property
    def is_config_valid(self):
        """Check if exam configuration is valid for variant generation"""
        # Check difficulty percentages sum to 100 or 0
        total_diff = (
            self.easy_percentage
            + self.medium_percentage
            + self.hard_percentage
            + self.unknown_percentage
        )
        if total_diff not in [0, 100]:
            return False

        return True

    def get_difficulty_distribution(self):
        """Get difficulty distribution for variant generation"""
        non_mandatory_count = self.questions.count() - self.mandatory_questions.count()
        if non_mandatory_count <= 0:
            return {"easy": 0, "medium": 0, "hard": 0}

        return {
            "easy": round(non_mandatory_count * self.easy_percentage / 100),
            "medium": round(non_mandatory_count * self.medium_percentage / 100),
            "hard": round(non_mandatory_count * self.hard_percentage / 100),
        }

    def calculate_difficulty_counts(self):
        """Calculate difficulty counts for questions in this exam"""
        # Use questions_per_variant as the base for calculation
        total_questions = self.questions_per_variant

        # Calculate counts based on difficulty percentages
        counts = {
            "easy": round(total_questions * self.easy_percentage / 100),
            "medium": round(total_questions * self.medium_percentage / 100),
            "hard": round(total_questions * self.hard_percentage / 100),
        }

        return counts

    def generate_variants(self):
        """
        Generate exam variants using the VariantGenerationService
        This method is kept for backward compatibility but delegates to the service
        """
        from .services import VariantGenerationService

        return VariantGenerationService.generate_variants(self)


class ExamSection(models.Model):
    """Sections within an exam for organizing questions"""

    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name="sections")
    title = models.CharField(max_length=200)
    instructions = models.TextField(
        blank=True, help_text="Instructions specific to this section"
    )
    order = models.IntegerField(
        default=0, help_text="Order of this section in the exam"
    )
    question_banks = models.ManyToManyField(
        "questions.QuestionBank",
        related_name="exam_sections",
        blank=True,
        help_text="Question banks used in this section",
    )

    # NEW: Configured question count for variant generation
    configured_question_count = models.IntegerField(
        default=5,
        validators=[MinValueValidator(1)],
        help_text="Number of questions to select from this section during variant generation",
    )

    class Meta:
        ordering = ["order", "title"]
        unique_together = ["exam", "title"]

    def __str__(self):
        return f"{self.exam.title} - {self.title}"

    @property
    def question_count(self):
        """Get total number of questions from all banks in this section"""
        total = 0
        for bank in self.question_banks.all():
            total += bank.questions.count()
        return total


class ExamQuestion(models.Model):
    """Through model for exam-question relationship"""

    exam = models.ForeignKey(Exam, on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    order = models.IntegerField(default=0)
    points = models.IntegerField(null=True, blank=True)

    class Meta:
        ordering = ["order"]
        unique_together = ["exam", "question"]


class Variant(models.Model):
    """Different versions of an exam (e.g., Version A, B, C)"""

    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name="variants")
    version_label = models.CharField(
        max_length=10,
        default="A",
        help_text='Version label for the variant (e.g. "A", "B", "C")',
    )

    # Store the questions for this variant
    questions = models.ManyToManyField(
        Question, through="VariantQuestion", related_name="in_variants"
    )

    # Variant metadata
    created_at = models.DateTimeField(auto_now_add=True)
    exported_at = models.DateTimeField(null=True, blank=True)

    # Export tracking
    docx_exported = models.BooleanField(default=False)
    pdf_exported = models.BooleanField(default=False)
    is_locked = models.BooleanField(
        default=False, help_text="Locked variants cannot be edited"
    )

    class Meta:
        ordering = ["version_label"]

    def __str__(self):
        return f"{self.exam.title} - Version {self.version_label}"


class VariantQuestion(models.Model):
    """Through model for variant-question relationship"""

    variant = models.ForeignKey(Variant, on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    order = models.IntegerField(default=0)

    # Store section information for proper grouping in exports
    section = models.ForeignKey(
        ExamSection,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Section this question belongs to in this variant",
    )

    # Store randomized choices and correct answers for this variant
    randomized_choices = models.JSONField(
        null=True, blank=True, help_text="Randomized choices for this variant"
    )
    randomized_correct_answer = models.JSONField(
        null=True, blank=True, help_text="Randomized correct answer for this variant"
    )

    class Meta:
        ordering = ["order"]
        unique_together = ["variant", "question"]


class ExamExportHistory(models.Model):
    """Track export history for exams"""

    EXPORT_FORMATS = [
        ("pdf", "PDF"),
        ("docx", "DOCX"),
        ("both", "Both"),
    ]

    exam = models.ForeignKey(
        Exam, on_delete=models.CASCADE, related_name="export_history"
    )
    exported_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    exported_at = models.DateTimeField(auto_now_add=True)
    export_format = models.CharField(max_length=20, choices=EXPORT_FORMATS)
    variants_exported = models.ManyToManyField(Variant)

    class Meta:
        ordering = ["-exported_at"]

    def __str__(self):
        return (
            f"{self.exam.title} - {self.export_format} export by "
            f"{self.exported_by.name}"
        )


class StudentVariantAssignment(models.Model):
    """Track which student gets which variant for an exam"""

    student = models.ForeignKey(
        "courses.Student", on_delete=models.CASCADE, related_name="variant_assignments"
    )
    exam = models.ForeignKey(
        Exam, on_delete=models.CASCADE, related_name="student_assignments"
    )
    variant = models.ForeignKey(
        Variant, on_delete=models.CASCADE, related_name="student_assignments"
    )

    # Assignment metadata
    assigned_at = models.DateTimeField(auto_now_add=True)
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="variant_assignments_made",
    )

    # Seating information for anti-cheating
    seat_number = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Physical seat number for exam administration",
    )
    row_number = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        help_text="Row number for seating arrangement",
    )

    # Status tracking
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True, help_text="Administrative notes")

    class Meta:
        unique_together = ["student", "exam"]  # One variant per student per exam
        ordering = ["assigned_at"]

    def __str__(self):
        return (
            f"{self.student.display_name} - {self.exam.title} - Variant "
            f"{self.variant.version_label}"
        )

    @property
    def seating_info(self):
        """Return formatted seating information"""
        if self.seat_number and self.row_number:
            return f"Row {self.row_number}, Seat {self.seat_number}"
        elif self.seat_number:
            return f"Seat {self.seat_number}"
        elif self.row_number:
            return f"Row {self.row_number}"
        return "Not assigned"

    @classmethod
    def assign_variants_to_students(
        cls, exam, students, assignment_strategy="round_robin"
    ):
        """
        Assign variants to students using specified strategy

        Args:
            exam: Exam instance
            students: QuerySet of Student objects
            assignment_strategy: 'round_robin', 'random', or 'seating_based'
        """
        variants = list(exam.variants.all())
        if not variants:
            raise ValueError("No variants available for assignment")

        # Clear existing assignments for this exam
        cls.objects.filter(exam=exam).delete()

        assignments = []
        students_list = list(students)

        if assignment_strategy == "round_robin":
            # Assign variants in round-robin fashion
            for i, student in enumerate(students_list):
                variant = variants[i % len(variants)]
                assignment = cls(student=student, exam=exam, variant=variant)
                assignments.append(assignment)

        elif assignment_strategy == "random":
            # Randomly assign variants
            import random

            for student in students_list:
                variant = random.choice(variants)
                assignment = cls(student=student, exam=exam, variant=variant)
                assignments.append(assignment)

        elif assignment_strategy == "seating_based":
            # Assign based on seating to maximize anti-cheating
            # This ensures adjacent seats get different variants
            for i, student in enumerate(students_list):
                # Use modulo to cycle through variants, but with offset based on row
                row_offset = (i // 10) % len(variants)  # Assume 10 students per row
                variant_index = (i + row_offset) % len(variants)
                variant = variants[variant_index]
                assignment = cls(student=student, exam=exam, variant=variant)
                assignments.append(assignment)

        # Bulk create all assignments
        cls.objects.bulk_create(assignments)
        return assignments


class ExamTemplate(models.Model):
    """Model for storing reusable exam layout templates."""

    name = models.CharField(
        max_length=255, help_text="Template name for easy identification"
    )
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="exam_templates"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_default = models.BooleanField(
        default=False, help_text="Whether this template is the default for all users"
    )

    # Store layout data as JSON
    layout_data = models.JSONField(
        default=dict,
        help_text="JSON containing exam layout settings: instructions, footer, academic integrity, sections",
    )

    class Meta:
        unique_together = ["name", "created_by"]
        ordering = ["-updated_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["is_default"],
                condition=models.Q(is_default=True),
                name="only_one_default_template",
            )
        ]

    def __str__(self):
        return f"{self.name} (by {self.created_by.name})"

    @property
    def instructions(self):
        """Get instructions from layout data."""
        return self.layout_data.get("instructions", [])

    @property
    def footer(self):
        """Get footer from layout data."""
        return self.layout_data.get("footer", "")

    @property
    def academic_integrity(self):
        """Get academic integrity settings from layout data."""
        return self.layout_data.get(
            "academic_integrity", {"enabled": False, "text": ""}
        )

    @property
    def sections(self):
        """Get sections from layout data."""
        return self.layout_data.get("sections", [])
