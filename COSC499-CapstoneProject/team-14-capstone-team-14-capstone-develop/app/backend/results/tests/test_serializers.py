from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile

# results/tests/test_serializers.py
from django.test import TestCase

from courses.models import Course, Student
from exams.models import Exam, Variant
from results.models import ExamResult, OMRImportSession
from results.serializers import (
    ExamResultSerializer,
    OMRImportSerializer,
    OMRImportSessionSerializer,
    OMRValidationResultSerializer,
)

User = get_user_model()


class ExamResultSerializerTests(TestCase):
    def setUp(self):
        # Create test data
        self.user = User.objects.create_user(
            email="test@example.com", name="Test User", password="testpass"
        )
        self.course = Course.objects.create(
            code="TEST101", name="Test Course", creator=self.user
        )
        self.student = Student.objects.create(
            course=self.course, student_id="S12345", name="Test Student", is_active=True
        )
        self.exam = Exam.objects.create(
            title="Test Exam", course=self.course, created_by=self.user
        )
        self.variant = Variant.objects.create(exam=self.exam, version_label="A")

    def test_percentage_score_calculation(self):
        """Test percentage score calculation with different scenarios"""
        # Test with zero total questions
        result1 = ExamResult.objects.create(
            exam=self.exam,
            variant=self.variant,
            student=self.student,
            raw_responses={},
            score=0.0,  # 0 score for 0 questions
            total_questions=0,
            correct_answers=0,
            incorrect_answers=0,
            unanswered=0,
        )
        serializer1 = ExamResultSerializer(result1)
        self.assertEqual(serializer1.data["percentage_score"], "0.00")

        # Test with partial score
        result2 = ExamResult.objects.create(
            exam=self.exam,
            variant=self.variant,
            student=self.student,
            raw_responses={},
            score=75.0,  # 3/4 questions = 75%
            total_questions=4,
            correct_answers=3,
            incorrect_answers=1,
            unanswered=0,
        )
        serializer2 = ExamResultSerializer(result2)
        self.assertEqual(serializer2.data["percentage_score"], "75.00")

    def test_missing_required_fields(self):
        """Test validation with missing required fields"""
        # Missing student
        data = {"exam": self.exam.id, "variant": self.variant.id, "raw_responses": {}}
        serializer = ExamResultSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("student", serializer.errors)

        # Missing raw_responses
        data = {
            "exam": self.exam.id,
            "variant": self.variant.id,
            "student": self.student.id,
        }
        serializer = ExamResultSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("raw_responses", serializer.errors)


class OMRImportSerializerTests(TestCase):
    def test_valid_csv_file(self):
        """Test validation with valid CSV file"""
        csv_content = b"student_id,variant_code,q1,q2\nS123,A,A,B\n"
        file = SimpleUploadedFile("test.csv", csv_content, content_type="text/csv")

        data = {"file": file, "format": "csv"}

        serializer = OMRImportSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data["format"], "csv")

    def test_valid_txt_file(self):
        """Test validation with valid TXT file"""
        txt_content = b"STUDENT_ID: S123\nVARIANT: A\n1. A\n2. B\n"
        file = SimpleUploadedFile("test.txt", txt_content, content_type="text/plain")

        data = {"file": file, "format": "txt"}

        serializer = OMRImportSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data["format"], "txt")

    def test_invalid_format(self):
        """Test validation with invalid format"""
        file = SimpleUploadedFile(
            "test.pdf", b"content", content_type="application/pdf"
        )

        data = {"file": file, "format": "pdf"}  # Invalid format

        serializer = OMRImportSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("format", serializer.errors)

    def test_missing_file(self):
        """Test validation without file"""
        data = {"format": "csv"}

        serializer = OMRImportSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("file", serializer.errors)


class OMRValidationResultSerializerTests(TestCase):
    def test_validation_result_serialization(self):
        """Test serializing validation results"""
        data = {
            "valid": True,
            "total_records": 10,
            "valid_records": 8,
            "errors": [
                {"row": 5, "message": "Invalid student ID"},
                {"row": 7, "message": "Missing variant"},
            ],
            "warnings": [{"row": 3, "message": "Duplicate entry"}],
            "preview": [
                {"student_id": "S001", "variant": "A", "responses": {"1": "A"}}
            ],
        }

        serializer = OMRValidationResultSerializer(data=data)
        self.assertTrue(serializer.is_valid())

        result = serializer.data
        self.assertEqual(result["valid"], True)
        self.assertEqual(result["total_records"], 10)
        self.assertEqual(result["valid_records"], 8)
        self.assertEqual(len(result["errors"]), 2)
        self.assertEqual(len(result["warnings"]), 1)
        self.assertEqual(len(result["preview"]), 1)

    def test_empty_validation_result(self):
        """Test validation with no records"""
        data = {
            "valid": True,
            "total_records": 0,
            "valid_records": 0,
            "errors": [],
            "warnings": [],
            "preview": [],
        }

        serializer = OMRValidationResultSerializer(data=data)
        self.assertTrue(serializer.is_valid())

        result = serializer.data
        self.assertEqual(result["total_records"], 0)
        self.assertEqual(len(result["errors"]), 0)


class OMRImportSessionSerializerTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="importer@example.com", name="Importer", password="testpass"
        )
        self.course = Course.objects.create(code="IMP101", name="Import Course")
        self.exam = Exam.objects.create(title="Import Test Exam", course=self.course)

    def test_import_session_serialization(self):
        """Test serializing an import session"""
        session = OMRImportSession.objects.create(
            exam=self.exam,
            imported_by=self.user,
            file_name="results.csv",
            file_format="csv",
            status="completed",
            total_records=100,
            successful_imports=95,
            failed_imports=5,
            validation_errors=[{"error": "test"}],
            import_errors=[],
            warnings=[{"warning": "test"}],
        )

        serializer = OMRImportSessionSerializer(session)
        data = serializer.data

        self.assertEqual(data["file_name"], "results.csv")
        self.assertEqual(data["file_format"], "csv")
        self.assertEqual(data["status"], "completed")
        self.assertEqual(data["total_records"], 100)
        self.assertEqual(data["successful_imports"], 95)
        self.assertEqual(data["failed_imports"], 5)
        self.assertEqual(len(data["validation_errors"]), 1)
        self.assertEqual(len(data["warnings"]), 1)

    def test_all_fields_serialization(self):
        """Test that all fields are included when using '__all__'"""
        session = OMRImportSession.objects.create(
            exam=self.exam,
            imported_by=self.user,
            file_name="complete.csv",
            file_format="csv",
        )

        serializer = OMRImportSessionSerializer(session)
        data = serializer.data

        # Check that all model fields are present
        expected_fields = [
            "id",
            "exam",
            "imported_by",
            "file_name",
            "file_format",
            "total_records",
            "successful_imports",
            "failed_imports",
            "status",
            "validation_errors",
            "import_errors",
            "warnings",
            "created_at",
            "completed_at",
        ]

        for field in expected_fields:
            self.assertIn(field, data)
