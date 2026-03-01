from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from courses.models import Course  # Import from courses app, not exams

User = get_user_model()


class CourseCreateandDeleteTest(TestCase):  # Fixed typo in class name

    def setUp(self):
        self.client = APIClient()
        self.login_url = "/api/auth/token/"

        # Fix: Use the correct URLs from courses app
        self.course_url = "/api/courses/"  # For list/create
        self.course_list_url = "/api/courses/"  # Same as above
        self.course_detail_url = "/api/courses/{}/"  # For retrieve/update/delete

        # Create a test user and login
        self.test_email = "testuser@example.com"
        self.test_password = "TestPass123!"
        self.test_user = User.objects.create_user(
            email=self.test_email, name="Test User", password=self.test_password
        )
        response = self.client.post(
            self.login_url, {"email": self.test_email, "password": self.test_password}
        )

        self.token = response.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

    def test_create_course(self):
        """Test adding a Course to the course table"""

        # Create course with required fields based on your Course model
        response = self.client.post(
            self.course_url,
            {
                "code": "MATH101",  # Added required code field
                "name": "Math - 101",
                "term": "Winter 2024",
                "description": "Introduction to Mathematics",
            },
            content_type="application/json",
        )

        # Check for 201 Created
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify course created correctly
        self.assertEqual(Course.objects.count(), 1)

        # Get the created course ID
        course_id = response.data["id"]

        # Verify course listed correctly
        response = self.client.get(
            self.course_list_url, {}, content_type="application/json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], "Math - 101")

        # Modify course with PUT request
        response = self.client.put(
            self.course_detail_url.format(course_id),
            {
                "code": "COSC200",  # Include all required fields
                "name": "COSC - 200",
                "term": "Winter 2024",
                "description": "Computer Science Course",
            },
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        course = Course.objects.get(pk=course_id)
        self.assertEqual(course.name, "COSC - 200")

        # Delete course
        response = self.client.delete(self.course_detail_url.format(course_id))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Course.objects.count(), 0)
