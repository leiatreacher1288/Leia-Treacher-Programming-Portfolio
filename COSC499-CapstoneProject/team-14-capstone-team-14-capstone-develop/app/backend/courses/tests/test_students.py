from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
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


class TestStudentEndpoints(APITestCase):
    """Test student management endpoints"""

    def setUp(self):
        # Create test user and course
        self.user = User.objects.create_user(
            email="instructor@test.com",
            password="testpass123",
            name="Test Instructor",
            role="instructor",
        )
        # Create another user for permission testing
        self.other_user = User.objects.create_user(
            email="other@test.com",
            password="testpass123",
            name="Other Instructor",
            role="instructor",
        )

        # Create course with new model
        self.course = Course.objects.create(
            name="Test Course", code="TEST101", term="Fall 2024"
        )
        # Use new permission model
        _make_main_full(self.course, self.user)

        # Authenticate the user
        self.client.force_authenticate(user=self.user)

        # Counter for unique student IDs
        self._student_counter = 0

    def tearDown(self):
        """Clean up test data to prevent unique constraint issues"""
        Student.objects.all().delete()

    def _get_unique_student_id(self):
        """Generate a unique student ID for testing"""
        self._student_counter += 1
        return f"S{self._student_counter:06d}"

    def test_get_students_success(self):
        """Test getting list of students"""
        # Create test students with unique IDs
        for i in range(3):
            Student.objects.create(
                student_id=self._get_unique_student_id(),
                name=f"Student {i+1}",
                email=f"student{i+1}@test.com",
                course=self.course,
            )

        url = f"/api/courses/{self.course.id}/students/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("students", response.data)
        self.assertEqual(len(response.data["students"]), 3)

    def test_get_students_empty(self):
        """Test getting empty student list"""
        url = reverse("course-students-list", kwargs={"course_pk": self.course.pk})
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertIn("students", response.data)
        self.assertEqual(len(response.data["students"]), 0)

    def test_get_students_forbidden(self):
        """Test non-instructor cannot get students"""
        self.client.force_authenticate(user=self.other_user)
        url = reverse("course-students-list", kwargs={"course_pk": self.course.pk})
        response = self.client.get(url)

        self.assertEqual(
            response.status_code, 404
        )  # DRF returns 404 for forbidden nested resource

    def test_create_student_success(self):
        """Test creating a new student"""
        url = reverse("course-students-list", kwargs={"course_pk": self.course.pk})
        data = {
            "name": "New Student",
            "student_id": "S12345",
            "email": "newstudent@example.com",
            "section": "A",
        }
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["name"], "New Student")
        self.assertTrue(Student.objects.filter(student_id="S12345").exists())

    def test_create_student_duplicate(self):
        """Test creating duplicate student"""
        """Test creating duplicate student"""
        # Create first student
        Student.objects.create(
            course=self.course,
            name="Existing Student",
            student_id="S12345",
            email="existing@example.com",
        )

        url = reverse("course-students-list", kwargs={"course_pk": self.course.pk})
        data = {
            "name": "Duplicate Student",
            "student_id": "S12345",  # Same ID
            "email": "duplicate@example.com",
        }
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, 400)

    def test_create_student_invalid_data(self):
        """Test creating student with invalid data"""
        url = reverse("course-students-list", kwargs={"course_pk": self.course.pk})
        data = {
            "name": "",  # Empty name
            "student_id": "",  # Empty ID
        }
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, 400)

    def test_update_student_success(self):
        """Test updating student information"""

        """Test updating student information"""
        student = Student.objects.create(
            course=self.course,
            name="Original Name",
            student_id="S12345",
            email="original@example.com",
        )

        url = f"/api/courses/{self.course.pk}/students/{student.pk}/"
        data = {
            "name": "Updated Name",
            "student_id": "S12345",
            "email": "updated@example.com",
        }
        response = self.client.put(url, data, format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["name"], "Updated Name")

    def test_update_student_not_found(self):
        """Test updating non-existent student"""
        url = reverse(
            "students-detail", kwargs={"course_pk": self.course.pk, "pk": 9999}
        )
        data = {"name": "Updated Name"}
        response = self.client.put(url, data, format="json")

        self.assertEqual(response.status_code, 404)

    def test_delete_student_success(self):
        """Test deleting a student"""

        """Test deleting a student"""
        student = Student.objects.create(
            course=self.course, name="To Delete", student_id="S12345"
        )

        url = reverse(
            "students-detail", kwargs={"course_pk": self.course.pk, "pk": student.pk}
        )
        response = self.client.delete(url)

        self.assertEqual(response.status_code, 204)
        self.assertFalse(Student.objects.filter(pk=student.pk).exists())

    def test_delete_student_not_found(self):
        """Test deleting non-existent student"""
        url = reverse(
            "students-detail", kwargs={"course_pk": self.course.pk, "pk": 9999}
        )
        response = self.client.delete(url)

        self.assertEqual(response.status_code, 404)

    def test_import_students_success(self):
        """Test importing students from CSV"""
        """Test importing students from CSV"""
        # The CSV headers need to match exactly what the view expects
        csv_content = """student_id,name,email,section,is_active
S001,John Doe,john@example.com,A,true
S002,Jane Smith,jane@example.com,B,true
S003,Bob Johnson,bob@example.com,A,false"""

        csv_file = SimpleUploadedFile(
            "students.csv", csv_content.encode("utf-8"), content_type="text/csv"
        )

        url = reverse("students-import", kwargs={"course_pk": self.course.pk})
        response = self.client.post(url, {"file": csv_file}, format="multipart")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(len(response.data), 3)
        self.assertTrue(Student.objects.filter(student_id="S001").exists())

    def test_import_students_invalid_file(self):
        """Test importing with missing file"""
        url = reverse("students-import", kwargs={"course_pk": self.course.pk})
        response = self.client.post(url, {}, format="multipart")

        self.assertEqual(response.status_code, 400)

    def test_export_students_success(self):
        """Test exporting students to CSV"""
        """Test exporting students to CSV"""
        # Create test students with unique IDs
        for i in range(3):
            Student.objects.create(
                student_id=self._get_unique_student_id(),
                name=f"Student {i+1}",
                email=f"student{i+1}@test.com",
                course=self.course,
            )

        url = f"/api/courses/{self.course.id}/students/export_csv/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "text/csv")

    def test_export_students_empty(self):
        """Test exporting empty student list"""
        url = reverse("students-export", kwargs={"course_pk": self.course.pk})
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "text/csv")

    def test_delete_all_students_success(self):
        """Test deleting all students in a course"""
        # Create test students with unique IDs
        for i in range(3):
            Student.objects.create(
                student_id=self._get_unique_student_id(),
                name=f"Student {i+1}",
                email=f"student{i+1}@test.com",
                course=self.course,
            )

        url = f"/api/courses/{self.course.id}/students/delete_all/"
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Student.objects.filter(course=self.course).count(), 0)

    def test_anonymize_all_students_success(self):
        """Test anonymizing all students"""
        # Create students with unique IDs
        for i in range(2):
            Student.objects.create(
                course=self.course,
                name=f"Student {i}",
                student_id=self._get_unique_student_id(),
                is_anonymous=False,
            )

        url = reverse("students-anonymize-all", kwargs={"course_pk": self.course.pk})
        response = self.client.post(url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["anonymized_count"], 2)

        # Verify all students are anonymous
        for student in Student.objects.filter(course=self.course):
            self.assertTrue(student.is_anonymous)

    def test_deanonymize_all_students_success(self):
        """Test deanonymizing all students in a course"""
        # Create test students with unique IDs
        for i in range(3):
            Student.objects.create(
                student_id=self._get_unique_student_id(),
                name=f"Student {i+1}",
                email=f"student{i+1}@test.com",
                course=self.course,
                is_anonymous=True,
            )

        url = f"/api/courses/{self.course.id}/students/deanonymize_all/"
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check that all students are now deanonymized
        anonymous_count = Student.objects.filter(
            course=self.course, is_anonymous=True
        ).count()
        self.assertEqual(anonymous_count, 0)


