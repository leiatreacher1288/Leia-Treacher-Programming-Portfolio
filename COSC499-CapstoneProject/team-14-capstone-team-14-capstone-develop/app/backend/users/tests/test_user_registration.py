"""
Test file: test_user_registration.py

This file tests the USER MODEL layer directly:
- Tests User.objects.create_user() method
- Tests password hashing at the database level
- Tests model field validation and constraints
- Tests the UserManager methods

This is different from test_register.py which tests the API layer:
- test_register.py tests HTTP endpoints (/api/auth/register/)
- test_register.py tests REST framework serializers
- test_register.py tests the full request/response cycle

Together, these files ensure both our model logic and API endpoints work correctly.
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password
from django.db import IntegrityError
from django.test import TestCase

User = get_user_model()


class UserModelTests(TestCase):
    """
    Test suite for User model and create_user() method.
    This complements test_register.py by testing model-level logic directly.
    """

    def test_create_user_method(self):
        """Test that create_user() method works correctly"""
        user = User.objects.create_user(
            email="test@example.com", name="Test User", password="testpass123"
        )

        # Verify user was created with correct attributes
        self.assertEqual(user.email, "test@example.com")
        self.assertEqual(user.name, "Test User")
        self.assertEqual(user.role, "instructor")  # default role
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)

    def test_password_hashing(self):
        """Test that create_user() properly hashes passwords"""
        raw_password = "testpass123"
        user = User.objects.create_user(
            email="test@example.com", name="Test User", password=raw_password
        )

        # Password should not be stored in plain text
        self.assertNotEqual(user.password, raw_password)

        # Password should be hashed (check for common Django hashers)
        self.assertTrue(
            user.password.startswith("pbkdf2_sha256$")
            or user.password.startswith("md5$")
            or user.password.startswith("bcrypt$")
            or user.password.startswith("sha1$")
        )

        # Verify the password works
        self.assertTrue(check_password(raw_password, user.password))

    def test_required_email_field(self):
        """Test that email is required when using create_user()"""
        # Test with empty string
        with self.assertRaises(ValueError) as context:
            User.objects.create_user(email="", name="Test User", password="testpass123")
        self.assertEqual(str(context.exception), "Email is required")

        # Test with None
        with self.assertRaises(ValueError) as context:
            User.objects.create_user(
                email=None, name="Test User", password="testpass123"
            )
        self.assertEqual(str(context.exception), "Email is required")

    def test_role_validation(self):
        """Test that only valid roles are accepted"""
        user_instructor = User.objects.create_user(
            email="instructor@example.com",
            name="Instructor",
            password="pass123",
            role="instructor",
        )
        self.assertEqual(user_instructor.role, "instructor")

        user_admin = User.objects.create_user(
            email="admin@example.com", name="Admin", password="pass123", role="admin"
        )
        self.assertEqual(user_admin.role, "admin")

        # Invalid role should raise error
        with self.assertRaises(ValueError) as context:
            User.objects.create_user(
                email="test@example.com",
                name="Test",
                password="pass123",
                role="student",  # invalid
            )
        self.assertEqual(str(context.exception), "Role must be 'instructor' or 'admin'")

    def test_email_uniqueness_at_model_level(self):
        """Test that duplicate emails fail at the database level"""
        # Create first user
        User.objects.create_user(
            email="duplicate@example.com", name="First User", password="pass123"
        )

        # Attempt to create second user with same email
        with self.assertRaises(IntegrityError):
            User.objects.create_user(
                email="duplicate@example.com", name="Second User", password="pass456"
            )

    def test_create_superuser_method(self):
        """Test that create_superuser() sets correct permissions"""
        admin = User.objects.create_superuser(
            email="admin@example.com", name="Admin User", password="adminpass123"
        )

        # Verify superuser attributes
        self.assertEqual(admin.role, "admin")
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)
        self.assertTrue(admin.is_active)

        # Verify password is still hashed
        self.assertNotEqual(admin.password, "adminpass123")
        self.assertTrue(check_password("adminpass123", admin.password))
