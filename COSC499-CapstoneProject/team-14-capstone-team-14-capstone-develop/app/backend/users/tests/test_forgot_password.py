# users/tests/test_forgot_password.py
#
# Tests for the “forgot-password / request-reset-link” endpoint
# (assumed route:  /api/auth/forgot-password/)

from django.contrib.auth import get_user_model
from django.core import mail
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

User = get_user_model()


class ForgotPasswordAPITests(TestCase):
    """Password-reset e-mail request endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.url = "/api/auth/forgot-password/"

        # a real user that *does* exist
        self.email = "resetme@example.com"
        self.password = "ResetMe123!"
        self.user = User.objects.create_user(
            email=self.email,
            name="Reset User",
            password=self.password,
        )

    # ──────────────────────────────────────────────────────────────
    # happy-path
    # ──────────────────────────────────────────────────────────────
    def test_send_reset_email_success(self):
        """Known e-mail → 200 OK + message + e-mail sent"""

        """Known e-mail → 200 OK + message + e-mail sent"""
        response = self.client.post(self.url, {"email": self.email}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data.get("message"),
            "Password reset email sent",
        )

        # Exactly one e-mail sent and addressed to the right recipient
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(self.email, mail.outbox[0].to)

    # ──────────────────────────────────────────────────────────────
    # edge-cases / error paths
    # ──────────────────────────────────────────────────────────────
    def test_nonexistent_email_returns_400(self):

        response = self.client.post(
            self.url, {"email": "nobody@nowhere.fake"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data.get("error"),
            "User with this email does not exist",
        )
        self.assertEqual(len(mail.outbox), 0)

    def test_missing_email_field(self):

        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)  # DRF serializer validation
        self.assertEqual(len(mail.outbox), 0)

    def test_invalid_email_format(self):

        response = self.client.post(self.url, {"email": "not_an_email"}, format="json")
        self.assertIn("email", response.data)
        self.assertEqual(len(mail.outbox), 0)
