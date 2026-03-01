from django.urls import path

from .views import (
    AllQuestionsView,
    PingView,
    QuestionBankListView,
    QuestionBankView,
    QuestionCSVUploadView,
    QuestionListView,
    QuestionsHealthCheckView,
    QuestionView,
)

urlpatterns = [
    path("", PingView.as_view(), name="questions-root"),
    path("health/", QuestionsHealthCheckView.as_view(), name="questions-health"),
    path("ping/", PingView.as_view(), name="questions-ping"),
    path("upload/", QuestionCSVUploadView.as_view(), name="questions-upload"),
    path("all/", AllQuestionsView.as_view(), name="all-questions"),
    path(
        "questionbanklist/<int:course_id>/",
        QuestionBankListView.as_view(),
        name="questionbank-list",
    ),
    path(
        "questionbank/<int:pk>/", QuestionBankView.as_view(), name="questionbank-detail"
    ),
    path("questionbank/", QuestionBankView.as_view(), name="questionbank-detail"),
    path("question/<int:pk>/", QuestionView.as_view(), name="question-detail"),
    path("question/", QuestionView.as_view(), name="question-detail"),
    path(
        "questionlist/<int:questionbank_id>/",
        QuestionListView.as_view(),
        name="question-list",
    ),
]
