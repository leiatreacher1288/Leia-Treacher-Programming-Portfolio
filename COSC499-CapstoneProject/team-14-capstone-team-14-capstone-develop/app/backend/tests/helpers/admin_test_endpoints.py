"""
Admin Test Endpoints
===================
Centralized endpoint definitions for admin testing.
"""


class AdminEndpoints:
    """Centralized admin API endpoints for testing"""

    # Authentication endpoints
    LOGIN = "/api/admin/login/"
    LOGOUT = "/api/admin/logout/"
    CSRF = "/api/admin/csrf-token/"

    # Admin dashboard endpoints
    STATS = "/api/admin/stats/"
    RECENT_ACTIVITY = "/api/admin/recent-activity/"

    # User management endpoints
    USERS = "/api/admin/users/"

    # Global settings endpoints
    GLOBAL_SETTINGS = "/api/admin/settings/"
    MARKING_SCHEMES = "/api/admin/settings/marking-schemes/"
    EXAM_FORMATS = "/api/admin/settings/exam-formats/"

    # Overview endpoints
    COURSES_OVERVIEW = "/api/admin/courses-overview/"
    EXAMS_OVERVIEW = "/api/admin/exams-overview/"

    @classmethod
    def get_all_endpoints(cls):
        """Get all endpoint URLs as a dictionary"""
        return {
            "login": cls.LOGIN,
            "logout": cls.LOGOUT,
            "csrf": cls.CSRF,
            "stats": cls.STATS,
            "recent_activity": cls.RECENT_ACTIVITY,
            "users": cls.USERS,
            "global_settings": cls.GLOBAL_SETTINGS,
            "marking_schemes": cls.MARKING_SCHEMES,
            "exam_formats": cls.EXAM_FORMATS,
            "courses_overview": cls.COURSES_OVERVIEW,
            "exams_overview": cls.EXAMS_OVERVIEW,
        }

    @classmethod
    def get_protected_endpoints(cls):
        """Get endpoints that require admin authentication"""
        return [
            cls.STATS,
            cls.USERS,
            cls.RECENT_ACTIVITY,
            cls.GLOBAL_SETTINGS,
            cls.MARKING_SCHEMES,
            cls.EXAM_FORMATS,
            cls.COURSES_OVERVIEW,
            cls.EXAMS_OVERVIEW,
        ]

    @classmethod
    def get_public_endpoints(cls):
        """Get endpoints that don't require authentication"""
        return [
            cls.LOGIN,
            cls.LOGOUT,
            cls.CSRF,
        ]

    @classmethod
    def get_user_filter_url(cls, filter_type):
        """Get user endpoint with filter parameter"""
        return f"{cls.USERS}?filter={filter_type}"
