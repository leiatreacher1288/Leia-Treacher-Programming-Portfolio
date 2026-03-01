# app/backend/courses/tests/test_models.py
import time

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from courses.models import Course


class CourseModelTests(TestCase):

    def setUp(self):
        # Minimal user who can be an instructor
        self.instructor = get_user_model().objects.create_user(
            email="instructor@example.com",
            name="Prof X",
            password="pass",
            role="instructor",  # drop if your User model lacks this
        )

        # The course we'll exercise in every test
        self.course = Course.objects.create(
            code="HIST101",
            name="World History",
            term="Fall 2025",
        )
        self.course.instructors.add(self.instructor)

    def test___str__(self):
        """__str__ returns code and term nicely formatted."""
        self.assertEqual(str(self.course), "HIST101 — Fall 2025")

    def test_last_edited_updates_on_save(self):
        """saving the course bumps last_edited to 'now'."""
        before = self.course.last_edited
        # Add small delay to ensure time difference
        time.sleep(0.01)  # 10ms should be enough
        self.course.name = "World History II"
        self.course.save(update_fields=["name"])
        self.assertGreater(self.course.last_edited, before)
        self.assertLess(
            (timezone.now() - self.course.last_edited).total_seconds(),
            2,  # within two seconds is fine for CI
        )
