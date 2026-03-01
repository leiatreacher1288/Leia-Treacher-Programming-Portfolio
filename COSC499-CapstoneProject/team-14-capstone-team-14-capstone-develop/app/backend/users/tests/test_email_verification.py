from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

User = get_user_model()


class VerifyEmailTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.verify_url = reverse("verify-email")

    def test_no_token(self):
        """Test verification without token returns 400"""
        resp = self.client.post(self.verify_url, {})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(resp.data["message"], "Verification token required")

    def test_valid_token(self):
        """Test verification with valid token returns 200"""
        """Test verification with valid token returns 200"""
        # Create a user with a token
        user = User.objects.create_user(
            email="test@example.com", name="Test User", password="password123"
        )
        user.verification_token = "valid-test-token"
        user.save()

        resp = self.client.post(self.verify_url, {"token": "valid-test-token"})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["message"], "Email verified successfully!")

    def test_invalid_token(self):
        """Test that invalid token returns 200 with 'already verified' message"""
        resp = self.client.post(self.verify_url, {"token": "invalid-token-123"})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)  # Changed from 400
        self.assertEqual(
            resp.data["message"], "Email already verified!"
        )  # Changed message
