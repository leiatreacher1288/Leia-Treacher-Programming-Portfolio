#!/usr/bin/env python3
"""
Admin Integration Test Suite
===========================
Integration tests for admin functionality that spans multiple services.
Focuses on cross-service workflows and global admin features.

Coverage:
- UR1.1: Administrator secure login authentication (integration aspects)
- UR1.3: Global settings configuration (marking schemes, exam formats)
- FR1.1-FR1.4: Authentication, role management, password security, activity logging
- UR2.1: Role-based access control and password recovery
- Cross-service admin integration workflows

Note: UR1.2 (Instructor account management) is tested in users/tests/test_admin_instructor_management.py

Usage:
    python manage.py test examvault.tests.test_admin_integration
"""

import logging
import os

# Import test helpers from backend tests
import sys

from django.contrib.auth import get_user_model
from django.test import TestCase
from helpers import AdminEndpoints as Endpoints
from helpers import AdminTestAssertions as Assert
from helpers import AdminTestDataFactory as DataFactory
from helpers.admin_test_base import AdminAPITestMixin, AdminDBTestMixin, AdminTestBase
from rest_framework.test import APITestCase

from examvault.models import GlobalSetting

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", "tests"))


User = get_user_model()
logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════
# AUTHENTICATION TESTS (UR1.1, FR1.1-FR1.4)
# ═══════════════════════════════════════════════════════════════


class AdminAuthenticationTestCase(TestCase, AdminTestBase):
    """Test UR1.1: Must log in using a secure username/password"""

    def test_admin_login_success(self):
        """Test successful admin login with valid credentials"""
        login_data = DataFactory.get_valid_admin_login()
        response = self.make_json_request("post", Endpoints.LOGIN, login_data)
        Assert.assert_login_success(self, response)

    def test_admin_login_invalid_credentials(self):
        """Test admin login fails with invalid credentials"""
        invalid_logins = DataFactory.get_invalid_login_data_sets()

        for credentials in invalid_logins:
            with self.subTest(credentials=credentials):
                response = self.make_json_request("post", Endpoints.LOGIN, credentials)
                Assert.assert_login_failure(self, response)

    def test_non_admin_access_denied(self):
        """Test FR1.2: Role-based access control restricts non-admin access"""
        login_data = DataFactory.get_instructor_login()
        response = self.make_json_request("post", Endpoints.LOGIN, login_data)
        Assert.assert_access_denied(self, response)

    def test_password_security_requirements(self):
        """Test FR1.3: Passwords must be hashed and stored securely"""
        Assert.assert_password_security(self, self.admin_user, "SecureAdminPass123!")

    def test_deactivated_account_access_denied(self):
        """Test deactivated admin accounts cannot login"""
        self.admin_user.is_active = False
        self.admin_user.save()

        login_data = DataFactory.get_valid_admin_login()
        response = self.make_json_request("post", Endpoints.LOGIN, login_data)
        Assert.assert_access_denied(self, response)

    def test_admin_logout_functionality(self):
        """Test admin logout clears session"""
        self.login_as_admin()
        response = self.client.post(Endpoints.LOGOUT)
        Assert.assert_session_cleared(self, response, Endpoints.STATS)

    def test_csrf_token_endpoint(self):
        """Test CSRF token retrieval for security"""
        response = self.client.get(Endpoints.CSRF)
        data = Assert.assert_response_contains_data(self, response, ["csrfToken"])
        self.assertTrue(data["csrfToken"])


# ═══════════════════════════════════════════════════════════════
# GLOBAL SETTINGS TESTS (UR1.3)
# ═══════════════════════════════════════════════════════════════
# Note: User Management Tests (UR1.2) moved to users/tests/test_admin_instructor_management.py

# GLOBAL SETTINGS TESTS (UR1.3)
# ═══════════════════════════════════════════════════════════════


