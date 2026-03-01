"""
Admin Test Data Factory
======================
Factory methods for creating test data for admin functionality.
"""

from django.contrib.auth import get_user_model

User = get_user_model()


class AdminTestDataFactory:
    """Factory for creating admin test data"""

    @staticmethod
    def get_valid_instructor_data():
        """Get valid instructor creation data"""
        return {
            "email": "new@instructor.com",
            "name": "New Instructor",
            "password": "NewInstructorPass123!",
            "role": "instructor",
        }

    @staticmethod
    def get_invalid_instructor_data_sets():
        """Get various invalid instructor data for validation testing"""
        return [
            {"name": "Test Instructor"},  # Missing email
            {"email": "test@instructor.com"},  # Missing name
            {
                "email": "invalid-email",
                "name": "Test",
                "password": "pass",
            },  # Invalid email
            {
                "email": "weak@test.com",
                "name": "Weak",
                "password": "123",
            },  # Weak password
        ]

    @staticmethod
    def get_valid_admin_login():
        """Get valid admin login credentials"""
        return {"username": "admin@test.com", "password": "SecureAdminPass123!"}

    @staticmethod
    def get_invalid_login_data_sets():
        """Get various invalid login data for testing"""
        return [
            {"username": "admin@test.com", "password": "wrongpassword"},
            {"username": "wrong@email.com", "password": "SecureAdminPass123!"},
            {"username": "", "password": "SecureAdminPass123!"},
            {"username": "admin@test.com", "password": ""},
            {"username": "admin@test.com", "password": "123"},  # Weak password
        ]

    @staticmethod
    def get_instructor_login():
        """Get instructor login credentials"""
        return {"username": "instructor@test.com", "password": "InstructorPass123!"}

    @staticmethod
    def get_valid_global_setting():
        """Get valid global setting data"""
        return {
            "key": "test-setting",
            "setting_type": "system-config",
            "name": "Test Setting",
            "description": "A test configuration setting",
            "value": {"test_key": "test_value"},
            "is_active": True,
            "is_default": False,
        }

    @staticmethod
    def get_valid_marking_scheme():
        """Get valid marking scheme data"""
        return {
            "global_setting": {
                "key": "standard-marking",
                "setting_type": "marking-scheme",
                "name": "Standard Marking",
                "description": "Standard grading scheme",
                "is_default": True,
            },
            "grade_boundaries": {"A": 90, "B": 80, "C": 70, "D": 60, "F": 0},
            "pass_threshold": 60.0,
            "negative_marking": {"enabled": True, "penalty_percentage": 25},
        }

    @staticmethod
    def get_valid_exam_format():
        """Get valid exam format data"""
        return {
            "global_setting": {
                "key": "standard-format",
                "setting_type": "exam-format",
                "name": "Standard Format",
                "description": "3-hour comprehensive exam",
                "is_default": True,
            },
            "sections": [
                {"name": "Multiple Choice", "question_count": 20, "points": 40},
                {"name": "Essay", "question_count": 2, "points": 60},
            ],
            "time_limits": {"total_minutes": 180, "warning_minutes": 30},
            "question_distribution": {"easy": 40, "medium": 40, "hard": 20},
        }

    @staticmethod
    def get_user_update_data(user_id):
        """Get user update data"""
        return {"user_id": user_id, "name": "Updated User Name", "role": "instructor"}

    @staticmethod
    def get_user_action_data(user_id, action):
        """Get user action data (activate/deactivate)"""
        return {"user_id": user_id, "action": action}

    @staticmethod
    def get_bulk_user_action_data(user_ids, action):
        """Get bulk user action data"""
        return {"user_ids": user_ids, "action": action}

    @staticmethod
    def create_additional_instructors(count=2):
        """Create additional instructor users for testing"""
        instructors = []
        for i in range(count):
            instructor = User.objects.create_user(
                email=f"instructor{i+2}@test.com",
                name=f"Instructor {i+2}",
                password="InstructorPass123!",
                role="instructor",
                is_active=True,
            )
            instructors.append(instructor)
        return instructors
