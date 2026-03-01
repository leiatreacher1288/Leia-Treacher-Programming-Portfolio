"""
Statistics calculation helpers for analytics.
Centralizes common statistical calculations from exam results.
"""

import math
from typing import Any, Dict, List, Tuple

from courses.models import Course
from results.models import ExamResult


class StatisticsCalculator:
    """Helper class for calculating various statistics from exam results."""

    @staticmethod
    def calculate_basic_stats(scores: List[float]) -> Dict[str, float]:
        """Calculate average, median, min, max from a list of scores."""
        if not scores:
            return {"average": 0, "median": 0, "min": 0, "max": 0}

        sorted_scores = sorted(scores)
        n = len(sorted_scores)

        average = round(sum(sorted_scores) / n, 2)
        median = (
            sorted_scores[n // 2]
            if n % 2 == 1
            else (sorted_scores[n // 2 - 1] + sorted_scores[n // 2]) / 2
        )
        median = round(median, 2)
        min_score = min(sorted_scores)
        max_score = max(sorted_scores)

        return {
            "average": average,
            "median": median,
            "min": min_score,
            "max": max_score,
        }

    @staticmethod
    def get_student_performance(student_id: int, course: Course) -> Dict[str, Any]:
        """Get comprehensive performance data for a student in a course."""
        # Get student's exam results
        student_results = (
            ExamResult.objects.filter(student_id=student_id, exam__course=course)
            .exclude(score__isnull=True)
            .select_related("exam", "variant")
        )

        student_scores = [float(r.score) for r in student_results]
        student_stats = StatisticsCalculator.calculate_basic_stats(student_scores)

        return {
            "results": student_results,
            "scores": student_scores,
            "stats": student_stats,
            "exam_count": len(student_scores),
        }

    @staticmethod
    def get_course_performance(course: Course) -> Dict[str, Any]:
        """Get comprehensive performance data for entire course."""
        # Get all course exam results
        course_results = (
            ExamResult.objects.filter(exam__course=course)
            .exclude(score__isnull=True)
            .select_related("exam", "student")
        )

        course_scores = [float(r.score) for r in course_results]
        course_stats = StatisticsCalculator.calculate_basic_stats(course_scores)

        total_students = len(set(r.student.id for r in course_results))

        return {
            "results": course_results,
            "scores": course_scores,
            "stats": course_stats,
            "total_students": total_students,
        }

    @staticmethod
    def get_exam_performance(exam_id: int) -> Dict[str, Any]:
        """Get comprehensive performance data for a specific exam."""
        exam_results = (
            ExamResult.objects.filter(exam_id=exam_id)
            .exclude(score__isnull=True)
            .select_related("student", "variant")
        )

        exam_scores = [float(r.score) for r in exam_results]
        exam_stats = StatisticsCalculator.calculate_basic_stats(exam_scores)

        return {
            "results": exam_results,
            "scores": exam_scores,
            "stats": exam_stats,
            "student_count": len(exam_scores),
        }

    @staticmethod
    def calculate_standard_deviation(scores: List[float]) -> float:
        """Calculate standard deviation of scores."""
        if len(scores) < 2:
            return 0.0

        mean = sum(scores) / len(scores)
        variance = sum((x - mean) ** 2 for x in scores) / (len(scores) - 1)
        return round(math.sqrt(variance), 2)

    @staticmethod
    def calculate_percentile(scores: List[float], percentile: int) -> float:
        """Calculate the specified percentile of scores."""
        if not scores:
            return 0.0

        sorted_scores = sorted(scores)
        n = len(sorted_scores)
        index = (percentile / 100) * (n - 1)

        if index.is_integer():
            return sorted_scores[int(index)]
        else:
            lower = sorted_scores[int(index)]
            upper = sorted_scores[int(index) + 1]
            return round(lower + (upper - lower) * (index - int(index)), 2)

    @staticmethod
    def calculate_discrimination_index(
        high_scores: List[float], low_scores: List[float], max_score: float
    ) -> float:
        """
        Calculate discrimination index for an item.
        DI = (Mean of high group - Mean of low group) / Max possible score
        """
        if not high_scores or not low_scores or max_score == 0:
            return 0.0

        high_mean = sum(high_scores) / len(high_scores)
        low_mean = sum(low_scores) / len(low_scores)

        discrimination_index = (high_mean - low_mean) / max_score
        return round(discrimination_index, 3)

    @staticmethod
    def calculate_point_biserial(item_scores: List[Tuple[float, float]]) -> float:
        """
        Calculate point-biserial correlation coefficient.
        item_scores: List of tuples (item_score, total_score)
        """
        if len(item_scores) < 2:
            return 0.0

        # Separate into correct (1) and incorrect (0) groups
        correct_total_scores = [total for item, total in item_scores if item > 0]
        incorrect_total_scores = [total for item, total in item_scores if item == 0]

        if not correct_total_scores or not incorrect_total_scores:
            return 0.0

        # Calculate means
        mean_correct = sum(correct_total_scores) / len(correct_total_scores)
        mean_incorrect = sum(incorrect_total_scores) / len(incorrect_total_scores)

        # Calculate overall mean and standard deviation
        all_totals = [total for _, total in item_scores]
        overall_mean = sum(all_totals) / len(all_totals)

        if len(all_totals) < 2:
            return 0.0

        std_dev = math.sqrt(
            sum((x - overall_mean) ** 2 for x in all_totals) / (len(all_totals) - 1)
        )

        if std_dev == 0:
            return 0.0

        # Calculate point-biserial correlation
        p = len(correct_total_scores) / len(item_scores)  # proportion correct
        q = 1 - p  # proportion incorrect

        rpb = ((mean_correct - mean_incorrect) / std_dev) * math.sqrt(p * q)
        return round(rpb, 3)

    @staticmethod
    def calculate_item_difficulty(correct_count: int, total_count: int) -> float:
        """Calculate item difficulty (proportion of students who answered correctly)."""
        if total_count == 0:
            return 0.0
        return round(correct_count / total_count, 3)

    @staticmethod
    def calculate_full_exam_statistics(exam_scores: List[float]) -> Dict[str, Any]:
        """Calculate comprehensive exam statistics including all required metrics."""
        if not exam_scores:
            return {}

        basic_stats = StatisticsCalculator.calculate_basic_stats(exam_scores)
        std_dev = StatisticsCalculator.calculate_standard_deviation(exam_scores)

        # Calculate percentiles
        percentiles = {}
        for p in [25, 50, 75, 90, 95]:
            percentiles[f"p{p}"] = StatisticsCalculator.calculate_percentile(
                exam_scores, p
            )

        # Calculate grade distribution
        grade_ranges = {
            "A": (90, 100),
            "B": (80, 89),
            "C": (70, 79),
            "D": (60, 69),
            "F": (0, 59),
        }

        grade_distribution = {}
        for grade, (min_score, max_score) in grade_ranges.items():
            count = sum(1 for score in exam_scores if min_score <= score <= max_score)
            grade_distribution[grade] = {
                "count": count,
                "percentage": round((count / len(exam_scores)) * 100, 1),
            }

        return {
            **basic_stats,
            "standard_deviation": std_dev,
            "percentiles": percentiles,
            "grade_distribution": grade_distribution,
            "total_students": len(exam_scores),
            "reliability_metrics": {
                "coefficient_alpha": 0.85,  # Placeholder - would need item-level data
                "sem": round(
                    std_dev * math.sqrt(1 - 0.85), 2
                ),  # Standard Error of Measurement
            },
        }

    @staticmethod
    def generate_per_topic_breakdown(
        exam_results: List, topic_mapping: Dict[str, List[int]]
    ) -> Dict[str, Dict]:
        """
        Generate per-topic performance breakdown.
        topic_mapping: Dict mapping topic names to question IDs
        """
        topic_performance = {}

        for topic, question_ids in topic_mapping.items():
            pass

            # This would need to be implemented based on your question/answer structure
            # For now, providing a framework
            topic_performance[topic] = {
                "average_score": 0.0,
                "difficulty": 0.0,
                "discrimination": 0.0,
                "student_count": 0,
            }

        return topic_performance
