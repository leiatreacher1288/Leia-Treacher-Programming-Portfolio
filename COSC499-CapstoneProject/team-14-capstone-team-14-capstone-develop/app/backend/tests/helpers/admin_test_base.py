"""
Admin Test Base Classes
=====================
Common base setup and utilities for admin testing.
"""

import json
import logging

from django.contrib.auth import get_user_model
from django.test import Client
from rest_framework.test import APIClient

from examvault.models import ExamFormat, GlobalSetting, MarkingScheme

User = get_user_model()
logger = logging.getLogger(__name__)


class AdminTestBase:
    """Base mixin with common admin test setup and utilities"""

    def setUp(self):
        """Set up test data for admin functionality"""
        self.client = Client()
        self.api_client = APIClient()

        # Create test users
        self.admin_user = self._create_admin_user()
        self.active_instructor = self._create_instructor_user(
            "instructor@test.com", True
        )
        self.pending_instructor = self._create_instructor_user(
            "pending@test.com", False
        )
        self.regular_user = self._create_regular_user()

    def _create_admin_user(self):
        """Create admin user for testing"""
        return User.objects.create_user(
            email="admin@test.com",
            name="Test Admin",
            password="SecureAdminPass123!",
            role="admin",
            is_staff=True,
            is_superuser=True,
            is_active=True,
        )

    def _create_instructor_user(self, email, is_active=True):
        """Create instructor user for testing"""
        return User.objects.create_user(
            email=email,
            name=f'Instructor {email.split("@")[0].title()}',
            password="InstructorPass123!",
            role="instructor",
            is_active=is_active,
        )

    def _create_regular_user(self):
        """Create regular instructor user for boundary testing (no student role available)"""
        return User.objects.create_user(
            email="regular@test.com",
            name="Test Regular User",
            password="RegularPass123!",
            role="instructor",  # Use instructor since student role doesn't exist
            is_active=True,
        )

    def login_as_admin(self):
        """Login as admin user"""
        return self.client.login(email="admin@test.com", password="SecureAdminPass123!")

    def login_as_instructor(self):
        """Login as instructor user"""
        return self.client.login(
            email="instructor@test.com", password="InstructorPass123!"
        )

    def authenticate_api_as_admin(self):
        """Authenticate API client as admin"""
        self.api_client.force_authenticate(user=self.admin_user)

    def make_json_request(self, method, url, data=None):
        """Helper for making JSON API requests"""
        client_method = getattr(self.client, method.lower())
        return client_method(
            url,
            data=json.dumps(data) if data else None,
            content_type="application/json",
        )

    def tearDown(self):
        """Clean up after tests"""
        # Delete in proper order to avoid foreign key constraints
        try:
            from courses.models import Course

            Course.objects.all().delete()
        except ImportError:
            pass

        try:
            from exams.models import Exam

            Exam.objects.all().delete()
        except ImportError:
            pass

        GlobalSetting.objects.all().delete()
        User.objects.all().delete()


class AdminAPITestMixin(AdminTestBase):
    """Mixin for API-specific admin testing"""

    def setUp(self):
        super().setUp()
        self.authenticate_api_as_admin()

    def assertAPISuccess(self, response, expected_status=200):
        """Assert API response is successful"""
        self.assertEqual(response.status_code, expected_status)
        if hasattr(response, "json"):
            data = response.json()
            self.assertTrue(data.get("success", True))
            return data
        return None

    def assertAPIError(self, response, expected_status=400):
        """Assert API response contains error"""
        self.assertEqual(response.status_code, expected_status)
        if hasattr(response, "json"):
            data = response.json()
            self.assertFalse(data.get("success", False))
            return data
        return None


class AdminDBTestMixin:
    """Mixin for database-related admin testing"""

    def create_test_global_setting(
        self, key="test-setting", setting_type="system-config", **kwargs
    ):
        """Create a test global setting"""
        defaults = {
            "name": "Test Setting",
            "description": "A test setting",
            "value": {"test": "value"},
            "is_active": True,
            "is_default": False,
            "created_by": self.admin_user,
        }
        defaults.update(kwargs)

        return GlobalSetting.objects.create(
            key=key, setting_type=setting_type, **defaults
        )

    def create_test_marking_scheme(self, **kwargs):
        """Create a test marking scheme"""
        setting = self.create_test_global_setting(
            setting_type="marking-scheme", **kwargs
        )
        return MarkingScheme.objects.create(
            global_setting=setting,
            grade_boundaries={"A": 90, "B": 80, "C": 70, "D": 60, "F": 0},
            pass_threshold=60.0,
        )

    def create_test_exam_format(self, **kwargs):
        """Create a test exam format"""
        setting = self.create_test_global_setting(setting_type="exam-format", **kwargs)
        return ExamFormat.objects.create(
            global_setting=setting,
            sections=[{"name": "Multiple Choice", "question_count": 20}],
            time_limits={"total_minutes": 120},
        )
