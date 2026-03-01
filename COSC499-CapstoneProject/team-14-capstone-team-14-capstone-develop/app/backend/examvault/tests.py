"""
Test Admin Global Settings API
=============================
Tests for the admin global settings functionality.
"""

import json

from django.contrib.auth import get_user_model
from django.test import Client, TestCase

from examvault.models import GlobalSetting

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
