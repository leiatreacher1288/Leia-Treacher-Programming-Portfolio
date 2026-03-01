from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
import pytest
from rest_framework.test import APIClient

from exams.models import Course
from exams.serializers import QuestionSerializer
from questions.models import QuestionBank
from users.models import User

# These tests verify that our /api/exams/list/ endpoint:
# - denies unauthenticated access
# - allows access if the request has a valid token


class ExamListAuthTests(TestCase):

    def setUp(self):
        self.client = APIClient()

        # Create test user with all required fields
        self.user = get_user_model().objects.create_user(
            email="test2@example.com", name="Exam User", password="testpass"
        )

        self.token_url = reverse("token_obtain_pair")  # /api/auth/token/
        self.exam_list_url = reverse("exam-list")  # /api/exams/list/

    def test_exam_list_requires_auth(self):
        # Access the endpoint without authentication
        response = self.client.get(self.exam_list_url)
        self.assertEqual(response.status_code, 401)

    def test_exam_list_with_valid_token(self):
        response = self.client.post(
            self.token_url, {"email": "test2@example.com", "password": "testpass"}
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        token = response.data["access"]

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = self.client.get(self.exam_list_url)

        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.data, list)  # Check response is a list


@pytest.mark.django_db
def test_valid_question_data():
    user = User.objects.create_user(email="a@test.com", name="A", password="123")
    course = Course.objects.create(user=user, name="Test Course", term="2025W1")
    bank = QuestionBank.objects.create(course=course, title="Test Bank")

    valid_data = {
        "question_bank": bank.id,
        "text": "What is 2+2?",
        "options": {"A": "1", "B": "2", "C": "3", "D": "4"},
        "correct_answers": ["D"],
        "difficulty": 2,
        "tags": ["math", "easy"],
    }

    serializer = QuestionSerializer(data=valid_data)
    assert serializer.is_valid(), serializer.errors


@pytest.mark.django_db
def test_invalid_keys_and_correct_answer():
    user = User.objects.create_user(email="a@test.com", name="A", password="123")
    course = Course.objects.create(user=user, name="Test Course", term="2025W1")
    course = Course.objects.create(user=user, name="Test Course", term="2025W1")
    bank = QuestionBank.objects.create(course=course, title="Test Bank")

    bad_data = {
        "question_bank": bank.id,
        "text": "Pick all prime numbers",
        "options": {"A": "2", "B": "3", "C": "4", "X": "5"},  # Invalid key
        "correct_answers": ["X"],
        "difficulty": 3,
        "tags": ["prime"],
    }

    serializer = QuestionSerializer(data=bad_data)
    assert not serializer.is_valid()
    assert "options" in serializer.errors or "correct_answers" in serializer.errors
