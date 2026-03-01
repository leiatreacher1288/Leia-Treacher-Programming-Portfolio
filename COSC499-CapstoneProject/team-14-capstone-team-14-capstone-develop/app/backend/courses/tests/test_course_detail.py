# courses/tests/test_course_detail.py
# ------------------------------------------------------------------
# End‑to‑end tests for the Course detail / ViewSet functionality
# Adapted to the new CourseInstructor‑based permission model
# ------------------------------------------------------------------

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from courses.models import Course, CourseInstructor, Student

User = get_user_model()


# ────────────────────────────────────────────────────────────────────
# Test helpers
# ────────────────────────────────────────────────────────────────────
def _make_main_full(course: Course, user):
    """
    Give *user* a MAIN / FULL, accepted CourseInstructor row on *course*.
    (One‑liner used in every set‑up to satisfy the new permission rules.)
    """
    CourseInstructor.objects.update_or_create(
        course=course,
        user=user,
        defaults={
            "role": CourseInstructor.Role.MAIN,
            "access": CourseInstructor.Access.FULL,
            "accepted": True,
        },
    )

    if course.creator_id is None:
        course.creator = user
        course.save(update_fields=["creator"])


# ────────────────────────────────────────────────────────────────────
# Course detail & CRUD tests
# ────────────────────────────────────────────────────────────────────
class CourseDetailTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="instructor@test.com",
            password="testpass123",
            name="Test Instructor",
        )
        self.client.force_authenticate(user=self.user)

        self.course = Course.objects.create(
            code="CS101",
            name="Introduction to Computer Science",
            description="Basic CS concepts",
            term="Fall 2025",
        )
        _make_main_full(self.course, self.user)

        self.course_detail_url = reverse("course-detail", kwargs={"pk": self.course.pk})

    # ── GET -----------------------------------------------------------------
    def test_get_course_detail_success(self):
        resp = self.client.get(self.course_detail_url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["code"], "CS101")
        self.assertEqual(resp.data["name"], "Introduction to Computer Science")

    def test_get_course_detail_not_found(self):
        """Test course detail for non-existent course"""

        """Test course detail for non-existent course"""
        response = self.client.get(reverse("course-detail", kwargs={"pk": 9999}))
        self.assertEqual(response.status_code, 404)

    def test_get_course_detail_unauthenticated(self):
        self.client.logout()
        resp = self.client.get(self.course_detail_url)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    # ── PUT / PATCH ---------------------------------------------------------
    def test_update_course_success(self):
        """Test updating course details"""

        """Test updating course details"""
        update_data = {
            "code": "CS101",
            "name": "Advanced Computer Science",
            "description": "Advanced CS concepts",
            "term": "Fall 2025",
        }
        resp = self.client.put(self.course_detail_url, update_data, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["name"], "Advanced Computer Science")

    def test_update_course_not_found(self):
        resp = self.client.put(
            reverse("course-detail", kwargs={"pk": 9999}),
            {"name": "New Title"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    # ── DELETE --------------------------------------------------------------
    def test_delete_course_success(self):
        resp = self.client.delete(self.course_detail_url)
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Course.objects.filter(pk=self.course.pk).exists())

    def test_delete_course_not_found(self):
        resp = self.client.delete(reverse("course-detail", kwargs={"pk": 9999}))
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)


# ────────────────────────────────────────────────────────────────────
# Tabs / auxiliary endpoints (still use retrieve for now)
# ────────────────────────────────────────────────────────────────────
class CourseTabsEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="instructor@test.com",
            password="testpass123",
            name="Test Instructor",
        )
        self.client.force_authenticate(user=self.user)

        self.course = Course.objects.create(
            code="CS101", name="Test Course", term="Fall 2025"
        )
        _make_main_full(self.course, self.user)

    def test_get_course_stats(self):
        resp = self.client.get(reverse("course-detail", kwargs={"pk": self.course.pk}))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("code", resp.data)
        self.assertIn("name", resp.data)

    def test_get_recent_activity(self):
        Student.objects.create(
            course=self.course,
            name="John Doe",
            student_id="12345",
            email="john@example.com",
        )
        resp = self.client.get(reverse("course-detail", kwargs={"pk": self.course.pk}))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_get_grade_distribution(self):
        resp = self.client.get(reverse("course-detail", kwargs={"pk": self.course.pk}))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)


