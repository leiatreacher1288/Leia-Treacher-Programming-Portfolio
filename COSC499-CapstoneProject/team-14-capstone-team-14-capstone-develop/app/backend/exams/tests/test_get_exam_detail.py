"""
Tests for exam creation, adding questions, and verifying the exam‑detail
endpoint.

Copy this file over the existing
`exams/tests/test_get_exam_detail.py` and re‑run your test suite.
"""

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from courses.models import Course, CourseInstructor
from questions.models import Question, QuestionBank

User = get_user_model()


class ExamCreationModelTests(TestCase):
    """End‑to‑end check of the Exam API."""

    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com", password="testpass123", name="Test User"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.course = Course.objects.create(
            name="Test Course", code="TEST101", term="Fall 2024"
        )

        # Make user an instructor for the course
        CourseInstructor.objects.create(
            course=self.course,
            user=self.user,
            role=CourseInstructor.Role.MAIN,
            access=CourseInstructor.Access.FULL,
            accepted=True,
        )

        self.question_bank = QuestionBank.objects.create(
            title="Test Bank", description="Test question bank", course=self.course
        )

        # Two questions we will add later
        self.easy_question = Question.objects.create(
            bank=self.question_bank,
            prompt="What is 1 + 1?",
            choices={"A": "1", "B": "2", "C": "3", "D": "4"},
            correct_answer=["B"],
            difficulty=1,
            tags=["Math", "Easy"],
            explanation="1 + 1 = 2",
        )
        self.medium_question = Question.objects.create(
            bank=self.question_bank,
            prompt="What is the capital of France?",
            choices={"A": "London", "B": "Berlin", "C": "Paris", "D": "Madrid"},
            correct_answer=["C"],
            difficulty=2,
            tags=["France", "Capital"],
            explanation="The capital of France is Paris.",
        )

    def test_create_exam_add_questions_check_get_exam_detail(self):
        # ---------- 1. create the exam ----------
        create_payload = {
            "title": "Quiz #1",
            "course": self.course.id,
            "exam_type": "quiz",
            "easy_percentage": 30,
            "medium_percentage": 50,
            "hard_percentage": 20,
            "questions_per_variant": 3,
            "num_variants": 2,
        }
        create_resp = self.client.post(
            reverse("exam-list"), create_payload, format="json"
        )
        self.assertEqual(create_resp.status_code, status.HTTP_201_CREATED)

        exam_id = create_resp.data["id"]
        detail_url = reverse("exam-detail", kwargs={"pk": exam_id})

        # ---------- 2. fetch defaults ----------
        resp = self.client.get(detail_url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["title"], "Quiz #1")
        self.assertEqual(resp.data["course_code"], "TEST101")
        self.assertEqual(resp.data["questions"], [])

        # ---------- 3. add questions ----------
        add_url = reverse("exam-add-questions", kwargs={"pk": exam_id})
        add_resp = self.client.post(
            add_url,
            {"question_ids": [self.easy_question.id, self.medium_question.id]},
            format="json",
        )
        self.assertEqual(add_resp.status_code, status.HTTP_200_OK)

        # ---------- 4. fetch again & verify ----------
        resp = self.client.get(detail_url)
        self.assertEqual(len(resp.data["questions"]), 2)

        # Build helper map so we don't depend on list order
        questions_by_id = {q["question"]["id"]: q for q in resp.data["questions"]}

        # -- easy question checks
        easy = questions_by_id[self.easy_question.id]
        self.assertEqual(easy["question"]["prompt"], "What is 1 + 1?")
        self.assertEqual(easy["question"]["difficulty"], "Easy")
        self.assertEqual(easy["question"]["correct_answers"], ["B"])

        # -- medium question checks
        medium = questions_by_id[self.medium_question.id]
        self.assertEqual(medium["question"]["prompt"], "What is the capital of France?")
        self.assertEqual(medium["question"]["difficulty"], "Medium")
        self.assertEqual(medium["question"]["correct_answers"], ["C"])
