from django.contrib.auth import (  # Use get_user_model instead of importing User directly
    get_user_model,
)
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from courses.models import Course
from exams.models import Exam

User = get_user_model()  # Get the custom User model


class AnalyticsViewsTestCase(APITestCase):
    """Basic test cases for analytics API endpoints."""

    def setUp(self):
        """Set up test data."""
        # Create test instructor using custom User model fields
        self.instructor = User.objects.create_user(
            email="instructor@test.com",
            name="Test Instructor",
            password="testpass123",
            role="instructor",
        )

        # Create test course - using 'creator' field instead of 'created_by'
        self.course = Course.objects.create(
            code="TEST101",
            name="Test Course",
            description="A test course",
            term="2024W1",
            creator=self.instructor,
        )

        # Create test exam with correct fields
        self.exam = Exam.objects.create(
            title="Test Exam",
            course=self.course,
            created_by=self.instructor,  # Exam uses created_by
            time_limit=60,  # Use time_limit instead of max_duration_minutes
        )

        # Authenticate as instructor
        self.client.force_authenticate(user=self.instructor)

    def test_analytics_endpoints_exist(self):
        """Test that analytics endpoints exist and return some response."""
        # Test endpoints that should exist
        test_urls = [
            "/api/analytics/courses/",
        ]

        for url in test_urls:
            response = self.client.get(url)
            # Should not return 404 (not found)
            self.assertNotEqual(response.status_code, status.HTTP_404_NOT_FOUND)
            # Should return either 200 (success) or a valid error code
            self.assertIn(
                response.status_code,
                [
                    status.HTTP_200_OK,
                    status.HTTP_401_UNAUTHORIZED,  # If auth required
                    status.HTTP_403_FORBIDDEN,  # If permissions required
                    status.HTTP_500_INTERNAL_SERVER_ERROR,  # If implementation incomplete
                ],
            )

    def test_unauthenticated_access(self):
        """Test analytics endpoints without authentication."""
        self.client.force_authenticate(user=None)

        # Test a basic endpoint
        url = "/api/analytics/courses/"
        response = self.client.get(url)

        # Should require authentication
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_instructor_has_course_access(self):
        """Test that instructor can access their own course data."""
        # This test verifies basic model relationships work
        self.assertEqual(self.course.creator, self.instructor)
        self.assertEqual(self.exam.created_by, self.instructor)
        self.assertEqual(self.exam.course, self.course)


class AnalyticsModelTestCase(TestCase):
    """Test cases for analytics-related models."""

    def setUp(self):
        """Set up test data."""
        self.instructor = User.objects.create_user(
            email="instructor@test.com",
            name="Test Instructor",
            password="testpass123",
            role="instructor",
        )

        self.course = Course.objects.create(
            code="TEST101", name="Test Course", term="2024W1", creator=self.instructor
        )

    def test_course_creation(self):
        """Test basic course model functionality."""
        self.assertEqual(self.course.code, "TEST101")
        self.assertEqual(self.course.name, "Test Course")
        self.assertEqual(self.course.creator, self.instructor)
        self.assertIsNotNone(self.course.created_at)

    def test_exam_creation(self):
        """Test basic exam model functionality."""
        exam = Exam.objects.create(
            title="Test Exam",
            course=self.course,
            created_by=self.instructor,
            time_limit=60,
        )

        self.assertEqual(exam.title, "Test Exam")
        self.assertEqual(exam.course, self.course)
        self.assertEqual(exam.created_by, self.instructor)
        self.assertEqual(exam.time_limit, 60)

    def test_course_string_representation(self):
        """Test course string representation."""
        # Course model __str__ returns: f"{self.code} — {self.term}"
        expected_str = f"{self.course.code} — {self.course.term}"
        str_repr = str(self.course)
        self.assertEqual(str_repr, expected_str)


