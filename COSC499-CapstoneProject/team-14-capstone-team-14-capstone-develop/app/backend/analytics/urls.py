# analytics/urls.py
from django.urls import path

from .views import (
    AnalyticsCoursesView,
    AnalyticsHealthView,
    CompareCourseView,
    CourseBulkExportView,
    CourseStatisticsView,
    DebugCSVExportView,
    DebugDOCXExportView,
    DebugExportView,
    DebugPDFExportView,
    GradeDistributionView,
    InstructorOverviewView,
    PerformanceMetricsView,
    QuestionAnalyticsView,
    SimilarityFlagsView,
    StudentReportExportCSVView,
    StudentReportExportDOCXView,
    StudentReportExportView,
    StudentReportView,
    VariantSetAnalyticsView,
    YearOverYearTrendsView,
)

app_name = "analytics"

urlpatterns = [
    # Health check endpoint
    path("health/", AnalyticsHealthView.as_view(), name="analytics-health"),
    # Main analytics endpoints
    path(
        "instructor/overview/",
        InstructorOverviewView.as_view(),
        name="instructor-overview",
    ),
    path("questions/", QuestionAnalyticsView.as_view(), name="question-analytics"),
    path(
        "grade-distribution/",
        GradeDistributionView.as_view(),
        name="grade-distribution",
    ),
    path(
        "performance-metrics/",
        PerformanceMetricsView.as_view(),
        name="performance-metrics",
    ),
    path("similarity-flags/", SimilarityFlagsView.as_view(), name="similarity-flags"),
    path("courses/", AnalyticsCoursesView.as_view(), name="courses"),
    path("trends/", YearOverYearTrendsView.as_view(), name="trends"),
    path("search-courses/", AnalyticsCoursesView.as_view(), name="search-courses"),
    path(
        "student-report/<int:course_id>/<int:student_id>/",
        StudentReportView.as_view(),
        name="student-report",
    ),
    path(
        "variant-set/<int:exam_id>/<str:variant_ids>/",
        VariantSetAnalyticsView.as_view(),
        name="variant-set-analytics",
    ),
    path("compare-courses/", CompareCourseView.as_view(), name="compare-courses"),
    # Export endpoints - separate endpoints for each format to avoid query parameter issues
    path(
        "student-report/<int:course_id>/<int:student_id>/export/",
        StudentReportExportView.as_view(),
        name="student-export",
    ),
    path(
        "student-report/<int:course_id>/<int:student_id>/export/docx/",
        StudentReportExportDOCXView.as_view(),
        name="student-export-docx",
    ),
    path(
        "student-report/<int:course_id>/<int:student_id>/export/csv/",
        StudentReportExportCSVView.as_view(),
        name="student-export-csv",
    ),
    # Bulk export endpoints - MUST come before course-statistics to avoid conflicts
    path(
        "course/<int:course_id>/bulk-export/<str:file_format>/",
        CourseBulkExportView.as_view(),
        name="course-bulk-export-format",
    ),
    path(
        "course/<int:course_id>/bulk-export/",
        CourseBulkExportView.as_view(),
        name="course-bulk-export",
    ),
    # Course statistics - moved after bulk export to avoid conflicts
    path(
        "course-statistics/<str:course_code>/",
        CourseStatisticsView.as_view(),
        name="course-statistics",
    ),
    # Debug/test endpoints
    path("debug-simple/", DebugExportView.as_view(), name="debug-simple"),
    path("debug-csv/", DebugCSVExportView.as_view(), name="debug-csv"),
    path("debug-pdf/", DebugPDFExportView.as_view(), name="debug-pdf"),
    path("debug-docx/", DebugDOCXExportView.as_view(), name="debug-docx"),
    path(
        "test-bulk/<int:course_id>/<str:format>/",
        CourseBulkExportView.as_view(),
        name="test-bulk",
    ),
    path(
        "test-simple/<int:course_id>/",
        CourseBulkExportView.as_view(),
        name="test-simple",
    ),
]
