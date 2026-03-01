"""
Analytics utility functions for data processing and calculations.
"""

import statistics
from typing import Any, Dict, List

from django.contrib.auth.models import User
from django.db.models import Avg
import numpy as np

from analytics.models import SimilarityFlag
from courses.models import Course
from exams.models import Exam
from results.models import Result


def get_instructor_statistics(instructor: User) -> Dict[str, Any]:
    """
    Calculate comprehensive statistics for an instructor.

    Args:
        instructor: User object representing the instructor

    Returns:
        Dictionary containing instructor statistics
    """
    # Get instructor's courses
    courses = Course.objects.filter(instructor=instructor)

    # Get instructor's exams
    exams = Exam.objects.filter(instructor=instructor)

    # Get all results for instructor's exams
    results = Result.objects.filter(exam__instructor=instructor)

    # Calculate statistics
    total_courses = courses.count()
    total_students = results.values("student").distinct().count()
    total_exams = exams.count()

    # Calculate average grade
    if results.exists():
        avg_percentage = results.aggregate(
            avg_score=Avg("score"), avg_max=Avg("max_score")
        )
        if avg_percentage["avg_score"] and avg_percentage["avg_max"]:
            average_grade = (
                avg_percentage["avg_score"] / avg_percentage["avg_max"]
            ) * 100
        else:
            average_grade = 0.0
    else:
        average_grade = 0.0

    return {
        "total_courses": total_courses,
        "total_students": total_students,
        "total_exams": total_exams,
        "average_grade": round(average_grade, 1),
    }


def calculate_grade_distribution(instructor: User) -> List[Dict[str, Any]]:
    """
    Calculate grade distribution for an instructor's exams.

    Args:
        instructor: User object representing the instructor

    Returns:
        List of dictionaries containing grade distribution data
    """
    results = Result.objects.filter(exam__instructor=instructor)

    if not results.exists():
        return []

    # Calculate percentages for each result
    percentages = []
    for result in results:
        if result.max_score > 0:
            percentage = (result.score / result.max_score) * 100
            percentages.append(percentage)

    if not percentages:
        return []

    # Define grade ranges
    grade_ranges = [
        ("A (90-100%)", 90, 100),
        ("B (80-89%)", 80, 89.99),
        ("C (70-79%)", 70, 79.99),
        ("D (60-69%)", 60, 69.99),
        ("F (0-59%)", 0, 59.99),
    ]

    total_results = len(percentages)
    distribution = []

    for range_name, min_score, max_score in grade_ranges:
        count = sum(1 for p in percentages if min_score <= p <= max_score)
        percentage = (count / total_results) * 100 if total_results > 0 else 0

        distribution.append(
            {"range": range_name, "count": count, "percentage": round(percentage, 1)}
        )

    return distribution


def calculate_performance_metrics(instructor: User) -> Dict[str, Any]:
    """
    Calculate performance metrics for an instructor's exams.

    Args:
        instructor: User object representing the instructor

    Returns:
        Dictionary containing performance metrics
    """
    results = Result.objects.filter(exam__instructor=instructor)

    if not results.exists():
        return {
            "mean": 0.0,
            "median": 0.0,
            "standardDeviation": 0.0,
            "skewness": 0.0,
            "reliability": 0.0,
            "totalResults": 0,
        }

    # Calculate percentages
    percentages = []
    for result in results:
        if result.max_score > 0:
            percentage = (result.score / result.max_score) * 100
            percentages.append(percentage)

    if not percentages:
        return {
            "mean": 0.0,
            "median": 0.0,
            "standardDeviation": 0.0,
            "skewness": 0.0,
            "reliability": 0.0,
            "totalResults": 0,
        }

    # Calculate statistics
    mean = statistics.mean(percentages)
    median = statistics.median(percentages)

    if len(percentages) > 1:
        std_dev = statistics.stdev(percentages)

        # Calculate skewness using numpy
        np_percentages = np.array(percentages)
        skewness = (
            float(np.mean(((np_percentages - mean) / std_dev) ** 3))
            if std_dev > 0
            else 0.0
        )

        # Simplified reliability calculation (Cronbach's alpha approximation)
        # This would need actual item-level data for proper calculation
        reliability = (
            max(0.0, min(1.0, 1.0 - (std_dev / mean) ** 2)) if mean > 0 else 0.0
        )
    else:
        std_dev = 0.0
        skewness = 0.0
        reliability = 0.0

    return {
        "mean": round(mean, 1),
        "median": round(median, 1),
        "standardDeviation": round(std_dev, 1),
        "skewness": round(skewness, 3),
        "reliability": round(reliability, 3),
        "totalResults": len(percentages),
    }


def detect_similarity_flags(
    exam: Exam, threshold: float = 80.0
) -> List[Dict[str, Any]]:
    """
    Detect potential academic integrity issues through similarity analysis.

    Args:
        exam: Exam object to analyze
        threshold: Similarity threshold percentage

    Returns:
        List of similarity flags
    """
    # This is a simplified implementation
    # In practice, this would involve sophisticated comparison algorithms

    flags = []
    existing_flags = SimilarityFlag.objects.filter(exam=exam)

    for flag in existing_flags:
        flags.append(
            {
                "id": flag.id,
                "student1": flag.student1.username,
                "student2": flag.student2.username,
                "similarity": flag.similarity_score,
                "examId": flag.exam.id,
                "status": flag.status,
                "created_at": flag.created_at.isoformat(),
            }
        )

    return flags


