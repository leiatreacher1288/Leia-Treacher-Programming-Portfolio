"""
Test Admin Global Settings API
=============================
Tests for the admin global settings functionality (UR 1.3).
"""

import json

from django.contrib.auth import get_user_model
from django.test import Client, TestCase

from courses.models import Course
from examvault.models import ExamFormat, GlobalSetting, MarkingScheme

User = get_user_model()


class AdminGlobalSettingsTestCase(TestCase):
    """Test case for Admin Global Settings API"""

    def setUp(self):
        """Set up test data"""
        self.client = Client()

        # Create admin user
        self.admin_user = User.objects.create_user(
            email="admin@test.com",
            name="Test Admin",
            password="testpass123",
            role="admin",
            is_staff=True,
            is_superuser=True,
            is_active=True,
        )

        # Create test instructor
        self.instructor_user = User.objects.create_user(
            email="instructor@test.com",
            name="Test Instructor",
            password="testpass123",
            role="instructor",
            is_active=True,
        )

    def test_global_settings_endpoint_accessible(self):
        """Test that global settings endpoint is accessible to admin"""
        # Login as admin
        self.client.force_login(self.admin_user)

        response = self.client.get("/api/admin/settings/")
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertIn("success", data)
        self.assertTrue(data["success"])
        self.assertIn("settings", data)

    def test_marking_schemes_endpoint_accessible(self):
        """Test that marking schemes endpoint is accessible to admin"""
        # Login as admin
        self.client.force_login(self.admin_user)

        response = self.client.get("/api/admin/settings/marking-schemes/")
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertIn("success", data)
        self.assertTrue(data["success"])
        self.assertIn("marking_schemes", data)

    def test_exam_formats_endpoint_accessible(self):
        """Test that exam formats endpoint is accessible to admin"""
        # Login as admin
        self.client.force_login(self.admin_user)

        response = self.client.get("/api/admin/settings/exam-formats/")
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertIn("success", data)
        self.assertTrue(data["success"])
        self.assertIn("exam_formats", data)

    def test_courses_overview_endpoint_accessible(self):
        """Test that courses overview endpoint is accessible to admin"""
        # Login as admin
        self.client.force_login(self.admin_user)

        response = self.client.get("/api/admin/courses-overview/")
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertIn("success", data)
        self.assertTrue(data["success"])
        self.assertIn("courses", data)
        self.assertIn("statistics", data)

    def test_exams_overview_endpoint_accessible(self):
        """Test that exams overview endpoint is accessible to admin"""
        # Login as admin
        self.client.force_login(self.admin_user)

        response = self.client.get("/api/admin/exams-overview/")
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertIn("success", data)
        self.assertTrue(data["success"])
        self.assertIn("exams", data)
        self.assertIn("statistics", data)

    def test_non_admin_access_denied(self):
        """Test that non-admin users cannot access global settings"""
        # Login as instructor (non-admin)
        self.client.force_login(self.instructor_user)

        response = self.client.get("/api/admin/settings/")
        self.assertEqual(response.status_code, 403)

    def test_create_global_setting(self):
        """Test creating a new global setting"""
        # Login as admin
        self.client.force_login(self.admin_user)

        setting_data = {
            "key": "test-setting",
            "setting_type": "system-config",
            "name": "Test Setting",
            "description": "A test setting",
            "value": {"test_key": "test_value"},
            "is_active": True,
            "is_default": False,
        }

        response = self.client.post(
            "/api/admin/settings/",
            data=json.dumps(setting_data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("success", data)
        self.assertTrue(data["success"])

        # Verify setting was created
        setting = GlobalSetting.objects.get(key="test-setting")
        self.assertEqual(setting.name, "Test Setting")
        self.assertEqual(setting.created_by, self.admin_user)

    def test_global_setting_model_default_enforcement(self):
        """Test that only one default setting per type is allowed"""
        # Create first setting as default
        setting1 = GlobalSetting.objects.create(
            key="default-1",
            setting_type="marking-scheme",
            name="Default 1",
            value={},
            is_default=True,
            created_by=self.admin_user,
        )

        # Create second setting as default - should remove default from first
        setting2 = GlobalSetting.objects.create(
            key="default-2",
            setting_type="marking-scheme",
            name="Default 2",
            value={},
            is_default=True,
            created_by=self.admin_user,
        )

        # Refresh from database
        setting1.refresh_from_db()
        setting2.refresh_from_db()

        # Only the second setting should be default
        self.assertFalse(setting1.is_default)
        self.assertTrue(setting2.is_default)


class AdminCoursesOverviewTestCase(TestCase):
    """Test case for Admin Courses Overview functionality"""

    def setUp(self):
        """Set up test data"""
        self.client = Client()

        # Create admin user
        self.admin_user = User.objects.create_user(
            email="admin@test.com",
            name="Test Admin",
            password="testpass123",
            role="admin",
            is_staff=True,
            is_superuser=True,
            is_active=True,
        )

        # Create instructor user
        self.instructor_user = User.objects.create_user(
            email="instructor@test.com",
            name="Test Instructor",
            password="testpass123",
            role="instructor",
            is_active=True,
        )

        # Create test course
        self.course = Course.objects.create(
            code="CS101",
            name="Introduction to Computer Science",
            description="Basic CS concepts",
            term="2025W1",
            creator=self.instructor_user,
        )

    def test_courses_overview_shows_creator_info(self):
        """Test that courses overview shows creator information"""
        # Login as admin
        self.client.force_login(self.admin_user)

        response = self.client.get("/api/admin/courses-overview/")
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertTrue(data["success"])
        self.assertGreaterEqual(len(data["courses"]), 1)

        # Check that course has creator info
        course_data = data["courses"][0]
        self.assertIn("creator_name", course_data)
        self.assertIn("creator_email", course_data)
        self.assertEqual(course_data["creator_name"], self.instructor_user.name)
        self.assertEqual(course_data["creator_email"], self.instructor_user.email)

    def test_courses_overview_filtering(self):
        """Test courses overview filtering functionality"""
        # Login as admin
        self.client.force_login(self.admin_user)

        # Test search filtering
        response = self.client.get("/api/admin/courses-overview/?search=CS101")
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertTrue(data["success"])
        # Should find our CS101 course
        self.assertGreaterEqual(len(data["courses"]), 1)

        # Test creator filtering
        response = self.client.get(
            f"/api/admin/courses-overview/?creator={self.instructor_user.id}"
        )
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertTrue(data["success"])
        # Should find courses created by this instructor
        self.assertGreaterEqual(len(data["courses"]), 1)

    def test_courses_overview_statistics(self):
        """Test that courses overview includes statistics"""
        # Login as admin
        self.client.force_login(self.admin_user)

        response = self.client.get("/api/admin/courses-overview/")
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("statistics", data)

        stats = data["statistics"]
        self.assertIn("total_courses", stats)
        self.assertIn("active_courses", stats)
        self.assertIn("filtered_count", stats)
        self.assertGreaterEqual(stats["total_courses"], 1)


class AdminMarkingSchemesTestCase(TestCase):
    """Test case for Admin Marking Schemes functionality"""

    def setUp(self):
        """Set up test data"""
        self.client = Client()

        # Create admin user
        self.admin_user = User.objects.create_user(
            email="admin@test.com",
            name="Test Admin",
            password="testpass123",
            role="admin",
            is_staff=True,
            is_superuser=True,
            is_active=True,
        )

    def test_create_marking_scheme(self):
        """Test creating a new marking scheme"""
        # Login as admin
        self.client.force_login(self.admin_user)

        scheme_data = {
            "global_setting": {
                "name": "Standard Grading",
                "description": "Standard percentage-based grading",
                "is_default": True,
                "is_active": True,
            },
            "grade_boundaries": {
                "A+": 95,
                "A": 90,
                "A-": 85,
                "B+": 80,
                "B": 75,
                "B-": 70,
                "C+": 65,
                "C": 60,
                "C-": 55,
                "D": 50,
                "F": 0,
            },
            "negative_marking": {"enabled": False, "penalty_percentage": 0},
            "pass_threshold": 50.0,
            "weight_distribution": {"exam": 60, "assignments": 30, "participation": 10},
        }

        response = self.client.post(
            "/api/admin/settings/marking-schemes/",
            data=json.dumps(scheme_data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertTrue(data["success"])

        # Verify marking scheme was created
        scheme = MarkingScheme.objects.get(global_setting__name="Standard Grading")
        self.assertEqual(scheme.grade_boundaries["A"], 90)
        self.assertEqual(scheme.pass_threshold, 50.0)


class AdminExamFormatsTestCase(TestCase):
    """Test case for Admin Exam Formats functionality"""

    def setUp(self):
        """Set up test data"""
        self.client = Client()

        # Create admin user
        self.admin_user = User.objects.create_user(
            email="admin@test.com",
            name="Test Admin",
            password="testpass123",
            role="admin",
            is_staff=True,
            is_superuser=True,
            is_active=True,
        )

    def test_create_exam_format(self):
        """Test creating a new exam format"""
        # Login as admin
        self.client.force_login(self.admin_user)

        format_data = {
            "global_setting": {
                "name": "Standard 3-Hour Exam",
                "description": "Standard format for 3-hour comprehensive exams",
                "is_default": True,
                "is_active": True,
            },
            "sections": [
                {"name": "Multiple Choice", "question_count": 20, "points": 40},
                {"name": "Short Answer", "question_count": 5, "points": 30},
                {"name": "Essay", "question_count": 2, "points": 30},
            ],
            "time_limits": {"total_minutes": 180, "warning_minutes": 30},
            "question_distribution": {"easy": 40, "medium": 40, "hard": 20},
            "exam_structure": {
                "randomize_questions": True,
                "randomize_choices": True,
                "show_progress": True,
            },
        }

        response = self.client.post(
            "/api/admin/settings/exam-formats/",
            data=json.dumps(format_data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertTrue(data["success"])

        # Verify exam format was created
        format_obj = ExamFormat.objects.get(global_setting__name="Standard 3-Hour Exam")
        self.assertEqual(len(format_obj.sections), 3)
        self.assertEqual(format_obj.time_limits["total_minutes"], 180)
