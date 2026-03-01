# analytics/admin.py
from django.contrib import admin

from .models import QuestionPerformance, ScoreDistribution, SimilarityCheck


# ────────────────────────────────────────────────────────────────────────────────
# Question-level analytics
# ────────────────────────────────────────────────────────────────────────────────
@admin.register(QuestionPerformance)
class QuestionPerformanceAdmin(admin.ModelAdmin):
    """Admin interface for QuestionPerformance"""

    list_display = [
        "question_preview",
        "question_bank",  # custom property below
        "total_attempts",
        "incorrect_attempts",
        "miss_rate_display",
    ]

    # 🔑 FK path updated to `question__bank`
    list_filter = ["question__bank", "total_attempts"]
    search_fields = ["question__text", "question__bank__title"]
    ordering = ["-incorrect_attempts"]

    # ───── custom column helpers ─────
    @admin.display(description="Question")
    def question_preview(self, obj):
        text = obj.question.text
        return text[:50] + "…" if len(text) > 50 else text

    @admin.display(description="Question Bank")
    def question_bank(self, obj):
        return obj.question.bank.title if obj.question.bank else "No Bank"

    @admin.display(description="Miss Rate")
    def miss_rate_display(self, obj):
        return f"{obj.miss_rate:.1%}"


# ────────────────────────────────────────────────────────────────────────────────
# Similarity-check analytics
# ────────────────────────────────────────────────────────────────────────────────
@admin.register(SimilarityCheck)
class SimilarityCheckAdmin(admin.ModelAdmin):
    """Admin interface for SimilarityCheck"""

    list_display = [
        "exam_variant",
        "student_a_id",
        "student_b_id",
        "similarity_score",
        "flagged",
        "checked_at",
    ]
    list_filter = ["flagged", "exam_variant__exam", "checked_at"]
    search_fields = ["student_a_id", "student_b_id"]
    ordering = ["-similarity_score"]


# ────────────────────────────────────────────────────────────────────────────────
# Score-distribution analytics
# ────────────────────────────────────────────────────────────────────────────────
@admin.register(ScoreDistribution)
class ScoreDistributionAdmin(admin.ModelAdmin):
    """Admin interface for ScoreDistribution"""

    list_display = ["exam", "mean", "median", "std_dev", "generated_at"]
    list_filter = ["exam", "generated_at"]
    search_fields = ["exam__title"]
    ordering = ["-generated_at"]
