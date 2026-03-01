from django.conf import settings
from django.contrib import admin
from django.urls import include, path

from examvault.adminViews import (  # Global Settings API Views
    AdminCoursesOverviewAPIView,
    AdminExamFormatsAPIView,
    AdminExamsOverviewAPIView,
    AdminGlobalSettingsAPIView,
    AdminInstructorBulkAPIView,
    AdminInstructorDetailAPIView,
    AdminInstructorManagementAPIView,
    AdminLoginAPIView,
    AdminLogoutAPIView,
    AdminMarkingSchemesAPIView,
    AdminPrivacyAuditLogAPIView,
    AdminRecentActivityAPIView,
    AdminRefreshAPIView,
    AdminStatsAPIView,
    AdminTemplatesAPIView,
    AdminUsersAPIView,
    CSRFTokenView,
)
from examvault.views import GlobalHealthCheckView

urlpatterns = [
    # Admin API URLs for React frontend
    path("api/admin/login/", AdminLoginAPIView.as_view(), name="admin-login-api"),
    path("api/admin/logout/", AdminLogoutAPIView.as_view(), name="admin-logout-api"),
    path("api/admin/refresh/", AdminRefreshAPIView.as_view(), name="admin-refresh-api"),
    path("api/admin/stats/", AdminStatsAPIView.as_view(), name="admin-stats-api"),
    path("api/admin/health/", AdminStatsAPIView.as_view(), name="admin-health-api"),
    path(
        "api/admin/recent-activity/",
        AdminRecentActivityAPIView.as_view(),
        name="admin-recent-activity-api",
    ),
    path("api/admin/csrf-token/", CSRFTokenView.as_view(), name="admin-csrf-token"),
    path("api/admin/users/", AdminUsersAPIView.as_view(), name="admin-users-api"),
    path(
        "api/admin/users/<int:user_id>/",
        AdminUsersAPIView.as_view(),
        name="admin-users-detail",
    ),
    path(
        "api/admin/users/update/",
        AdminUsersAPIView.as_view(),
        name="admin-users-update",
    ),
    path(
        "api/admin/users/delete/",
        AdminUsersAPIView.as_view(),
        name="admin-users-delete",
    ),
    # PII Management URLs for GDPR compliance
    path(
        "api/admin/users/<int:user_id>/archive/",
        AdminUsersAPIView.as_view(),
        name="admin-users-archive",
    ),
    path(
        "api/admin/users/<int:user_id>/export/",
        AdminUsersAPIView.as_view(),
        name="admin-users-export",
    ),
    path(
        "api/admin/users/bulk-archive/",
        AdminUsersAPIView.as_view(),
        name="admin-users-bulk-archive",
    ),
    path(
        "api/admin/users/bulk-delete/",
        AdminUsersAPIView.as_view(),
        name="admin-users-bulk-delete",
    ),
    # Instructor Management URLs
    path(
        "api/admin/instructors/",
        AdminInstructorManagementAPIView.as_view(),
        name="admin-instructors",
    ),
    path(
        "api/admin/instructors/<int:instructor_id>/",
        AdminInstructorDetailAPIView.as_view(),
        name="admin-instructor-detail",
    ),
    path(
        "api/admin/instructors/<int:instructor_id>/deactivate/",
        AdminInstructorDetailAPIView.as_view(),
        name="admin-instructor-deactivate",
    ),
    path(
        "api/admin/instructors/<int:instructor_id>/reactivate/",
        AdminInstructorDetailAPIView.as_view(),
        name="admin-instructor-reactivate",
    ),
    path(
        "api/admin/instructors/bulk-deactivate/",
        AdminInstructorBulkAPIView.as_view(),
        name="admin-instructor-bulk-deactivate",
    ),
    # Global Settings API URLs (UR 1.3)
    path(
        "api/admin/settings/",
        AdminGlobalSettingsAPIView.as_view(),
        name="admin-global-settings",
    ),
    path(
        "api/admin/settings/marking-schemes/",
        AdminMarkingSchemesAPIView.as_view(),
        name="admin-marking-schemes",
    ),
    path(
        "api/admin/settings/marking-schemes/<int:scheme_id>/",
        AdminMarkingSchemesAPIView.as_view(),
        name="admin-marking-scheme-detail",
    ),
    path(
        "api/admin/settings/exam-formats/",
        AdminExamFormatsAPIView.as_view(),
        name="admin-exam-formats",
    ),
    path(
        "api/admin/settings/exam-formats/<int:format_id>/",
        AdminExamFormatsAPIView.as_view(),
        name="admin-exam-format-detail",
    ),
    # Admin Overview APIs
    path(
        "api/admin/courses-overview/",
        AdminCoursesOverviewAPIView.as_view(),
        name="admin-courses-overview",
    ),
    path(
        "api/admin/exams-overview/",
        AdminExamsOverviewAPIView.as_view(),
        name="admin-exams-overview",
    ),
    path(
        "api/admin/templates/", AdminTemplatesAPIView.as_view(), name="admin-templates"
    ),
    path(
        "api/admin/templates/<int:template_id>/",
        AdminTemplatesAPIView.as_view(),
        name="admin-templates-detail",
    ),
    # Privacy Audit Log API
    path(
        "api/admin/privacy-audit/",
        AdminPrivacyAuditLogAPIView.as_view(),
        name="admin-privacy-audit",
    ),
    # Django's default admin (different path)
    path("admin/", admin.site.urls),
    # Regular API URLs
    path("api/auth/", include("users.urls")),
    path("api/exams/", include("exams.urls")),
    path("api/questions/", include("questions.urls")),
    path("api/analytics/", include("analytics.urls")),
    path("api/results/", include("results.urls")),
    path("api/courses/", include("courses.urls")),
    path("api/health/", GlobalHealthCheckView.as_view(), name="global-health"),
]

if settings.DEBUG:
    try:
        import debug_toolbar

        urlpatterns = [
            path("__debug__/", include(debug_toolbar.urls)),
        ] + urlpatterns
    except ImportError:
        pass  # debug_toolbar not available, continue without it
