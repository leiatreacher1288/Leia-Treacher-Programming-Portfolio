from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

# results/tests/test_models.py
from django.test import TestCase
from django.utils import timezone

from courses.models import Course, Student
from exams.models import Exam, Variant
from results.models import ExamResult, OMRImportSession

User = get_user_model()


class ExamResultModelTests(TestCase):
    def setUp(self):
        # create a user (custom User requires email & name)
        self.user = User.objects.create_user(
            email="u1@example.com", name="User One", password="pass"
        )
        # create a course and a student with real fields student_id & name
        self.course = Course.objects.create(code="C101", name="Course 101")
        self.student = Student.objects.create(
            course=self.course, student_id="S1", name="Student One", is_active=True
        )
        # exam + variant
        self.exam = Exam.objects.create(title="Test Exam", course=self.course)
        self.variant = Variant.objects.create(exam=self.exam, version_label="A")

    def test_percentage_score_zero_total(self):
        er = ExamResult.objects.create(
            exam=self.exam,
            variant=self.variant,
            student=self.student,
            raw_responses={},
            total_questions=0,
        )
        self.assertEqual(er.percentage_score, 0)

    def test_percentage_score_computation(self):
        er = ExamResult.objects.create(
            exam=self.exam,
            variant=self.variant,
            student=self.student,
            raw_responses={},
            score=40.0,  # Add this line - 2 correct out of 5 = 40%
            total_questions=5,
            correct_answers=2,
            incorrect_answers=3,  # Add this for completeness
            unanswered=0,  # Add this for completeness
        )
        self.assertAlmostEqual(er.percentage_score, 40.0)

    def test_str_method(self):
        er = ExamResult.objects.create(
            exam=self.exam,
            variant=self.variant,
            student=self.student,
            raw_responses={},
            total_questions=1,
            score=85,
        )
        expected = f"{self.student.display_name} - {self.exam.title} - {er.score}%"
        self.assertEqual(str(er), expected)

    def test_unique_together_constraint(self):
        # Create first result
        er1 = ExamResult.objects.create(
            exam=self.exam,
            variant=self.variant,
            student=self.student,
            raw_responses={},
            total_questions=1,
        )

        # Prepare a second instance with the same submitted_at
        er2 = ExamResult(
            exam=self.exam,
            variant=self.variant,
            student=self.student,
            raw_responses={},
            total_questions=1,
        )
        er2.submitted_at = er1.submitted_at

        # full_clean() should catch the unique_together violation
        with self.assertRaises(ValidationError):
            er2.full_clean()

    def test_default_fields_on_examresult(self):
        er = ExamResult.objects.create(
            exam=self.exam,
            variant=self.variant,
            student=self.student,
            raw_responses={},
            total_questions=1,
        )
        self.assertEqual(er.import_source, "manual")
        self.assertEqual(er.import_metadata, {})
        self.assertEqual(er.grading_details, {})
        self.assertEqual(er.correct_answers, 0)
        self.assertIsNone(er.imported_by)

    def test_invalid_import_source_raises(self):
        er = ExamResult(
            exam=self.exam,
            variant=self.variant,
            student=self.student,
            raw_responses={},
            total_questions=1,
            import_source="not_a_choice",
        )
        with self.assertRaises(ValidationError):
            er.full_clean()

    def test_examresult_ordering_newest_first(self):
        older = ExamResult.objects.create(
            exam=self.exam,
            variant=self.variant,
            student=self.student,
            raw_responses={},
            total_questions=1,
        )
        older.submitted_at = timezone.now() - timedelta(days=1)
        older.save(update_fields=["submitted_at"])

        newer = ExamResult.objects.create(
            exam=self.exam,
            variant=self.variant,
            student=self.student,
            raw_responses={},
            total_questions=1,
        )

        qs = list(ExamResult.objects.all())
        self.assertEqual(qs, [newer, older])


class OMRImportSessionModelTests(TestCase):
    def setUp(self):
        # same fix here for the importing user
        self.user = User.objects.create_user(
            email="u2@example.com", name="User Two", password="pass"
        )
        self.course = Course.objects.create(code="C102", name="Course 102")
        self.exam = Exam.objects.create(title="Import Exam", course=self.course)

    def test_defaults_and_str(self):
        sess = OMRImportSession.objects.create(
            exam=self.exam,
            imported_by=self.user,
            file_name="data.csv",
            file_format="csv",
        )
        self.assertEqual(sess.total_records, 0)
        self.assertEqual(sess.successful_imports, 0)
        self.assertEqual(sess.failed_imports, 0)
        self.assertEqual(sess.status, "pending")
        expected = f"OMR Import for {self.exam.title} - {sess.status}"
        self.assertEqual(str(sess), expected)

    def test_default_json_fields_on_import_session(self):
        sess = OMRImportSession.objects.create(
            exam=self.exam,
            imported_by=self.user,
            file_name="foo.txt",
            file_format="txt",
        )
        self.assertEqual(sess.validation_errors, [])
        self.assertEqual(sess.import_errors, [])
        self.assertEqual(sess.warnings, [])

    def test_invalid_file_format_raises(self):
        sess = OMRImportSession(
            exam=self.exam,
            imported_by=self.user,
            file_name="bar.bin",
            file_format="badfmt",
        )
        with self.assertRaises(ValidationError):
            sess.full_clean()

    def test_default_completed_at_is_none(self):
        sess = OMRImportSession.objects.create(
            exam=self.exam,
            imported_by=self.user,
            file_name="test.csv",
            file_format="csv",
        )
        self.assertIsNone(sess.completed_at)

    def test_invalid_status_raises(self):
        sess = OMRImportSession(
            exam=self.exam,
            imported_by=self.user,
            file_name="foo.csv",
            file_format="csv",
            status="nope",
        )
        with self.assertRaises(ValidationError):
            sess.full_clean()

    def test_importsession_ordering_newest_first(self):
        old = OMRImportSession.objects.create(
            exam=self.exam, imported_by=self.user, file_name="a.csv", file_format="csv"
        )
        old.created_at = timezone.now() - timedelta(days=1)
        old.save(update_fields=["created_at"])

        new = OMRImportSession.objects.create(
            exam=self.exam, imported_by=self.user, file_name="b.csv", file_format="csv"
        )

        qs = list(OMRImportSession.objects.all())
        self.assertEqual(qs, [new, old])
