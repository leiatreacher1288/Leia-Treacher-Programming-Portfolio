"""
Test adding questions to an exam, by creating a new question and by importing
from the question bank.
"""

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from courses.models import Course, CourseInstructor
from exams.models import Exam
from questions.models import QuestionBank

User = get_user_model()


class ExamAddQuestions(TestCase):
    """Create an exam and add questions"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="t1@example.com", password="Password1234", name="Test User"
        )
        self.client.force_authenticate(user=self.user)
        self.course = Course.objects.create(
            name="Course1", code="Course-101", term="Fall 2024"
        )
        self.bank = QuestionBank.objects.create(
            title="TestBank", description="Test question bank", course=self.course
        )

        self.exam = Exam.objects.create(
            title="Test Exam",
            course=self.course,
            easy_percentage=0,
            medium_percentage=0,
            hard_percentage=0,
            questions_per_variant=2,
            num_variants=1,
            created_by=self.user,
        )

        # Add user as instructor to the course so they can access the exam
        CourseInstructor.objects.create(
            course=self.course, user=self.user, accepted=True
        )

    def test_adding_new_question_to_exam(self):
        """Test adding a new question to the exam"""

        """Test adding a new question to the exam"""
        data = {
            "bank": self.bank.id,
            "prompt": "What is 1 + 1?",
            "choices": {"A": "1", "B": "2", "C": "3", "D": "4"},
            "correct_answer": ["B"],
            "difficulty": 2,
            "tags": ["math", "easy"],
            "explanation": "1+1=2",
        }
        # Create a question first
        resp_question = self.client.post(
            "/api/questions/question/", data, format="json"
        )
        self.assertEqual(resp_question.status_code, 201)

        # add the question to exam.
        # examAPI passes the question_ids as a number[]
        data = {
            "question_ids": [resp_question.data["id"]],
        }
        self.add_question_url = "/api/exams/{}/add_questions/"
        resp_exam = self.client.post(
            self.add_question_url.format(self.exam.pk), data, format="json"
        )
        self.assertEqual(resp_exam.status_code, status.HTTP_200_OK)
        # check if the one question is added to exam
        self.assertEqual(
            self.exam.questions.values("id")[0]["id"], resp_question.data["id"]
        )

    def test_removing_question_from_exam(self):
        """Test removing a question from the exam"""
        data = {
            "bank": self.bank.id,
            "prompt": "What is 1 + 1?",
            "choices": {"A": "1", "B": "2", "C": "3", "D": "4"},
            "correct_answer": ["B"],
            "difficulty": 2,
            "tags": ["math", "easy"],
            "explanation": "1+1=2",
        }
        # Create a question first
        resp_question = self.client.post(
            "/api/questions/question/", data, format="json"
        )
        self.assertEqual(resp_question.status_code, 201)

        # add the question to exam.
        # examAPI passes the question_ids as a number[]
        data = {
            "question_ids": [resp_question.data["id"]],
        }
        self.add_question_url = "/api/exams/{}/add_questions/"
        resp_exam = self.client.post(
            self.add_question_url.format(self.exam.pk), data, format="json"
        )
        self.assertEqual(resp_exam.status_code, status.HTTP_200_OK)
        # check if the one question is added to exam
        self.assertEqual(
            self.exam.questions.values("id")[0]["id"], resp_question.data["id"]
        )

        # now lets delete the question from the exam
        self.remove_question_url = "/api/exams/{}/remove_questions/"
        resp_exam = self.client.post(
            self.remove_question_url.format(self.exam.pk), data, format="json"
        )
        self.assertEqual(resp_exam.status_code, status.HTTP_200_OK)

        # check if there are no questions in the exam
        self.assertEqual(self.exam.questions.count(), 0)

    def test_adding_bulk_questions_to_exam(self):
        """Test adding bulk questions to the exam"""

        """Test adding bulk questions to the exam"""
        data = {
            "bank": self.bank.id,
            "prompt": "What is 1 + 1?",
            "choices": {"A": "1", "B": "2", "C": "3", "D": "4"},
            "correct_answer": ["B"],
            "difficulty": 2,
            "tags": ["math", "easy"],
            "explanation": "1+1=2",
        }
        # Create the first question
        resp_question1 = self.client.post(
            "/api/questions/question/", data, format="json"
        )
        self.assertEqual(resp_question1.status_code, 201)

        data = {
            "bank": self.bank.id,
            "prompt": "What is 2 + 2?",
            "choices": {"A": "1", "B": "2", "C": "3", "D": "4"},
            "correct_answer": ["D"],
            "difficulty": 2,
            "tags": ["math", "easy"],
            "explanation": "2+2=4",
        }
        # Create the second question
        resp_question2 = self.client.post(
            "/api/questions/question/", data, format="json"
        )
        self.assertEqual(resp_question2.status_code, 201)

        # add the two question to exam.
        # examAPI passes the question_ids as a number[]
        data = {
            "question_ids": [resp_question1.data["id"], resp_question2.data["id"]],
        }
        self.add_question_url = "/api/exams/{}/add_questions/"
        resp_exam = self.client.post(
            self.add_question_url.format(self.exam.pk), data, format="json"
        )
        self.assertEqual(resp_exam.status_code, status.HTTP_200_OK)
        # check if the two questions are added to exam
        self.assertEqual(self.exam.questions.count(), 2)

    def test_removing_bulk_questions_from_exam(self):
        """Test removing bulk questions from exam"""
        data = {
            "bank": self.bank.id,
            "prompt": "What is 1 + 1?",
            "choices": {"A": "1", "B": "2", "C": "3", "D": "4"},
            "correct_answer": ["B"],
            "difficulty": 2,
            "tags": ["math", "easy"],
            "explanation": "1+1=2",
        }
        # Create the first question
        resp_question1 = self.client.post(
            "/api/questions/question/", data, format="json"
        )
        self.assertEqual(resp_question1.status_code, 201)

        data = {
            "bank": self.bank.id,
            "prompt": "What is 2 + 2?",
            "choices": {"A": "1", "B": "2", "C": "3", "D": "4"},
            "correct_answer": ["D"],
            "difficulty": 2,
            "tags": ["math", "easy"],
            "explanation": "2+2=4",
        }
        # Create the second question
        resp_question2 = self.client.post(
            "/api/questions/question/", data, format="json"
        )
        self.assertEqual(resp_question2.status_code, 201)

        # add the twoquestion to exam.
        # examAPI passes the question_ids as a number[]
        data = {
            "question_ids": [resp_question1.data["id"], resp_question2.data["id"]],
        }
        self.add_question_url = "/api/exams/{}/add_questions/"
        resp_exam = self.client.post(
            self.add_question_url.format(self.exam.pk), data, format="json"
        )
        self.assertEqual(resp_exam.status_code, status.HTTP_200_OK)

        # check if the two questions are added to exam
        self.assertEqual(self.exam.questions.count(), 2)

        # now lets remove the questions from the exam
        self.remove_question_url = "/api/exams/{}/remove_questions/"
        resp_exam = self.client.post(
            self.remove_question_url.format(self.exam.pk), data, format="json"
        )
        self.assertEqual(resp_exam.status_code, status.HTTP_200_OK)

        # check if there are no questions in the exam
        self.assertEqual(self.exam.questions.count(), 0)
