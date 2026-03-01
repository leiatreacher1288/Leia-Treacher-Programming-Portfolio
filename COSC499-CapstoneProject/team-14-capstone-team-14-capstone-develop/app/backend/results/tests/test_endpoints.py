"""
Smoke tests for results service endpoints.
Covers: /api/results/health/ and /api/results/upload/ endpoints.
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient


class ResultsEndpointsTests(TestCase):
    """
    Smoke tests to be sure the results service is wired
    and its placeholder endpoints respond as expected.
    """

    def setUp(self):
        self.client = APIClient()
        self.upload_url = reverse(
            "results-upload"
        )  # /api/results/  or /api/results/upload/
        self.health_url = reverse("results-health")  # /api/results/health/

    # -----------------------------
    # Health-check
    # -----------------------------
    def test_health_endpoint(self):
        resp = self.client.get(self.health_url)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data.get("service"), "results")
        self.assertIn("database", resp.data)

    # -----------------------------
    # Upload placeholder
    # -----------------------------
    def test_upload_placeholder(self):
        # POST with empty body (placeholder accepts anything)
        resp = self.client.post(self.upload_url, {})
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(
            resp.data.get("message"), "Please use specific endpoints for uploads"
        )