class TestStudentPermissions(TestCase):
    """Test student endpoint permissions"""

    def setUp(self):
        self.client = APIClient()

        # Create users
        self.instructor = User.objects.create_user(
            email="instructor@test.com",
            password="testpass123",
            name="Test Instructor",
            role="instructor",
        )
        self.other_user = User.objects.create_user(
            email="other@test.com",
            password="testpass123",
            name="Other User",
            role="instructor",
        )

        # Create course with creator (auto-creates CourseInstructor)
        self.course = Course.objects.create(
            code="CS101",
            name="Test Course",
            term="Fall 2025",
            creator=self.instructor,  # This automatically creates CourseInstructor
        )
        # OLD: self.course.instructors.add(self.instructor)

    def test_unauthorized_access(self):
        """Test unauthenticated access is denied"""

        """Test unauthenticated access is denied"""
        url = reverse("course-students-list", kwargs={"course_pk": self.course.pk})
        response = self.client.get(url)

        self.assertEqual(response.status_code, 401)

    def test_forbidden_access(self):
        """Test non-instructor gets permission denied"""
        self.client.force_authenticate(user=self.other_user)

        # Create a student
        Student.objects.create(
            course=self.course, name="Test Student", student_id="S12345"
        )

        url = reverse("course-students-list", kwargs={"course_pk": self.course.pk})
        response = self.client.get(url)

        self.assertEqual(
            response.status_code, 404
        )  # DRF returns 404 for forbidden nested resource


