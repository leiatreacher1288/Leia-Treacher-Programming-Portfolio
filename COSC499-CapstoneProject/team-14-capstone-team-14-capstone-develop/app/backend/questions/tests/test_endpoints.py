"""
Smoke tests for questions service endpoints.
Covers: /api/questions/ping/ and /api/questions/health/ endpoints.
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient


class QuestionsEndpointsTests(TestCase):
    """
    Basic smoke tests to confirm that the questions service
    is wired up and its public endpoints respond as expected.
    """

    def setUp(self):

        self.client = APIClient()
        self.client = APIClient()
        # These names come from questions/urls.py
        self.ping_url = reverse("questions-ping")  # /api/questions/ping/
        self.health_url = reverse("questions-health")  # /api/questions/health/

    def test_ping_endpoint(self):

        resp = self.client.get(self.ping_url)
        resp = self.client.get(self.ping_url)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(
            resp.data.get("message"),
            "Questions service is reachable. Placeholder for page to be developed",
        )

    def test_health_endpoint(self):

        resp = self.client.get(self.health_url)
        resp = self.client.get(self.health_url)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data.get("service"), "questions")
        self.assertIn("database", resp.data)  # "connected" or "unreachable"
