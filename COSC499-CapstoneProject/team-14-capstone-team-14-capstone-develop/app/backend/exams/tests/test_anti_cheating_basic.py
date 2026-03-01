"""
Basic anti-cheating optimization tests.
Covers: Question reuse vs unique questions, different
variant/question counts, basic scenarios.
"""

from django.contrib.auth import get_user_model
from django.test import TestCase

from courses.models import Course
from exams.models import Exam
from exams.services import VariantGenerationService
from questions.models import Question, QuestionBank

User = get_user_model()


class AntiCheatingBasicTests(TestCase):
    """Basic anti-cheating optimization tests"""

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

    def test_unique_questions_3_variants_4_questions_success(self):
        """# NEW TEST: Unique questions, enough of each difficulty, should succeed"""
        exam = Exam.objects.create(
            title="Unique Test Success",
            exam_type="quiz",
            course=self.course,
            created_by=self.user,
            num_variants=3,
            questions_per_variant=4,
            allow_reuse=False,
            randomize_questions=True,
            randomize_choices=True,
            easy_percentage=25,
            medium_percentage=50,
            hard_percentage=25,
        )
        # Need 12 questions total for 3 variants × 4 questions each
        # 25% easy = 1 question per variant = 3 easy questions
        # 50% medium = 2 questions per variant = 6 medium questions
        # 25% hard = 1 question per variant = 3 hard questions
        for i in range(3):
            q = Question.objects.create(
                bank=self.bank,
                prompt="Easy {i+1}",
                difficulty=1,
                points=1,
                choices=["A", "B", "C", "D"],
                correct_answer=[0],
            )
            exam.questions.add(q)
        for i in range(6):
            q = Question.objects.create(
                bank=self.bank,
                prompt="Medium {i+1}",
                difficulty=2,
                points=1,
                choices=["A", "B", "C", "D"],
                correct_answer=[1],
            )
            exam.questions.add(q)
        for i in range(3):
            q = Question.objects.create(
                bank=self.bank,
                prompt="Hard {i+1}",
                difficulty=3,
                points=1,
                choices=["A", "B", "C", "D"],
                correct_answer=[2],
            )
            exam.questions.add(q)
        exam.generate_variants()
        variants = exam.variants.order_by("version_label").all()
        self.assertEqual(len(variants), 3)
        for v in variants:
            self.assertEqual(v.questions.count(), 4)

    def test_edge_cases(self):
        """Test edge cases for anti-cheating risk"""
        """Test edge cases for anti-cheating risk"""
        # Edge Case 1: 1 variant, 1 question, 100% easy
        exam = Exam.objects.create(
            title="Edge Cases Test",
            exam_type="quiz",
            course=self.course,
            created_by=self.user,
            num_variants=1,
            questions_per_variant=1,
            allow_reuse=True,
            randomize_questions=True,
            randomize_choices=True,
            easy_percentage=100,
            medium_percentage=0,
            hard_percentage=0,
        )
        q1 = Question.objects.create(
            bank=self.bank,
            prompt="Edge Case 1",
            difficulty=1,  # Easy
            points=1,
            choices=["A"],
            correct_answer=["A"],
        )
        exam.questions.add(q1)
        exam.generate_variants()
        variants = exam.variants.order_by("version_label").all()
        risk = VariantGenerationService.calculate_cheating_risk(variants)
        self.assertEqual(
            risk, 0, "Single variant, single question should have 0 risk, got {risk}%"
        )
        print("Edge case 1v1q: {risk:.1f}%")

        # Edge Case 2: 1 variant, 1 question, 100% easy, no reuse
        exam = Exam.objects.create(
            title="Edge Cases Test 2",
            exam_type="quiz",
            course=self.course,
            created_by=self.user,
            num_variants=1,
            questions_per_variant=1,
            allow_reuse=False,
            randomize_questions=True,
            randomize_choices=True,
            easy_percentage=100,
            medium_percentage=0,
            hard_percentage=0,
        )
        q2 = Question.objects.create(
            bank=self.bank,
            prompt="Edge Case 2",
            difficulty=1,  # Easy
            points=1,
            choices=["A"],
            correct_answer=["A"],
        )
        exam.questions.add(q2)
        exam.generate_variants()
        variants = exam.variants.order_by("version_label").all()
        risk = VariantGenerationService.calculate_cheating_risk(variants)
        self.assertEqual(
            risk,
            0,
            (
                "Single variant, single question with no reuse "
                "should have 0 risk, got {risk}%"
            ),
        )
        print("Edge case 1v1q no reuse: {risk:.1f}%")

        # Edge Case 3: 1 variant, 1 question, 100% easy, no randomization
        exam = Exam.objects.create(
            title="Edge Cases Test 3",
            exam_type="quiz",
            course=self.course,
            created_by=self.user,
            num_variants=1,
            questions_per_variant=1,
            allow_reuse=True,
            randomize_questions=False,
            randomize_choices=False,
            easy_percentage=100,
            medium_percentage=0,
            hard_percentage=0,
        )
        q3 = Question.objects.create(
            bank=self.bank,
            prompt="Edge Case 3",
            difficulty=1,  # Easy
            points=1,
            choices=["A"],
            correct_answer=["A"],
        )
        exam.questions.add(q3)
        exam.generate_variants()
        variants = exam.variants.order_by("version_label").all()
        risk = VariantGenerationService.calculate_cheating_risk(variants)
        self.assertEqual(
            risk,
            0,
            (
                "Single variant, single question with no randomization "
                "should have 0 risk, got {risk}%"
            ),
        )
        print("Edge case 1v1q no randomization: {risk:.1f}%")

        # Edge Case 4: 100% easy
        exam = Exam.objects.create(
            title="Edge Cases Test 4",
            exam_type="quiz",
            course=self.course,
            created_by=self.user,
            num_variants=1,
            questions_per_variant=1,
            allow_reuse=True,
            randomize_questions=True,
            randomize_choices=True,
            easy_percentage=100,
            medium_percentage=0,
            hard_percentage=0,
        )
        q4 = Question.objects.create(
            bank=self.bank,
            prompt="Edge Case 4",
            difficulty=1,  # Easy
            points=1,
            choices=["A"],
            correct_answer=["A"],
        )
        exam.questions.add(q4)
        exam.generate_variants()
        variants = exam.variants.order_by("version_label").all()
        risk = VariantGenerationService.calculate_cheating_risk(variants)
        self.assertEqual(
            risk,
            0,
            (
                "Single variant, single question with 100% easy should have "
                "0 risk, got {risk}%"
            ),
        )
        print("Edge case 1v1q 100% easy: {risk:.1f}%")

        # Edge Case 5: 100% medium
        exam = Exam.objects.create(
            title="Edge Cases Test 5",
            exam_type="quiz",
            course=self.course,
            created_by=self.user,
            num_variants=1,
            questions_per_variant=1,
            allow_reuse=True,
            randomize_questions=True,
            randomize_choices=True,
            easy_percentage=0,
            medium_percentage=100,
            hard_percentage=0,
        )
        q5 = Question.objects.create(
            bank=self.bank,
            prompt="Edge Case 5",
            difficulty=2,  # Medium
            points=1,
            choices=["A"],
            correct_answer=["A"],
        )
        exam.questions.add(q5)
        exam.generate_variants()
        variants = exam.variants.order_by("version_label").all()
        risk = VariantGenerationService.calculate_cheating_risk(variants)
        self.assertEqual(
            risk,
            0,
            (
                "Single variant, single question with 100% medium should have "
                "0 risk, got {risk}%"
            ),
        )
        print("Edge case 1v1q 100% medium: {risk:.1f}%")

        # Edge Case 6: 100% hard
        exam = Exam.objects.create(
            title="Edge Cases Test 6",
            exam_type="quiz",
            course=self.course,
            created_by=self.user,
            num_variants=1,
            questions_per_variant=1,
            allow_reuse=True,
            randomize_questions=True,
            randomize_choices=True,
            easy_percentage=0,
            medium_percentage=0,
            hard_percentage=100,
        )
        q6 = Question.objects.create(
            bank=self.bank,
            prompt="Edge Case 6",
            difficulty=3,  # Hard
            points=1,
            choices=["A"],
            correct_answer=["A"],
        )
        exam.questions.add(q6)
        exam.generate_variants()
        variants = exam.variants.order_by("version_label").all()
        risk = VariantGenerationService.calculate_cheating_risk(variants)
        self.assertEqual(
            risk,
            0,
            (
                "Single variant, single question with 100% hard should have "
                "0 risk, got {risk}%"
            ),
        )
        print("Edge case 1v1q 100% hard: {risk:.1f}%")

        # Edge Case 7: 50% easy, 50% medium
        exam = Exam.objects.create(
            title="Edge Cases Test 7",
            exam_type="quiz",
            course=self.course,
            created_by=self.user,
            num_variants=1,
            questions_per_variant=2,
            allow_reuse=True,
            randomize_questions=True,
            randomize_choices=True,
            easy_percentage=50,
            medium_percentage=50,
            hard_percentage=0,
        )
        q7_easy = Question.objects.create(
            bank=self.bank,
            prompt="Edge Case 7 Easy",
            difficulty=1,  # Easy
            points=1,
            choices=["A"],
            correct_answer=["A"],
        )
        q7_medium = Question.objects.create(
            bank=self.bank,
            prompt="Edge Case 7 Medium",
            difficulty=2,  # Medium
            points=1,
            choices=["A"],
            correct_answer=["A"],
        )
        exam.questions.add(q7_easy)
        exam.questions.add(q7_medium)
        exam.generate_variants()
        variants = exam.variants.order_by("version_label").all()
        risk = VariantGenerationService.calculate_cheating_risk(variants)
        self.assertEqual(
            risk,
            0,
            (
                "Single variant, two questions with 50% easy, 50% medium should have "
                "0 risk, got {risk}%"
            ),
        )
        print("Edge case 1v2q 50% easy, 50% medium: {risk:.1f}%")

        # Edge Case 8: 0% easy, 50% medium, 50% hard
        exam = Exam.objects.create(
            title="Edge Cases Test 8",
            exam_type="quiz",
            course=self.course,
            created_by=self.user,
            num_variants=1,
            questions_per_variant=2,
            allow_reuse=True,
            randomize_questions=True,
            randomize_choices=True,
            easy_percentage=0,
            medium_percentage=50,
            hard_percentage=50,
        )
        q8_medium = Question.objects.create(
            bank=self.bank,
            prompt="Edge Case 8 Medium",
            difficulty=2,  # Medium
            points=1,
            choices=["A"],
            correct_answer=["A"],
        )
        q8_hard = Question.objects.create(
            bank=self.bank,
            prompt="Edge Case 8 Hard",
            difficulty=3,  # Hard
            points=1,
            choices=["A"],
            correct_answer=["A"],
        )
        exam.questions.add(q8_medium)
        exam.questions.add(q8_hard)
        exam.generate_variants()
        variants = exam.variants.order_by("version_label").all()
        risk = VariantGenerationService.calculate_cheating_risk(variants)
        self.assertEqual(
            risk,
            0,
            (
                "Single variant, two questions with 0% easy, 50% medium, 50% hard "
                "should have 0 risk, got {risk}%"
            ),
        )
        print("Edge case 1v2q 0% easy, 50% medium, 50% hard: {risk:.1f}%")

        # Edge Case 9: 50% easy, 0% medium, 50% hard
        exam = Exam.objects.create(
            title="Edge Cases Test 9",
            exam_type="quiz",
            course=self.course,
            created_by=self.user,
            num_variants=1,
            questions_per_variant=2,
            allow_reuse=True,
            randomize_questions=True,
            randomize_choices=True,
            easy_percentage=50,
            medium_percentage=0,
            hard_percentage=50,
        )
        q9_easy = Question.objects.create(
            bank=self.bank,
            prompt="Edge Case 9 Easy",
            difficulty=1,  # Easy
            points=1,
            choices=["A"],
            correct_answer=["A"],
        )
        q9_hard = Question.objects.create(
            bank=self.bank,
            prompt="Edge Case 9 Hard",
            difficulty=3,  # Hard
            points=1,
            choices=["A"],
            correct_answer=["A"],
        )
        exam.questions.add(q9_easy)
        exam.questions.add(q9_hard)
        exam.generate_variants()
        variants = exam.variants.order_by("version_label").all()
        risk = VariantGenerationService.calculate_cheating_risk(variants)
        self.assertEqual(
            risk,
            0,
            (
                "Single variant, two questions with 50% easy, 0% medium, 50% hard "
                "should have 0 risk, got {risk}%"
            ),
        )
        print("Edge case 1v2q 50% easy, 0% medium, 50% hard: {risk:.1f}%")

        exam = Exam.objects.create(
            title="Edge Cases Test 10",
            exam_type="quiz",
            course=self.course,
            created_by=self.user,
            num_variants=1,
            questions_per_variant=1,
            allow_reuse=True,
            randomize_questions=True,
            randomize_choices=True,
            easy_percentage=0,
            medium_percentage=0,
            hard_percentage=0,
        )
        q10 = Question.objects.create(
            bank=self.bank,
            prompt="Edge Case 10",
            difficulty=1,
            points=1,
            choices=["A"],
            correct_answer=["A"],
        )
        exam.questions.add(q10)
        exam.generate_variants()
        variants = exam.variants.order_by("version_label").all()
        risk = VariantGenerationService.calculate_cheating_risk(variants)
        self.assertEqual(
            risk,
            0,
            (
                "Single variant, single question with 0% easy, 0% medium, 0% hard "
                "should have 0 risk, got {risk}%"
            ),
        )
        print("Edge case 1v1q 0% easy, 0% medium, 0% hard: {risk:.1f}%")
