"""
Tests for section-based variant generation algorithms in exam_algorithms.py
"""

from unittest.mock import MagicMock

from django.contrib.auth import get_user_model
from django.test import TestCase

from courses.models import Course
from exams.exam_algorithms import (
    generate_section_based_variants_reuse,
    generate_section_based_variants_unique,
    round_robin_shuffle_choices,
)
from exams.models import Exam, ExamSection, VariantQuestion
from questions.models import Question, QuestionBank

User = get_user_model()


class SectionBasedAlgorithmsTests(TestCase):
    """Test section-based variant generation algorithms"""

    def setUp(self):
        self.user = User.objects.create_user(
            email="instructor@test.com", name="Test Instructor", password="testpass123"
        )

        self.course = Course.objects.create(
            code="TEST101", name="Test Course", term="2025W1"
        )

        # Create question banks
        self.bank1 = QuestionBank.objects.create(
            course=self.course, title="Bank 1", created_by=self.user
        )

        self.bank2 = QuestionBank.objects.create(
            course=self.course, title="Bank 2", created_by=self.user
        )

        # Create exam
        self.exam = Exam.objects.create(
            title="Section Test Exam",
            description="Test exam with sections",
            exam_type="midterm",
            course=self.course,
            created_by=self.user,
            num_variants=2,
            questions_per_variant=6,
            allow_reuse=True,
        )

        # Create questions for bank 1
        self.questions_bank1 = []
        for i in range(10):
            q = Question.objects.create(
                bank=self.bank1,
                prompt=f"Bank 1 question {i+1}",
                difficulty=1 + (i % 3),  # Mix of difficulties
                points=2,
                choices={
                    "A": "Choice A",
                    "B": "Choice B",
                    "C": "Choice C",
                    "D": "Choice D",
                },
                correct_answer=["A"],
                tags=["bank1"],
            )
            self.questions_bank1.append(q)

        # Create questions for bank 2
        self.questions_bank2 = []
        for i in range(8):
            q = Question.objects.create(
                bank=self.bank2,
                prompt=f"Bank 2 question {i+1}",
                difficulty=1 + (i % 3),  # Mix of difficulties
                points=3,
                choices={
                    "A": "Choice A",
                    "B": "Choice B",
                    "C": "Choice C",
                    "D": "Choice D",
                },
                correct_answer=["B"],
                tags=["bank2"],
            )
            self.questions_bank2.append(q)

        # Create exam sections
        self.section1 = ExamSection.objects.create(
            exam=self.exam,
            title="Section 1",
            instructions="Instructions for section 1",
            order=1,
            configured_question_count=3,
        )
        self.section1.question_banks.add(self.bank1)

        self.section2 = ExamSection.objects.create(
            exam=self.exam,
            title="Section 2",
            instructions="Instructions for section 2",
            order=2,
            configured_question_count=3,
        )
        self.section2.question_banks.add(self.bank2)

        # Create mandatory questions
        self.mandatory_question = Question.objects.create(
            bank=self.bank1,
            prompt="Mandatory question",
            difficulty=2,
            points=10,
            choices={
                "A": "Choice A",
                "B": "Choice B",
                "C": "Choice C",
                "D": "Choice D",
            },
            correct_answer=["C"],
            tags=["mandatory"],
        )

    def test_generate_section_based_variants_reuse_basic(self):
        """Test basic reuse mode with sections"""
        # Setup section questions data
        section_questions = {
            self.section1.id: {
                "section": self.section1,
                "questions": self.questions_bank1,
                "max_questions": 3,
            },
            self.section2.id: {
                "section": self.section2,
                "questions": self.questions_bank2,
                "max_questions": 3,
            },
        }

        section_allocation = {self.section1.id: 3, self.section2.id: 2}

        question_to_section = {}
        for q in self.questions_bank1:
            question_to_section[q.id] = self.section1
        for q in self.questions_bank2:
            question_to_section[q.id] = self.section2

        # Generate variants
        variants, warning, distribution_info = generate_section_based_variants_reuse(
            self.exam,
            [self.mandatory_question],
            section_questions,
            section_allocation,
            2,  # num_variants
            5,  # num_non_mandatory
            question_to_section,
        )

        # Assertions
        self.assertIsNone(warning)
        self.assertEqual(len(variants), 2)
        self.assertTrue(distribution_info["auto_balance_disabled"])

        # Check each variant
        for variant in variants:
            vqs = VariantQuestion.objects.filter(variant=variant).order_by("order")
            self.assertEqual(vqs.count(), 6)  # 1 mandatory + 5 non-mandatory

            # Check that mandatory question is present
            mandatory_vq = vqs.filter(question=self.mandatory_question).first()
            self.assertIsNotNone(mandatory_vq)

            # Check section distribution
            section1_count = vqs.filter(section=self.section1).count()
            section2_count = vqs.filter(section=self.section2).count()
            mandatory_count = vqs.filter(question=self.mandatory_question).count()
            self.assertEqual(
                section1_count, 3
            )  # 3 from section1 (mandatory is separate)
            self.assertEqual(section2_count, 2)  # 2 from section2
            self.assertEqual(mandatory_count, 1)  # 1 mandatory question

    def test_generate_section_based_variants_unique_basic(self):
        """Test basic unique mode with sections"""
        # Setup section questions data
        section_questions = {
            self.section1.id: {
                "section": self.section1,
                "questions": self.questions_bank1,
                "max_questions": 3,
            },
            self.section2.id: {
                "section": self.section2,
                "questions": self.questions_bank2,
                "max_questions": 3,
            },
        }

        section_allocation = {self.section1.id: 3, self.section2.id: 2}

        question_to_section = {}
        for q in self.questions_bank1:
            question_to_section[q.id] = self.section1
        for q in self.questions_bank2:
            question_to_section[q.id] = self.section2

        # Generate variants
        variants, warning, distribution_info = generate_section_based_variants_unique(
            self.exam,
            [self.mandatory_question],
            section_questions,
            section_allocation,
            2,  # num_variants
            5,  # num_non_mandatory
            question_to_section,
        )

        # Assertions
        self.assertIsNone(warning)
        self.assertEqual(len(variants), 2)
        self.assertFalse(distribution_info["auto_balance_disabled"])

        # Check each variant
        for variant in variants:
            vqs = VariantQuestion.objects.filter(variant=variant).order_by("order")
            self.assertEqual(vqs.count(), 6)  # 1 mandatory + 5 non-mandatory

            # Check that mandatory question is present
            mandatory_vq = vqs.filter(question=self.mandatory_question).first()
            self.assertIsNotNone(mandatory_vq)

    def test_generate_section_based_variants_reuse_shared_question_bank(self):
        """Test reuse mode with shared question bank across sections"""
        # Create a third section that shares bank1
        section3 = ExamSection.objects.create(
            exam=self.exam,
            title="Section 3",
            instructions="Instructions for section 3",
            order=3,
            configured_question_count=2,
        )
        section3.question_banks.add(self.bank1)  # Share bank1

        # Setup section questions data
        section_questions = {
            self.section1.id: {
                "section": self.section1,
                "questions": self.questions_bank1,
                "max_questions": 3,
            },
            self.section2.id: {
                "section": self.section2,
                "questions": self.questions_bank2,
                "max_questions": 2,
            },
            section3.id: {
                "section": section3,
                "questions": self.questions_bank1,  # Same questions as section1
                "max_questions": 2,
            },
        }

        section_allocation = {self.section1.id: 2, self.section2.id: 2, section3.id: 1}

        question_to_section = {}
        for q in self.questions_bank1:
            question_to_section[q.id] = self.section1  # Default to section1
        for q in self.questions_bank2:
            question_to_section[q.id] = self.section2

        # Generate variants
        variants, warning, distribution_info = generate_section_based_variants_reuse(
            self.exam,
            [self.mandatory_question],
            section_questions,
            section_allocation,
            2,  # num_variants
            5,  # num_non_mandatory
            question_to_section,
        )

        # Assertions
        self.assertIsNone(warning)
        self.assertEqual(len(variants), 2)

        # Check that no duplicate questions exist in any variant
        for variant in variants:
            vqs = VariantQuestion.objects.filter(variant=variant)
            question_ids = [vq.question.id for vq in vqs]
            self.assertEqual(len(question_ids), len(set(question_ids)))  # No duplicates

    def test_generate_section_based_variants_unique_insufficient_questions(self):
        """Test unique mode with insufficient questions"""
        # Create only 3 questions total (need 5 * 2 = 10 for unique mode)
        limited_questions = self.questions_bank1[:3]

        section_questions = {
            self.section1.id: {
                "section": self.section1,
                "questions": limited_questions,
                "max_questions": 3,
            }
        }

        section_allocation = {self.section1.id: 5}

        question_to_section = {q.id: self.section1 for q in limited_questions}

        # Generate variants
        variants, warning, distribution_info = generate_section_based_variants_unique(
            self.exam,
            [self.mandatory_question],
            section_questions,
            section_allocation,
            2,  # num_variants
            5,  # num_non_mandatory
            question_to_section,
        )

        # Should fail due to insufficient questions
        self.assertEqual(len(variants), 0)
        self.assertIsNotNone(warning)
        self.assertIn("needs", warning)
        self.assertIn("questions but only has", warning)

    def test_round_robin_shuffle_choices(self):
        """Test choice shuffling algorithm"""
        # Create a mock variant question group
        vq1 = MagicMock()
        vq2 = MagicMock()
        vq3 = MagicMock()
        vq_group = [vq1, vq2, vq3]

        original_choices = ["Choice A", "Choice B", "Choice C", "Choice D"]
        correct_answers = ["A"]
        choice_keys = ["A", "B", "C", "D"]

        # Test the shuffling
        round_robin_shuffle_choices(
            vq_group, original_choices, correct_answers, choice_keys
        )

        # Check that each VQ was updated
        for vq in vq_group:
            self.assertTrue(hasattr(vq, "randomized_choices"))
            self.assertTrue(hasattr(vq, "randomized_correct_answer"))
            vq.save.assert_called_once()

    def test_generate_section_based_variants_reuse_exact_question_count(self):
        """Test that exact question count is maintained"""
        # Setup for exactly 5 non-mandatory questions
        section_questions = {
            self.section1.id: {
                "section": self.section1,
                "questions": self.questions_bank1[:5],  # Exactly 5 questions
                "max_questions": 5,
            }
        }

        section_allocation = {self.section1.id: 5}

        question_to_section = {q.id: self.section1 for q in self.questions_bank1[:5]}

        # Generate variants
        variants, warning, distribution_info = generate_section_based_variants_reuse(
            self.exam,
            [self.mandatory_question],
            section_questions,
            section_allocation,
            2,  # num_variants
            5,  # num_non_mandatory
            question_to_section,
        )

        # Should succeed with exact count
        self.assertIsNone(warning)
        self.assertEqual(len(variants), 2)

        for variant in variants:
            vqs = VariantQuestion.objects.filter(variant=variant)
            self.assertEqual(vqs.count(), 6)  # 1 mandatory + 5 non-mandatory

    def test_generate_section_based_variants_reuse_insufficient_questions(self):
        """Test reuse mode with insufficient questions for exact count"""
        # Setup for only 3 questions when 5 are needed
        section_questions = {
            self.section1.id: {
                "section": self.section1,
                "questions": self.questions_bank1[:3],  # Only 3 questions
                "max_questions": 3,
            }
        }

        section_allocation = {self.section1.id: 5}  # Try to allocate 5

        question_to_section = {q.id: self.section1 for q in self.questions_bank1[:3]}

        # Generate variants
        variants, warning, distribution_info = generate_section_based_variants_reuse(
            self.exam,
            [self.mandatory_question],
            section_questions,
            section_allocation,
            2,  # num_variants
            5,  # num_non_mandatory
            question_to_section,
        )

        # Should fail due to insufficient questions
        self.assertEqual(len(variants), 0)
        self.assertIsNotNone(warning)
        self.assertIn("Could not select exactly", warning)
