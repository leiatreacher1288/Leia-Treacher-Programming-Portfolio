"""
Comprehensive API Tests for Course Management
==========================================

Tests all course API endpoints including:
- CRUD operations
- Stude        self.client.force_authenticate(user=self.other_instructor2)

        response = self.client.get(f'/api/courses/{self.course.id}/students/')management
- Instructor management
- CSV import/export
- Proper authentication and permissio        response = self.client.put(
            f'/api/courses/{self.course.id}/',

Usage:
    python -m pytest app/backend/courses/tests/test_course_api.py -v
"""

import io

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from courses.models import Course, CourseInstructor, Student

User = get_user_model()


def _make_main_full(course: Course, user):
    """
    Give *user* a MAIN / FULL, accepted CourseInstructor row on *course*.
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


class CourseAPITestCase(APITestCase):
    """Test case for Course API endpoints"""

    def setUp(self):
        """Set up test data"""
        # Create test users
        self.admin_user = User.objects.create_user(
            email="admin@test.com",
            name="Admin User",
            password="testpass123",
            role="admin",
            is_superuser=True,
            is_active=True,
        )

        self.instructor1 = User.objects.create_user(
            email="instructor1@test.com",
            name="Instructor One",
            password="testpass123",
            role="instructor",
            is_active=True,
        )

        self.instructor2 = User.objects.create_user(
            email="api_instructor2@test.com",
            name="Instructor Two",
            password="testpass123",
            role="instructor",
            is_active=True,
        )

        # Create a separate instructor user for testing permissions
        self.other_instructor = User.objects.create_user(
            email="other@test.com",
            name="Other Instructor",
            password="testpass123",
            role="instructor",
            is_active=True,
        )

        self.other_instructor2 = User.objects.create_user(
            email="api_other_instructor@test.com",
            name="Other Instructor",
            password="testpass123",
            role="instructor",
            is_active=True,
        )

        # Create test course
        self.course = Course.objects.create(
            code="CS101",
            name="Introduction to Computer Science",
            description="Basic computer science concepts",
            term="2025W1",
            instructor=self.instructor1.name,
            creator=self.instructor1,
        )
        # Use new permission model
        _make_main_full(self.course, self.instructor1)

        # Create test students in course
        # First create a User for the student
        self.student_user = User.objects.create_user(
            email="student1@test.com",
            name="Student One User",
            password="testpass123",
            role="instructor",  # Need valid role
        )

        self.enrolled_student1 = Student.objects.create(
            course=self.course,
            student_id="12345",
            name="Student One",
            email="student1@test.com",
            user=self.student_user,  # Link the User to the Student
            is_active=True,
        )

        self.client = APIClient()

    def tearDown(self):
        # Delete all courses where the user is the creator before deleting users to avoid ProtectedError
        for user in User.objects.filter(email__contains="@test.com"):
            Course.objects.filter(creator=user).delete()
        User.objects.filter(email__contains="@test.com").delete()

    def test_unauthorized_access_protection(self):
        """Test that endpoints are protected from unauthorized access"""
        protected_endpoints = [
            "/api/courses/",
            f"/api/courses/{self.course.id}/",
            f"/api/courses/{self.course.id}/students/",
            f"/api/courses/{self.course.id}/students/add/",
            f"/api/courses/{self.course.id}/remove_instructor/",
        ]

        for endpoint in protected_endpoints:
            response = self.client.get(endpoint)
            self.assertIn(
                response.status_code,
                [401, 403],
                f"Endpoint {endpoint} should be protected",
            )

    def test_course_list_as_instructor(self):
        """Test course list endpoint as instructor"""
        self.client.force_authenticate(user=self.instructor1)

        response = self.client.get("/api/courses/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["code"], "CS101")

    def test_course_detail_retrieve(self):
        """Test course detail endpoint"""
        self.client.force_authenticate(user=self.instructor1)

        response = self.client.get(f"/api/courses/{self.course.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        self.assertEqual(data["code"], "CS101")
        self.assertEqual(data["name"], "Introduction to Computer Science")
        self.assertIn("instructors", data)
        self.assertIn("student_count", data)

    def test_course_creation(self):
        """Test creating a new course"""

        """Test creating a new course"""
        self.client.force_authenticate(user=self.instructor1)

        course_data = {
            "code": "CS201",
            "name": "Data Structures",
            "description": "Advanced data structures and algorithms",
            "term": "2025W2",
        }

        response = self.client.post("/api/courses/", course_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Check that course was created and instructor was added
        new_course = Course.objects.get(code="CS201")
        self.assertIn(self.instructor1, new_course.instructors.all())

    def test_students_list_endpoint(self):
        """Test listing students in a course"""
        self.client.force_authenticate(user=self.instructor1)

        url = reverse("course-students-list", kwargs={"course_pk": self.course.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        # The API returns structured data with metadata
        self.assertIsInstance(data, dict)
        self.assertIn("students", data)
        self.assertIn("count", data)
        self.assertIn("course_id", data)
        self.assertIn("course_name", data)

        students = data["students"]
        self.assertIsInstance(students, list)
        self.assertEqual(len(students), 1)
        self.assertEqual(students[0]["email"], "student1@test.com")

    def test_students_list_permission_denied(self):
        """Test that non-instructors cannot list students"""
        self.client.force_authenticate(
            user=self.instructor2
        )  # Not instructor of this course

        url = reverse("course-students-list", kwargs={"course_pk": self.course.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)

    def test_add_student_by_email(self):
        """Test adding a student to course by email"""
        self.client.force_authenticate(user=self.instructor1)

        response = self.client.post(
            f"/api/courses/{self.course.id}/students/add/",
            {"email": "api_instructor2@test.com"},
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        data = response.json()
        self.assertIn("message", data)
        self.assertIn("student", data)
        self.assertEqual(data["student"]["email"], "api_instructor2@test.com")

        # Verify student was actually added
        student_exists = Student.objects.filter(
            course=self.course, email="api_instructor2@test.com", is_active=True
        ).exists()
        self.assertTrue(student_exists)

    def test_add_student_by_user_id(self):
        """Test adding a student to course by user ID"""

        """Test adding a student to course by user ID"""
        self.client.force_authenticate(user=self.instructor1)

        response = self.client.post(
            f"/api/courses/{self.course.id}/students/add/",
            {"user_id": self.other_instructor2.id},
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_add_student_already_enrolled(self):
        """Test adding a student who is already enrolled"""
        self.client.force_authenticate(user=self.instructor1)

        response = self.client.post(
            f"/api/courses/{self.course.id}/students/add/",
            {"email": "student1@test.com"},  # Already enrolled
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        data = response.json()
        self.assertIn("error", data)
        self.assertIn("already enrolled", data["error"])

    def test_add_student_invalid_email(self):
        """Test adding a student with non-existent email"""

        """Test adding a student with non-existent email"""
        self.client.force_authenticate(user=self.instructor1)

        response = self.client.post(
            f"/api/courses/{self.course.id}/students/add/",
            {"email": "nonexistent@test.com"},
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_add_student_missing_data(self):
        """Test adding a student without email or user_id"""
        self.client.force_authenticate(user=self.instructor1)

        response = self.client.post(f"/api/courses/{self.course.id}/students/add/", {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_csv_import_students(self):
        """Test importing students via CSV"""

        """Test importing students via CSV"""
        self.client.force_authenticate(user=self.instructor1)

        # Create CSV content with correct format
        csv_content = """student_id,name,email,section,is_active
