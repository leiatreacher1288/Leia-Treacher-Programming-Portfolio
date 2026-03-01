#!/usr/bin/env python
"""
Quick Django endpoint test to verify API structure
"""
import os
import sys

import django
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from courses.models import Course, Student

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "examvault.settings")
sys.path.append(os.path.join(os.path.dirname(__file__)))
django.setup()


User = get_user_model()


def quick_api_test():
    """Quick test of the problematic endpoints"""
    print("🔍 Quick API Diagnostic Test")
    print("=" * 40)

    # Clean slate
    User.objects.all().delete()
    Course.objects.all().delete()
    Student.objects.all().delete()

    # Create users
    instructor = User.objects.create_user(
        email="instructor@test.com",
        name="Test Instructor",
        password="test123",
        role="instructor",
        is_active=True,
    )

    # Create course
    course = Course.objects.create(
        code="TEST101", name="Test Course", description="Test course"
    )
    course.instructors.add(instructor)

    # Create student enrollment
    student = Student.objects.create(
        course=course,
        student_id="TEST001",
        name="Test Student",
        email="student@test.com",
    )

    print("✅ Setup complete:")
    print(f"   Course: {course}")
    print(f"   Instructor: {instructor}")
    print(f"   Student: {student}")

    # Test API client
    client = APIClient()
    client.force_authenticate(user=instructor)

    # Test 1: Students list endpoint
    print("\n🔍 Test 1: GET /api/courses/{course.id}/students/")
    response = client.get(f"/api/courses/{course.id}/students/")
    print(f"   Status: {response.status_code}")
    print(f"   Content-Type: {response.get('Content-Type', 'N/A')}")
    if hasattr(response, "data"):
        print(f"   Response data type: {type(response.data)}")
        print(f"   Response data: {response.data}")
    else:
        print(f"   Response content: {response.content}")

    # Test 2: Add student endpoint
    print(f"\n🔍 Test 2: POST /api/courses/{course.id}/students/add/")
    response = client.post(
        f"/api/courses/{course.id}/students/add/", {"email": "student@test.com"}
    )
    print(f"   Status: {response.status_code}")
    if hasattr(response, "data"):
        print(f"   Response data: {response.data}")
    else:
        print(f"   Response content: {response.content}")


if __name__ == "__main__":
    quick_api_test()