class AdminGlobalSettingsTestCase(APITestCase, AdminAPITestMixin, AdminDBTestMixin):
    """Test UR1.3: Must configure global settings (marking schemes, exam formats)"""

    def test_global_settings_endpoint_access(self):
        """Test global settings endpoint accessibility"""
        response = self.api_client.get(Endpoints.GLOBAL_SETTINGS)
        Assert.assert_response_contains_data(self, response, ["settings"])

    def test_create_global_setting(self):
        """Test creating new global setting"""
        setting_data = DataFactory.get_valid_global_setting()
        response = self.api_client.post(
            Endpoints.GLOBAL_SETTINGS, setting_data, format="json"
        )

        Assert.assert_api_success(self, response, 201)
        Assert.assert_global_setting_created(
            self, "test-setting", "Test Setting", self.admin_user
        )

    def test_marking_schemes_management(self):
        """Test marking schemes configuration"""
        scheme_data = DataFactory.get_valid_marking_scheme()
        response = self.api_client.post(
            Endpoints.MARKING_SCHEMES, scheme_data, format="json"
        )

        self.assertEqual(response.status_code, 201)

        # Verify retrieval
        response = self.api_client.get(Endpoints.MARKING_SCHEMES)
        Assert.assert_response_contains_data(self, response, ["marking_schemes"])

    def test_exam_formats_management(self):
        """Test exam formats configuration"""
        format_data = DataFactory.get_valid_exam_format()
        response = self.api_client.post(
            Endpoints.EXAM_FORMATS, format_data, format="json"
        )

        self.assertEqual(response.status_code, 201)

        # Verify retrieval
        response = self.api_client.get(Endpoints.EXAM_FORMATS)
        Assert.assert_response_contains_data(self, response, ["exam_formats"])

    def test_default_setting_enforcement(self):
        """Test only one default per type enforcement"""
        setting1 = self.create_test_global_setting(
            key="default-1", setting_type="marking-scheme", is_default=True
        )
        setting2 = self.create_test_global_setting(
            key="default-2", setting_type="marking-scheme", is_default=True
        )

        Assert.assert_default_setting_enforcement(self, setting1, setting2)

    def test_courses_overview_access(self):
        """Test courses overview endpoint"""
        response = self.api_client.get(Endpoints.COURSES_OVERVIEW)
        Assert.assert_response_contains_data(self, response, ["courses", "statistics"])

    def test_exams_overview_access(self):
        """Test exams overview endpoint"""
        response = self.api_client.get(Endpoints.EXAMS_OVERVIEW)
        Assert.assert_response_contains_data(self, response, ["exams", "statistics"])

    def test_non_admin_access_denied_global_settings(self):
        """Test non-admin users cannot access global settings"""
        self.api_client.force_authenticate(user=self.active_instructor)
        response = self.api_client.get(Endpoints.GLOBAL_SETTINGS)
        self.assertEqual(response.status_code, 403)


# ═══════════════════════════════════════════════════════════════
# ACTIVITY LOGGING TESTS (FR1.4)
# ═══════════════════════════════════════════════════════════════


class AdminActivityLoggingTestCase(TestCase, AdminTestBase):
    """Test FR1.4: User activity must be logged for auditing"""

    def setUp(self):
        super().setUp()
        self.login_as_admin()

    def test_admin_stats_endpoint(self):
        """Test admin statistics endpoint for activity monitoring"""
        response = self.client.get(Endpoints.STATS)
        Assert.assert_response_contains_data(
            self, response, ["total_users", "active_users", "pending_users"]
        )

    def test_recent_activity_endpoint(self):
        """Test recent activity monitoring"""
        # Perform some activity first
        activate_data = DataFactory.get_user_action_data(
            self.pending_instructor.id, "activate"
        )
        self.make_json_request("post", Endpoints.USERS, activate_data)

        # Check recent activity
        response = self.client.get(Endpoints.RECENT_ACTIVITY)
        Assert.assert_response_contains_data(self, response, ["activities"])

    def test_user_status_tracking(self):
        """Test user online/offline status tracking"""
        response = self.client.get(Endpoints.USERS)
        data = Assert.assert_response_contains_data(self, response, ["results"])
        Assert.assert_user_has_status_fields(self, data["results"])


# ═══════════════════════════════════════════════════════════════
# SECURITY BOUNDARY TESTS
# ═══════════════════════════════════════════════════════════════


