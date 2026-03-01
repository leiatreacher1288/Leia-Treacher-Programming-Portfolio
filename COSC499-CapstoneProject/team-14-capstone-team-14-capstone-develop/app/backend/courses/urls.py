# courses/urls.py
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_nested.routers import NestedDefaultRouter

from .views import (
    AcceptInviteView,
    CoursesHealthCheckView,
    CourseViewSet,
    DeclineInviteView,
    InstructorCoursesAPIView,
    PendingInvitesView,
    PreviewImportQuestions,
    StudentViewSet,
)

# ────────────────────────────────────────────────────────────────
# 1) Top‑level router:  /api/courses/
# ────────────────────────────────────────────────────────────────
router = DefaultRouter()
router.register(r"", CourseViewSet, basename="course")

# ────────────────────────────────────────────────────────────────
# 2) Nested router:  /api/courses/{course_pk}/students/
# ────────────────────────────────────────────────────────────────
students_router = NestedDefaultRouter(router, r"", lookup="course")
students_router.register(r"students", StudentViewSet, basename="course-students")

urlpatterns = [
    # ───────────────────────────── utility endpoints (HIGHEST PRIORITY) ──────────────────────────────
    path("health/", CoursesHealthCheckView.as_view(), name="courses-health"),
    path("instructor/", InstructorCoursesAPIView.as_view(), name="instructor-courses"),
    # ─────────────────────────── explicit course action endpoints ──────────────────────
    path(
        "<int:course_id>/preview-import/",
        PreviewImportQuestions.as_view(),
        name="preview-import",
    ),
    path(
        "<int:pk>/add_instructor/",
        CourseViewSet.as_view({"post": "add_instructor"}),
        name="course-add-instructor",
    ),
    path(
        "<int:course_pk>/students/<int:pk>/",
        StudentViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="students-detail",
    ),
    # CSV utilities
    path(
        "<int:course_pk>/students/import_csv/",
        StudentViewSet.as_view({"post": "import_csv"}),
        name="students-import",
    ),
    path(
        "<int:course_pk>/students/export_csv/",
        StudentViewSet.as_view({"get": "export_csv"}),
        name="students-export",
    ),
    # Bulk student operations
    path(
        "<int:course_pk>/students/delete_all/",
        StudentViewSet.as_view({"delete": "delete_all"}),
        name="students-delete-all",
    ),
    path(
        "<int:course_pk>/students/anonymize_all/",
        StudentViewSet.as_view({"post": "anonymize_all"}),
        name="students-anonymize-all",
    ),
    path(
        "<int:course_pk>/students/deanonymize_all/",
        StudentViewSet.as_view({"post": "deanonymize_all"}),
        name="students-deanonymize-all",
    ),
    # ───────────────────────────── instructor management endpoints ────────────────────────────
    # These are the missing endpoints that your tests expect
    path(
        "<int:pk>/instructors/",
        CourseViewSet.as_view({"get": "instructors"}),
        name="course-instructors",
    ),
    path(
        "<int:pk>/add_instructor/",
        CourseViewSet.as_view({"post": "add_instructor"}),
        name="course-add-instructor",
    ),
    path(
        "<int:pk>/remove_instructor/",
        CourseViewSet.as_view({"post": "remove_instructor"}),
        name="course-remove-instructor",
    ),
    # ───────────────────────────── utility endpoints ──────────────────────────────
    path("health/", CoursesHealthCheckView.as_view(), name="courses-health"),
    path("instructor/", InstructorCoursesAPIView.as_view(), name="instructor-courses"),
    # ─────────────────────────── router‑generated routes ───────────────────────────
    path("", include(router.urls)),
    # ─────────────────────────── nested router (fallback) ─────────────────────────────
    path("", include(students_router.urls)),
    # Add these to your courses/urls.py
    path("invites/pending/", PendingInvitesView.as_view(), name="pending-invites"),
    path("invites/<int:pk>/accept/", AcceptInviteView.as_view(), name="accept-invite"),
    path(
        "invites/<int:pk>/decline/", DeclineInviteView.as_view(), name="decline-invite"
    ),
    path(
        "<int:pk>/leave/",
        CourseViewSet.as_view({"post": "leave"}),
        name="course-leave",
    ),
]
