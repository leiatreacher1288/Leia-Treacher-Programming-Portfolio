import io
import zipfile

from django.contrib.auth import get_user_model
from django.urls import reverse
from docx import Document
from rest_framework import status
from rest_framework.test import APITestCase

from courses.models import Course, CourseInstructor
from exams.models import Exam, Variant, VariantQuestion
from questions.models import Question, QuestionBank


class ExportDocxTest(APITestCase):
    def setUp(self):
        # ---------- user ----------
        User = get_user_model()
        self.user = User.objects.create_user(
            email="test@example.com",
            name="Test User",
            password="password123",
        )
        self.client.force_authenticate(self.user)

        # ---------- course & bank ----------
        self.course = Course.objects.create(
            code="TEST101",
            name="Test Course",
            term="Test Term",
        )

        # Add user as instructor for the course
        CourseInstructor.objects.create(
            course=self.course,
            user=self.user,
            role=CourseInstructor.Role.MAIN,
            access=CourseInstructor.Access.FULL,
            accepted=True,
        )

        bank = QuestionBank.objects.create(  # use `title`, not `name`
            course=self.course,
            title="Default Bank",
        )

        # ---------- questions ----------
        self.questions = []
        for i in range(5):
            q = Question.objects.create(
                bank=bank,
                prompt=f"What is {i} + {i}?",
                choices={"A": str(i + i), "B": "wrong", "C": "wrong"},
                correct_answer=["A"],
            )
            self.questions.append(q)

        # ---------- exam & variants ----------
        self.exam = Exam.objects.create(  # must set `created_by`
            title="Sample Exam",
            course=self.course,
            created_by=self.user,
        )

        # Variant A – first three questions
        self.variant1 = Variant.objects.create(
            exam=self.exam,
            version_label="A",
        )
        for order, q in enumerate(self.questions[:3]):
            VariantQuestion.objects.create(
                variant=self.variant1,
                question=q,
                order=order,
            )

        # Variant B – last three questions
        self.variant2 = Variant.objects.create(
            exam=self.exam,
            version_label="B",
        )
        for order, q in enumerate(self.questions[2:]):
            VariantQuestion.objects.create(
                variant=self.variant2,
                question=q,
                order=order,
            )

    # ------------------------------------------------------------------ tests

    def test_export_single_variant_docx(self):
        """POST with one variant_id should return a single .docx"""
        url = reverse("exam-export-docx", kwargs={"pk": self.exam.pk})
        resp = self.client.post(
            url,
            {"variant_ids": [self.variant1.id]},
            format="json",
        )

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(
            resp["Content-Type"],
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
        self.assertTrue(resp["Content-Disposition"].endswith('.docx"'))

        # Open the returned file as a real DOCX
        doc = Document(io.BytesIO(resp.content))
        full_text = "\n".join(p.text for p in doc.paragraphs)
        self.assertIn("Variant A", full_text)

    def test_export_all_variants_zip(self):
        """POST with no variant_ids should return a ZIP of docx+csv"""
        url = reverse("exam-export-docx", kwargs={"pk": self.exam.pk})
        resp = self.client.post(url, {}, format="json")

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp["Content-Type"], "application/zip")

        z = zipfile.ZipFile(io.BytesIO(resp.content))
        names = z.namelist()

        # Both variants' DOCX and CSV answer keys should be present
        for label in ("A", "B"):
            self.assertIn(f"{self.exam.title}_Variant_{label}.docx", names)
            self.assertIn(f"{self.exam.title}_Variant_{label}_AnswerKey.csv", names)
