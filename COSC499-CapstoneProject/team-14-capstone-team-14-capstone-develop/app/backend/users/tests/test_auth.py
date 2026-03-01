from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

User = get_user_model()

"""
Test file: test_auth.py

This file tests JWT authentication endpoints:
- Tests token generation (/api/auth/token/)
- Tests token refresh functionality
- Tests authentication with valid/invalid credentials
"""


class AuthTokenTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.token_url = reverse("token_obtain_pair")
        self.refresh_url = reverse("token_refresh")

        self.user = User.objects.create_user(
            email="test@example.com", name="Test User", password="testpass123"
        )

    def test_token_obtain_valid_credentials(self):
        resp = self.client.post(
            self.token_url, {"email": "test@example.com", "password": "testpass123"}
        )
        self.assertEqual(resp.status_code, 200)
        self.assertIn("access", resp.data)
        self.assertIn("refresh", resp.data)

    def test_token_obtain_invalid_credentials(self):
        resp = self.client.post(
            self.token_url, {"email": "test@example.com", "password": "wrongpass"}
        )
        self.assertEqual(resp.status_code, 401)

    def test_token_refresh(self):
        login = self.client.post(
            self.token_url, {"email": "test@example.com", "password": "testpass123"}
        )
        refresh = login.data["refresh"]
        resp = self.client.post(self.refresh_url, {"refresh": refresh})
        self.assertEqual(resp.status_code, 200)
        self.assertIn("access", resp.data)

    def test_user_profile_authenticated(self):
        # Get token first
        login_resp = self.client.post(
            self.token_url, {"email": "test@example.com", "password": "testpass123"}
        )
        token = login_resp.data["access"]

        # Test profile endpoint
        profile_url = reverse("user-profile")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        resp = self.client.get(profile_url)

        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["email"], "test@example.com")
        # Your model has 'name' field
        self.assertEqual(resp.data["name"], "Test User")
        self.assertIn("is_staff", resp.data)

    def test_user_profile_unauthenticated(self):
        profile_url = reverse("user-profile")
        resp = self.client.get(profile_url)
        self.assertEqual(resp.status_code, 401)  # Should be unauthorized
