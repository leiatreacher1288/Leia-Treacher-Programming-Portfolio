"""
Tests for exam editing functionality at both model and API levels.
Covers: PATCH /api/exams/{id}/, model updates, and validation during updates.
"""

from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from courses.models import Course, CourseInstructor
from exams.models import Exam
from exams.serializers import ExamCreateSerializer as ExamSerializer

User = get_user_model()


class ExamEditModelTests(TestCase):
    """Test exam editing at the model level"""

    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com", password="testpass123", name="Test User"
        )
        self.course = Course.objects.create(
            name="Test Course", code="TEST101", term="Fall 2024"
        )
        self.exam = Exam.objects.create(
            title="Original Exam",
            course=self.course,
            exam_type="midterm",
            time_limit=90,
            weight=25,
            required_to_pass=True,
            description="Original description",
            easy_percentage=30,
            medium_percentage=50,
            hard_percentage=20,
            questions_per_variant=10,
            num_variants=2,
            created_by=self.user,
        )

    def test_update_exam_basic_fields(self):
        """Test updating basic exam fields"""
        self.exam.title = "Updated Exam Title"
        self.exam.description = "Updated description"
        self.exam.exam_type = "final"
        self.exam.save()

        self.exam.refresh_from_db()
        self.assertEqual(self.exam.title, "Updated Exam Title")
        self.assertEqual(self.exam.description, "Updated description")
        self.assertEqual(self.exam.exam_type, "final")

    def test_update_exam_weight(self):
        """Test updating exam weight"""
        self.exam.weight = Decimal("40.00")
        self.exam.save()

        self.exam.refresh_from_db()
        self.assertEqual(self.exam.weight, Decimal("40.00"))

    def test_update_exam_time_limit(self):
        """Test updating exam time limit"""
        # Test regular time limit
        self.exam.time_limit = 180
        self.exam.save()

        self.exam.refresh_from_db()
        self.assertEqual(self.exam.time_limit, 180)

        # Test unlimited (0)
        self.exam.time_limit = 0
        self.exam.save()

        self.exam.refresh_from_db()
        self.assertEqual(self.exam.time_limit, 0)

    def test_update_exam_required_to_pass(self):
        """Test updating required_to_pass flag"""
        self.exam.required_to_pass = False
        self.exam.save()

        self.exam.refresh_from_db()
        self.assertFalse(self.exam.required_to_pass)

    def test_update_exam_course(self):
        """Test updating exam course"""
        new_course = Course.objects.create(
            name="New Course", code="TEST102", term="Fall 2024"
        )

        self.exam.course = new_course
        self.exam.save()

        self.exam.refresh_from_db()
        self.assertEqual(self.exam.course, new_course)

    def test_partial_update_preserves_other_fields(self):
        """Test that partial updates don't affect other fields"""
        original_weight = self.exam.weight
        original_time_limit = self.exam.time_limit

        # Update only title
        self.exam.title = "New Title Only"
        self.exam.save()

        self.exam.refresh_from_db()
        self.assertEqual(self.exam.title, "New Title Only")
        self.assertEqual(self.exam.weight, original_weight)
        self.assertEqual(self.exam.time_limit, original_time_limit)


