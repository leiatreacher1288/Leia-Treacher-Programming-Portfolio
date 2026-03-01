# app/backend/courses/tests/test_serializers.py

from django.contrib.auth import get_user_model
from django.test import TestCase

from courses.models import Course
from courses.serializers import CourseDetailSerializer, CourseSerializer

User = get_user_model()


class CourseSerializerTests(TestCase):

    def setUp(self):
        # Create an instructor user
        self.instructor = User.objects.create_user(
            email="instructor@example.com",
            name="Prof X",
            password="pass",
            role="instructor",  # drop if your User model has no `role` field
        )

        # Create a course and attach the instructor
        self.course = Course.objects.create(
            code="HIST101",
            name="World History",
            term="Fall 2025",
        )
        self.course.instructors.add(self.instructor)

    def test_basic_fields_present(self):

        data = CourseSerializer(self.course).data
        data = CourseSerializer(self.course).data
        self.assertEqual(data["id"], self.course.id)
        self.assertEqual(data["code"], "HIST101")
        self.assertEqual(data["name"], "World History")
        self.assertEqual(data["term"], "Fall 2025")

    def test_instructors_and_count(self):

        data = CourseSerializer(self.course).data
        data = CourseSerializer(self.course).data

        # instructor_count
        self.assertEqual(data["instructor_count"], 1)

        # by default instructors is just a list of IDs
        self.assertIsInstance(data["instructors"], list)
        self.assertEqual(data["instructors"], [self.instructor.id])

    def test_last_edited_included(self):

        data = CourseSerializer(self.course).data
        data = CourseSerializer(self.course).data
        self.assertIn("last_edited", data)
        # last_edited is a string timestamp
        self.assertIsInstance(data["last_edited"], str)


class CourseDetailSerializerTests(TestCase):

    def setUp(self):
        # A course with no exams or question banks
        self.course = Course.objects.create(
            code="CHEM101",
            name="General Chemistry",
            term="Fall 2025",
        )

    def test_detail_fields_and_empty_counts(self):

        data = CourseDetailSerializer(self.course).data
        data = CourseDetailSerializer(self.course).data

        # All base fields exist
        for field in (
            "id",
            "code",
            "name",
            "term",
            "banner",
            "instructors",
            "instructor_count",
            "last_edited",
        ):
            self.assertIn(field, data)

        # Detail-only counts default to zero
        self.assertEqual(data["exam_count"], 0)
        self.assertEqual(data["question_bank_count"], 0)
