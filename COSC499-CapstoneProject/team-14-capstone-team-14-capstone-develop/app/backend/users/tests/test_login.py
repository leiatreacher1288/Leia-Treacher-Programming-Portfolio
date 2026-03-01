# users/tests/test_login.py

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

User = get_user_model()


class LoginAPITests(TestCase):
    """Test suite for JWT login endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.login_url = "/api/auth/token/"

        # Create a test user
        self.test_email = "testuser@example.com"
        self.test_password = "TestPass123!"
        self.test_user = User.objects.create_user(
            email=self.test_email, name="Test User", password=self.test_password
        )

    def test_successful_login(self):
        """Test login with valid credentials returns JWT tokens"""

        """Test login with valid credentials returns JWT tokens"""
        response = self.client.post(
            self.login_url, {"email": self.test_email, "password": self.test_password}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

        # Verify tokens are valid JWT format
        self.assertTrue(response.data["access"].count(".") == 2)  # JWT has 3 parts
        self.assertTrue(response.data["refresh"].count(".") == 2)

    def test_login_with_wrong_password(self):
        """Test login with wrong password returns 401"""
        response = self.client.post(
            self.login_url, {"email": self.test_email, "password": "WrongPassword123!"}
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("detail", response.data)
        self.assertEqual(
            response.data["detail"],
            "No active account found with the given credentials",
        )

    def test_login_with_nonexistent_email(self):
        """Test login with non-existent email returns 401"""

        """Test login with non-existent email returns 401"""
        response = self.client.post(
            self.login_url,
            {"email": "nonexistent@example.com", "password": "SomePassword123!"},
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("detail", response.data)

    def test_login_missing_email(self):
        """Test login without email returns 400"""
        response = self.client.post(self.login_url, {"password": self.test_password})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_login_missing_password(self):
        """Test login without password returns 400"""

        """Test login without password returns 400"""
        response = self.client.post(self.login_url, {"email": self.test_email})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)

    def test_login_with_inactive_user(self):
        """Test login with inactive user fails"""
        # Deactivate the user
        self.test_user.is_active = False
        self.test_user.save()

        response = self.client.post(
            self.login_url, {"email": self.test_email, "password": self.test_password}
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_refresh_endpoint(self):
        """Test token refresh endpoint works"""
        """Test token refresh endpoint works"""
        # First login to get tokens
        login_response = self.client.post(
            self.login_url, {"email": self.test_email, "password": self.test_password}
        )

        refresh_token = login_response.data["refresh"]

        # Try to refresh
        refresh_url = "/api/auth/token/refresh/"
        refresh_response = self.client.post(refresh_url, {"refresh": refresh_token})

        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)
        self.assertIn("access", refresh_response.data)
        # New access token should be different
        self.assertNotEqual(
            login_response.data["access"], refresh_response.data["access"]
        )


class AuthenticationIntegrationTests(TestCase):
    """Test authentication flow with protected endpoints"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="auth@example.com", name="Auth User", password="AuthPass123!"
        )

    def test_protected_endpoint_without_token(self):
        """Test that protected endpoints require authentication"""
        """Test that protected endpoints require authentication"""
        # Try to access a protected endpoint without token
        # You'll need to adjust this to match your actual protected endpoints
        # Example protected endpoint
        response = self.client.get("/api/exams/list/")

        # Should return 401 or 403 depending on your setup
        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
        )

    def test_protected_endpoint_with_token(self):
        """Test that authentication token grants access"""
        # Login first
        login_response = self.client.post(
            "/api/auth/token/",
            {"email": "auth@example.com", "password": "AuthPass123!"},
        )

        login_response.data["access"]
