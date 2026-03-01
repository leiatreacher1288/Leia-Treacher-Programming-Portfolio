#!/usr/bin/env python3
"""
Admin API Test Suite
===================
Comprehensive Django test suite for admin functionality.
Tests all admin API endpoints, authentication, user management, etc.
Usage:
    # Run from backend directory:
    python manage.py test tests.test_admin_api
    # Run specific test:
    python manage.py test tests.test_admin_api.AdminAPITestCase.test_admin_login
"""
import json

from django.contrib.auth import get_user_model
from django.test import Client, TestCase
from django.utils import timezone

User = get_user_model()


class AdminAPITestCase(TestCase):
    """Test suite for admin API functionality"""

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
        # Create test users for management operations
        self.active_instructor = User.objects.create_user(
            email="instructor@test.com",
            name="Active Instructor",
            password="testpass123",
            role="instructor",
            is_active=True,
        )
        self.pending_instructor = User.objects.create_user(
            email="pending@test.com",
            name="Pending Instructor",
            password="testpass123",
            role="instructor",
            is_active=False,
        )
        self.staff_admin = User.objects.create_user(
            email="staff@test.com",
            name="Staff Admin",
            password="testpass123",
            role="admin",
            is_staff=True,
            is_active=True,
        )

    def test_admin_authentication_success(self):
        """Test successful admin login"""
        login_data = {"username": "admin@test.com", "password": "testpass123"}
        response = self.client.post(
            "/api/admin/login/",
            data=json.dumps(login_data),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("success"))
        self.assertIn("user", data)
        self.assertEqual(data["user"]["email"], "admin@test.com")

    def test_admin_authentication_failure(self):
        """Test failed admin login with wrong credentials"""
        login_data = {"username": "admin@test.com", "password": "wrongpassword"}
        response = self.client.post(
            "/api/admin/login/",
            data=json.dumps(login_data),
            content_type="application/json",
        )
        # Should return error status
        self.assertIn(response.status_code, [400, 401])

    def test_admin_logout(self):
        """Test admin logout"""
        # Login first
        self.client.login(username="admin@test.com", password="testpass123")
        # Then logout
        response = self.client.post("/api/admin/logout/")
        self.assertEqual(response.status_code, 200)

    def test_csrf_token_endpoint(self):
        """Test CSRF token retrieval"""
        response = self.client.get("/api/admin/csrf-token/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("csrfToken", data)
        self.assertTrue(data["csrfToken"])

    def test_user_list_unauthenticated(self):
        """Test that user list requires authentication"""
        response = self.client.get("/api/admin/users/")
        self.assertIn(response.status_code, [401, 403])

    def test_user_list_authenticated(self):
        """Test user list with authentication"""
        self.client.login(username="admin@test.com", password="testpass123")
        response = self.client.get("/api/admin/users/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # Should contain our test users
        self.assertGreaterEqual(len(data.get("results", data)), 4)

    def test_user_approval(self):
        """Test user approval functionality"""
        self.client.login(username="admin@test.com", password="testpass123")
        # Get CSRF token
        csrf_response = self.client.get("/api/admin/csrf-token/")
        csrf_token = csrf_response.json()["csrfToken"]
        # Approve pending user
        approval_data = {"user_id": self.pending_instructor.id, "action": "approve"}
        response = self.client.post(
            "/api/admin/users/",
            data=json.dumps(approval_data),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(response.status_code, 200)
        # Verify user is now active
        self.pending_instructor.refresh_from_db()
        self.assertTrue(self.pending_instructor.is_active)

    def test_user_deactivation(self):
        """Test user deactivation functionality"""
        self.client.login(username="admin@test.com", password="testpass123")
        # Get CSRF token
        csrf_response = self.client.get("/api/admin/csrf-token/")
        csrf_token = csrf_response.json()["csrfToken"]
        # Deactivate active user
        deactivation_data = {
            "user_id": self.active_instructor.id,
            "action": "deactivate",
        }
        response = self.client.post(
            "/api/admin/users/",
            data=json.dumps(deactivation_data),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(response.status_code, 200)
        # Verify user is now inactive
        self.active_instructor.refresh_from_db()
        self.assertFalse(self.active_instructor.is_active)

    def test_user_editing(self):
        """Test user editing functionality"""
        self.client.login(username="admin@test.com", password="testpass123")
        # Get CSRF token
        csrf_response = self.client.get("/api/admin/csrf-token/")
        csrf_token = csrf_response.json()["csrfToken"]
        # Edit user
        edit_data = {
            "name": "Updated Name",
            "email": self.active_instructor.email,
            "role": "instructor",
            "is_active": True,
        }
        response = self.client.put(
            f"/api/admin/users/{self.active_instructor.id}/",
            data=json.dumps(edit_data),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertIn(response.status_code, [200, 204])
        # Verify user was updated
        self.active_instructor.refresh_from_db()
        self.assertEqual(self.active_instructor.name, "Updated Name")

    def test_user_deletion(self):
        """Test user deletion functionality"""
        self.client.login(username="admin@test.com", password="testpass123")
        # Get CSRF token
        csrf_response = self.client.get("/api/admin/csrf-token/")
        csrf_token = csrf_response.json()["csrfToken"]
        user_id = self.active_instructor.id
        # Delete user
        response = self.client.delete(
            f"/api/admin/users/{user_id}/", HTTP_X_CSRFTOKEN=csrf_token
        )
        self.assertIn(response.status_code, [200, 204])
        # Verify user was deleted
        self.assertFalse(User.objects.filter(id=user_id).exists())

    def test_admin_stats(self):
        """Test admin statistics endpoint"""
        # Use force_authenticate for DRF APIView
        from rest_framework.test import APIClient

        api_client = APIClient()
        api_client.force_authenticate(user=self.admin_user)
        response = api_client.get("/api/admin/stats/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        expected_fields = ["total_users", "active_users", "pending_users"]
        for field in expected_fields:
            self.assertIn(field, data)
            self.assertIsInstance(data[field], int)

    def test_recent_activity(self):
        """Test recent activity endpoint"""
        self.client.login(username="admin@test.com", password="testpass123")
        response = self.client.get("/api/admin/recent-activity/")
        self.assertEqual(response.status_code, 200)
        # Should return list or paginated results
        data = response.json()
        self.assertIsInstance(data, (list, dict))

    def test_invalid_user_action(self):
        """Test handling of invalid user actions"""
        self.client.login(username="admin@test.com", password="testpass123")
        # Get CSRF token
        csrf_response = self.client.get("/api/admin/csrf-token/")
        csrf_token = csrf_response.json()["csrfToken"]
        # Try invalid action
        invalid_data = {
            "user_id": self.active_instructor.id,
            "action": "invalid_action",
        }
        response = self.client.post(
            "/api/admin/users/",
            data=json.dumps(invalid_data),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertIn(response.status_code, [400, 422])

    def test_nonexistent_user_action(self):
        """Test handling of actions on non-existent users"""
        self.client.login(username="admin@test.com", password="testpass123")
        # Get CSRF token
        csrf_response = self.client.get("/api/admin/csrf-token/")
        csrf_token = csrf_response.json()["csrfToken"]
        # Try action on non-existent user
        invalid_data = {"user_id": 99999, "action": "approve"}
        response = self.client.post(
            "/api/admin/users/",
            data=json.dumps(invalid_data),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertIn(response.status_code, [400, 404])

    def test_permission_boundaries(self):
        """Test that admins can't perform dangerous actions on themselves"""
        self.client.login(username="admin@test.com", password="testpass123")
        # Get CSRF token
        csrf_response = self.client.get("/api/admin/csrf-token/")
        csrf_token = csrf_response.json()["csrfToken"]
        # Try to deactivate self
        self_deactivate_data = {"user_id": self.admin_user.id, "action": "deactivate"}
        response = self.client.post(
            "/api/admin/users/",
            data=json.dumps(self_deactivate_data),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        # Should be blocked
        self.assertIn(response.status_code, [400, 403])

    def test_instructor_cannot_access_admin_endpoints(self):
        """Test that regular instructors cannot access admin endpoints"""
        self.client.login(username="instructor@test.com", password="testpass123")
        admin_endpoints = [
            "/api/admin/users/",
            "/api/admin/stats/",
            "/api/admin/recent-activity/",
        ]
        for endpoint in admin_endpoints:
            response = self.client.get(endpoint)
            self.assertIn(
                response.status_code,
                [401, 403],
                f"Endpoint {endpoint} should be protected",
            )

    def test_user_status_tracking(self):
        """Test user status tracking in responses"""
        self.client.login(username="admin@test.com", password="testpass123")
        # Update last_login for a user
        self.active_instructor.last_login = timezone.now()
        self.active_instructor.save()
        response = self.client.get("/api/admin/users/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        users = data.get("results", data)
        # Find our test user
        instructor_data = None
        for user in users:
            if user["id"] == self.active_instructor.id:
                instructor_data = user
                break
        self.assertIsNotNone(instructor_data)
        self.assertIn("last_login", instructor_data)
        self.assertIn("is_active", instructor_data)

    def test_filtering_users(self):
        """Test user filtering functionality"""
        self.client.login(username="admin@test.com", password="testpass123")
        # Test filtering for pending users
        response = self.client.get("/api/admin/users/?is_active=false")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        users = data.get("results", data)
        # Should include our pending instructor
        pending_found = any(u["id"] == self.pending_instructor.id for u in users)
        self.assertTrue(pending_found)


class AdminIntegrationTestCase(TestCase):
    """Integration tests for admin workflows"""

    def setUp(self):
        """Set up test data"""
        self.client = Client()
        self.admin_user = User.objects.create_user(
            email="admin@test.com",
            name="Test Admin",
            password="testpass123",
            role="admin",
            is_staff=True,
            is_superuser=True,
            is_active=True,
        )

    def test_complete_user_approval_workflow(self):
        """Test the complete workflow of approving a user"""
        from rest_framework.test import APIClient

        api_client = APIClient()
        api_client.force_authenticate(user=self.admin_user)

        # Create pending user
        pending_user = User.objects.create_user(
            email="newuser@test.com",
            name="New User",
            password="testpass123",
            role="instructor",
            is_active=False,
        )

        # Get CSRF token using regular client
        csrf_response = self.client.get("/api/admin/csrf-token/")
        csrf_token = csrf_response.json()["csrfToken"]

        # 1. Check user appears in pending list
        response = api_client.get("/api/admin/users/?is_active=false")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        users = data.get("results", data)
        pending_found = any(u["id"] == pending_user.id for u in users)
        self.assertTrue(pending_found)

        # 2. Approve the user using regular client with session login
        self.client.login(username="admin@test.com", password="testpass123")
        approval_data = {"user_id": pending_user.id, "action": "approve"}
        response = self.client.post(
            "/api/admin/users/",
            data=json.dumps(approval_data),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(response.status_code, 200)

        # 3. Verify user is now active
        pending_user.refresh_from_db()
        self.assertTrue(pending_user.is_active)

        # 4. Check user no longer appears in pending list
        response = api_client.get("/api/admin/users/?is_active=false")
        data = response.json()
        users = data.get("results", data)
        pending_found = any(u["id"] == pending_user.id for u in users)
        self.assertFalse(pending_found)

        # 5. Check user appears in active list
        response = api_client.get("/api/admin/users/?is_active=true")
        data = response.json()
        users = data.get("results", data)
        active_found = any(u["id"] == pending_user.id for u in users)
        self.assertTrue(active_found)


if __name__ == "__main__":
    import unittest

    unittest.main()
