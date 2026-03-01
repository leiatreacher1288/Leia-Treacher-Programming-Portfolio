"""
Advanced anti-cheating optimization tests.
Covers: Multi-correct answers, different option counts (A-D vs A-E), complex scenarios.
"""

from django.contrib.auth import get_user_model
from django.test import TestCase

from courses.models import Course
from exams.models import Exam
from exams.services import VariantGenerationService
from questions.models import Question, QuestionBank

User = get_user_model()


class AntiCheatingAdvancedTests(TestCase):
    """Advanced anti-cheating optimization tests"""

    def setUp(self):
        """Set up test data"""

        """Set up test data"""
        self.user = User.objects.create_user(
            email="test@example.com", name="Test User", password="testpass123"
        )
        self.course = Course.objects.create(
            name="Test Course", code="TEST101", term="Fall 2024"
        )
        self.bank = QuestionBank.objects.create(
            title="Test Bank", course=self.course, created_by=self.user
        )

    def test_multi_correct_answers(self):
        """Test anti-cheating with multi-correct answer questions"""
        exam = Exam.objects.create(
            title="Multi-Correct Test",
            exam_type="quiz",
            course=self.course,
            created_by=self.user,
            num_variants=3,
            questions_per_variant=4,
            allow_reuse=True,
            randomize_questions=True,
            randomize_choices=True,
        )

        # Create questions with multi-correct answers
        questions = []
        multi_answers = [
            [0, 1],  # A, B
            [1, 2],  # B, C
            [2, 3],  # C, D
            [0, 3],  # A, D
            [0, 2],  # A, C
            [1, 3],  # B, D
            [0, 1, 2],  # A, B, C
            [1, 2, 3],  # B, C, D
        ]

        for i in range(8):
            q = Question.objects.create(
                bank=self.bank,
                prompt="Multi-correct Question {i+1}",
                difficulty=1,
                points=1,
                choices=["A", "B", "C", "D"],
                correct_answer=multi_answers[i],
            )
            questions.append(q)
            exam.questions.add(q)

        exam.generate_variants()
        variants = exam.variants.order_by("version_label").all()
        risk = VariantGenerationService.calculate_cheating_risk(variants)

        # Multi-correct answers should still achieve reasonable risk reduction
        self.assertLess(
            risk,
            60,
            "Multi-correct answers should achieve reasonable risk, got {risk}%",
        )
        print("Multi-correct answers: {risk:.1f}%")

    def test_multi_correct_with_different_counts(self):
        """Test multi-correct answers with different option counts"""

        """Test multi-correct answers with different option counts"""
        exam = Exam.objects.create(
            title="Multi-Correct Mixed Test",
            exam_type="quiz",
            course=self.course,
            created_by=self.user,
            num_variants=3,
            questions_per_variant=4,
            allow_reuse=True,
            randomize_questions=True,
            randomize_choices=True,
        )

        # Create questions with multi-correct answers and different option counts
        questions = []
        for i in range(8):
            if i % 2 == 0:
                # A-D multi-correct
                choices = ["A", "B", "C", "D"]
                correct = [i % 4, (i + 1) % 4]  # Two correct answers
            else:
                # A-E multi-correct
                choices = ["A", "B", "C", "D", "E"]
                correct = [i % 5, (i + 2) % 5]  # Two correct answers

            q = Question.objects.create(
                bank=self.bank,
                prompt="Multi-Mixed Question {i+1}",
                difficulty=1,
                points=1,
                choices=choices,
                correct_answer=correct,
            )
            questions.append(q)
            exam.questions.add(q)

        exam.generate_variants()
        variants = exam.variants.order_by("version_label").all()
        risk = VariantGenerationService.calculate_cheating_risk(variants)

        # Complex scenario should still work
        self.assertLess(
            risk, 70, "Complex multi-correct scenario should work, got {risk}%"
        )
        print("Multi-correct mixed: {risk:.1f}%")

    def test_edge_cases(self):
        """Test edge cases for anti-cheating risk calculation."""
        exam = Exam.objects.create(
            title="Edge Cases Test",
            exam_type="quiz",
            course=self.course,
            created_by=self.user,
            num_variants=1,  # Single variant for edge cases
            questions_per_variant=1,
            allow_reuse=True,
            randomize_questions=True,
            randomize_choices=True,
        )

        # Create a single question with a single correct answer
        q = Question.objects.create(
            bank=self.bank,
            prompt="Single Answer Question",
            difficulty=1,
            points=1,
            choices=["A"],
            correct_answer=["A"],
        )
        exam.questions.add(q)

        # Use the service directly instead of exam.generate_variants()
        VariantGenerationService.generate_variants(exam)
        variants = exam.variants.order_by("version_label").all()
        risk = VariantGenerationService.calculate_cheating_risk(variants)

        self.assertEqual(
            risk, 0.0, f"Expected 0% risk for single question, got {risk}%"
        )
        print(f"Edge cases: {risk:.1f}%")

        # Create a single question with multiple correct answers
        q = Question.objects.create(
            bank=self.bank,
            prompt="Multi-Answer Question",
            difficulty=1,
            points=1,
            choices=["A", "B"],
            correct_answer=["A", "B"],
        )
        exam.questions.add(q)

        # Use the service directly instead of exam.generate_variants()
        VariantGenerationService.generate_variants(exam)
        variants = exam.variants.order_by("version_label").all()
        risk = VariantGenerationService.calculate_cheating_risk(variants)

        self.assertEqual(
            risk, 0.0, f"Expected 0% risk for multi-answer question, got {risk}%"
        )
        print(f"Edge cases: {risk:.1f}%")

        # Create a single question with no correct answer
        q = Question.objects.create(
            bank=self.bank,
            prompt="No Answer Question",
            difficulty=1,
            points=1,
            choices=["A"],
            correct_answer=[],
        )
        exam.questions.add(q)

        # Use the service directly instead of exam.generate_variants()
        VariantGenerationService.generate_variants(exam)
        variants = exam.variants.order_by("version_label").all()
        risk = VariantGenerationService.calculate_cheating_risk(variants)

        self.assertEqual(
            risk, 0.0, f"Expected 0% risk for question with no answer, got {risk}%"
        )
        print(f"Edge cases: {risk:.1f}%")
