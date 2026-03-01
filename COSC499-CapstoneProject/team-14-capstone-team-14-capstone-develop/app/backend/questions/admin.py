# questions/admin.py
from django.contrib import admin

from .models import Question, QuestionBank


# ────────────────────────────────────────────────────────────────────────────────
# QuestionBank admin
# ────────────────────────────────────────────────────────────────────────────────
@admin.register(QuestionBank)
class QuestionBankAdmin(admin.ModelAdmin):
    list_display = ["title", "course", "questions_count", "created_at"]
    list_filter = ["course", "created_at"]
    search_fields = ["title", "course__name"]
    ordering = ["-created_at"]

    @admin.display(description="Questions")
    def questions_count(self, obj):
        return obj.questions.count()


# ────────────────────────────────────────────────────────────────────────────────
# Question admin  (updated to use FK name `bank`, not `question_bank`)
# ────────────────────────────────────────────────────────────────────────────────
@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = [
        "text_preview",
        "bank",  # ← was question_bank
        "difficulty",
        "has_options",
        "has_correct_answers",
    ]
    list_filter = [
        "bank",  # ← was question_bank
        "difficulty",
        "bank__course",  # ← was question_bank__course
    ]
    search_fields = ["text", "bank__title", "tags"]
    ordering = ["bank", "id"]  # ← was question_bank

    fieldsets = (
        (
            "Question Content",
            {
                "fields": ("bank", "prompt", "difficulty")
            },  # ← bank instead of question_bank
        ),
        ("Answer Options", {"fields": ("choices", "correct_answer")}),
        ("Metadata", {"fields": ("tags", "explanation"), "classes": ("collapse",)}),
    )

    # ──────────────── helpers ────────────────
    @admin.display(description="Question Text")
    def text_preview(self, obj):
        return (obj.prompt[:60] + "…") if len(obj.prompt) > 60 else obj.prompt

    @admin.display(boolean=True, description="Has Options")
    def has_options(self, obj):
        return bool(obj.choices)

    @admin.display(boolean=True, description="Has Correct Answers")
    def has_correct_answers(self, obj):
        return bool(obj.correct_answer)
