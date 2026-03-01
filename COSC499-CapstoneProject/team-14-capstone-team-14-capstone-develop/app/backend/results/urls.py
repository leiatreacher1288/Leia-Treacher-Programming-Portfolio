# results/urls.py
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ExamResultsSummaryView,
    ExamResultsView,
    ExamResultViewSet,
    ExportCSVView,
    ExportDOCXView,
    ExportPDFView,
    OMRImportHistoryView,
    OMRImportView,
    OMRTemplatesView,
    OMRValidateView,
    ResultsHealthCheckView,
    StudentResultView,
    UploadPlaceholderView,
)

router = DefaultRouter()
router.register("exam-results", ExamResultViewSet, basename="examresult")

urlpatterns = [
    # 1) root, upload, health
    path("", UploadPlaceholderView.as_view(), name="results-root"),
    path("upload/", UploadPlaceholderView.as_view(), name="results-upload"),
    path("health/", ResultsHealthCheckView.as_view(), name="results-health"),
    # 2) THREE SEPARATE EXPORT ENDPOINTS - EXPLICIT AND CLEAR
    path("export/<int:exam_id>/csv/", ExportCSVView.as_view(), name="export-csv"),
    path("export/<int:exam_id>/pdf/", ExportPDFView.as_view(), name="export-pdf"),
    path("export/<int:exam_id>/docx/", ExportDOCXView.as_view(), name="export-docx"),
    # 3) OMR batch-import
    path(
        "instructor/exams/<int:exam_id>/omr/import/",
        OMRImportView.as_view(),
        name="omr-import",
    ),
    path(
        "instructor/exams/<int:exam_id>/omr/validate/",
        OMRValidateView.as_view(),
        name="omr-validate",
    ),
    path(
        "instructor/exams/<int:exam_id>/omr/templates/",
        OMRTemplatesView.as_view(),
        name="omr-templates",
    ),
    path(
        "instructor/exams/<int:exam_id>/omr/history/",
        OMRImportHistoryView.as_view(),
        name="omr-history",
    ),
    # 4) Results endpoints
    path(
        "instructor/exams/<int:exam_id>/results/<int:student_id>/",
        StudentResultView.as_view(),
        name="student-result",
    ),
    path(
        "instructor/exams/<int:exam_id>/results/",
        ExamResultsView.as_view(),
        name="exam-results",
    ),
    # 5) course-level summary
    path(
        "instructor/courses/<int:course_id>/results/summary/",
        ExamResultsSummaryView.as_view(),
        name="course-results-summary",
    ),
    # 6) Router URLs - MUST come last to avoid capturing other URLs
    path("", include(router.urls)),
]