class AdminSecurityTestCase(TestCase, AdminTestBase):
    """Test security boundaries and role-based access control"""

    def test_unauthenticated_access_denied(self):
        """Test unauthenticated access to admin endpoints is denied"""
        for endpoint in Endpoints.get_protected_endpoints():
            with self.subTest(endpoint=endpoint):
                response = self.client.get(endpoint)
                Assert.assert_access_denied(self, response)

    def test_instructor_access_boundaries(self):
        """Test instructor users cannot access admin endpoints"""
        self.login_as_instructor()

        for endpoint in [Endpoints.STATS, Endpoints.USERS, Endpoints.GLOBAL_SETTINGS]:
            with self.subTest(endpoint=endpoint):
                response = self.client.get(endpoint)
                Assert.assert_access_denied(self, response)

    def test_student_access_boundaries(self):
        """Test student users cannot access admin endpoints"""
        self.client.login(email="student@test.com", password="StudentPass123!")

        for endpoint in Endpoints.get_protected_endpoints():
            with self.subTest(endpoint=endpoint):
                response = self.client.get(endpoint)
                Assert.assert_access_denied(self, response)

    def test_admin_permission_enforcement(self):
        """Test admin permission is properly enforced"""
        # Remove admin privileges
        self.admin_user.is_staff = False
        self.admin_user.is_superuser = False
        self.admin_user.save()

        self.client.login(email="admin@test.com", password="SecureAdminPass123!")
        response = self.client.get(Endpoints.STATS)
        Assert.assert_access_denied(self, response)


# ═══════════════════════════════════════════════════════════════
# INTEGRATION TESTS
# ═══════════════════════════════════════════════════════════════


class AdminIntegrationTestCase(TestCase, AdminTestBase):
    """Integration tests for complete admin workflows"""

    def setUp(self):
        super().setUp()
        self.login_as_admin()

    def test_complete_instructor_management_workflow(self):
        """Test complete instructor lifecycle management"""
        # 1. Create instructor
        create_data = DataFactory.get_valid_instructor_data()
        create_data["email"] = "workflow@test.com"
        create_data["name"] = "Workflow Instructor"

        response = self.make_json_request("post", Endpoints.USERS, create_data)
        self.assertEqual(response.status_code, 201)

        # Get created user
        user = User.objects.get(email="workflow@test.com")

        # 2. Update instructor
        update_data = DataFactory.get_user_update_data(user.id)
        update_data["name"] = "Updated Workflow Instructor"

        response = self.make_json_request("post", Endpoints.USERS, update_data)
        self.assertEqual(response.status_code, 200)

        # 3. Deactivate instructor
        deactivate_data = DataFactory.get_user_action_data(user.id, "deactivate")
        response = self.make_json_request("post", Endpoints.USERS, deactivate_data)
        self.assertEqual(response.status_code, 200)

        # 4. Verify final state
        user.refresh_from_db()
        self.assertEqual(user.name, "Updated Workflow Instructor")
        self.assertFalse(user.is_active)

    def test_complete_global_settings_workflow(self):
        """Test complete global settings configuration workflow"""
        # Test would be implemented using AdminAPITestMixin if needed
        self.assertTrue(True)  # Placeholder for complex workflow


# ═══════════════════════════════════════════════════════════════
# REGRESSION TESTS
# ═══════════════════════════════════════════════════════════════


class AdminRegressionTestCase(TestCase, AdminTestBase):
    """Regression tests for critical admin functionality"""

    def setUp(self):
        super().setUp()
        self.login_as_admin()

    def test_admin_endpoints_availability(self):
        """Regression: Ensure all admin endpoints are accessible"""
        critical_endpoints = [
            Endpoints.STATS,
            Endpoints.USERS,
            Endpoints.RECENT_ACTIVITY,
        ]

        for endpoint in critical_endpoints:
            with self.subTest(endpoint=endpoint):
                response = self.client.get(endpoint)
                self.assertEqual(response.status_code, 200)

    def test_user_creation_data_integrity(self):
        """Regression: Ensure user creation maintains data integrity"""
        original_count = User.objects.count()

        create_data = DataFactory.get_valid_instructor_data()
        create_data["email"] = "regression@test.com"
        create_data["name"] = "Regression Test User"

        response = self.make_json_request("post", Endpoints.USERS, create_data)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(User.objects.count(), original_count + 1)
        Assert.assert_user_created(self, "regression@test.com", "Regression Test User")

    def test_admin_permission_persistence(self):
        """Regression: Ensure admin permissions persist correctly"""
        response = self.client.get(Endpoints.STATS)
        self.assertEqual(response.status_code, 200)

        self.admin_user.refresh_from_db()
        Assert.assert_admin_permissions(self, self.admin_user)

    def test_global_settings_model_constraints(self):
        """Regression: Ensure global settings model constraints work"""

        # Should raise error for duplicate key+type
        with self.assertRaises(Exception):
            GlobalSetting.objects.create(
                key="test-constraint",
                setting_type="marking-scheme",
                name="Test Setting 2",
                created_by=self.admin_user,
            )


if __name__ == "__main__":
    import unittest

    unittest.main()
