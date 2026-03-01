"""
Recommendation engine for generating student recommendations.
Provides intelligent recommendations based on performance analysis.
"""

from typing import List, Optional

from django.db.models import QuerySet

from .statistics import StatisticsCalculator


class RecommendationEngine:
    """Helper class for generating student recommendations based on performance."""

    @staticmethod
    def generate_recommendations(
        student,
        student_avg: float,
        class_avg: float,
        performance_trend: Optional[float] = None,
    ) -> List[str]:
        """Generate personalized recommendations based on performance metrics."""
        recommendations = []
        performance_ratio = student_avg / class_avg if class_avg > 0 else 1

        # Use student's 8-digit code instead of backend ID
        student_code = getattr(student, "student_id", str(student.id))

        # Performance-based recommendations
        if student_avg < 60:
            recommendations.append(
                f"Student (ID: {student_code}) performance is below passing level. Consider attending office hours for additional support."
            )
        elif performance_ratio < 0.85:
            recommendations.append(
                f"Student (ID: {student_code}) performance is below class average. Focus on areas where points were lost."
            )
        elif performance_ratio < 1.1:
            recommendations.append(
                f"Student (ID: {student_code}) is performing around the class average. Good work!"
            )
        else:
            recommendations.append(
                f"Student (ID: {student_code}) shows excellent performance above class average."
            )

        # Trend-based recommendations
        if performance_trend is not None:
            if performance_trend > 10:
                recommendations.append(
                    f"Student (ID: {student_code}) shows great improvement trend with increasing scores over time."
                )
            elif performance_trend < -10:
                recommendations.append(
                    f"Student (ID: {student_code}) recent scores show a declining trend. Consider reviewing study approach."
                )

        return recommendations

    @staticmethod
    def generate_exam_specific_recommendations(
        student_results: QuerySet, course_performance: dict
    ) -> List[str]:
        """Generate recommendations based on specific exam performance patterns."""
        recommendations = []

        # Find exams where student performed significantly below class average
        low_performing_exams = []
        for result in student_results:
            exam_performance = StatisticsCalculator.get_exam_performance(result.exam.id)
            if (
                result.score
                and exam_performance["stats"]["average"] > 0
                and result.score < exam_performance["stats"]["average"] * 0.8
            ):
                low_performing_exams.append(result.exam.title)

        if low_performing_exams:
            exam_titles = ", ".join(low_performing_exams[:3])  # Limit to first 3
            if len(low_performing_exams) > 3:
                exam_titles += "..."
            recommendations.append(f"Review topics covered in: {exam_titles}")

        return recommendations
