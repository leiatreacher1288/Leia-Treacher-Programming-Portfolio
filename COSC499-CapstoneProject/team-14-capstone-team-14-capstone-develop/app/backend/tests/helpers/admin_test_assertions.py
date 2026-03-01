"""
Admin Test Assertions
====================
Custom assertion methods for admin functionality testing.
"""

from django.contrib.auth import get_user_model

from examvault.models import GlobalSetting

User = get_user_model()


class AdminTestAssertions:
    """Custom assertion methods for admin testing"""

    @staticmethod
    def has_keys(data, expected_keys):
        """Assert that data dictionary contains all expected keys"""
        for key in expected_keys:
            if key not in data:
                raise AssertionError(
                    f"Key '{key}' not found in data. Available keys: {list(data.keys())}"
                )
        return True

    @staticmethod
    def assert_user_created(
        test_case,
        email,
        expected_name,
        expected_role="instructor",
        expected_active=True,
    ):
        """Assert user was created correctly"""
        user = User.objects.get(email=email)
        test_case.assertEqual(user.name, expected_name)
        test_case.assertEqual(user.role, expected_role)
        test_case.assertEqual(user.is_active, expected_active)
        if expected_role == "instructor":
            test_case.assertFalse(user.is_staff)
        return user

    @staticmethod
    def assert_login_success(test_case, response, expected_email="admin@test.com"):
        """Assert successful login response"""
        test_case.assertEqual(response.status_code, 200)
        data = response.json()
        test_case.assertTrue(data.get("success"))
        test_case.assertIn("user", data)
        test_case.assertEqual(data["user"]["email"], expected_email)
        test_case.assertIn("sessionid", test_case.client.cookies)
        return data

    @staticmethod
    def assert_login_failure(test_case, response):
        """Assert failed login response"""
        test_case.assertIn(response.status_code, [400, 401, 403])

    @staticmethod
    def assert_admin_permissions(test_case, user):
        """Assert user has admin permissions"""
        test_case.assertTrue(user.is_staff)
        test_case.assertTrue(user.is_superuser)
        test_case.assertEqual(user.role, "admin")

    @staticmethod
    def assert_access_denied(test_case, response):
        """Assert access is denied"""
        test_case.assertIn(response.status_code, [401, 403])

    @staticmethod
    def assert_user_status_change(test_case, user, expected_active):
        """Assert user status was changed correctly"""
        user.refresh_from_db()
        test_case.assertEqual(user.is_active, expected_active)

    @staticmethod
    def assert_user_update(test_case, user, expected_name):
        """Assert user was updated correctly"""
        user.refresh_from_db()
        test_case.assertEqual(user.name, expected_name)

    @staticmethod
    def assert_bulk_status_change(test_case, users, expected_active):
        """Assert multiple users status was changed"""
        for user in users:
            user.refresh_from_db()
            test_case.assertEqual(user.is_active, expected_active)

    @staticmethod
    def assert_global_setting_created(test_case, key, expected_name, expected_creator):
        """Assert global setting was created correctly"""
        setting = GlobalSetting.objects.get(key=key)
        test_case.assertEqual(setting.name, expected_name)
        test_case.assertEqual(setting.created_by, expected_creator)
        return setting

    @staticmethod
    def assert_default_setting_enforcement(test_case, setting1, setting2):
        """Assert only one default setting per type"""
        setting1.refresh_from_db()
        test_case.assertFalse(setting1.is_default)
        test_case.assertTrue(setting2.is_default)

    @staticmethod
    def assert_api_success(test_case, response, expected_status=200):
        """Assert API response is successful"""
        test_case.assertEqual(response.status_code, expected_status)
        data = response.json()
        test_case.assertTrue(data.get("success"))
        return data

    @staticmethod
    def assert_api_error(test_case, response, expected_status=400):
        """Assert API response contains error"""
        test_case.assertEqual(response.status_code, expected_status)

    @staticmethod
    def assert_response_contains_data(test_case, response, required_keys):
        """Assert response contains required data keys"""
        test_case.assertEqual(response.status_code, 200)
        data = response.json()
        for key in required_keys:
            test_case.assertIn(key, data)
        return data

    @staticmethod
    def assert_user_list_filtering(test_case, response, filter_type):
        """Assert user list filtering works correctly"""
        test_case.assertEqual(response.status_code, 200)
        data = response.json()
        users = data.get("results", [])

        if filter_type == "Active":
            test_case.assertTrue(all(user["is_active"] for user in users))
        elif filter_type == "Pending Approval":
            test_case.assertTrue(all(not user["is_active"] for user in users))

        return users

    @staticmethod
    def assert_password_security(test_case, user, plain_password):
        """Assert password is properly hashed and secure"""
        test_case.assertNotEqual(user.password, plain_password)
        test_case.assertTrue(user.password.startswith("pbkdf2_sha256$"))
        test_case.assertTrue(user.check_password(plain_password))
        test_case.assertFalse(user.check_password("wrongpassword"))

    @staticmethod
    def assert_session_cleared(test_case, response, protected_endpoint):
        """Assert session is cleared after logout"""
        test_case.assertEqual(response.status_code, 200)
        # Try to access protected endpoint
        protected_response = test_case.client.get(protected_endpoint)
        test_case.assertIn(protected_response.status_code, [401, 403])

    @staticmethod
    def assert_user_has_status_fields(test_case, users):
        """Assert users have required status fields"""
        for user in users:
            test_case.assertIn("is_online", user)
            test_case.assertIn("is_offline", user)
            test_case.assertIn("last_login", user)
