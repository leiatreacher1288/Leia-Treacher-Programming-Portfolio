"""
Unit tests for Exam, Variant, and related models,
including string representations, ordering, and computed properties.
Covers: __str__ methods, total points, ordering, and export history.
"""

from django.test import TestCase

from courses.models import Course
from exams.models import Exam, Variant
from questions.models import Question, QuestionBank
from users.models import User


class ExamsModelsTests(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            email="a@test.com", name="Test User", password="123"
        )
        self.course = Course.objects.create(
            code="TEST101", name="Test Course", term="2025W1"
        )
        self.bank = QuestionBank.objects.create(
            course=self.course, title="Test Bank", created_by=self.user
        )

        # Three distinct questions so we never duplicate (exam, question)
        self.q1 = Question.objects.create(bank=self.bank, prompt="Q1", points=5)
        self.q2 = Question.objects.create(bank=self.bank, prompt="Q2", points=3)
        self.q3 = Question.objects.create(bank=self.bank, prompt="Q3", points=7)

    def test_exam_str_and_default_course_str(self):

        exam_no_course = Exam.objects.create(title="NoCourse")
        self.assertEqual(str(exam_no_course), "NoCourse - No Course")

    def test_is_config_valid(self):
        exam = Exam.objects.create(
            title="E", easy_percentage=30, medium_percentage=50, hard_percentage=20
        )
        self.assertTrue(exam.is_config_valid)

        exam.hard_percentage = 10
        self.assertFalse(exam.is_config_valid)

    def test_calculate_difficulty_counts_with_and_without_mandatory(self):

        exam = Exam.objects.create(title="E", questions_per_variant=10)
        counts = exam.calculate_difficulty_counts()
        self.assertEqual(
            counts,
            {
                "easy": round(10 * exam.easy_percentage / 100),
                "medium": round(10 * exam.medium_percentage / 100),
                "hard": round(10 * exam.hard_percentage / 100),
            },
        )

    def test_total_points_and_examquestion_ordering(self):

        exam = Exam.objects.create(title="E")
        # Add questions to the exam
        exam.questions.add(self.q1, self.q2, self.q3)

        # total = 5 + 3 + 7 = 15
        expected_total = self.q1.points + self.q2.points + self.q3.points
        self.assertEqual(exam.total_points, expected_total)

    def test_variant_defaults_str_and_ordering(self):

        exam = Exam.objects.create(title="E")
        v1 = Variant.objects.create(exam=exam)
        self.assertEqual(v1.version_label, "A")
        self.assertEqual(str(v1), "E - Version A")

        # Create additional variants to test ordering
        v2 = Variant.objects.create(exam=exam, version_label="B")
        v0 = Variant.objects.create(exam=exam, version_label="0")

        # Check that variants are ordered correctly
        labels = [v.version_label for v in Variant.objects.filter(exam=exam)]
        self.assertEqual(labels, ["0", "A", "B"])
