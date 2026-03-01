from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from courses.models import Course
from exams.models import Exam, ExamQuestion
from questions.models import Question, QuestionBank


class Command(BaseCommand):
    help = "Seed demo courses, exams, and questions for the superuser."

    def handle(self, *args, **options):
        User = get_user_model()
        superuser = User.objects.filter(is_superuser=True).first()
        if not superuser:
            self.stdout.write(self.style.ERROR("No superuser found."))
            return

        # Create demo course
        course, _ = Course.objects.get_or_create(
            code="COSC 304",
            term="2025W",
            defaults={
                "name": "Database Systems",
                "description": "A demo course for database systems.",
            },
        )
        course.instructors.add(superuser)

        # Create a question bank
        qb, _ = QuestionBank.objects.get_or_create(
            title="Demo Bank", course=course, defaults={"created_by": superuser}
        )

        # Create demo questions
        questions = []
        for i in range(1, 11):
            q, _ = Question.objects.get_or_create(
                bank=qb,
                prompt=f"Demo question {i}",
                defaults={
                    "choices": [
                        f"Option A{i}",
                        f"Option B{i}",
                        f"Option C{i}",
                        f"Option D{i}",
                    ],
                    "correct_answer": [0],
                    "difficulty": 1 if i <= 3 else 2 if i <= 7 else 3,
                    "created_by": superuser,
                },
            )
            questions.append(q)

        # Create a demo exam
        exam, _ = Exam.objects.get_or_create(
            title="Demo Final Exam",
            course=course,
            defaults={
                "exam_type": "final",
                "created_by": superuser,
                "time_limit": 120,
                "num_variants": 2,
                "questions_per_variant": 10,
                "easy_percentage": 30,
                "medium_percentage": 40,
                "hard_percentage": 30,
                "randomize_questions": True,
                "randomize_choices": True,
                "show_answers_after": False,
                "question_budget": 10,
                "created_at": timezone.now(),
                "updated_at": timezone.now(),
            },
        )

        # Add all demo questions to the exam
        for idx, q in enumerate(questions):
            ExamQuestion.objects.get_or_create(
                exam=exam, question=q, defaults={"order": idx + 1, "points": 1}
            )

        # Generate variants for the exam if not already present
        if hasattr(exam, "generate_variants") and not exam.variants.exists():
            exam.generate_variants()

        self.stdout.write(self.style.SUCCESS("Demo data seeded for superuser."))