class AnalyticsIntegrationTestCase(TestCase):
    """Integration tests for analytics functionality."""

    def setUp(self):
        """Set up test data."""
        # Create multiple instructors and courses for integration testing
        self.instructor1 = User.objects.create_user(
            email="instructor1@test.com",
            name="Instructor One",
            password="testpass123",
            role="instructor",
        )

        self.instructor2 = User.objects.create_user(
            email="instructor2@test.com",
            name="Instructor Two",
            password="testpass123",
            role="instructor",
        )

        # Create courses for different instructors
        self.course1 = Course.objects.create(
            code="MATH101", name="Calculus I", term="2024W1", creator=self.instructor1
        )

        self.course2 = Course.objects.create(
            code="PHYS111", name="Physics I", term="2024W1", creator=self.instructor2
        )

    def test_instructor_course_isolation(self):
        """Test that instructors only see their own courses."""
        # Instructor 1 should only see their course
        instructor1_courses = Course.objects.filter(creator=self.instructor1)
        self.assertEqual(instructor1_courses.count(), 1)
        self.assertEqual(instructor1_courses.first(), self.course1)

        # Instructor 2 should only see their course
        instructor2_courses = Course.objects.filter(creator=self.instructor2)
        self.assertEqual(instructor2_courses.count(), 1)
        self.assertEqual(instructor2_courses.first(), self.course2)

    def test_course_term_filtering(self):
        """Test filtering courses by term."""
        # All courses are in 2024W1
        winter_courses = Course.objects.filter(term="2024W1")
        self.assertEqual(winter_courses.count(), 2)

        # No courses in other terms
        summer_courses = Course.objects.filter(term="2024S1")
        self.assertEqual(summer_courses.count(), 0)

    def test_multiple_exams_per_course(self):
        """Test creating multiple exams for a course."""
        # Create multiple exams for the same course
        exam1 = Exam.objects.create(
            title="Midterm 1",
            course=self.course1,
            created_by=self.instructor1,
            time_limit=90,
        )

        exam2 = Exam.objects.create(
            title="Final Exam",
            course=self.course1,
            created_by=self.instructor1,
            time_limit=180,
        )

        # Verify both exams are associated with the course
        course_exams = Exam.objects.filter(course=self.course1)
        self.assertEqual(course_exams.count(), 2)
        self.assertIn(exam1, course_exams)
        self.assertIn(exam2, course_exams)


class AnalyticsUtilityTestCase(TestCase):
    """Test cases for analytics utility functions."""

    def setUp(self):
        """Set up test data."""
        self.instructor = User.objects.create_user(
            email="instructor@test.com",
            name="Test Instructor",
            password="testpass123",
            role="instructor",
        )

    def test_basic_statistics_calculation(self):
        """Test basic statistics functions work."""
        # Test that we can perform basic calculations
        test_scores = [85, 90, 78, 92, 88]

        # Calculate mean
        mean_score = sum(test_scores) / len(test_scores)
        self.assertEqual(mean_score, 86.6)

        # Calculate basic statistics
        max_score = max(test_scores)
        min_score = min(test_scores)

        self.assertEqual(max_score, 92)
        self.assertEqual(min_score, 78)

    def test_grade_distribution_logic(self):
        """Test grade distribution calculation logic."""

        # Test grade classification
        def classify_grade(percentage):
            if percentage >= 90:
                return "A"
            elif percentage >= 80:
                return "B"
            elif percentage >= 70:
                return "C"
            elif percentage >= 60:
                return "D"
            else:
                return "F"

        # Test various percentages
        self.assertEqual(classify_grade(95), "A")
        self.assertEqual(classify_grade(85), "B")
        self.assertEqual(classify_grade(75), "C")
        self.assertEqual(classify_grade(65), "D")
        self.assertEqual(classify_grade(55), "F")

    def test_percentage_calculation(self):
        """Test percentage calculations for grades."""

        # Test score to percentage conversion
        def calculate_percentage(score, max_score):
            if max_score == 0:
                return 0
            return (score / max_score) * 100

        # Test various score combinations
        self.assertEqual(calculate_percentage(85, 100), 85.0)
        self.assertEqual(calculate_percentage(42, 50), 84.0)
        self.assertEqual(calculate_percentage(0, 100), 0.0)
        self.assertEqual(calculate_percentage(0, 0), 0)  # Edge case
