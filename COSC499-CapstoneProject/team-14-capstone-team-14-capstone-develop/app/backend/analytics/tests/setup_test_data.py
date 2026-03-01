#!/usr/bin/env python3
"""
Setup test data for PDF/DOCX testing
"""

import os

import django

from courses.models import Course, Student
from users.models import User

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "examvault.settings")
django.setup()


def setup_test_data():
    print("=== Current Data ===")
    print(f"Courses: {Course.objects.count()}")
    print(f"Students: {Student.objects.count()}")

    # Create test data if needed
    if Course.objects.count() == 0:
        course = Course.objects.create(
            code="TEST101",
            name="Test Course for Analytics",
            description="Test course for PDF/DOCX export testing",
        )
        print(f"Created course: {course}")

        for i in range(3):
            student = Student.objects.create(
                student_id=f"STU{i+1:03d}",
                course=course,
                name=f"Test Student {i+1}",
                email=f"student{i+1}@test.com",
            )
            print(f"Created student: {student}")

    print("\n=== Final Data ===")
    for course in Course.objects.all():
        print(f"Course ID: {course.id}, Code: {course.code}, Name: {course.name}")
        for student in course.student_set.all():
            print(f"  Student ID: {student.id}, Name: {student.name}")


if __name__ == "__main__":
    setup_test_data()
