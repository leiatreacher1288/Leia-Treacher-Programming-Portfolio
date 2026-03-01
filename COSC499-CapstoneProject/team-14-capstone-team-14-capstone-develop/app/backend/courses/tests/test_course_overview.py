# src/__tests__/backend/test_course_overview.py
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from courses.models import Course, CourseInstructor, Student
from exams.models import Exam

User = get_user_model()


class CourseOverviewTests(TestCase):
    """
    Test course overview functionality including
    instructor assignment and activity tracking
    """

    def setUp(self):
        self.client = APIClient()
        # Create test users
        self.instructor1 = User.objects.create_user(
            email="instructor1@test.com", password="testpass123", name="John Smith"
        )
        self.instructor2 = User.objects.create_user(
            email="instructor2@test.com", password="testpass123", name="Jane Doe"
        )
        self.client.force_authenticate(user=self.instructor1)

    def test_course_creation_sets_instructor_field(self):
        """Test that creating a course automatically sets the instructor field"""
        url = reverse("course-list")
        data = {
            "code": "CS101",
            "name": "Introduction to Computer Science",
            "description": "Basic CS concepts",
            "term": "Fall 2025",
        }
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["instructor"], "John Smith")

        # Verify in database
        course = Course.objects.get(code="CS101")
        self.assertEqual(course.instructor, "John Smith")
        self.assertIn(self.instructor1, course.instructors.all())

    def test_course_detail_includes_timestamps(self):
        """Test that course detail returns created_at and updated_at"""
        course = Course.objects.create(
            code="CS101",
            name="Test Course",
            term="Fall 2025",
            instructor=self.instructor1.name,
        )
        course.instructors.add(self.instructor1)

        url = reverse("course-detail", kwargs={"pk": course.pk})
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertIn("created_at", response.data)
        self.assertIn("updated_at", response.data)
        self.assertIn("instructor", response.data)
        self.assertEqual(response.data["instructor"], "John Smith")

    def test_add_instructor_updates_main_instructor_if_empty(self):
        """
        A MAIN/FULL instructor can add another instructor.
        The request now returns **201 CREATED** and leaves the `instructor`
        text field unchanged when it was blank.
        """
        course = Course.objects.create(
            code="CS101",
            name="Test Course",
            term="Fall 2025",
            instructor="",  # text field intentionally blank
        )

        # make self.instructor1 the MAIN/FULL accepted instructor
        CourseInstructor.objects.create(
            course=course,
            user=self.instructor1,
            role=CourseInstructor.Role.MAIN,
            access=CourseInstructor.Access.FULL,
            accepted=True,
        )

        self.client.force_authenticate(user=self.instructor1)
        url = reverse("course-add-instructor", kwargs={"pk": course.pk})
        resp = self.client.post(url, {"email": self.instructor2.email}, format="json")

        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        course.refresh_from_db()
        self.assertEqual(course.instructor, "")  # stays blank
        self.assertTrue(
            CourseInstructor.objects.filter(
                course=course, user=self.instructor2
            ).exists()
        )

    def test_remove_instructor_updates_main_instructor(self):
        """
        The MAIN instructor **cannot** be removed.
        ‑ The endpoint must return **400 BAD REQUEST** with an explanatory message.
        ‑ The CourseInstructor row and the `instructor` text field remain untouched.
        """
        course = Course.objects.create(
            code="CS101",
            name="Test Course",
            term="Fall 2025",
            instructor=self.instructor1.name,
        )

        # create links: MAIN (to be “removed”) + a secondary
        CourseInstructor.objects.create(
            course=course,
            user=self.instructor1,
            role=CourseInstructor.Role.MAIN,
            access=CourseInstructor.Access.FULL,
            accepted=True,
        )
        CourseInstructor.objects.create(
            course=course,
            user=self.instructor2,
            role=CourseInstructor.Role.SEC,
            access=CourseInstructor.Access.FULL,
            accepted=True,
        )

        self.client.force_authenticate(user=self.instructor1)
        url = reverse("course-remove-instructor", kwargs={"pk": course.pk})
        resp = self.client.post(url, {"email": self.instructor1.email}, format="json")

        # ── expectation: cannot remove MAIN ──────────────────────────────
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Cannot remove the last main instructor", resp.data["error"])

        course.refresh_from_db()
        self.assertEqual(course.instructor, self.instructor1.name)  # unchanged
        self.assertTrue(
            CourseInstructor.objects.filter(
                course=course, user=self.instructor1
            ).exists()
        )

    def test_course_statistics_in_detail_view(self):
        """Test that course detail includes exam_count and student_count"""
        course = Course.objects.create(
            code="CS101",
            name="Test Course",
            term="Fall 2025",
            instructor=self.instructor1.name,
        )
        course.instructors.add(self.instructor1)

        # Add students
        for i in range(3):
            Student.objects.create(
                course=course,
                name="Student {i}",
                student_id=f"S00{i}",
                email="student{i}@test.com",
                is_active=True,
            )

        # Add one inactive student
        Student.objects.create(
            course=course,
            name="Inactive Student",
            student_id="S999",
            email="inactive@test.com",
            is_active=False,
        )

        # Add exams
        for i in range(2):
            Exam.objects.create(
                course=course,
                title="Exam {i}",
                exam_type="quiz",
                created_by=self.instructor1,
            )

        url = reverse("course-detail", kwargs={"pk": course.pk})
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["student_count"], 3)  # Only active students
        self.assertEqual(response.data["exam_count"], 2)

    def test_recent_activity_data_structure(self):
        """Test that course provides data needed for recent activity"""
        """Test that course provides data needed for recent activity"""
        # Create course with specific timestamps
        course = Course.objects.create(
            code="CS101",
            name="Test Course",
            term="Fall 2025",
            instructor=self.instructor1.name,
            created_at=timezone.now() - timedelta(days=5),
            updated_at=timezone.now() - timedelta(days=2),
        )
        course.instructors.add(self.instructor1)

        # Get course detail
        url = reverse("course-detail", kwargs={"pk": course.pk})
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(response.data["created_at"])
        self.assertIsNotNone(response.data["updated_at"])
        self.assertEqual(response.data["instructor"], "John Smith")

    def test_course_without_instructor_field(self):
        """Test handling of courses without instructor field set"""
        course = Course.objects.create(
            code="CS101",
            name="Test Course",
            term="Fall 2025",
            # No instructor field
        )
        course.instructors.add(self.instructor1)

        url = reverse("course-detail", kwargs={"pk": course.pk})
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        # Should still return instructor data from relationship
        self.assertIn("instructor", response.data)

    def test_scheduled_date_in_exam_list(self):
        """Test that exam list includes scheduled_date field"""

        """Test that exam list includes scheduled_date field"""
        course = Course.objects.create(
            code="CS101",
            name="Test Course",
            term="Fall 2025",
            instructor=self.instructor1.name,
        )

        # Ensure instructor is properly associated with course
        CourseInstructor.objects.create(
            course=course,
            user=self.instructor1,
            role=CourseInstructor.Role.MAIN,
            access=CourseInstructor.Access.FULL,
            accepted=True,
        )

        # Create an exam for the course
        from exams.models import Exam

        exam = Exam.objects.create(
            course=course,
            title="Test Exam",
            description="Test exam description",
            exam_type="midterm",
            time_limit=120,
            num_variants=2,
            questions_per_variant=5,
            randomize_questions=True,
            randomize_choices=True,
            created_by=self.instructor1,
        )

        # Get exams for course
        url = reverse("exam-list")
        response = self.client.get(url, {"course": course.id})

        self.assertEqual(response.status_code, 200)
        self.assertGreater(len(response.data), 0)
        exam_data = response.data[0]
        self.assertIn("scheduled_date", exam_data)
        self.assertIn("created_at", exam_data)
        self.assertIn("course_term", exam_data)

    def test_student_created_at_field(self):
        """
        An accepted instructor can list students and each record contains `created_at`.
        """
        course = Course.objects.create(
            code="CS101",
            name="Test Course",
            term="Fall 2025",
            instructor=self.instructor1.name,
        )

        CourseInstructor.objects.create(
            course=course,
            user=self.instructor1,
            role=CourseInstructor.Role.MAIN,
            access=CourseInstructor.Access.FULL,
            accepted=True,
        )

        Student.objects.create(
            course=course,
            name="Test Student",
            student_id="S100",
            email="test@student.com",
            is_active=True,
        )

        self.client.force_authenticate(user=self.instructor1)
        url = reverse("course-students-list", kwargs={"course_pk": course.pk})
        resp = self.client.get(url)

        self.assertEqual(resp.status_code, 200)
        self.assertIn("students", resp.data)
        self.assertGreater(len(resp.data["students"]), 0)
        student_data = resp.data["students"][0]
        self.assertIn("created_at", student_data)

    def test_empty_instructor_field_handling(self):
        """Test that empty instructor field is handled gracefully"""

        """Test that empty instructor field is handled gracefully"""
        course = Course.objects.create(
            code="CS101",
            name="Test Course",
            term="Fall 2025",
            instructor="",  # Empty string
        )
        course.instructors.add(self.instructor1)

        url = reverse("course-detail", kwargs={"pk": course.pk})
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        # Should return empty string or None, not cause error
        self.assertIn("instructor", response.data)


