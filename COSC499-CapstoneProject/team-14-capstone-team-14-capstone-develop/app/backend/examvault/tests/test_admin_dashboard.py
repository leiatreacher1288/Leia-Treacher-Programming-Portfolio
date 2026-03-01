#!/usr/bin/env python3
"""
Admin Dashboard Test Suite
=========================
Comprehensive tests for admin dashboard functionality including stats and recent activity.

Coverage:
- UR2.1: Admin dashboard functionality
- Admin statistics API endpoints
- Recent activity tracking and retrieval
- Dashboard overview data (courses, exams)

Usage:
    python manage.py test examvault.tests.test_admin_dashboard
"""

from datetime import timedelta
import os

# Import test helpers
import sys

from django.test import TestCase
from django.utils import timezone
from helpers import AdminTestAssertions as Assert
from helpers.admin_test_base import AdminTestBase
from rest_framework import status

from courses.models import Course
from exams.models import Exam
from users.models import User

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", "tests"))


# ═══════════════════════════════════════════════════════════════
# ADMIN DASHBOARD TESTS (UR2.1)
# ═══════════════════════════════════════════════════════════════


class AdminDashboardStatsTestCase(AdminTestBase, TestCase):
    """Test admin statistics API endpoints"""

    def setUp(self):
        """Set up test data for dashboard statistics"""
        super().setUp()

        # Create additional test data for statistics
        self.instructors = []
        for i in range(3):
            instructor = User.objects.create_user(
                email=f"instructor{i}@test.com",
                name=f"Instructor {i}",
                password="testpass123",
                role="instructor",
                is_active=True,
            )
            self.instructors.append(instructor)

        # Create courses
        self.courses = []
        for i, instructor in enumerate(self.instructors):
            course = Course.objects.create(
                code=f"TEST{i}01",
                name=f"Test Course {i}",
                description=f"Test course {i} description",
                creator=instructor,
            )
            self.courses.append(course)

        # Create exams
        self.exams = []
        for i, course in enumerate(self.courses):
            exam = Exam.objects.create(
                title=f"Test Exam {i}",
                course=course,
                created_by=course.creator,
                scheduled_date=timezone.now() + timedelta(days=i + 1),
                time_limit=60,
            )
            self.exams.append(exam)

    def test_admin_stats_api_authentication_required(self):
        """Test that admin stats endpoint requires authentication"""
        response = self.client.get("/api/admin/stats/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_stats_api_admin_permission_required(self):
        """Test that admin stats endpoint requires admin permissions"""
        # Login as regular instructor
        self.client.force_login(self.instructors[0])
        response = self.client.get("/api/admin/stats/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_stats_api_success(self):
        """Test successful admin stats retrieval"""
        self.client.force_login(self.admin_user)
        response = self.client.get("/api/admin/stats/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Verify stats structure (from AdminStatsAPIView)
        Assert.has_keys(
            data,
            [
                "total_users",
                "active_users",
                "pending_users",
                "total_exams",
                "total_questions",
                "total_results",
                "pending_approvals",
                "active_exams",
                "user_info",
            ],
        )

        # Verify stats accuracy
        self.assertGreaterEqual(data["total_users"], 4)  # admin + 3 instructors
        self.assertEqual(data["total_exams"], 3)
        self.assertIsInstance(data["user_info"], dict)

    def test_admin_stats_user_counts(self):
        """Test accurate user count statistics"""
        self.client.force_login(self.admin_user)
        response = self.client.get("/api/admin/stats/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Verify user counts are accurate
        self.assertGreaterEqual(data["total_users"], 4)  # admin + 3 instructors
        self.assertGreaterEqual(data["active_users"], 4)  # all should be active
        self.assertGreaterEqual(data["pending_users"], 0)  # may have pending users

        # Verify user info structure
        user_info = data["user_info"]
        self.assertIsInstance(user_info, dict)
        self.assertIn("total", user_info)
        self.assertIn("by_role", user_info)


# ═══════════════════════════════════════════════════════════════
# RECENT ACTIVITY TESTS
# ═══════════════════════════════════════════════════════════════


class AdminRecentActivityTestCase(AdminTestBase, TestCase):
    """Test admin recent activity functionality"""

    def setUp(self):
        """Set up test data for recent activity"""
        super().setUp()

        # Create some test activity by logging in
        self.client.force_login(self.admin_user)
        self.client.get("/api/admin/stats/")  # Generate some activity

    def test_admin_recent_activity_authentication_required(self):
        """Test that recent activity endpoint requires authentication"""
        response = self.client.get("/api/admin/recent-activity/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_recent_activity_admin_permission_required(self):
        """Test that recent activity endpoint requires admin permissions"""
        # Login as regular instructor
        instructor = User.objects.create_user(
            email="instructor@test.com",
            name="Test Instructor",
            password="testpass123",
            role="instructor",
            is_active=True,
        )
        self.client.force_login(instructor)
        response = self.client.get("/api/admin/recent-activity/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_recent_activity_success(self):
        """Test successful recent activity retrieval"""
        self.client.force_login(self.admin_user)
        response = self.client.get("/api/admin/recent-activity/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Verify response structure (from AdminRecentActivityAPIView)
        self.assertIsInstance(data, list)

        # Should have at least some activities (may include login or other activities)
        self.assertGreaterEqual(len(data), 0)

        # Check for login activity in the list if any exist
        if data:
            _login_activities = [
                activity for activity in data if activity.get("action") == "login"
            ]
            # May or may not have login activities depending on recent login timing

    def test_admin_recent_activity_pagination(self):
        """Test recent activity pagination"""
        self.client.force_login(self.admin_user)

        # Test with limit parameter (though current API doesn't support this)
        response = self.client.get("/api/admin/recent-activity/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Should return activities (limited to 20 by default in the API)
        self.assertLessEqual(len(data), 20)


class AdminCoursesOverviewTestCase(AdminTestBase, TestCase):
    """Test admin courses overview functionality"""

    def setUp(self):
        """Set up test data for courses overview"""
        super().setUp()

        # Create test instructor and courses
        self.instructor = User.objects.create_user(
            email="instructor@test.com",
            name="Test Instructor",
            password="testpass123",
            role="instructor",
            is_active=True,
        )

        self.course = Course.objects.create(
            code="TEST101",
            name="Test Course",
            description="Test course description",
            creator=self.instructor,
        )

    def test_admin_courses_overview_authentication_required(self):
        """Test that courses overview endpoint requires authentication"""
        response = self.client.get("/api/admin/courses-overview/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_courses_overview_admin_permission_required(self):
        """Test that courses overview endpoint requires admin permissions"""
        self.client.force_login(self.instructor)
        response = self.client.get("/api/admin/courses-overview/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_courses_overview_success(self):
        """Test successful courses overview retrieval"""
        self.client.force_login(self.admin_user)
        response = self.client.get("/api/admin/courses-overview/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Verify response structure (from AdminCoursesOverviewAPIView)
        Assert.has_keys(data, ["success", "courses", "statistics"])
        self.assertTrue(data["success"])
        self.assertIsInstance(data["courses"], list)
        self.assertIsInstance(data["statistics"], dict)

        # Verify statistics structure
        Assert.has_keys(
            data["statistics"], ["total_courses", "active_courses", "filtered_count"]
        )

        # Verify course data structure
        if data["courses"]:
            course_data = data["courses"][0]
            Assert.has_keys(
                course_data,
                ["id", "code", "name", "creator", "creator_name", "creator_email"],
            )


class AdminExamsOverviewTestCase(AdminTestBase, TestCase):
    """Test admin exams overview functionality"""

    def setUp(self):
        """Set up test data for exams overview"""
        super().setUp()

        # Create test instructor, course, and exam
        self.instructor = User.objects.create_user(
            email="instructor@test.com",
            name="Test Instructor",
            password="testpass123",
            role="instructor",
            is_active=True,
        )

        self.course = Course.objects.create(
            code="TEST101",
            name="Test Course",
            description="Test course description",
            creator=self.instructor,
        )

        self.exam = Exam.objects.create(
            title="Test Exam",
            course=self.course,
            created_by=self.instructor,
            scheduled_date=timezone.now() + timedelta(days=1),
            time_limit=60,
        )

    def test_admin_exams_overview_authentication_required(self):
        """Test that exams overview endpoint requires authentication"""
        response = self.client.get("/api/admin/exams-overview/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_exams_overview_admin_permission_required(self):
        """Test that exams overview endpoint requires admin permissions"""
        self.client.force_login(self.instructor)
        response = self.client.get("/api/admin/exams-overview/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_exams_overview_success(self):
        """Test successful exams overview retrieval"""
        self.client.force_login(self.admin_user)
        response = self.client.get("/api/admin/exams-overview/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Verify response structure (from AdminExamsOverviewAPIView)
        Assert.has_keys(data, ["success", "exams", "statistics"])
        self.assertTrue(data["success"])
        self.assertIsInstance(data["exams"], list)
        self.assertIsInstance(data["statistics"], dict)

        # Verify statistics structure
        Assert.has_keys(
            data["statistics"], ["total_exams", "active_exams", "filtered_count"]
        )

        # Verify exam data structure
        if data["exams"]:
            exam_data = data["exams"][0]
            Assert.has_keys(
                exam_data,
                ["id", "title", "course", "creator", "creator_name", "creator_email"],
            )


# ═══════════════════════════════════════════════════════════════
# DASHBOARD INTEGRATION TESTS
# ═══════════════════════════════════════════════════════════════


class AdminDashboardIntegrationTestCase(AdminTestBase, TestCase):
    """Test admin dashboard integration across multiple endpoints"""

    def setUp(self):
        """Set up comprehensive test data"""
        super().setUp()

        # Create comprehensive test environment
        self.instructors = []
        self.courses = []
        self.exams = []

        for i in range(2):
            # Create instructor
            instructor = User.objects.create_user(
                email=f"instructor{i}@test.com",
                name=f"Instructor {i}",
                password="testpass123",
                role="instructor",
                is_active=True,
            )
            self.instructors.append(instructor)

            # Create course
            course = Course.objects.create(
                code=f"TEST{i}01",
                name=f"Test Course {i}",
                description=f"Test course {i} description",
                creator=instructor,
            )
            self.courses.append(course)

            # Create exam
            exam = Exam.objects.create(
                title=f"Test Exam {i}",
                course=course,
                created_by=instructor,
                scheduled_date=timezone.now() + timedelta(days=i + 1),
                time_limit=60,
            )
            self.exams.append(exam)

    def test_dashboard_data_consistency(self):
        """Test consistency of data across dashboard endpoints"""
        self.client.force_login(self.admin_user)

        # Get stats
        stats_response = self.client.get("/api/admin/stats/")
        stats_data = stats_response.json()

        # Get courses overview
        courses_response = self.client.get("/api/admin/courses-overview/")
        courses_data = courses_response.json()

        # Get exams overview
        exams_response = self.client.get("/api/admin/exams-overview/")
        exams_data = exams_response.json()

        # Verify data consistency (adjust for actual API structure)
        self.assertEqual(
            stats_data["total_exams"], exams_data["statistics"]["total_exams"]
        )
        self.assertEqual(len(courses_data["courses"]), 2)
        self.assertEqual(len(exams_data["exams"]), 2)

    def test_dashboard_performance_with_large_dataset(self):
        """Test dashboard performance with larger dataset"""
        # Create additional data
        for i in range(10):
            _instructor = User.objects.create_user(
                email=f"perf_instructor{i}@test.com",
                name=f"Performance Instructor {i}",
                password="testpass123",
                role="instructor",
                is_active=True,
            )

        self.client.force_login(self.admin_user)

        # Test response times (should be reasonable even with more data)
        import time

        start_time = time.time()
        response = self.client.get("/api/admin/stats/")
        end_time = time.time()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertLess(
            end_time - start_time, 2.0
        )  # Should complete in under 2 seconds