class TestStudentValidation(TestCase):
    """Test student data validation"""

    """Test student data validation"""

    def setUp(self):

        self.client = APIClient()
        self.client = APIClient()

        # Create and authenticate instructor
        self.instructor = User.objects.create_user(
            email="instructor@test.com",
            password="testpass123",
            name="Test Instructor",
            role="instructor",
        )
        self.client.force_authenticate(user=self.instructor)

        # Create course with creator (auto-creates CourseInstructor)
        self.course = Course.objects.create(
            code="CS101",
            name="Test Course",
            term="Fall 2025",
            creator=self.instructor,  # This automatically creates CourseInstructor
        )
        # OLD: self.course.instructors.add(self.instructor)

    def test_create_student_course_not_found(self):
        """Test creating student for non-existent course"""
        url = reverse("course-students-list", kwargs={"course_pk": 9999})
        data = {"name": "Test Student", "student_id": "S12345"}
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, 404)

    def test_create_student_empty_student_id(self):
        """Test creating student with empty ID"""

        """Test creating student with empty ID"""
        url = reverse("course-students-list", kwargs={"course_pk": self.course.pk})
        data = {"name": "Test Student", "student_id": ""}  # Empty ID
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, 400)

    def test_create_student_invalid_email(self):
        """Test creating student with invalid email"""
        url = reverse("course-students-list", kwargs={"course_pk": self.course.pk})
        data = {
            "name": "Test Student",
            "student_id": "S12345",
            "email": "invalid-email",  # Invalid email format
        }
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, 400)

    def test_create_student_missing_required_fields(self):
        """Test creating student without required fields"""

        """Test creating student without required fields"""
        url = reverse("course-students-list", kwargs={"course_pk": self.course.pk})
        data = {}  # No data
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, 400)