class CourseOverviewIntegrationTests(TestCase):
    """Integration tests for complete overview functionality"""

    def setUp(self):
        self.client = APIClient()
        self.instructor = User.objects.create_user(
            email="instructor@test.com", password="testpass123", name="Prof. Smith"
        )
        self.client.force_authenticate(user=self.instructor)

    def test_complete_overview_data_flow(self):
        """Test the complete data flow for overview tab"""
        """Test the complete data flow for overview tab"""
        # Create course
        create_url = reverse("course-list")
        course_data = {
            "code": "CS301",
            "name": "Advanced Algorithms",
            "description": "Study of advanced algorithmic techniques",
            "term": "Spring 2025",
        }
        create_response = self.client.post(create_url, course_data, format="json")
        self.assertEqual(create_response.status_code, 201)

        course_id = create_response.data["id"]

        # Add students
        students_url = reverse("course-students-list", kwargs={"course_pk": course_id})
        for i in range(5):
            student_data = {
                "student_id": f"2025{i:03d}",
                "name": f"Student {i}",
                "email": f"student{i}@university.edu",
                "section": "A",
                "is_anonymous": False,
            }
            self.client.post(students_url, student_data, format="json")

        # Create exams with different scheduled dates
        exams_url = reverse("exam-list")

        # Past exam
        past_exam_data = {
            "title": "Midterm 1",
            "exam_type": "midterm",
            "course": course_id,
            "time_limit": 90,
            "scheduled_date": (timezone.now() - timedelta(days=7)).isoformat(),
        }
        self.client.post(exams_url, past_exam_data, format="json")

        # Future exam
        future_exam_data = {
            "title": "Final Exam",
            "exam_type": "final",
            "course": course_id,
            "time_limit": 120,
            "scheduled_date": (timezone.now() + timedelta(days=14)).isoformat(),
        }
        self.client.post(exams_url, future_exam_data, format="json")

        # Get course detail for overview
        detail_url = reverse("course-detail", kwargs={"pk": course_id})
        detail_response = self.client.get(detail_url)

        self.assertEqual(detail_response.status_code, 200)
        self.assertEqual(detail_response.data["instructor"], "Prof. Smith")
        self.assertEqual(detail_response.data["student_count"], 5)
        self.assertEqual(detail_response.data["exam_count"], 2)

        # Get students to check created_at
        students_response = self.client.get(students_url)
        self.assertEqual(students_response.status_code, 200)
        self.assertIn("students", students_response.data)
        for student in students_response.data["students"]:
            self.assertIn("created_at", student)

        # Get exams to check scheduled_date
        exams_response = self.client.get(exams_url, {"course": course_id})
        self.assertEqual(exams_response.status_code, 200)
        for exam in exams_response.data:
            self.assertIn("scheduled_date", exam)
            self.assertIn("created_at", exam)
