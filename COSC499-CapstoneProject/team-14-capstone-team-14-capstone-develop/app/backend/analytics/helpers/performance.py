"""
Performance analysis helpers for trend analysis and insights.
Provides qualitative analysis of student performance patterns.
"""

from typing import List, Tuple


class PerformanceAnalyzer:
    """Helper class for analyzing performance patterns and trends."""

    @staticmethod
    def analyze_performance_trend(scores: List[float]) -> Tuple[float, str]:
        """Analyze the trend in student scores over time."""
        if len(scores) < 2:
            return 0.0, "Insufficient data"

        trend = scores[-1] - scores[0]

        if trend > 5:
            analysis = "Positive trend: Your scores are improving over time!"
        elif trend < -5:
            analysis = "Concerning trend: Your scores are declining. Review your study methods."
        else:
            analysis = "Stable performance: Your scores are consistent."

        return trend, analysis

    @staticmethod
    def get_performance_analysis(student_avg: float, class_avg: float) -> str:
        """Get qualitative analysis of student performance vs class."""
        if class_avg == 0:
            return "Unable to compare with class average."

        performance_ratio = student_avg / class_avg

        if performance_ratio >= 1.2:
            return "Excellent performance! You are significantly above class average."
        elif performance_ratio >= 1.1:
            return "Very good performance! You are above class average."
        elif performance_ratio >= 0.9:
            return "Good performance! You are performing around class average."
        elif performance_ratio >= 0.8:
            return "Below average performance. There's room for improvement."
        else:
            return "Performance needs significant improvement. Consider seeking additional help."