class TestStudentMultipleCourses(TestCase):
    """Test that students can be enrolled in multiple courses"""

    def setUp(self):
        self.client = APIClient()

        # Create instructor
        self.instructor = User.objects.create_user(
            email="instructor@test.com", password="testpass123", name="Test Instructor"
        )

        # Create multiple courses with creator (auto-creates CourseInstructor)
        self.course1 = Course.objects.create(
            code="CS101",
            name="Intro to CS",
            term="Fall 2025",
            creator=self.instructor,  # This automatically creates CourseInstructor
        )

        self.course2 = Course.objects.create(
            code="CS102",
            name="Data Structures",
            term="Fall 2025",
            creator=self.instructor,  # This automatically creates CourseInstructor
        )

        self.course3 = Course.objects.create(
            code="MATH101",
            name="Calculus I",
            term="Fall 2025",
            creator=self.instructor,  # This automatically creates CourseInstructor
        )

        # Authenticate as instructor
        self.client.force_authenticate(user=self.instructor)

    def test_same_student_multiple_courses(self):
        """Test that the same student can be enrolled in multiple courses"""
        # Student data - same student ID across courses
        student_data = {
            "name": "John Doe",
            "student_id": "S12345",
            "email": "john.doe@example.com",
            "section": "A",
        }

        # Enroll student in first course
        url1 = reverse("course-students-list", kwargs={"course_pk": self.course1.pk})
        response1 = self.client.post(url1, student_data, format="json")
        self.assertEqual(response1.status_code, 201)
        self.assertEqual(response1.data["student_id"], "S12345")

        # Enroll same student in second course
        url2 = reverse("course-students-list", kwargs={"course_pk": self.course2.pk})
        response2 = self.client.post(url2, student_data, format="json")
        self.assertEqual(response2.status_code, 201)
        self.assertEqual(response2.data["student_id"], "S12345")

        # Enroll same student in third course
        url3 = reverse("course-students-list", kwargs={"course_pk": self.course3.pk})
        response3 = self.client.post(url3, student_data, format="json")
        self.assertEqual(response3.status_code, 201)
        self.assertEqual(response3.data["student_id"], "S12345")

        # Verify student exists in all three courses
        self.assertEqual(Student.objects.filter(student_id="S12345").count(), 3)
        self.assertTrue(
            Student.objects.filter(course=self.course1, student_id="S12345").exists()
        )
        self.assertTrue(
            Student.objects.filter(course=self.course2, student_id="S12345").exists()
        )
        self.assertTrue(
            Student.objects.filter(course=self.course3, student_id="S12345").exists()
        )

    def test_prevent_duplicate_in_same_course(self):
        """Test that the same student cannot be enrolled twice in the same course"""
        student_data = {
            "name": "Jane Smith",
            "student_id": "S67890",
            "email": "jane.smith@example.com",
            "section": "B",
        }

        url = reverse("course-students-list", kwargs={"course_pk": self.course1.pk})

        # First enrollment should succeed
        response1 = self.client.post(url, student_data, format="json")
        self.assertEqual(response1.status_code, 201)

        # Second enrollment in same course should fail
        response2 = self.client.post(url, student_data, format="json")
        self.assertEqual(response2.status_code, 400)

        # Verify only one instance exists
        self.assertEqual(
            Student.objects.filter(course=self.course1, student_id="S67890").count(), 1
        )

    def test_import_csv_multiple_courses(self):
        """Test importing the same students to multiple courses via CSV"""
        csv_content = """student_id,name,email,section,is_active
S101,Alice Johnson,alice@example.com,A,true
S102,Bob Williams,bob@example.com,B,true
S103,Charlie Brown,charlie@example.com,A,true"""

        # Import to first course
        csv_file1 = SimpleUploadedFile(
            "students1.csv", csv_content.encode("utf-8"), content_type="text/csv"
        )
        url1 = reverse("students-import", kwargs={"course_pk": self.course1.pk})
        response1 = self.client.post(url1, {"file": csv_file1}, format="multipart")
        self.assertEqual(response1.status_code, 201)
        self.assertEqual(len(response1.data), 3)

        # Import same students to second course
        csv_file2 = SimpleUploadedFile(
            "students2.csv", csv_content.encode("utf-8"), content_type="text/csv"
        )
        url2 = reverse("students-import", kwargs={"course_pk": self.course2.pk})
        response2 = self.client.post(url2, {"file": csv_file2}, format="multipart")
        self.assertEqual(response2.status_code, 201)
        self.assertEqual(len(response2.data), 3)

        # Verify students exist in both courses
        for student_id in ["S101", "S102", "S103"]:
            self.assertEqual(Student.objects.filter(student_id=student_id).count(), 2)
            self.assertTrue(
                Student.objects.filter(
                    course=self.course1, student_id=student_id
                ).exists()
            )
            self.assertTrue(
                Student.objects.filter(
                    course=self.course2, student_id=student_id
                ).exists()
            )

    def test_update_student_in_one_course_not_affect_others(self):
        """Test that updating a student in one course doesn't affect other courses"""
        student_data = {
            "name": "Michael Scott",
            "student_id": "S99999",
            "email": "michael@dundermifflin.com",
            "section": "A",
        }

        # Create student in two courses
        url1 = reverse("course-students-list", kwargs={"course_pk": self.course1.pk})
        response1 = self.client.post(url1, student_data, format="json")
        student1_id = response1.data["id"]

        url2 = reverse("course-students-list", kwargs={"course_pk": self.course2.pk})
        response2 = self.client.post(url2, student_data, format="json")
        student2_id = response2.data["id"]

        # Update student in first course only
        update_url = reverse(
            "students-detail", kwargs={"course_pk": self.course1.pk, "pk": student1_id}
        )
        update_data = {
            "name": "Michael G. Scott",  # Changed name
            "student_id": "S99999",
            "email": "michael.gary.scott@dundermifflin.com",  # Changed email
            "section": "B",  # Changed section
        }
        update_response = self.client.put(update_url, update_data, format="json")
        self.assertEqual(update_response.status_code, 200)

        # Verify changes in course 1
        student1 = Student.objects.get(pk=student1_id)
        self.assertEqual(student1.name, "Michael G. Scott")
        self.assertEqual(student1.email, "michael.gary.scott@dundermifflin.com")
        self.assertEqual(student1.section, "B")

        # Verify no changes in course 2
        student2 = Student.objects.get(pk=student2_id)
        self.assertEqual(student2.name, "Michael Scott")
        self.assertEqual(student2.email, "michael@dundermifflin.com")
        self.assertEqual(student2.section, "A")

    def test_delete_student_from_one_course_not_affect_others(self):
        """Test that deleting a student from one course doesn't affect other courses"""
        student_data = {
            "name": "Dwight Schrute",
            "student_id": "S11111",
            "email": "dwight@schrutefarms.com",
            "section": "A",
        }

        # Create student in three courses
        students = []
        for course in [self.course1, self.course2, self.course3]:
            url = reverse("course-students-list", kwargs={"course_pk": course.pk})
            response = self.client.post(url, student_data, format="json")
            students.append(response.data["id"])

        # Delete from course1 only
        delete_url = reverse(
            "students-detail", kwargs={"course_pk": self.course1.pk, "pk": students[0]}
        )
        delete_response = self.client.delete(delete_url)
        self.assertEqual(delete_response.status_code, 204)

        # Verify student deleted from course1
        self.assertFalse(
            Student.objects.filter(course=self.course1, student_id="S11111").exists()
        )

        # Verify student still exists in course2 and course3
        self.assertTrue(
            Student.objects.filter(course=self.course2, student_id="S11111").exists()
        )
        self.assertTrue(
            Student.objects.filter(course=self.course3, student_id="S11111").exists()
        )
        self.assertEqual(Student.objects.filter(student_id="S11111").count(), 2)
