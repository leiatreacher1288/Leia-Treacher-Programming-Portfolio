from io import BytesIO

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from courses.models import Course
from questions.models import Question, QuestionBank
from users.models import User


class CSVUploadTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.url = reverse("questions-upload")

        self.user = User.objects.create_user(
            email="t@example.com", name="T", password="123"
        )
        self.client.force_authenticate(user=self.user)

        self.course = Course.objects.create(code="MATH101", name="Math", term="2025W1")
        self.course.instructors.add(self.user)

        self.bank = QuestionBank.objects.create(
            course=self.course, title="Bank 1", created_by=self.user
        )

    def test_csv_upload(self):
        content = (
            "prompt,explanation,a,b,c,d,e,correct_answer,difficulty,tags\n"
            "What is 1 + 1?,Basic math,1,2,3,4,,B,1,math\n"
            "What is the capital of British Columbia?,Geography,Ottawa,Victoria,Toronto,Vancouver,Washington,B,2,Canada|Capital\n"
            "What is the Capital of Canada?,Geography,Ottawa,Toronto,Montreal,Quebec,,A,1,Canada\n"
        )

        file = BytesIO(content.encode("utf-8"))
        file.name = "questions.csv"

        response = self.client.post(
            self.url,
            {"file": file, "question_bank_id": self.bank.id},
            format="multipart",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["saved"], 3)
        self.assertEqual(response.data["failed"], 0)

    def test_csv_upload_with_bad_answer(self):
        content = (
            "prompt,explanation,a,b,c,d,e,correct_answer,difficulty,tags\n"
            "What is 1 + 1?,Basic math,1,2,3,4,,E,1,math\n"
            "What is the capital of British Columbia?,Geography,Ottawa,Victoria,Toronto,Vancouver,Washington,B,2,Canada|Capital\n"
            "What is the Capital of Canada?,Geography,Ottawa,Toronto,Montreal,Quebec,,A,1,Canada\n"
        )

        file = BytesIO(content.encode("utf-8"))
        file.name = "questions.csv"

        response = self.client.post(
            self.url,
            {"file": file, "question_bank_id": self.bank.id},
            format="multipart",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["saved"], 2)
        self.assertEqual(response.data["failed"], 1)

    def test_csv_upload_with_not_enough_choices(self):
        content = (
            "prompt,explanation,a,b,c,d,e,correct_answer,difficulty,tags\n"
            "What is 1 + 1?,Basic math,1,,,,,B,1,math\n"  # Only 1 option now
            "What is the capital of British Columbia?,Geography,Ottawa,Victoria,Toronto,Vancouver,Washington,B,2,Canada|Capital\n"
            "What is the Capital of Canada?,Geography,Ottawa,Toronto,Montreal,Quebec,,A,1,Canada\n"
        )

        file = BytesIO(content.encode("utf-8"))
        file.name = "questions.csv"

        response = self.client.post(
            self.url,
            {"file": file, "question_bank_id": self.bank.id},
            format="multipart",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["saved"], 2)
        self.assertEqual(response.data["failed"], 1)

    def test_question_creation_with_null_difficulty(self):
        """Test that questions can be created with null difficulty"""
        # Test direct model creation
        question = Question.objects.create(
            bank=self.bank,
            prompt="Test question with no difficulty",
            choices={
                "A": "Option A",
                "B": "Option B",
                "C": "Option C",
                "D": "Option D",
            },
            correct_answer=["A"],
            difficulty=None,
            created_by=self.user,
        )

        self.assertIsNone(question.difficulty)

        # Test API creation
        response = self.client.post(
            reverse("question-detail"),
            {
                "bank": self.bank.id,
                "prompt": "API test question with no difficulty",
                "choices": {
                    "A": "Option A",
                    "B": "Option B",
                    "C": "Option C",
                    "D": "Option D",
                },
                "correct_answer": ["A"],
                "difficulty": None,
                "created_by": self.user.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertIsNone(response.data.get("difficulty"))

        # Verify the question was saved with null difficulty
        saved_question = Question.objects.get(id=response.data["id"])
        self.assertIsNone(saved_question.difficulty)
