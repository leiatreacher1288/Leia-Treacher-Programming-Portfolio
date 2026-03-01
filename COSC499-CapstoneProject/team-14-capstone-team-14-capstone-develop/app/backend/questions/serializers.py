from rest_framework import serializers

from .models import Question, QuestionBank


class QuestionSerializer(serializers.ModelSerializer):
    """
    Serializer for the Question model.
    Handles validation and data transformation for both JSON API use and
    future CSV imports.

    STANDARDIZED FIELDS:
    - prompt: question text
    - choices: options (dict A-E)
    - correct_answer: array of correct answers (letters)
    All legacy aliases (text, options, correct_answers) are removed for consistency.
    """

    # Added these new fields so the seach on the QuestionBank page will work
    # Also to have Course information available for each question
    course_id = serializers.SerializerMethodField()
    course_code = serializers.SerializerMethodField()
    course_name = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = [
            "id",
            "bank",
            "prompt",
            "choices",
            "correct_answer",
            "difficulty",
            "tags",
            "explanation",
            "points",
            "created_at",
            "updated_at",
            "created_by",
            "course_id",
            "course_code",
            "course_name",
        ]

    def get_course_id(self, obj):
        print(
            f"[DEBUG] get_course_id: obj={obj}, "
            f"obj.bank={getattr(obj, 'bank', None)}, "
            f"obj.bank.course={getattr(getattr(obj, 'bank', None), 'course', None)}"
        )
        return obj.bank.course.id if obj.bank and obj.bank.course else None

    def get_course_code(self, obj):
        print(
            f"[DEBUG] get_course_code: obj={obj}, "
            f"obj.bank={getattr(obj, 'bank', None)}, "
            f"obj.bank.course={getattr(getattr(obj, 'bank', None), 'course', None)}"
        )
        return obj.bank.course.code if obj.bank and obj.bank.course else None

    def get_course_name(self, obj):
        print(
            f"[DEBUG] get_course_name: obj={obj}, "
            f"obj.bank={getattr(obj, 'bank', None)}, "
            f"obj.bank.course={getattr(getattr(obj, 'bank', None), 'course', None)}"
        )
        return obj.bank.course.name if obj.bank and obj.bank.course else None

    def validate(self, data):
        # Only validate if choices or correct_answer are being updated
        if isinstance(data.get("choices"), list):
            data["choices"] = {
                chr(65 + i): str(text)  # A, B, C, …
                for i, text in enumerate(data["choices"])
                if str(text).strip()  # drop empty trailing cells
            }

        if "choices" in data or "correct_answer" in data:
            options = data.get("choices", {})
            correct_answers = data.get("correct_answer", [])
            errors = {}

            valid_keys = {"A", "B", "C", "D", "E"}

            # Check option count
            if not (2 <= len(options) <= 5):
                errors["choices"] = [
                    "You must provide between 4 and 5 answer options (A–E)."
                ]

            # Check option keys
            invalid_keys = set(options.keys()) - valid_keys
            if invalid_keys:
                errors.setdefault("choices", []).append(
                    f"Invalid option keys found: {', '.join(invalid_keys)}. "
                    f"Only A–E are allowed."
                )

            # Check correct answers exist in options
            missing = [ans for ans in correct_answers if ans not in options]
            if missing:
                errors["correct_answer"] = [
                    f"Correct answer '{ans}' is not among the provided options."
                    for ans in missing
                ]

            if errors:
                raise serializers.ValidationError(errors)

        return data


class QuestionBankSerializer(serializers.ModelSerializer):
    question_count = serializers.SerializerMethodField()
    difficulty_breakdown = serializers.SerializerMethodField()
    tag_counts = serializers.SerializerMethodField()

    class Meta:
        model = QuestionBank
        fields = [
            "id",
            "course",
            "title",
            "description",
            "created_by",
            "created_at",
            "updated_at",
            "question_count",
            "difficulty_breakdown",
            "tag_counts",
        ]

        extra_kwargs = {"created_at": {"read_only": True}}

    def get_question_count(self, obj):
        return obj.questions.count()

    def get_difficulty_breakdown(self, obj):
        """Calculate difficulty distribution as percentages"""
        questions = obj.questions.all()
        total = questions.count()

        if total == 0:
            return {"easy": 0, "medium": 0, "hard": 0, "unknown": 0}

        # Count questions by difficulty
        easy_count = questions.filter(difficulty=1).count()
        medium_count = questions.filter(difficulty=2).count()
        hard_count = questions.filter(difficulty=3).count()
        unknown_count = questions.filter(difficulty__isnull=True).count()

        return {
            "easy": round((easy_count / total) * 100),
            "medium": round((medium_count / total) * 100),
            "hard": round((hard_count / total) * 100),
            "unknown": round((unknown_count / total) * 100),
        }

    def get_tag_counts(self, obj):
        """Get all unique tags and their counts"""
        questions = obj.questions.all()
        tag_counts = {}

        for question in questions:
            for tag in question.tags:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1

        # Return sorted by count (descending)
        return dict(sorted(tag_counts.items(), key=lambda x: x[1], reverse=True))
