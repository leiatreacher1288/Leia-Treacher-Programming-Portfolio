#!/usr/bin/env python3
"""
Admin Global Settings Comprehensive Test Suite
==============================================
Complete tests for UR1.3: Global settings configuration (marking schemes, exam formats).

Coverage:
- UR1.3: Configure global settings (marking schemes, exam formats)
- Global settings CRUD operations
- Marking schemes management
- Exam formats management
- Settings validation and constraints

Usage:
    python manage.py test examvault.tests.test_admin_global_settings_comprehensive
"""

import json
import os

# Import test helpers
import sys

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status

from examvault.models import ExamFormat, GlobalSetting, MarkingScheme

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", "tests"))

try:
    from helpers import AdminTestAssertions as Assert
    from helpers.admin_test_base import AdminTestBase
except ImportError:
    # Fallback if helpers not available
    class AdminTestBase:
        def setUp(self):
            pass

    class Assert:
        @staticmethod
        def has_keys(data, keys):
            for key in keys:
                assert key in data, f"Key '{key}' not found in data"


User = get_user_model()


# ═══════════════════════════════════════════════════════════════
# GLOBAL SETTINGS TESTS (UR1.3)
# ═══════════════════════════════════════════════════════════════


class AdminGlobalSettingsTestCase(TestCase, AdminTestBase):
    """Test global settings configuration (UR1.3)"""

    def setUp(self):
        """Set up test data for global settings"""
        super().setUp()

        # Create admin user
        self.admin_user = User.objects.create_user(
            email="admin@test.com",
            name="Test Admin",
            password="admin123",
            role="admin",
            is_staff=True,
            is_superuser=True,
            is_active=True,
        )

        # Create instructor for permission testing
        self.instructor = User.objects.create_user(
            email="instructor@test.com",
            name="Test Instructor",
            password="testpass123",
            role="instructor",
            is_active=True,
        )

        # Create initial global setting
        self.global_setting = GlobalSetting.objects.create(
            key="default_exam_duration",
            setting_type="system-config",
            name="Default Exam Duration",
            description="Default exam duration in minutes",
            value={"duration_minutes": 60},
        )

    def test_global_settings_list_authentication_required(self):
        """Test that global settings list requires authentication"""
        response = self.client.get("/api/admin/settings/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_global_settings_list_admin_permission_required(self):
        """Test that global settings list requires admin permissions"""
        self.client.force_login(self.instructor)
        response = self.client.get("/api/admin/settings/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_global_settings_list_success(self):
        """Test successful global settings retrieval"""
        self.client.force_login(self.admin_user)
        response = self.client.get("/api/admin/settings/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Verify response structure
        Assert.has_keys(data, ["success", "settings"])
        self.assertTrue(data["success"])
        self.assertIsInstance(data["settings"], list)
        self.assertGreater(len(data["settings"]), 0)

        # Verify setting data structure
        setting = data["settings"][0]
        Assert.has_keys(setting, ["id", "setting_name", "setting_value", "description"])

    def test_global_settings_create(self):
        """Test creating new global settings"""
        self.client.force_login(self.admin_user)

        new_setting_data = {
            "setting_name": "max_questions_per_exam",
            "setting_value": "100",
            "description": "Maximum number of questions allowed per exam",
        }

        response = self.client.post(
            "/api/admin/settings/",
            data=json.dumps(new_setting_data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()

        # Verify creation response
        Assert.has_keys(data, ["success", "setting", "message"])
        self.assertTrue(data["success"])
        self.assertEqual(data["setting"]["setting_name"], "max_questions_per_exam")

        # Verify in database
        setting = GlobalSetting.objects.get(setting_name="max_questions_per_exam")
        self.assertEqual(setting.setting_value, "100")

    def test_global_settings_update(self):
        """Test updating existing global settings"""
        self.client.force_login(self.admin_user)

        update_data = {
            "setting_value": "90",
            "description": "Updated default exam duration",
        }

        response = self.client.put(
            f"/api/admin/settings/{self.global_setting.id}/",
            data=json.dumps(update_data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Verify update response
        Assert.has_keys(data, ["success", "setting", "message"])
        self.assertTrue(data["success"])
        self.assertEqual(data["setting"]["setting_value"], "90")

        # Verify in database
        self.global_setting.refresh_from_db()
        self.assertEqual(self.global_setting.setting_value, "90")

    def test_global_settings_delete(self):
        """Test deleting global settings"""
        self.client.force_login(self.admin_user)

        response = self.client.delete(f"/api/admin/settings/{self.global_setting.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Verify deletion response
        Assert.has_keys(data, ["success", "message"])
        self.assertTrue(data["success"])

        # Verify removed from database
        self.assertFalse(
            GlobalSetting.objects.filter(id=self.global_setting.id).exists()
        )


class AdminMarkingSchemesTestCase(TestCase, AdminTestBase):
    """Test marking schemes management (UR1.3)"""

    def setUp(self):
        """Set up test data for marking schemes"""
        super().setUp()

        # Create admin user
        self.admin_user = User.objects.create_user(
            email="admin@test.com",
            name="Test Admin",
            password="admin123",
            role="admin",
            is_staff=True,
            is_superuser=True,
            is_active=True,
        )

        # Create instructor for permission testing
        self.instructor = User.objects.create_user(
            email="instructor@test.com",
            name="Test Instructor",
            password="testpass123",
            role="instructor",
            is_active=True,
        )

        # Create initial marking scheme through GlobalSetting
        marking_global_setting = GlobalSetting.objects.create(
            key="standard_grading",
            setting_type="marking-scheme",
            name="Standard Grading",
            description="Standard percentage-based grading scheme",
            value={
                "grade_boundaries": {
                    "A+": {"min": 95, "max": 100},
                    "A": {"min": 90, "max": 94},
                    "A-": {"min": 85, "max": 89},
                    "B+": {"min": 80, "max": 84},
                    "B": {"min": 75, "max": 79},
                    "B-": {"min": 70, "max": 74},
                    "C+": {"min": 65, "max": 69},
                    "C": {"min": 60, "max": 64},
                    "C-": {"min": 55, "max": 59},
                    "D": {"min": 50, "max": 54},
                    "F": {"min": 0, "max": 49},
                },
                "pass_threshold": 50,
            },
        )
        self.marking_scheme = MarkingScheme.objects.create(
            global_setting=marking_global_setting
        )

    def test_marking_schemes_list_authentication_required(self):
        """Test that marking schemes list requires authentication"""
        response = self.client.get("/api/admin/settings/marking-schemes/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_marking_schemes_list_admin_permission_required(self):
        """Test that marking schemes list requires admin permissions"""
        self.client.force_login(self.instructor)
        response = self.client.get("/api/admin/settings/marking-schemes/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_marking_schemes_list_success(self):
        """Test successful marking schemes retrieval"""
        self.client.force_login(self.admin_user)
        response = self.client.get("/api/admin/settings/marking-schemes/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Verify response structure
        Assert.has_keys(data, ["success", "marking_schemes"])
        self.assertTrue(data["success"])
        self.assertIsInstance(data["marking_schemes"], list)
        self.assertEqual(len(data["marking_schemes"]), 1)

        # Verify marking scheme data structure
        scheme = data["marking_schemes"][0]
        Assert.has_keys(
            scheme, ["id", "name", "description", "scheme_data", "is_default"]
        )

    def test_marking_schemes_create(self):
        """Test creating new marking schemes"""
        self.client.force_login(self.admin_user)

        new_scheme_data = {
            "name": "Pass/Fail Grading",
            "description": "Simple pass/fail grading scheme",
            "scheme_data": {
                "Pass": {"min": 50, "max": 100},
                "Fail": {"min": 0, "max": 49},
            },
            "is_default": False,
        }

        response = self.client.post(
            "/api/admin/settings/marking-schemes/",
            data=json.dumps(new_scheme_data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()

        # Verify creation response
        Assert.has_keys(data, ["success", "marking_scheme", "message"])
        self.assertTrue(data["success"])
        self.assertEqual(data["marking_scheme"]["name"], "Pass/Fail Grading")

        # Verify in database
        scheme = MarkingScheme.objects.get(name="Pass/Fail Grading")
        self.assertEqual(len(scheme.scheme_data), 2)

    def test_marking_schemes_update(self):
        """Test updating existing marking schemes"""
        self.client.force_login(self.admin_user)

        update_data = {
            "description": "Updated standard grading scheme",
            "scheme_data": {
                "A": {"min": 90, "max": 100},
                "B": {"min": 80, "max": 89},
                "C": {"min": 70, "max": 79},
                "D": {"min": 60, "max": 69},
                "F": {"min": 0, "max": 59},
            },
        }

        response = self.client.put(
            f"/api/admin/settings/marking-schemes/{self.marking_scheme.id}/",
            data=json.dumps(update_data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Verify update response
        Assert.has_keys(data, ["success", "marking_scheme", "message"])
        self.assertTrue(data["success"])
        self.assertEqual(len(data["marking_scheme"]["scheme_data"]), 5)

        # Verify in database
        self.marking_scheme.refresh_from_db()
        self.assertEqual(len(self.marking_scheme.scheme_data), 5)

    def test_marking_schemes_delete(self):
        """Test deleting marking schemes"""
        self.client.force_login(self.admin_user)

        response = self.client.delete(
            f"/api/admin/settings/marking-schemes/{self.marking_scheme.id}/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Verify deletion response
        Assert.has_keys(data, ["success", "message"])
        self.assertTrue(data["success"])

        # Verify removed from database
        self.assertFalse(
            MarkingScheme.objects.filter(id=self.marking_scheme.id).exists()
        )

    def test_marking_schemes_validation(self):
        """Test marking scheme data validation"""
        self.client.force_login(self.admin_user)

        # Test invalid scheme data (overlapping ranges)
        invalid_scheme_data = {
            "name": "Invalid Scheme",
            "description": "Invalid overlapping scheme",
            "scheme_data": {
                "A": {"min": 90, "max": 100},
                "B": {"min": 85, "max": 95},  # Overlaps with A
            },
        }

        response = self.client.post(
            "/api/admin/settings/marking-schemes/",
            data=json.dumps(invalid_scheme_data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        data = response.json()
        self.assertFalse(data["success"])
        self.assertIn("error", data)


class AdminExamFormatsTestCase(TestCase, AdminTestBase):
    """Test exam formats management (UR1.3)"""

    def setUp(self):
        """Set up test data for exam formats"""
        super().setUp()

        # Create admin user
        self.admin_user = User.objects.create_user(
            email="admin@test.com",
            name="Test Admin",
            password="admin123",
            role="admin",
            is_staff=True,
            is_superuser=True,
            is_active=True,
        )

        # Create instructor for permission testing
        self.instructor = User.objects.create_user(
            email="instructor@test.com",
            name="Test Instructor",
            password="testpass123",
            role="instructor",
            is_active=True,
        )

        # Create initial exam format through GlobalSetting
        exam_format_global_setting = GlobalSetting.objects.create(
            key="multiple_choice_format",
            setting_type="exam-format",
            name="Multiple Choice",
            description="Standard multiple choice format",
            value={
                "question_types": ["multiple_choice"],
                "options_per_question": 4,
                "randomize_options": True,
                "allow_partial_credit": False,
                "time_per_question": 2,
                "exam_structure": {
                    "sections": [
                        {"name": "Main Section", "questions": 20, "time_limit": 40}
                    ]
                },
            },
        )
        self.exam_format = ExamFormat.objects.create(
            global_setting=exam_format_global_setting
        )

    def test_exam_formats_list_authentication_required(self):
        """Test that exam formats list requires authentication"""
        response = self.client.get("/api/admin/settings/exam-formats/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_exam_formats_list_admin_permission_required(self):
        """Test that exam formats list requires admin permissions"""
        self.client.force_login(self.instructor)
        response = self.client.get("/api/admin/settings/exam-formats/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_exam_formats_list_success(self):
        """Test successful exam formats retrieval"""
        self.client.force_login(self.admin_user)
        response = self.client.get("/api/admin/settings/exam-formats/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Verify response structure
        Assert.has_keys(data, ["success", "exam_formats"])
        self.assertTrue(data["success"])
        self.assertIsInstance(data["exam_formats"], list)
        self.assertEqual(len(data["exam_formats"]), 1)

        # Verify exam format data structure
        format_data = data["exam_formats"][0]
        Assert.has_keys(
            format_data, ["id", "name", "description", "format_settings", "is_default"]
        )

    def test_exam_formats_create(self):
        """Test creating new exam formats"""
        self.client.force_login(self.admin_user)

        new_format_data = {
            "name": "Mixed Format",
            "description": "Mixed question types format",
            "format_settings": {
                "question_types": ["multiple_choice", "short_answer", "essay"],
                "options_per_question": 4,
                "randomize_options": True,
                "allow_partial_credit": True,
                "time_per_question": 5,
            },
            "is_default": False,
        }

        response = self.client.post(
            "/api/admin/settings/exam-formats/",
            data=json.dumps(new_format_data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()

        # Verify creation response
        Assert.has_keys(data, ["success", "exam_format", "message"])
        self.assertTrue(data["success"])
        self.assertEqual(data["exam_format"]["name"], "Mixed Format")

        # Verify in database
        format_obj = ExamFormat.objects.get(name="Mixed Format")
        self.assertEqual(len(format_obj.format_settings["question_types"]), 3)

    def test_exam_formats_update(self):
        """Test updating existing exam formats"""
        self.client.force_login(self.admin_user)

        update_data = {
            "description": "Updated multiple choice format",
            "format_settings": {
                "question_types": ["multiple_choice"],
                "options_per_question": 5,
                "randomize_options": True,
                "allow_partial_credit": True,
                "time_per_question": 3,
            },
        }

        response = self.client.put(
            f"/api/admin/settings/exam-formats/{self.exam_format.id}/",
            data=json.dumps(update_data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Verify update response
        Assert.has_keys(data, ["success", "exam_format", "message"])
        self.assertTrue(data["success"])
        self.assertEqual(
            data["exam_format"]["format_settings"]["options_per_question"], 5
        )

        # Verify in database
        self.exam_format.refresh_from_db()
        self.assertEqual(
            self.exam_format.global_setting.value["options_per_question"], 5
        )

    def test_exam_formats_delete(self):
        """Test deleting exam formats"""
        self.client.force_login(self.admin_user)

        response = self.client.delete(
            f"/api/admin/settings/exam-formats/{self.exam_format.id}/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Verify deletion response
        Assert.has_keys(data, ["success", "message"])
        self.assertTrue(data["success"])

        # Verify removed from database
        self.assertFalse(ExamFormat.objects.filter(id=self.exam_format.id).exists())

        response = self.client.delete(
            f"/api/admin/settings/exam-formats/{self.exam_format.id}/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Verify deletion response
        Assert.has_keys(data, ["success", "message"])
        self.assertTrue(data["success"])

        # Verify removed from database
        self.assertFalse(ExamFormat.objects.filter(id=self.exam_format.id).exists())


# ═══════════════════════════════════════════════════════════════
# GLOBAL SETTINGS INTEGRATION TESTS
# ═══════════════════════════════════════════════════════════════


class GlobalSettingsIntegrationTestCase(TestCase, AdminTestBase):
    """Test global settings integration across the system"""

    def setUp(self):
        """Set up comprehensive test data"""
        super().setUp()

        # Create admin user
        self.admin_user = User.objects.create_user(
            email="admin@test.com",
            name="Test Admin",
            password="admin123",
            role="admin",
            is_staff=True,
            is_superuser=True,
            is_active=True,
        )

        # Create global settings
        self.global_settings = [
            GlobalSetting.objects.create(
                key="default_exam_duration",
                setting_type="system-config",
                name="Default Exam Duration",
                value={"duration_minutes": 60},
                description="Default exam duration in minutes",
            ),
            GlobalSetting.objects.create(
                key="max_questions_per_exam",
                setting_type="system-config",
                name="Max Questions Per Exam",
                value={"max_questions": 100},
                description="Maximum questions per exam",
            ),
        ]

        # Create marking scheme through GlobalSetting
        marking_global_setting = GlobalSetting.objects.create(
            key="university_standard",
            setting_type="marking-scheme",
            name="University Standard",
            description="University standard grading",
            value={
                "grade_boundaries": {
                    "A": {"min": 90, "max": 100},
                    "B": {"min": 80, "max": 89},
                    "C": {"min": 70, "max": 79},
                    "D": {"min": 60, "max": 69},
                    "F": {"min": 0, "max": 59},
                },
                "pass_threshold": 60,
            },
            is_default=True,
        )
        self.marking_scheme = MarkingScheme.objects.create(
            global_setting=marking_global_setting
        )

        # Create exam format through GlobalSetting
        exam_format_global_setting = GlobalSetting.objects.create(
            key="standard_format",
            setting_type="exam-format",
            name="Standard Format",
            description="Standard exam format",
            value={
                "question_types": ["multiple_choice", "short_answer"],
                "options_per_question": 4,
                "randomize_options": True,
                "allow_partial_credit": True,
                "exam_structure": {
                    "sections": [
                        {"name": "Main Section", "questions": 25, "time_limit": 60}
                    ]
                },
            },
            is_default=True,
        )
        self.exam_format = ExamFormat.objects.create(
            global_setting=exam_format_global_setting
        )

    def test_global_settings_complete_workflow(self):
        """Test complete global settings management workflow"""
        self.client.force_login(self.admin_user)

        # 1. List all global settings
        response = self.client.get("/api/admin/settings/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data["settings"]), 2)

        # 2. List all marking schemes
        response = self.client.get("/api/admin/settings/marking-schemes/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data["marking_schemes"]), 1)
        self.assertTrue(data["marking_schemes"][0]["is_default"])

        # 3. List all exam formats
        response = self.client.get("/api/admin/settings/exam-formats/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data["exam_formats"]), 1)
        self.assertTrue(data["exam_formats"][0]["is_default"])

    def test_default_settings_enforcement(self):
        """Test that only one default can exist per type"""
        self.client.force_login(self.admin_user)

        # Try to create another default marking scheme
        new_default_scheme = {
            "name": "New Default",
            "description": "New default scheme",
            "scheme_data": {
                "Pass": {"min": 50, "max": 100},
                "Fail": {"min": 0, "max": 49},
            },
            "is_default": True,
        }

        response = self.client.post(
            "/api/admin/settings/marking-schemes/",
            data=json.dumps(new_default_scheme),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify old default is no longer default
        self.marking_scheme.refresh_from_db()
        self.assertFalse(self.marking_scheme.is_default)

        # Verify new scheme is now default
        new_scheme = MarkingScheme.objects.get(name="New Default")
        self.assertTrue(new_scheme.is_default)
