# users/tests/test_reset_password_from_link.py
#
# End-to-end tests for the validate-token + reset-password endpoints
# -----------------------------------------------------------------
# Assumed routes:
#   • POST /api/auth/validate-reset-token/
#   • POST /api/auth/reset-password/
#
# If your actual paths differ, edit the two URL attributes in setUp().

from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.test import TestCase
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import status
from rest_framework.test import APIClient

User = get_user_model()


class ResetPasswordFromLinkAPITests(TestCase):
    """Validate-token + Reset-password workflow"""

    def setUp(self):
        self.client = APIClient()

        # Create a user we can reset
        self.user = User.objects.create_user(
            email="test@example.com",
            name="Reset User",
            password="OldPass123!",
        )

        # Build uid / token pair the same way your view does
        self.uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        self.token = default_token_generator.make_token(self.user)

        # End-point URLs (adjust if yours differ)
        self.validate_url = "/api/auth/validate-reset-token/"
        self.reset_url = "/api/auth/reset-password/"

    # ──────────────────────────────────────────────────────────────
    # validate-token
    # ──────────────────────────────────────────────────────────────
    def test_validate_token_success(self):
        response = self.client.post(
            self.validate_url,
            {"uid": self.uid, "token": self.token},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get("valid"))
        self.assertEqual(response.data.get("email"), self.user.email)

    def test_validate_token_invalid(self):
        response = self.client.post(
            self.validate_url,
            {"uid": self.uid, "token": "bad-token"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data.get("error"),
            "Invalid or expired reset token",
        )

    # ──────────────────────────────────────────────────────────────
    # reset-password
    # ──────────────────────────────────────────────────────────────
    def test_reset_password_success(self):
        response = self.client.post(
            self.reset_url,
            {
                "uid": self.uid,
                "token": self.token,
                "new_password": "NewPass123!",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data.get("message"),
            "Password reset successfully",
        )

        # password really changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewPass123!"))

    def test_reset_password_invalid_token(self):
        response = self.client.post(
            self.reset_url,
            {
                "uid": self.uid,
                "token": "wrong-token",
                "new_password": "NewPass123!",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data.get("error"),
            "Invalid or expired reset token",
        )

        # password must remain old
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("OldPass123!"))

    def test_reset_password_missing_fields(self):
        response = self.client.post(self.reset_url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("uid", response.data)
        self.assertIn("token", response.data)
        self.assertIn("new_password", response.data)
