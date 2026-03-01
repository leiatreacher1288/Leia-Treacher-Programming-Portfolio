from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from courses.models import Course
from questions.models import Question, QuestionBank
from users.models import User


class PreviewImportTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create and authenticate a user
        self.user = User.objects.create_user(
            email="test@example.com", name="Test User", password="pass123"
        )
        self.client.force_authenticate(user=self.user)

        # Create a course (using correct field names)
        self.course = Course.objects.create(
            code="TEST101",
            name="Test Course",
            term="2025W1",
            description="Test description",
            creator=self.user,
        )
        self.course.instructors.add(self.user)

        # Create a question bank with correct fields
        self.bank = QuestionBank.objects.create(
            course=self.course, title="Default Bank", created_by=self.user
        )

        # Add an existing question to mark as duplicate
        self.existing_question = Question.objects.create(
            bank=self.bank,
            prompt="What is 2+2?",
            choices={"A": "3", "B": "4"},
            correct_answer=["B"],
            created_by=self.user,
        )

        self.url = reverse("preview-import", args=[self.course.id])

    def test_preview_import_marks_duplicates(self):
        """Ensure duplicate questions are correctly flagged"""
        payload = {
            "questions": [
                {
                    "prompt": "What is 2+2?",
                    "choices": {"A": "3", "B": "4", "C": "5", "D": "6"},
                    "correct_answer": ["B"],
                    "difficulty": 1,  # Easy
                    "tags": [],
                    "explanation": "",
                }
            ]
        }

        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data[0]["is_duplicate"])

    def test_preview_import_non_duplicate(self):
        """Ensure non-duplicate questions are not flagged"""
        payload = {
            "questions": [
                {
                    "prompt": "What is 3+3?",
                    "choices": {"A": "5", "B": "6", "C": "7", "D": "8"},
                    "correct_answer": ["B"],
                    "difficulty": 1,
                    "tags": [],
                    "explanation": "",
                }
            ]
        }

        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data[0]["is_duplicate"])