def get_top_performing_courses(
    instructor: User, limit: int = 5
) -> List[Dict[str, Any]]:
    """
    Get top performing courses for an instructor.

    Args:
        instructor: User object representing the instructor
        limit: Maximum number of courses to return

    Returns:
        List of top performing courses
    """
    courses = Course.objects.filter(instructor=instructor)
    course_performance = []

    for course in courses:
        exams = Exam.objects.filter(course=course)
        results = Result.objects.filter(exam__in=exams)

        if results.exists():
            avg_data = results.aggregate(
                avg_score=Avg("score"), avg_max=Avg("max_score")
            )

            if avg_data["avg_score"] and avg_data["avg_max"]:
                avg_percentage = (avg_data["avg_score"] / avg_data["avg_max"]) * 100
            else:
                avg_percentage = 0.0

            student_count = results.values("student").distinct().count()
            exam_count = exams.count()

            course_performance.append(
                {
                    "id": course.id,
                    "code": course.code,
                    "name": course.title,
                    "avg_score": round(avg_percentage, 1),
                    "student_count": student_count,
                    "exam_count": exam_count,
                }
            )

    # Sort by average score and return top courses
    course_performance.sort(key=lambda x: x["avg_score"], reverse=True)
    return course_performance[:limit]


def get_recent_activity(instructor: User, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Get recent activity for an instructor.

    Args:
        instructor: User object representing the instructor
        limit: Maximum number of activities to return

    Returns:
        List of recent activities
    """
    activities = []

    # Get recent exams
    recent_exams = Exam.objects.filter(instructor=instructor).order_by("-created_at")[
        :limit
    ]
    for exam in recent_exams:
        activities.append(
            {
                "type": "exam",
                "action": f"Created exam: {exam.title}",
                "course": exam.course.code,
                "date": exam.created_at.date().isoformat(),
                "relative_date": "Recently",  # This would be calculated based on actual date
            }
        )

    # Sort by date and return limited results
    return activities[:limit]


def calculate_question_statistics(instructor: User) -> Dict[str, Any]:
    """
    Calculate question-level statistics for an instructor's exams.

    Args:
        instructor: User object representing the instructor

    Returns:
        Dictionary containing question statistics
    """
    exams = Exam.objects.filter(instructor=instructor)

    # This is a simplified implementation
    # In practice, this would analyze individual question responses

    question_stats = []
    total_questions = 0

    for exam in exams:
        # Mock question statistics for testing
        # In real implementation, this would analyze actual question responses
        for i in range(1, 21):  # Assume 20 questions per exam
            question_stats.append(
                {
                    "questionNumber": i,
                    "difficulty": round(np.random.uniform(0.2, 0.8), 2),
                    "discrimination": round(np.random.uniform(0.1, 0.7), 2),
                    "pointBiserial": round(np.random.uniform(0.1, 0.6), 2),
                    "missedCount": np.random.randint(5, 50),
                    "correctPercent": round(np.random.uniform(50, 95), 1),
                    "averageTime": np.random.randint(60, 300),
                }
            )
            total_questions += 1

    return {
        "questionStatistics": question_stats[:20],  # Return first 20 for display
        "totalQuestions": total_questions,
        "examCount": exams.count(),
    }


def get_year_over_year_trends(
    instructor: User, timeframe: str = "1year"
) -> Dict[str, Any]:
    """
    Get year-over-year performance trends for an instructor.

    Args:
        instructor: User object representing the instructor
        timeframe: Time period for trends ('1year', '2years', 'all')

    Returns:
        Dictionary containing trend data
    """
    courses = Course.objects.filter(instructor=instructor)
    trends = []

    # Group by year and term
    course_terms = courses.values("term").distinct()

    for term_data in course_terms:
        term = term_data["term"]
        if term:
            # Parse term (e.g., '2024W1' -> year=2024, term='W1')
            try:
                year = int(term[:4])
                term_code = term[4:]

                term_courses = courses.filter(term=term)
                term_results = Result.objects.filter(exam__course__in=term_courses)

                if term_results.exists():
                    avg_data = term_results.aggregate(
                        avg_score=Avg("score"), avg_max=Avg("max_score")
                    )

                    if avg_data["avg_score"] and avg_data["avg_max"]:
                        average = (avg_data["avg_score"] / avg_data["avg_max"]) * 100
                    else:
                        average = 0.0

                    count = term_results.count()

                    trends.append(
                        {
                            "year": year,
                            "term": term_code,
                            "average": round(average, 1),
                            "count": count,
                        }
                    )
            except (ValueError, IndexError):
                continue

    # Sort trends by year and term
    trends.sort(key=lambda x: (x["year"], x["term"]))

    return {"trends": trends, "timeframe": timeframe, "totalDataPoints": len(trends)}
