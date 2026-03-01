"""
Data formatting helpers for various output formats.
Provides consistent data formatting for API responses, reports, and exports.
"""

from typing import Any, Dict

from .recommendations import RecommendationEngine
from .statistics import StatisticsCalculator


class DataFormatter:
    """Helper class for formatting data for various outputs (API, PDF, DOCX)."""

    @staticmethod
    def format_student_report_data(
        student, course, student_performance: Dict, course_performance: Dict
    ) -> Dict[str, Any]:
        """Format comprehensive student report data for API response."""

        # Calculate trend if enough data points
        trend = 0
        if len(student_performance["scores"]) >= 2:
            trend = student_performance["scores"][-1] - student_performance["scores"][0]

        # Generate recommendations
        recommendations = RecommendationEngine.generate_recommendations(
            student,
            student_performance["stats"]["average"],
            course_performance["stats"]["average"],
            trend,
        )

        # Add exam-specific recommendations
        exam_recommendations = (
            RecommendationEngine.generate_exam_specific_recommendations(
                student_performance["results"], course_performance
            )
        )
        recommendations.extend(exam_recommendations)

        # Build detailed exam results with class statistics
        exam_details = []
        for result in student_performance["results"]:
            exam_performance = StatisticsCalculator.get_exam_performance(result.exam.id)

            exam_details.append(
                {
                    "examId": result.exam.id,
                    "examTitle": result.exam.title,
                    "studentScore": result.score,
                    "classAverage": exam_performance["stats"]["average"],
                    "classMedian": exam_performance["stats"]["median"],
                    "classBest": exam_performance["stats"]["max"],
                    "totalStudents": exam_performance["student_count"],
                    "correctAnswers": result.correct_answers,
                    "incorrectAnswers": result.incorrect_answers,
                    "unanswered": result.unanswered,
                    "submittedAt": (
                        result.submitted_at.isoformat() if result.submitted_at else None
                    ),
                }
            )

        return {
            "student": {
                "id": student.id,
                "student_id": student.student_id,
                "name": student.name,
                "email": student.email,
                "section": student.section,
            },
            "coursePerformance": {
                "studentAverage": student_performance["stats"]["average"],
                "studentBest": student_performance["stats"]["max"],
                "studentWorst": student_performance["stats"]["min"],
                "examsCompleted": student_performance["exam_count"],
                "classAverage": course_performance["stats"]["average"],
                "classMedian": course_performance["stats"]["median"],
                "classBest": course_performance["stats"]["max"],
                "totalClassStudents": course_performance["total_students"],
            },
            "examResults": exam_details,
            "recommendations": recommendations,
        }
