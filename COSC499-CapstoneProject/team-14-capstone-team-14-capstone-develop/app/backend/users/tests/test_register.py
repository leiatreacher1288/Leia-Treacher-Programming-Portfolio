# users/tests/test_register.py

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

User = get_user_model()

"""
Test file: test_register.py

This file tests the API/ENDPOINT layer:
- Tests POST /api/auth/register/ endpoint
- Tests REST framework serializer validation
- Tests HTTP status codes and response formats
- Tests the full registration flow through the API
- Tests duplicate email handling
- Tests error message formats

For model-level user creation tests, see test_user_registration.py
"""


class InstructorRegisterTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        # Make sure your urls.py has this name
        self.register_url = reverse("register")

    def test_register_instructor_success(self):
        payload = {
            "email": "newuser@example.com",
            "name": "New Instructor",
            "password": "Newpass123",
        }
        resp = self.client.post(self.register_url, payload)
        self.assertEqual(resp.status_code, 201)
        self.assertTrue(User.objects.filter(email=payload["email"]).exists())

        # Check that tokens are returned
        self.assertIn("access", resp.data)
        self.assertIn("refresh", resp.data)
        self.assertIn("message", resp.data)

    def test_register_duplicate_email(self):
        """Test that duplicate email returns clear error message"""
        User.objects.create_user(
            email="existing@example.com", name="Existing", password="password123"
        )

        payload = {
            "email": "existing@example.com",
            "name": "Dup",
            "password": "AnotherPass",
        }
        resp = self.client.post(self.register_url, payload)
        self.assertEqual(resp.status_code, 400)

        # Check for the specific error message
        self.assertIn("message", resp.data)
        self.assertEqual(resp.data["message"], "Email already registered")

    def test_register_duplicate_email_case_insensitive(self):
        """Test that email uniqueness is case-insensitive"""
        User.objects.create_user(
            email="test@example.com", name="First User", password="password123"
        )

        payload = {
            "email": "TEST@EXAMPLE.COM",  # Different case
            "name": "Second User",
            "password": "AnotherPass123",
        }
        resp = self.client.post(self.register_url, payload)
        self.assertEqual(resp.status_code, 400)
        self.assertIn("message", resp.data)
        self.assertEqual(resp.data["message"], "Email already registered")

    def test_register_missing_fields(self):
        """Test that missing required fields return 400"""
        # Test missing email
        resp = self.client.post(
            self.register_url, {"name": "Test", "password": "pass123"}
        )
        self.assertEqual(resp.status_code, 400)

        # Test missing name
        resp = self.client.post(
            self.register_url, {"email": "test@example.com", "password": "pass123"}
        )
        self.assertEqual(resp.status_code, 400)

        # Test missing password
        resp = self.client.post(
            self.register_url, {"email": "test@example.com", "name": "Test"}
        )
        self.assertEqual(resp.status_code, 400)

    def test_register_weak_password(self):
        """Test that weak password is rejected"""
        payload = {
            "email": "weak@example.com",
            "name": "Weak Password User",
            "password": "short",  # Less than 8 characters
        }
        resp = self.client.post(self.register_url, payload)
        self.assertEqual(resp.status_code, 400)

    def test_register_sets_default_role(self):
        """Test that new users get instructor role by default"""
        payload = {
            "email": "instructor@example.com",
            "name": "Test Instructor",
            "password": "TestPass123",
        }
        resp = self.client.post(self.register_url, payload)
        self.assertEqual(resp.status_code, 201)

        user = User.objects.get(email=payload["email"])
        self.assertEqual(user.role, "instructor")
        self.assertFalse(user.is_staff)
        self.assertTrue(user.is_active)

    def test_register_creates_unverified_user(self):
        """Test that newly registered users are unverified"""
        payload = {
            "email": "unverified@example.com",
            "name": "Unverified User",
            "password": "TestPass123",
        }
        resp = self.client.post(self.register_url, payload)
        self.assertEqual(resp.status_code, 201)

        user = User.objects.get(email=payload["email"])
        self.assertFalse(user.is_verified)  # Should be False by default
        self.assertIsNotNone(user.verification_token)  # Should have a token
        # Should have timestamp
        self.assertIsNotNone(user.verification_sent_at)