# ────────────────────────────────────────────────────────────────────
# Validation tests
# ────────────────────────────────────────────────────────────────────
class CourseValidationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="instructor@test.com",
            password="testpass123",
            name="Test Instructor",
        )
        self.client.force_authenticate(user=self.user)

        self.course = Course.objects.create(
            code="CS101", name="Test Course", term="Fall 2025"
        )
        _make_main_full(self.course, self.user)

    def test_update_course_empty_title(self):
        url = reverse("course-detail", kwargs={"pk": self.course.pk})
        resp = self.client.put(
            url,
            {
                "code": "CS101",
                "name": "",  # invalid
                "description": "Some description",
                "term": "Fall 2025",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_course_invalid_term(self):
        url = reverse("course-detail", kwargs={"pk": self.course.pk})
        resp = self.client.put(
            url,
            {
                "code": "CS101",
                "name": "Test Course",
                "term": "Invalid Term 2025",
                "description": "Test",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_update_course_invalid_data_types(self):
        url = reverse("course-detail", kwargs={"pk": self.course.pk})
        resp = self.client.put(
            url,
            {"code": 12345, "name": None, "term": "Fall 2025"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_course_id_format(self):
        resp = self.client.get("/api/courses/detail/abc/")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)


# ────────────────────────────────────────────────────────────────────
# Integration: detail + students + list
# ────────────────────────────────────────────────────────────────────
class CourseIntegrationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="instructor@test.com",
            password="testpass123",
            name="Test Instructor",
        )
        self.client.force_authenticate(user=self.user)

        self.course = Course.objects.create(
            code="CS101", name="Test Course", term="Fall 2025"
        )
        _make_main_full(self.course, self.user)

    def test_full_course_load(self):
        for i in range(3):
            Student.objects.create(
                course=self.course,
                name="Student {i}",
                student_id=f"S00{i}",
                email="student{i}@example.com",
            )

        # detail
        resp = self.client.get(reverse("course-detail", kwargs={"pk": self.course.pk}))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["code"], "CS101")

        # Test student list
        url_students = reverse(
            "course-students-list", kwargs={"course_pk": self.course.pk}
        )
        response = self.client.get(url_students)
        self.assertEqual(response.status_code, 200)
        self.assertIn("students", response.data)
        self.assertEqual(len(response.data["students"]), 3)

        # list
        resp = self.client.get(reverse("course-list"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(resp.data), 1)


# ────────────────────────────────────────────────────────────────────
# ViewSet tests
# ────────────────────────────────────────────────────────────────────
class CourseViewSetTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.instructor = User.objects.create_user(
            email="instructor@test.com",
            password="testpass123",
            name="Test Instructor",
        )
        self.other_user = User.objects.create_user(
            email="other@test.com",
            password="testpass123",
            name="Other User",
        )

        self.course = Course.objects.create(
            code="CS101", name="Test Course", term="Fall 2025"
        )
        _make_main_full(self.course, self.instructor)

    # ── LIST / CREATE -------------------------------------------------------
    def test_list_courses_authenticated(self):
        self.client.force_authenticate(user=self.instructor)
        resp = self.client.get(reverse("course-list"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIsInstance(resp.data, list)

    def test_create_course_as_instructor(self):
        self.client.force_authenticate(user=self.instructor)
        resp = self.client.post(
            reverse("course-list"),
            {
                "code": "CS102",
                "name": "Data Structures",
                "description": "Learn about data structures",
                "term": "Spring 2025",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["code"], "CS102")
        self.assertTrue(
            CourseInstructor.objects.filter(
                course_id=resp.data["id"], user=self.instructor
            ).exists()
        )

    # ── ADD / REMOVE instructor --------------------------------------------
    def test_add_instructor_to_course(self):
        self.client.force_authenticate(user=self.instructor)
        resp = self.client.post(
            reverse("course-add-instructor", kwargs={"pk": self.course.pk}),
            {"email": self.other_user.email},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            CourseInstructor.objects.filter(
                course=self.course, user=self.other_user
            ).exists()
        )

    def test_remove_instructor_from_course(self):
        """
        MAIN/FULL instructor (self.instructor) removes a secondary FULL instructor.
        Expect 204 NO CONTENT.
        """
        # add other_user as a SECONDARY (not MAIN) with FULL access
        CourseInstructor.objects.create(
            course=self.course,
            user=self.other_user,
            role=CourseInstructor.Role.SEC,
            access=CourseInstructor.Access.FULL,
            accepted=True,
        )

        self.client.force_authenticate(user=self.instructor)
        resp = self.client.post(
            reverse("course-remove-instructor", kwargs={"pk": self.course.pk}),
            {"email": self.other_user.email},
            format="json",
        )

        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            CourseInstructor.objects.filter(
                course=self.course, user=self.other_user
            ).exists()
        )

    def test_cannot_remove_last_instructor(self):
        self.client.force_authenticate(user=self.instructor)
        resp = self.client.post(
            reverse("course-remove-instructor", kwargs={"pk": self.course.pk}),
            {"email": self.instructor.email},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Cannot remove the last main instructor", resp.data["error"])