class ExamEditAPITests(APITestCase):
    """Test exam editing via API"""

    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com", password="testpass123", name="Test User"
        )
        self.course = Course.objects.create(
            name="Test Course", code="TEST101", term="Fall 2024"
        )
        # Create CourseInstructor relationship for API access
        CourseInstructor.objects.get_or_create(
            course=self.course, user=self.user, defaults={"accepted": True}
        )
        self.exam = Exam.objects.create(
            title="Original Exam",
            course=self.course,
            exam_type="midterm",
            time_limit=90,
            weight=25,
            required_to_pass=True,
            description="Original description",
            easy_percentage=30,
            medium_percentage=50,
            hard_percentage=20,
            questions_per_variant=10,
            num_variants=2,
            created_by=self.user,
        )
        self.client.force_authenticate(user=self.user)

    def test_patch_exam_basic_fields(self):
        """Test PATCH update of basic exam fields"""
        data = {
            "title": "Updated via API",
            "description": "New description",
            "exam_type": "final",
        }

        response = self.client.patch(f"/api/exams/{self.exam.id}/", data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Updated via API")
        self.assertEqual(response.data["description"], "New description")
        self.assertEqual(response.data["exam_type"], "final")

    def test_patch_exam_weight_and_time(self):
        """Test PATCH update of weight and time_limit"""
        data = {"weight": 40, "time_limit": 180}

        response = self.client.patch(f"/api/exams/{self.exam.id}/", data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["weight"], "40.00")
        self.assertEqual(response.data["time_limit"], 180)

    def test_patch_exam_zero_values(self):
        """Test PATCH with zero values for weight and time_limit"""
        data = {"weight": 0, "time_limit": 0}

        response = self.client.patch(f"/api/exams/{self.exam.id}/", data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["weight"], "0.00")
        self.assertEqual(response.data["time_limit"], 0)

    def test_patch_exam_required_to_pass(self):
        """Test PATCH update of required_to_pass boolean"""
        # Test with boolean
        data = {"required_to_pass": False}
        response = self.client.patch(f"/api/exams/{self.exam.id}/", data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["required_to_pass"])

        # Test with integer (frontend might send 0/1)
        data = {"required_to_pass": 1}
        response = self.client.patch(f"/api/exams/{self.exam.id}/", data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["required_to_pass"])

    def test_patch_exam_course_change(self):
        """Test PATCH update to change course"""
        new_course = Course.objects.create(
            name="New Course", code="TEST102", term="Fall 2024"
        )
        # Need CourseInstructor relationship for the new course too
        CourseInstructor.objects.get_or_create(
            course=new_course, user=self.user, defaults={"accepted": True}
        )

        data = {"course": new_course.id}
        response = self.client.patch(f"/api/exams/{self.exam.id}/", data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["course"], new_course.id)

    def test_patch_exam_validation_weight_over_100(self):
        """Test PATCH validation for weight > 100"""
        data = {"weight": 150}
        response = self.client.patch(f"/api/exams/{self.exam.id}/", data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("weight", response.data)

    def test_patch_exam_validation_negative_weight(self):
        """Test PATCH validation for negative weight"""
        data = {"weight": -10}
        response = self.client.patch(f"/api/exams/{self.exam.id}/", data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("weight", response.data)

    def test_patch_exam_validation_negative_time_limit(self):
        """Test PATCH validation for negative time_limit"""
        data = {"time_limit": -30}
        response = self.client.patch(f"/api/exams/{self.exam.id}/", data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("time_limit", response.data)

    def test_patch_exam_empty_description(self):
        """Test PATCH with empty description"""
        data = {"description": ""}
        response = self.client.patch(f"/api/exams/{self.exam.id}/", data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["description"], "")

    def test_patch_exam_whitespace_trimming(self):
        """Backend should trim leading/trailing whitespace on text fields"""
        data = {
            "title": "  Trimmed Title  ",
            "description": "  Trimmed description  ",
        }

        response = self.client.patch(f"/api/exams/{self.exam.id}/", data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Trimmed Title")
        self.assertEqual(response.data["description"], "Trimmed description")

    def test_patch_exam_partial_update(self):
        """
        PATCH should update only supplied fields and keep numeric fields
        (like weight) serialised with two-decimal precision.
        """
        original_weight = f"{self.exam.weight:.2f}"

        data = {"title": "Only Title Updated"}
        response = self.client.patch(f"/api/exams/{self.exam.id}/", data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Only Title Updated")
        self.assertEqual(response.data["weight"], original_weight)
        self.assertEqual(response.data["required_to_pass"], True)

    def test_patch_exam_not_found(self):
        """Test PATCH on non-existent exam"""
        data = {"title": "Updated"}
        response = self.client.patch("/api/exams/9999/", data)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_exam_unauthorized(self):
        """Test PATCH without authentication"""
        self.client.force_authenticate(user=None)

        data = {"title": "Updated"}
        response = self.client.patch(f"/api/exams/{self.exam.id}/", data)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_patch_exam_permission_denied(self):
        """Test PATCH by different user"""
        other_user = User.objects.create_user(
            email="other@example.com", password="otherpass123", name="Other User"
        )
        self.client.force_authenticate(user=other_user)

        data = {"title": "Updated"}
        response = self.client.patch(f"/api/exams/{self.exam.id}/", data)

        self.assertIn(
            response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]
        )

    def test_patch_exam_all_editable_fields(self):
        """Test PATCH with all fields that can be edited"""
        data = {
            "title": "Complete Update",
            "description": "All fields updated",
            "exam_type": "final",
            "time_limit": 240,
            "weight": 50,
            "required_to_pass": False,
            "course": self.course.id,
        }

        response = self.client.patch(f"/api/exams/{self.exam.id}/", data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Complete Update")
        self.assertEqual(response.data["description"], "All fields updated")
        self.assertEqual(response.data["exam_type"], "final")
        self.assertEqual(response.data["time_limit"], 240)
        self.assertEqual(response.data["weight"], "50.00")
        self.assertFalse(response.data["required_to_pass"])


class ExamEditSerializerTests(TestCase):
    """Test exam serializer for updates"""

    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com", password="testpass123", name="Test User"
        )
        self.course = Course.objects.create(
            name="Test Course", code="TEST101", term="Fall 2024"
        )
        self.exam = Exam.objects.create(
            title="Original Exam",
            course=self.course,
            exam_type="midterm",
            time_limit=90,
            weight=25,
            required_to_pass=True,
            created_by=self.user,
        )

    def test_serializer_partial_update(self):
        """Test serializer handles partial updates correctly"""
        data = {"title": "Updated Title Only"}
        serializer = ExamSerializer(self.exam, data=data, partial=True)

        self.assertTrue(serializer.is_valid())
        updated_exam = serializer.save()

        self.assertEqual(updated_exam.title, "Updated Title Only")
        self.assertEqual(updated_exam.weight, 25)

    def test_serializer_weight_validation(self):
        """Test serializer validates weight field"""
        # Over 100
        data = {"weight": 150}
        serializer = ExamSerializer(self.exam, data=data, partial=True)
        self.assertFalse(serializer.is_valid())
        self.assertIn("weight", serializer.errors)

        # Negative
        data = {"weight": -5}
        serializer = ExamSerializer(self.exam, data=data, partial=True)
        self.assertFalse(serializer.is_valid())
        self.assertIn("weight", serializer.errors)

        # Valid
        data = {"weight": 75}
        serializer = ExamSerializer(self.exam, data=data, partial=True)
        self.assertTrue(serializer.is_valid())

    def test_serializer_boolean_coercion(self):
        """Test serializer handles boolean/integer values for required_to_pass"""
        # Integer 0
        data = {"required_to_pass": 0}
        serializer = ExamSerializer(self.exam, data=data, partial=True)
        self.assertTrue(serializer.is_valid())
        self.assertFalse(serializer.validated_data["required_to_pass"])

        # Integer 1
        data = {"required_to_pass": 1}
        serializer = ExamSerializer(self.exam, data=data, partial=True)
        self.assertTrue(serializer.is_valid())
        self.assertTrue(serializer.validated_data["required_to_pass"])
