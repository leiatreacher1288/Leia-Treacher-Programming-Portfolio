from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from courses.models import Course
from questions.models import Question, QuestionBank
from users.models import User


class QuestionAPITests(TestCase):

    def setUp(self):

        self.client = APIClient()
        self.user = User.objects.create_user(
            email="api@test.com", name="API User", password="123"
        )
        self.client.force_authenticate(user=self.user)
        self.course = Course.objects.create(code="CS101", name="CS", term="2025W1")
        self.course.instructors.add(self.user)
        self.bank = QuestionBank.objects.create(
            course=self.course, title="API Bank", created_by=self.user
        )
        self.url = reverse("question-detail")

    def test_create_question_with_and_without_difficulty(self):
        # With difficulty
        data = {
            "prompt": "What is 2+2?",
            "choices": {"A": "3", "B": "4", "C": "5", "D": "6"},
            "correct_answer": ["B"],
            "difficulty": 2,
            "tags": ["math", "easy"],
            "explanation": "2+2=4",
        }
        resp = self.client.post(self.url, data, format="json")
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["difficulty"], 2)
        self.assertEqual(resp.data["tags"], ["math", "easy"])
        # Without difficulty
        data2 = data.copy()
        data2["prompt"] = "What is 3+3?"
        data2.pop("difficulty")
        resp2 = self.client.post(self.url, data2, format="json")
        self.assertEqual(resp2.status_code, 201)
        self.assertIsNone(resp2.data["difficulty"])

    def test_update_question(self):
        # Create
        q = Question.objects.create(
            bank=self.bank,
            prompt="Old prompt?",
            choices={"A": "1", "B": "2", "C": "3", "D": "4"},
            correct_answer=["A"],
            difficulty=1,
            tags=["old"],
            created_by=self.user,
        )
        url = reverse("question-detail", args=[q.id])
        # Update
        resp = self.client.patch(
            url, {"prompt": "New?", "difficulty": 3, "tags": ["new"]}, format="json"
        )
        if resp.status_code != 200:
            print("Update failed with status {resp.status_code}: {resp.data}")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["prompt"], "New?")
        self.assertEqual(resp.data["difficulty"], 3)
        self.assertEqual(resp.data["tags"], ["new"])

    def test_delete_question(self):

        q = Question.objects.create(
            bank=self.bank,
            prompt="Delete?",
            choices={"A": "1", "B": "2", "C": "3", "D": "4"},
            correct_answer=["A"],
            created_by=self.user,
        )
        url = reverse("question-detail", args=[q.id])
        resp = self.client.delete(url)
        self.assertEqual(resp.status_code, 204)
        self.assertFalse(Question.objects.filter(id=q.id).exists())

    def test_retrieve_question_and_list(self):

        q = Question.objects.create(
            bank=self.bank,
            prompt="Retrieve?",
            choices={"A": "1", "B": "2", "C": "3", "D": "4"},
            correct_answer=["A"],
            created_by=self.user,
        )
        # Detail
        url = reverse("question-detail", args=[q.id])
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["prompt"], "Retrieve?")
        # List by bank
        url_list = reverse("question-list", args=[self.bank.id])
        resp2 = self.client.get(url_list)
        self.assertEqual(resp2.status_code, 200)
        self.assertTrue(any(item["prompt"] == "Retrieve?" for item in resp2.data))

    def test_tag_saving_and_retrieval(self):
        data = {
            "bank": self.bank.id,
            "prompt": "Tag test?",
            "choices": {"A": "1", "B": "2", "C": "3", "D": "4"},
            "correct_answer": ["A"],
            "tags": ["tag1", "tag2"],
        }
        resp = self.client.post(self.url, data, format="json")
        self.assertEqual(resp.status_code, 201)
        qid = resp.data["id"]
        q = Question.objects.get(id=qid)
        self.assertEqual(q.tags, ["tag1", "tag2"])

    def test_validation_too_few_options(self):
        data = {
            "bank": self.bank.id,
            "prompt": "Few options?",
            "choices": {"A": "1"},  # Changed to only 1 option
            "correct_answer": ["A"],
        }
        resp = self.client.post(self.url, data, format="json")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("choices", resp.data)

    def test_validation_invalid_keys(self):
        data = {
            "bank": self.bank.id,
            "prompt": "Invalid keys?",
            "choices": {"A": "1", "B": "2", "F": "3", "D": "4"},
            "correct_answer": ["A"],
        }
        resp = self.client.post(self.url, data, format="json")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("choices", resp.data)

    def test_validation_correct_answer_not_in_options(self):
        data = {
            "bank": self.bank.id,
            "prompt": "Wrong answer?",
            "choices": {"A": "1", "B": "2", "C": "3", "D": "4"},
            "correct_answer": ["E"],
        }
        resp = self.client.post(self.url, data, format="json")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("correct_answer", resp.data)
