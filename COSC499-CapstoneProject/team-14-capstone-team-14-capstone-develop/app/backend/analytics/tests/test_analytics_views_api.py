"""
Test cases for analytics views API endpoints.
"""

from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from analytics.models import SimilarityFlag
from courses.models import Course, Student
from exams.models import Exam, Variant
from questions.models import Question, QuestionBank
from results.models import ExamResult

User = get_user_model()


class AnalyticsViewsAPITestCase(APITestCase):
    """Test cases for analytics views API endpoints."""

    def setUp(self):
        """Set up test data."""
        # Create test users - Fixed to use email instead of username
        self.instructor = User.objects.create_user(
            email="test_instructor@test.com",
            name="Test Instructor",
            password="testpass123",
            role="instructor",
        )

        self.student_user1 = User.objects.create_user(
            email="test_student1@test.com",
            name="Test Student 1",
            password="testpass123",
            role="instructor",  # Your model only supports instructor/admin roles
        )

        self.student_user2 = User.objects.create_user(
            email="test_student2@test.com",
            name="Test Student 2",
            password="testpass123",
            role="instructor",
        )

        # Create another instructor for permission tests
        self.other_instructor = User.objects.create_user(
            email="other_instructor@test.com",
            name="Other Instructor",
            password="testpass123",
            role="instructor",
        )

        # Create test course
        self.course = Course.objects.create(
            code="MATH101",
            name="Mathematics 101",
            description="Basic Mathematics",
            instructor="Dr. Test",
            term="W1 2024",
            creator=self.instructor,  # Changed from created_by to creator
        )

        # Create second course for comparison tests
        self.course2 = Course.objects.create(
            code="PHYS101",
            name="Physics 101",
            description="Basic Physics",
            instructor="Dr. Physics",
            term="W1 2024",
            creator=self.instructor,
        )

        # Course instructor relationships are automatically created by Course.save()
        # when creator is set, so we don't need to create them manually

        # Create students
        self.student1 = Student.objects.create(
            student_id="S001",
            name="Test Student 1",
            email="student1@test.com",
            course=self.course,
            section="A01",
            is_active=True,
        )

        self.student2 = Student.objects.create(
            student_id="S002",
            name="Test Student 2",
            email="student2@test.com",
            course=self.course,
            section="A01",
            is_active=True,
        )

        # Create question bank
        self.question_bank = QuestionBank.objects.create(
            title="Test Bank",  # Changed from name to title
            course=self.course,
            created_by=self.instructor,
        )

        # Create questions
        self.question1 = Question.objects.create(
            bank=self.question_bank,
            prompt="What is 2+2?",
            choices=["3", "4", "5", "6"],  # Choices as list
            correct_answer=["4"],  # Correct answer as list
            points=10,
            difficulty=1,  # Easy
        )

        self.question2 = Question.objects.create(
            bank=self.question_bank,
            prompt="What is 3*3?",
            choices=["6", "9", "12", "15"],
            correct_answer=["9"],
            points=10,
            difficulty=2,  # Medium
        )

        # Create exam
        self.exam = Exam.objects.create(
            title="Midterm Exam",
            course=self.course,
            time_limit=60,
            created_by=self.instructor,
        )

        # Create variant
        self.variant = Variant.objects.create(
            exam=self.exam, version_label="A"  # Changed from name to version_label
        )

        # Create exam results with grading details
        import json

        grading_details1 = json.dumps(
            [
                {
                    "question_id": "Q1",
                    "question_number": 1,
                    "question_text": "What is 2+2?",
                    "student_answer": "4",
                    "status": "correct",
                },
                {
                    "question_id": "Q2",
                    "question_number": 2,
                    "question_text": "What is 3*3?",
                    "student_answer": "9",
                    "status": "correct",
                },
            ]
        )

        grading_details2 = json.dumps(
            [
                {
                    "question_id": "Q1",
                    "question_number": 1,
                    "question_text": "What is 2+2?",
                    "student_answer": "4",
                    "status": "correct",
                },
                {
                    "question_id": "Q2",
                    "question_number": 2,
                    "question_text": "What is 3*3?",
                    "student_answer": "6",
                    "status": "incorrect",
                },
            ]
        )

        self.result1 = ExamResult.objects.create(
            exam=self.exam,
            student=self.student1,
            variant=self.variant,
            score=85,
            total_questions=10,
            correct_answers=8,
            incorrect_answers=2,
            unanswered=0,
            submitted_at=timezone.now(),
            raw_responses={},  # Add required field
            grading_details=grading_details1,
        )

        self.result2 = ExamResult.objects.create(
            exam=self.exam,
            student=self.student2,
            variant=self.variant,
            score=75,
            total_questions=10,
            correct_answers=7,
            incorrect_answers=3,
            unanswered=0,
            submitted_at=timezone.now(),
            raw_responses={},
            grading_details=grading_details2,
        )

        # Authenticate as instructor by default
        self.client.force_authenticate(user=self.instructor)

    def test_instructor_overview_authenticated(self):
        """Test instructor overview endpoint with authenticated user."""
        url = reverse("analytics:instructor-overview")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Check response structure
        self.assertIn("overview", data)
        self.assertIn("top_performing_courses", data)
        self.assertIn("recent_activity", data)
        self.assertIn("grade_trends", data)

        # Check overview values
        overview = data["overview"]
        self.assertEqual(overview["total_courses"], 2)
        self.assertEqual(overview["total_students"], 2)
        self.assertEqual(overview["total_exams"], 1)
        self.assertGreaterEqual(overview["average_grade"], 0)

    def test_instructor_overview_unauthenticated(self):
        """Test instructor overview endpoint without authentication."""
        self.client.force_authenticate(user=None)
        url = reverse("analytics:instructor-overview")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_question_analytics(self):
        """Test question analytics endpoint."""
        url = reverse("analytics:question-analytics")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Check response structure
        self.assertIn("questionStatistics", data)
        self.assertIn("totalQuestions", data)
        self.assertIn("examCount", data)
        self.assertIn("mostMissedPerCourse", data)

        # Verify counts
        self.assertEqual(data["examCount"], 1)
        self.assertEqual(data["totalQuestions"], 2)  # Updated based on actual response

    def test_grade_distribution(self):
        """Test grade distribution endpoint."""
        url = reverse("analytics:grade-distribution")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Check response structure
        self.assertIn("distribution", data)
        self.assertIn("totalResults", data)

        # Check distribution format
        distribution = data["distribution"]
        self.assertEqual(len(distribution), 5)  # A, B, C, D, F

        # Verify grade ranges
        expected_ranges = [
            "A (90-100%)",
            "B (80-89%)",
            "C (70-79%)",
            "D (60-69%)",
            "F (0-59%)",
        ]
        for i, grade in enumerate(distribution):
            self.assertEqual(grade["range"], expected_ranges[i])
            self.assertIn("count", grade)
            self.assertIn("percentage", grade)

        # Verify total results
        self.assertEqual(data["totalResults"], 2)

    def test_performance_metrics(self):
        """Test performance metrics endpoint."""
        url = reverse("analytics:performance-metrics")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Check all required metrics
        required_metrics = [
            "mean",
            "median",
            "standardDeviation",
            "skewness",
            "reliability",
            "totalResults",
        ]
        for metric in required_metrics:
            self.assertIn(metric, data)

        # Verify calculations
        self.assertEqual(data["totalResults"], 2)
        self.assertAlmostEqual(data["mean"], 80.0, places=1)  # (85+75)/2
        self.assertAlmostEqual(data["median"], 80.0, places=1)

    def test_similarity_flags_post_reviewed(self):
        """Test updating similarity flag to reviewed status."""
        # Create a flag
        flag = SimilarityFlag.objects.create(
            exam=self.exam,
            variant=self.variant,
            student1=self.student1,
            student2=self.student2,
            similarity_score=Decimal("90.0"),
            flagged_questions=[1, 2],
            status="pending",
        )

        url = reverse("analytics:similarity-flags")
        data = {
            "flag_id": flag.id,
            "status": "reviewed",
            "notes": "Reviewed and requires further investigation",
        }

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()

        # Check response
        self.assertTrue(response_data["success"])
        self.assertEqual(response_data["message"], "Flag updated to reviewed")
        self.assertEqual(response_data["flag"]["status"], "reviewed")

        # Verify database update
        flag.refresh_from_db()
        self.assertEqual(flag.status, "reviewed")
        self.assertEqual(flag.notes, "Reviewed and requires further investigation")
        self.assertEqual(flag.reviewer, self.instructor)

    def test_similarity_flags_post_dismissed(self):
        """Test dismissing a similarity flag."""
        flag = SimilarityFlag.objects.create(
            exam=self.exam,
            variant=self.variant,
            student1=self.student1,
            student2=self.student2,
            similarity_score=Decimal("75.0"),
            flagged_questions=[1],
            status="pending",
        )

        url = reverse("analytics:similarity-flags")
        data = {
            "flag_id": flag.id,
            "status": "dismissed",
            "notes": "False positive - different solution approaches",
        }

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify update
        flag.refresh_from_db()
        self.assertEqual(flag.status, "dismissed")

    def test_similarity_flags_post_invalid_status(self):
        """Test updating flag with invalid status."""
        flag = SimilarityFlag.objects.create(
            exam=self.exam,
            variant=self.variant,
            student1=self.student1,
            student2=self.student2,
            similarity_score=Decimal("80.0"),
            flagged_questions=[1],
            status="pending",
        )

        url = reverse("analytics:similarity-flags")
        data = {"flag_id": flag.id, "status": "invalid_status"}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.json())

    def test_similarity_flags_post_missing_flag_id(self):
        """Test updating flag without flag_id."""
        url = reverse("analytics:similarity-flags")
        data = {"status": "reviewed"}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.json())

    def test_similarity_flags_post_permission_denied(self):
        """Test updating flag without permission."""
        flag = SimilarityFlag.objects.create(
            exam=self.exam,
            variant=self.variant,
            student1=self.student1,
            student2=self.student2,
            similarity_score=Decimal("85.0"),
            flagged_questions=[1],
            status="pending",
        )

        # Authenticate as different instructor
        self.client.force_authenticate(user=self.other_instructor)

        url = reverse("analytics:similarity-flags")
        data = {"flag_id": flag.id, "status": "reviewed"}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_year_over_year_trends_all_timeframes(self):
        """Test year-over-year trends with all timeframes."""
        timeframes = ["1week", "1month", "1year", "all"]

        for timeframe in timeframes:
            url = reverse("analytics:trends")
            response = self.client.get(url, {"timeframe": timeframe})

            self.assertEqual(response.status_code, status.HTTP_200_OK)
            data = response.json()

            # Check response structure
            self.assertIn("trends", data)
            self.assertIn("timeframe", data)
            self.assertIn("totalDataPoints", data)

            # Verify timeframe
            self.assertEqual(data["timeframe"], timeframe)

            # Check trends structure
            if data["trends"]:
                trend = data["trends"][0]
                self.assertIn("year", trend)
                self.assertIn("term", trend)
                self.assertIn("average", trend)
                self.assertIn("count", trend)

    def test_course_statistics_valid_course(self):
        """Test course statistics for existing course."""
        url = reverse("analytics:course-statistics", kwargs={"course_code": "MATH101"})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Check response structure
        required_fields = [
            "courseCode",
            "courseName",
            "totalSections",
            "averageAllYears",
            "averageLast5Years",
            "maxSectionAverage",
            "minSectionAverage",
            "historicalData",
        ]

        for field in required_fields:
            self.assertIn(field, data)

        # Verify data
        self.assertEqual(data["courseCode"], "MATH101")
        self.assertEqual(data["courseName"], "Mathematics 101")

    def test_course_statistics_nonexistent_course(self):
        """Test course statistics for non-existent course."""
        url = reverse(
            "analytics:course-statistics", kwargs={"course_code": "NONEXISTENT"}
        )
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_course_statistics_permission_denied(self):
        """Test course statistics without permission."""
        self.client.force_authenticate(user=self.other_instructor)

        url = reverse("analytics:course-statistics", kwargs={"course_code": "MATH101"})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_analytics_courses(self):
        """Test getting all courses for analytics."""
        url = reverse("analytics:courses")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertIn("courses", data)
        courses = data["courses"]

        # Should have 2 courses
        self.assertEqual(len(courses), 2)

        # Check course structure
        for course in courses:
            self.assertIn("id", course)
            self.assertIn("code", course)
            self.assertIn("title", course)
            self.assertIn("term", course)
            self.assertIn("description", course)

    def test_compare_courses_valid(self):
        """Test comparing multiple courses."""
        url = reverse("analytics:compare-courses")
        data = {"course_ids": [self.course.id, self.course2.id]}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        comparison_data = response.json()

        # Should have data for 2 courses
        self.assertEqual(len(comparison_data), 2)

        # Check structure
        for course_data in comparison_data:
            self.assertIn("course", course_data)
            self.assertIn("metrics", course_data)

            # Check course info
            course = course_data["course"]
            self.assertIn("id", course)
            self.assertIn("code", course)
            self.assertIn("title", course)

            # Check metrics
            metrics = course_data["metrics"]
            self.assertIn("averageScore", metrics)
            self.assertIn("studentCount", metrics)
            self.assertIn("examCount", metrics)
            self.assertIn("passRate", metrics)

    def test_compare_courses_insufficient_ids(self):
        """Test compare courses with only one course ID."""
        url = reverse("analytics:compare-courses")
        data = {"course_ids": [self.course.id]}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.json())

    def test_compare_courses_permission_denied(self):
        """Test compare courses without permission for one course."""
        # Create course not taught by instructor
        other_course = Course.objects.create(
            code="CHEM101",
            name="Chemistry 101",
            description="Basic Chemistry",
            instructor="Dr. Chem",
            term="W1 2024",
            creator=self.other_instructor,
        )

        url = reverse("analytics:compare-courses")
        data = {"course_ids": [self.course.id, other_course.id]}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_report_nonexistent_student(self):
        """Test student report for non-existent student."""
        url = reverse(
            "analytics:student-report",
            kwargs={"course_id": self.course.id, "student_id": 99999},
        )

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_student_report_permission_denied(self):
        """Test student report without permission."""
        self.client.force_authenticate(user=self.other_instructor)

        url = reverse(
            "analytics:student-report",
            kwargs={"course_id": self.course.id, "student_id": self.student1.id},
        )

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_similarity_detection_in_get_endpoint(self):
        """Test that similarity detection runs when accessing the endpoint."""
        # Create new exam with identical answers
        new_exam = Exam.objects.create(
            title="Recent Exam",
            course=self.course,
            time_limit=30,
            created_at=timezone.now() - timedelta(days=1),
            created_by=self.instructor,
        )

        new_variant = Variant.objects.create(
            exam=new_exam, version_label="A", is_locked=True
        )

        # Create results with identical answers
        import json

        grading_details = json.dumps(
            [
                {
                    "question_id": "Q1",
                    "question_number": 1,
                    "student_answer": "A",
                    "status": "correct",
                },
                {
                    "question_id": "Q2",
                    "question_number": 2,
                    "student_answer": "B",
                    "status": "correct",
                },
                {
                    "question_id": "Q3",
                    "question_number": 3,
                    "student_answer": "C",
                    "status": "correct",
                },
            ]
        )

        ExamResult.objects.create(
            exam=new_exam,
            student=self.student1,
            variant=new_variant,
            score=100,
            total_questions=3,
            raw_responses={},
            grading_details=grading_details,
        )

        ExamResult.objects.create(
            exam=new_exam,
            student=self.student2,
            variant=new_variant,
            score=100,
            total_questions=3,
            raw_responses={},
            grading_details=grading_details,
        )

        # Access endpoint which should trigger detection
        url = reverse("analytics:similarity-flags")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Should return valid response structure
        self.assertIn("totalFlags", data)
        self.assertIn("flags", data)
        self.assertIn("activeFlags", data)
        self.assertIn("highRiskFlags", data)

    def test_all_endpoints_require_authentication(self):
        """Test that all analytics endpoints require authentication."""
        self.client.force_authenticate(user=None)

        # Test GET endpoints
        get_endpoints = [
            reverse("analytics:instructor-overview"),
            reverse("analytics:question-analytics"),
            reverse("analytics:grade-distribution"),
            reverse("analytics:performance-metrics"),
            reverse("analytics:similarity-flags"),
            reverse("analytics:trends"),
            reverse("analytics:courses"),
            reverse("analytics:course-statistics", kwargs={"course_code": "MATH101"}),
            reverse(
                "analytics:student-report",
                kwargs={"course_id": self.course.id, "student_id": self.student1.id},
            ),
        ]

        for url in get_endpoints:
            response = self.client.get(url)
            self.assertEqual(
                response.status_code,
                status.HTTP_401_UNAUTHORIZED,
                f"GET {url} should require authentication",
            )

        # Test POST endpoints
        post_endpoints = [
            (
                reverse("analytics:similarity-flags"),
                {"flag_id": 1, "status": "reviewed"},
            ),
            (reverse("analytics:compare-courses"), {"course_ids": [1, 2]}),
        ]

        for url, data in post_endpoints:
            response = self.client.post(url, data, format="json")
            self.assertEqual(
                response.status_code,
                status.HTTP_401_UNAUTHORIZED,
                f"POST {url} should require authentication",
            )