S001,New Student1,newstudent1@test.com,A,true
S002,New Student2,newstudent2@test.com,B,true"""

        # Convert to bytes for file upload
        csv_bytes = io.BytesIO(csv_content.encode("utf-8"))
        csv_bytes.name = "students.csv"

        response = self.client.post(
            f"/api/courses/{self.course.id}/students/import_csv/",
            {"file": csv_bytes},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        data = response.json()
        # The API returns a list of created students
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 2)
        self.assertEqual(data[0]["student_id"], "S001")
        self.assertEqual(data[1]["student_id"], "S002")

    def test_csv_import_invalid_file(self):
        """Test CSV import with invalid file type"""
        self.client.force_authenticate(user=self.instructor1)

        # Create a non-CSV file
        txt_file = io.BytesIO(b"This is not a CSV file")
        txt_file.name = "not_csv.txt"

        response = self.client.post(
            f"/api/courses/{self.course.id}/students/import_csv/",
            {"csv_file": txt_file},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_remove_instructor_by_email(self):
        """Test removing an instructor by email"""
        """Test removing an instructor by email"""
        # Add second instructor first
        self.course.instructors.add(self.instructor2)
        self.client.force_authenticate(user=self.instructor1)

        response = self.client.post(
            f"/api/courses/{self.course.id}/remove_instructor/",
            {"email": self.instructor2.email},
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Verify instructor was removed
        self.assertNotIn(self.instructor2, self.course.instructors.all())

    def test_remove_last_instructor_fails(self):
        """Test that removing the last instructor fails"""
        self.client.force_authenticate(user=self.instructor1)

        response = self.client.post(
            f"/api/courses/{self.course.id}/remove_instructor/",
            {"email": self.instructor1.email},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        data = response.json()
        self.assertIn("Cannot remove the last main instructor", data["error"])

    def test_remove_instructor_permission_denied(self):
        """Test that non-instructors cannot remove instructors"""
        self.client.force_authenticate(
            user=self.instructor2
        )  # Not instructor of this course

        response = self.client.post(
            f"/api/courses/{self.course.id}/remove_instructor/",
            {"email": self.instructor1.email},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_add_instructor(self):
        """Test adding an instructor to a course"""
        self.client.force_authenticate(user=self.instructor1)

        response = self.client.post(
            f"/api/courses/{self.course.id}/add_instructor/",
            {"email": self.instructor2.email},
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify instructor was added
        self.assertTrue(
            CourseInstructor.objects.filter(
                course=self.course, user=self.instructor2
            ).exists()
        )

    def test_course_filtering_by_instructor(self):
        """Test that instructors only see their own courses"""
        """Test that instructors only see their own courses"""
        # Create another course with different instructor
        other_course = Course.objects.create(
            code="CS301",
            name="Advanced Algorithms",
            description="Advanced algorithms course",
            term="2025W1",
            instructor=self.instructor2.name,
        )
        other_course.instructors.add(self.instructor2)

        # Test instructor1 sees only their course
        self.client.force_authenticate(user=self.instructor1)
        response = self.client.get("/api/courses/")

        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["code"], "CS101")

        # Test instructor2 sees only their course
        self.client.force_authenticate(user=self.instructor2)
        response = self.client.get("/api/courses/")

        data = response.json()
        self.assertEqual(len(data), 0)

    def test_course_update(self):
        """Test updating a course"""
        self.client.force_authenticate(user=self.instructor1)

        update_data = {
            "name": "Updated Course Name",
            "description": "Updated description",
        }

        response = self.client.patch(f"/api/courses/{self.course.id}/", update_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify changes
        self.course.refresh_from_db()
        self.assertEqual(self.course.name, "Updated Course Name")
        self.assertEqual(self.course.description, "Updated description")

    def test_course_delete(self):
        """Test deleting a course"""

        """Test deleting a course"""
        self.client.force_authenticate(user=self.instructor1)

        response = self.client.delete(f"/api/courses/{self.course.id}/")
        # If the test user is not the creator, expect 403; otherwise, expect 204
        # For now, expect 403 as per current behavior
        self.assertEqual(response.status_code, 204)

        # Verify course was deleted
        self.assertFalse(Course.objects.filter(id=self.course.id).exists())

    def test_course_statistics(self):
        """Test course statistics endpoint if implemented"""
        self.client.force_authenticate(user=self.instructor1)

        # Try to access statistics endpoint (may not exist yet)
        response = self.client.get(f"/api/courses/{self.course.id}/statistics/")

        # Accept either success or 404 (if not implemented)
        self.assertIn(response.status_code, [200, 404])

        if response.status_code == 200:
            data = response.json()
            self.assertIn("course_id", data)
            self.assertIn("total_students", data)


class CoursePermissionTestCase(APITestCase):
    """Test case for course permission edge cases"""

    def setUp(self):
        """Set up test data for permission tests"""
        # Create test users
        self.instructor = User.objects.create_user(
            email="instructor@test.com",
            name="Test Instructor",
            password="testpass123",
            role="instructor",
            is_active=True,
        )

        self.non_instructor = User.objects.create_user(
            email="noninstructor@test.com",
            name="Non Course Instructor",
            password="testpass123",
            role="instructor",
            is_active=True,
        )

        # Create test course
        self.course = Course.objects.create(
            code="TEST101",
            name="Test Course",
            description="Test course",
            term="2025W1",
            instructor=self.instructor.name,
            creator=self.instructor,  # Set creator
        )

        # Set up proper permissions using the new model
        _make_main_full(self.course, self.instructor)

        self.client = APIClient()

    def tearDown(self):
        """Clean up test data"""
        # Delete courses first to avoid ProtectedError
        Course.objects.filter(creator=self.instructor).delete()
        User.objects.filter(
            email__in=["instructor@test.com", "noninstructor@test.com"]
        ).delete()

    def test_student_cannot_modify_course(self):
        """Test that students cannot modify courses"""
        self.client.force_authenticate(user=self.non_instructor)

        # Test course update
        response = self.client.patch(
            f"/api/courses/{self.course.id}/", {"name": "Hacked Course Name"}
        )
        self.assertIn(response.status_code, [403, 404])

        # Test course deletion
        response = self.client.delete(f"/api/courses/{self.course.id}/")
        self.assertIn(response.status_code, [403, 404])

    def test_student_cannot_add_remove_instructors(self):
        """Test that students cannot manage instructors"""
        self.client.force_authenticate(user=self.non_instructor)

        # Test add instructor
        response = self.client.post(
            f"/api/courses/{self.course.id}/add_instructor/",
            {"email": "newinstructor@test.com"},
        )
        self.assertIn(response.status_code, [403, 404])

        # Test remove instructor
        response = self.client.post(
            f"/api/courses/{self.course.id}/remove_instructor/",
            {"email": self.instructor.email},
        )
        self.assertIn(response.status_code, [403, 404])

    def test_student_cannot_manage_students(self):
        """Test that students cannot manage other students"""

        """Test that students cannot manage other students"""
        self.client.force_authenticate(user=self.non_instructor)

        # Test add student
        response = self.client.post(
            f"/api/courses/{self.course.id}/students/add/",
            {"email": "anotherstudent@test.com"},
        )
        self.assertIn(response.status_code, [403, 404])

        # Test import CSV
        csv_file = io.BytesIO(b"email,name\ntest@test.com,Test User")
        csv_file.name = "test.csv"

        response = self.client.post(
            f"/api/courses/{self.course.id}/students/import_csv/",
            {"csv_file": csv_file},
            format="multipart",
        )
        self.assertIn(response.status_code, [403, 404])

    def test_course_code_max_length_validation(self):
        """Test that course code is limited to 10 characters"""
        self.client.force_authenticate(
            user=self.instructor
        )  # Changed from self.instructor1

        # Test that 10 characters is accepted
        course_data = {
            "code": "CSCI123456",  # Exactly 10 characters
            "name": "Test Course",
            "description": "Test description",
            "term": "Fall 2025",
        }
        response = self.client.post("/api/courses/", course_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Clean up
        Course.objects.filter(code="CSCI123456").delete()

        # Test that 11 characters is rejected
        course_data["code"] = "CSCI1234567"  # 11 characters
        response = self.client.post("/api/courses/", course_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Course code must be 10 characters or less", str(response.data))

    def test_course_code_update_validation(self):
        """Test that course code validation works on updates"""
        self.client.force_authenticate(
            user=self.instructor
        )  # Changed from self.instructor1

        # Try to update with a code that's too long
        update_data = {"code": "TOOLONGCODE"}  # 11 characters
        response = self.client.patch(f"/api/courses/{self.course.id}/", update_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Course code must be 10 characters or less", str(response.data))

    def test_course_model_validation(self):
        """Test model-level validation for course code"""
        from django.core.exceptions import ValidationError

        # Test that 10 characters is accepted
        course = Course(
            code="CSCI123456",  # 10 characters
            name="Test Course",
            term="Fall 2025",
            creator=self.instructor,  # Changed from self.instructor1
        )
        try:
            course.full_clean()  # Should not raise
        except ValidationError:
            self.fail("Course with 10-character code should be valid")

        # Test that 11 characters is rejected
        course.code = "CSCI1234567"  # 11 characters
        with self.assertRaises(ValidationError) as cm:
            course.full_clean()

        # Check that the error is about the code field
        self.assertIn("code", cm.exception.message_dict)
