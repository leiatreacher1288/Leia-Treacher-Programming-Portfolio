# users/tests/test_change_password.py
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

User = get_user_model()


class TestChangePasswordEndpoint(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="test@example.com",
            name="Tester",
            password="OldPass123!",
        )
        self.client.force_authenticate(user=self.user)
        self.url = "/api/auth/change-password/"

    def test_change_password_success(self):
        resp = self.client.post(
            self.url,
            {"current_password": "OldPass123!", "new_password": "NewPass123!"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewPass123!"))

    def test_change_password_wrong_current(self):
        resp = self.client.post(
            self.url,
            {"current_password": "WrongPass123!", "new_password": "NewPass123!"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_change_password_same_as_current(self):
        resp = self.client.post(
            self.url,
            {"current_password": "OldPass123!", "new_password": "OldPass123!"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unauthenticated_user_cannot_change(self):
        self.client.force_authenticate(user=None)
        resp = self.client.post(
            self.url,
            {"current_password": "OldPass123!", "new_password": "NewPass123!"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_missing_fields_returns_validation_error(self):
        resp = self.client.post(self.url, {}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
