# app/backend/courses/tests/test_course_collaboration.py
# ---------------------------------------------------------------------
# Comprehensive tests for course collaboration features
# ---------------------------------------------------------------------
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from courses.models import Course, CourseInstructor, Student

User = get_user_model()


class CourseCollaborationTests(APITestCase):
    """
    Complete test coverage for course collaboration:
    - Instructor roles and permissions
    - Adding/removing instructors
    - Permission-based access control
    - Student management with proper permissions
    """

    def setUp(self):
        self.client = APIClient()

        # Create test users
        self.main_instructor = User.objects.create_user(
            email="main@example.com", name="Main Instructor", password="testpass"
        )
        self.secondary_instructor = User.objects.create_user(
            email="secondary@example.com",
            name="Secondary Instructor",
            password="testpass",
        )
        self.ta = User.objects.create_user(
            email="ta@example.com", name="Teaching Assistant", password="testpass"
        )
        self.other_instructor = User.objects.create_user(
            email="other@example.com", name="Other Instructor", password="testpass"
        )
        self.regular_user = User.objects.create_user(
            email="regular@example.com", name="Regular User", password="testpass"
        )

        # Create tokens
        self.tokens = {}
        for user in [
            self.main_instructor,
            self.secondary_instructor,
            self.ta,
            self.other_instructor,
            self.regular_user,
        ]:
            self.tokens[user] = self._get_token(user)

        # Create course (auto-creates MAIN instructor)
        self._authenticate(self.main_instructor)
        response = self.client.post(
            reverse("course-list"),
            {
                "code": "CS101",
                "name": "Introduction to CS",
                "term": "Fall 2025",
                "description": "Test course for collaboration",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.course = Course.objects.get(id=response.data["id"])

    def _get_token(self, user):
        """Get JWT token for user"""
        response = self.client.post(
            reverse("token_obtain_pair"),
            {"email": user.email, "password": "testpass"},
            format="json",
        )
        return response.data["access"]

    def _authenticate(self, user):
        """Set authentication header for user"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.tokens[user]}")

    # ===== Test Course Creation and Auto-MAIN Assignment =====

    def test_course_creation_creates_main_instructor(self):
        """Test that creating a course automatically assigns creator as MAIN instructor"""
        # Verify CourseInstructor entry was created
        instructor_link = CourseInstructor.objects.get(
            course=self.course, user=self.main_instructor
        )
        self.assertEqual(instructor_link.role, CourseInstructor.Role.MAIN)
        self.assertEqual(instructor_link.access, CourseInstructor.Access.FULL)
        self.assertTrue(instructor_link.accepted)

    def test_course_primary_instructor_property(self):
        """Test that primary_instructor property works correctly"""
        self.assertEqual(self.course.primary_instructor, self.main_instructor.name)

    # ===== Test Instructor Listing =====

    def test_list_instructors_as_instructor(self):
        """Test that instructors can view the instructor list"""
        self._authenticate(self.main_instructor)
        url = reverse("course-instructors", args=[self.course.id])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["email"], self.main_instructor.email)
        self.assertEqual(response.data[0]["role"], "MAIN")

    def test_list_instructors_as_non_instructor(self):
        """Test that non-instructors cannot view instructor list"""
        self._authenticate(self.regular_user)
        url = reverse("course-instructors", args=[self.course.id])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # ===== Test Adding Instructors =====

    def test_main_instructor_can_add_secondary(self):
        """Test MAIN instructor can add SECONDARY instructor"""
        self._authenticate(self.main_instructor)
        url = reverse("course-add-instructor", args=[self.course.id])
        response = self.client.post(
            url,
            {"email": self.secondary_instructor.email, "role": "SEC"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            CourseInstructor.objects.filter(
                course=self.course, user=self.secondary_instructor, role="SEC"
            ).exists()
        )

    def test_secondary_with_full_access_can_add_ta(self):
        """Test SECONDARY instructor with FULL access can add TA"""
        # First add secondary instructor
        CourseInstructor.objects.create(
            course=self.course,
            user=self.secondary_instructor,
            role="SEC",
            access="FULL",
            accepted=True,
        )

        self._authenticate(self.secondary_instructor)
        url = reverse("course-add-instructor", args=[self.course.id])
        response = self.client.post(
            url, {"email": self.ta.email, "role": "TA"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_ta_with_limited_access_cannot_add_instructor(self):
        """Test TA with LIMITED access cannot add instructors"""
        # Add TA with limited access
        CourseInstructor.objects.create(
            course=self.course, user=self.ta, role="TA", access="LIMITED", accepted=True
        )

        self._authenticate(self.ta)
        url = reverse("course-add-instructor", args=[self.course.id])
        response = self.client.post(
            url, {"email": self.other_instructor.email}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_cannot_add_instructor_without_email(self):
        """Test that email is required when adding instructor"""
        self._authenticate(self.main_instructor)
        url = reverse("course-add-instructor", args=[self.course.id])
        response = self.client.post(url, {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Email is required", response.data["error"])

    def test_cannot_add_nonexistent_user(self):
        """Test cannot add user that doesn't exist"""
        self._authenticate(self.main_instructor)
        url = reverse("course-add-instructor", args=[self.course.id])
        response = self.client.post(
            url, {"email": "nonexistent@example.com"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_adding_existing_instructor_returns_200(self):
        """Test that adding an existing instructor is idempotent"""
        # Add secondary instructor
        CourseInstructor.objects.create(
            course=self.course,
            user=self.secondary_instructor,
            role="SEC",
            access="FULL",
            accepted=True,
        )

        self._authenticate(self.main_instructor)
        url = reverse("course-add-instructor", args=[self.course.id])
        response = self.client.post(
            url, {"email": self.secondary_instructor.email}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # ===== Test Removing Instructors =====

    def test_main_can_remove_secondary(self):
        """Test MAIN instructor can remove SECONDARY instructor"""
        # Add secondary instructor
        CourseInstructor.objects.create(
            course=self.course,
            user=self.secondary_instructor,
            role="SEC",
            access="FULL",
            accepted=True,
        )

        self._authenticate(self.main_instructor)
        url = reverse("course-remove-instructor", args=[self.course.id])
        response = self.client.post(
            url, {"email": self.secondary_instructor.email}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            CourseInstructor.objects.filter(
                course=self.course, user=self.secondary_instructor
            ).exists()
        )

    def test_cannot_remove_main_instructor(self):
        """Test cannot remove MAIN instructor"""
        self._authenticate(self.main_instructor)
        url = reverse("course-remove-instructor", args=[self.course.id])
        response = self.client.post(
            url, {"email": self.main_instructor.email}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Cannot remove the last main instructor", response.data["error"])

    def test_secondary_cannot_remove_anyone(self):
        """Test SECONDARY instructor cannot remove other instructors"""
        # Add secondary and TA
        CourseInstructor.objects.create(
            course=self.course,
            user=self.secondary_instructor,
            role="SEC",
            access="FULL",
            accepted=True,
        )
        CourseInstructor.objects.create(
            course=self.course, user=self.ta, role="TA", access="LIMITED", accepted=True
        )

        self._authenticate(self.secondary_instructor)
        url = reverse("course-remove-instructor", args=[self.course.id])
        response = self.client.post(url, {"email": self.ta.email}, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_cannot_remove_nonexistent_instructor(self):
        """Test removing non-member returns 404"""
        self._authenticate(self.main_instructor)
        url = reverse("course-remove-instructor", args=[self.course.id])
        response = self.client.post(
            url, {"email": "notininstructor@example.com"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ===== Test Student Management Permissions =====

    def test_instructor_can_view_students(self):
        """Test that instructors can view student list"""
        # Create a student
        Student.objects.create(
            course=self.course,
            name="Test Student",
            student_id="S12345",
            email="student@example.com",
        )

        self._authenticate(self.main_instructor)
        url = reverse("course-students-list", args=[self.course.id])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 4)

    def test_ta_with_limited_can_view_students(self):
        """Test TA with LIMITED access can still view students"""
        # Add TA with limited access
        CourseInstructor.objects.create(
            course=self.course, user=self.ta, role="TA", access="LIMITED", accepted=True
        )

        # Create a student
        Student.objects.create(
            course=self.course, name="Test Student", student_id="S12345"
        )

        self._authenticate(self.ta)
        url = reverse("course-students-list", args=[self.course.id])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_non_instructor_cannot_view_students(self):
        """Test non-instructors cannot view students"""
        self._authenticate(self.regular_user)
        url = reverse("course-students-list", args=[self.course.id])
        response = self.client.get(url)

        self.assertEqual(response.status_code, 404)

    # ===== Test Access Control =====

    def test_unaccepted_instructor_cannot_access(self):
        """Test instructor with accepted=False cannot access course"""
        # Add instructor but not accepted
        CourseInstructor.objects.create(
            course=self.course,
            user=self.secondary_instructor,
            role="SEC",
            access="FULL",
            accepted=False,  # Not accepted yet
        )

        self._authenticate(self.secondary_instructor)
        url = reverse("course-instructors", args=[self.course.id])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_instructor_with_no_access_cannot_modify(self):
        """Test instructor with NONE access cannot modify course"""
        # Add instructor with no access
        CourseInstructor.objects.create(
            course=self.course,
            user=self.other_instructor,
            role="OTH",
            access="NONE",
            accepted=True,
        )

        self._authenticate(self.other_instructor)
        url = reverse("course-detail", args=[self.course.id])
        response = self.client.patch(url, {"name": "Modified Name"}, format="json")

        # Should fail permission check
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # ===== Test Course List Filtering =====

    def test_instructor_only_sees_their_courses(self):
        """Test instructors only see courses they're assigned to"""

        self._authenticate(self.main_instructor)
        url = reverse("course-list")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.course.id)

    # ===== Test Instructor Count and Display =====

    def test_instructor_count_in_serializer(self):
        """Test that instructor_count is correctly calculated"""
        # Add more instructors
        CourseInstructor.objects.create(
            course=self.course,
            user=self.secondary_instructor,
            role="SEC",
            accepted=True,
        )
        CourseInstructor.objects.create(
            course=self.course, user=self.ta, role="TA", accepted=True
        )

        self._authenticate(self.main_instructor)
        url = reverse("course-detail", args=[self.course.id])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["instructor_count"], 3)

    def test_instructors_list_in_detail_serializer(self):
        """Test that instructors list includes all necessary fields"""
        self._authenticate(self.main_instructor)
        url = reverse("course-detail", args=[self.course.id])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("instructors", response.data)
        instructor = response.data["instructors"][0]
        self.assertIn("id", instructor)
        self.assertIn("email", instructor)
        self.assertIn("name", instructor)
        self.assertIn("role", instructor)
        self.assertIn("access", instructor)
        self.assertIn("accepted", instructor)


class StudentPermissionTests(APITestCase):
    """Test student management with CourseInstructor permissions"""

    def setUp(self):
        self.client = APIClient()

        # Create users
        self.instructor = User.objects.create_user(
            email="instructor@test.com", name="Instructor", password="testpass"
        )
        self.ta = User.objects.create_user(
            email="ta@test.com", name="TA", password="testpass"
        )
        self.non_instructor = User.objects.create_user(
            email="non@test.com", name="Non Instructor", password="testpass"
        )

        # Create course
        self.course = Course.objects.create(
            code="TEST101",
            name="Test Course",
            term="Fall 2025",
            creator=self.instructor,
        )

        # Add TA
        CourseInstructor.objects.create(
            course=self.course, user=self.ta, role="TA", access="LIMITED", accepted=True
        )

    def _authenticate(self, user):
        """Helper to authenticate user"""
        response = self.client.post(
            reverse("token_obtain_pair"),
            {"email": user.email, "password": "testpass"},
            format="json",
        )
        token = response.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_csv_export_requires_instructor(self):
        """Test CSV export requires instructor permission"""
        # Create students
        Student.objects.create(course=self.course, name="Student 1", student_id="S001")

        # Try as non-instructor
        self._authenticate(self.non_instructor)
        url = reverse("students-export", args=[self.course.id])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Try as instructor
        self._authenticate(self.instructor)
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "text/csv")

    def test_bulk_operations_require_instructor(self):
        """Test bulk operations require instructor permission"""
        # Create students
        for i in range(3):
            Student.objects.create(
                course=self.course, name=f"Student {i}", student_id=f"S00{i}"
            )

        # Test anonymize_all
        self._authenticate(self.non_instructor)
        url = reverse("students-anonymize-all", args=[self.course.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Test as instructor
        self._authenticate(self.instructor)
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify students are anonymized
        self.assertTrue(
            all(s.is_anonymous for s in Student.objects.filter(course=self.course))
        )


class CourseInviteAcceptanceTests(APITestCase):
    """Test invite acceptance/decline flow"""

    def setUp(self):
        self.client = APIClient()

        # Create users
        self.inviter = User.objects.create_user(
            email="inviter@example.com", name="Inviter", password="testpass"
        )
        self.invitee = User.objects.create_user(
            email="invitee@example.com", name="Invitee", password="testpass"
        )

        # Create course with inviter as MAIN
        self.course = Course.objects.create(
            code="CS101", name="Test Course", term="Fall 2025", creator=self.inviter
        )

        # Create pending invite
        self.invite = CourseInstructor.objects.create(
            course=self.course,
            user=self.invitee,
            role="SEC",
            access="FULL",
            accepted=False,  # Pending
        )

    def _authenticate(self, user):
        response = self.client.post(
            reverse("token_obtain_pair"), {"email": user.email, "password": "testpass"}
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def test_get_pending_invites(self):
        """Test retrieving pending invites for a user"""
        self._authenticate(self.invitee)

        url = reverse("pending-invites")  # /courses/invites/pending/
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        invite = response.data[0]
        self.assertEqual(invite["course_id"], self.course.id)
        self.assertEqual(invite["course_code"], "CS101")
        self.assertEqual(invite["course_title"], "Test Course")
        self.assertEqual(invite["inviter_name"], "Inviter")
        self.assertEqual(invite["inviter_email"], "inviter@example.com")
        self.assertEqual(invite["role"], "SEC")
        self.assertEqual(invite["permissions"], "FULL")

    def test_accept_invite(self):
        """Test accepting an invite"""
        self._authenticate(self.invitee)

        url = reverse("accept-invite", args=[self.invite.id])
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify invite is now accepted
        self.invite.refresh_from_db()
        self.assertTrue(self.invite.accepted)

        # Verify user can now access course
        course_url = reverse("course-detail", args=[self.course.id])
        response = self.client.get(course_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_decline_invite(self):
        """Test declining an invite"""
        self._authenticate(self.invitee)

        url = reverse("decline-invite", args=[self.invite.id])
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify invite is removed or marked as declined
        self.assertFalse(
            CourseInstructor.objects.filter(id=self.invite.id, accepted=False).exists()
        )

    def test_cannot_accept_others_invite(self):
        """Test user cannot accept invite meant for another user"""
        other_user = User.objects.create_user(
            email="other@example.com", name="Other", password="testpass"
        )

        self._authenticate(other_user)

        url = reverse("accept-invite", args=[self.invite.id])
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_accept_already_accepted(self):
        """Test cannot accept an already accepted invite"""
        # First accept
        self._authenticate(self.invitee)
        url = reverse("accept-invite", args=[self.invite.id])
        self.client.post(url)

        # Try to accept again
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_pending_invites_excludes_accepted(self):
        """Test pending invites doesn't show accepted invites"""
        # Accept the invite
        self.invite.accepted = True
        self.invite.save()

        self._authenticate(self.invitee)
        url = reverse("pending-invites")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)  # No pending invites
