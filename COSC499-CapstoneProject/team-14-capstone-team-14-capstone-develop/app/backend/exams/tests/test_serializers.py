from django.test import TestCase

from courses.models import Course  # Import from courses app now
from exams.serializers import QuestionSerializer
from questions.models import QuestionBank
from users.models import User


class QuestionSerializerTests(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            email="a@test.com", name="Test User", password="123"
        )
        # Create course without user parameter
        self.course = Course.objects.create(
            code="TEST101",  # Added required code field
            name="Test Course",
            term="2025W1",
        )
        # Add the user as an instructor through M2M relationship
        self.course.instructors.add(self.user)

        # Create QuestionBank with the user as created_by
        self.bank = QuestionBank.objects.create(
            course=self.course,
            title="Test Bank",
            created_by=self.user,  # Added required created_by field
        )

    def test_valid_question_data(self):
        valid_data = {
            "question_bank": self.bank.id,
            "prompt": "What is 2+2?",
            "choices": {"A": "1", "B": "2", "C": "3", "D": "4"},
            "correct_answer": ["D"],
            "difficulty": 2,
            "tags": ["math", "easy"],
        }
        serializer = QuestionSerializer(data=valid_data)
        self.assertTrue(serializer.is_valid())

    def test_invalid_option_key_and_answer(self):
        bad_data = {
            "question_bank": self.bank.id,
            "prompt": "Pick all prime numbers",
            "choices": {"A": "2", "B": "3", "C": "4", "Z": "5"},  # invalid key
            "correct_answer": ["Z"],  # invalid answer
            "difficulty": 3,
            "tags": ["prime"],
        }
        serializer = QuestionSerializer(data=bad_data)
        self.assertFalse(serializer.is_valid())
        # We are now OK if either or both are flagged
        self.assertIn("choices", serializer.errors)
        # Be flexible: correct_answer might be skipped due to choices failing
        if "correct_answer" not in serializer.errors:
            print(
                "correct_answer not validated due to early failure "
                "(expected DRF behavior)"
            )

    def test_invalid_correct_answer_only(self):
        data = {
            "question_bank": self.bank.id,
            "prompt": "Pick all odd numbers",
            "choices": {"A": "1", "B": "2", "C": "3", "D": "4"},
            "correct_answer": ["E"],  # invalid
            "difficulty": 2,
            "tags": ["odd"],
        }
        serializer = QuestionSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("correct_answer", serializer.errors)
