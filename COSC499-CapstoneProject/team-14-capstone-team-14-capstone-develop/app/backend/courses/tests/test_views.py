# app/backend/courses/tests/test_views.py
# ---------------------------------------------------------------------
# Integration tests for the /api/courses/ endpoints, using Django's TestCase
# No conftest.py required; all data setup is inside setUp.
# ---------------------------------------------------------------------

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from courses.models import Course

User = get_user_model()


class CourseViewsTests(TestCase):
    """Integration tests for the /api/courses/ endpoints."""

    def setUp(self):
        self.client = APIClient()

        # Create an instructor
        self.instructor = User.objects.create_user(
            email="instr@example.com",
            name="Prof X",
            password="pass",
            role="instructor",
        )

        # URLs
        self.token_url = reverse("token_obtain_pair")
        self.list_url = reverse("course-list")

    def _get_token(self, user):
        resp = self.client.post(
            self.token_url,
            {"email": user.email, "password": "pass"},
            format="json",
        )
        return resp.data.get("access")

    def test_instructor_can_create_course(self):
        """Instructor can create a course (201)."""

        """Instructor can create a course (201)."""
        token = self._get_token(self.instructor)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        data = {"code": "HIST101", "name": "World History", "term": "Fall 2025"}
        resp = self.client.post(self.list_url, data, format="json")

        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Course.objects.filter(code="HIST101").exists())

    def test_unauthenticated_cannot_create_course(self):
        """Unauthenticated request returns 401 and no course created."""
        data = {"code": "PHYS101", "name": "Physics", "term": "Fall 2025"}
        resp = self.client.post(self.list_url, data, format="json")

        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(Course.objects.filter(code="PHYS101").exists())

    def test_list_courses_filters_by_term(self):
        """List endpoint filters courses by the 'term' query param."""
        course_a = Course.objects.create(code="A", name="Alpha", term="T1")
        course_b = Course.objects.create(code="B", name="Beta", term="T2")

        # Attach the instructor via the new CourseInstructor join‑table
        from courses.models import CourseInstructor

        for course in (course_a, course_b):
            CourseInstructor.objects.create(
                course=course,
                user=self.instructor,
                role=CourseInstructor.Role.MAIN,  # any role works for the test
                access=CourseInstructor.Access.FULL,  # full access keeps permissions simple
                accepted=True,  # only accepted links are listed
            )

        # Authenticate as that instructor
        token = self._get_token(self.instructor)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        # Filter by term T1
        resp = self.client.get(self.list_url, {"term": "T1"})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        codes = [item["code"] for item in resp.json()]
        self.assertEqual(codes, ["A"])

    def test_course_detail_endpoint(self):
        """Detail endpoint returns correct course data."""
        course = Course.objects.create(
            code="CHEM101", name="General Chemistry", term="Fall 2025"
        )
        detail_url = reverse("course-detail", args=[course.id])

        # Authenticate as instructor (read allowed)
        token = self._get_token(self.instructor)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        resp = self.client.get(detail_url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        body = resp.json()
        self.assertEqual(body.get("code"), "CHEM101")
        self.assertEqual(body.get("name"), "General Chemistry")
        self.assertEqual(body.get("term"), "Fall 2025")
