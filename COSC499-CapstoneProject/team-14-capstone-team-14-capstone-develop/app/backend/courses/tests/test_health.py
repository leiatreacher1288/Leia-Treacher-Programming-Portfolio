from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

# app/backend/courses/tests/test_health.py
from courses.models import Course


class HealthEndpointTests(TestCase):

    def setUp(self):
        # create one course so the endpoint can count it
        instructor = get_user_model().objects.create_user(
            email="instructor@example.com",
            name="Prof X",
            password="pass",
            role="instructor",
        )
        course = Course.objects.create(
            code="HIST101", name="World History", term="Fall 2025"
        )
        course.instructors.add(instructor)

        self.url = reverse("courses-health")

    def test_health_endpoint_ok(self):

        response = self.client.get(self.url)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["status"], "ok")
        self.assertEqual(body["course_count"], 1)
