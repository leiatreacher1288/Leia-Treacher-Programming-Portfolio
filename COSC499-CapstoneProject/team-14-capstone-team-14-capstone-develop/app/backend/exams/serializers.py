# exams/serializers.py
from django.core.validators import MaxValueValidator, MinValueValidator
from rest_framework import serializers

from questions.models import Question, QuestionBank

from .models import (
    Exam,
    ExamExportHistory,
    ExamQuestion,
    ExamSection,
    ExamTemplate,
    Variant,
    VariantQuestion,
)


class ExamSectionSerializer(serializers.ModelSerializer):
    """Serializer for exam sections"""

    question_count = serializers.IntegerField(read_only=True)
    question_banks = serializers.SerializerMethodField()

    class Meta:
        model = ExamSection
        fields = [
            "id",
            "title",
            "instructions",
            "order",
            "question_banks",
            "question_count",
            "configured_question_count",
        ]

    def get_question_banks(self, obj):
        """Return detailed question bank information instead of just IDs"""
        question_banks = obj.question_banks.all()
        banks_data = []

        for bank in question_banks:
            questions = bank.questions.all()
            easy_count = sum(1 for q in questions if q.difficulty == 1)
            medium_count = sum(1 for q in questions if q.difficulty == 2)
            hard_count = sum(1 for q in questions if q.difficulty == 3)

            total_questions = questions.count()
            if total_questions > 0:
                easy_percent = round((easy_count / total_questions) * 100)
                medium_percent = round((medium_count / total_questions) * 100)
                hard_percent = round((hard_count / total_questions) * 100)
            else:
                easy_percent = medium_percent = hard_percent = 0

            # Get unique tags from questions
            all_tags = []
            for question in questions:
                all_tags.extend(question.tags or [])
            unique_tags = list(set(all_tags))

            banks_data.append(
                {
                    "id": bank.id,
                    "title": bank.title,
                    "description": bank.description,
                    "easy": easy_percent,
                    "medium": medium_percent,
                    "hard": hard_percent,
                    "tags": unique_tags,
                    "question_count": total_questions,
                }
            )

        return banks_data


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

    question_bank = serializers.PrimaryKeyRelatedField(
        source="bank", queryset=QuestionBank.objects.all(), write_only=True
    )
    # Removed legacy aliases: text, options, correct_answers
    type = serializers.CharField(source="question_type", read_only=True)
    points = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    course_id = serializers.SerializerMethodField()
    course_code = serializers.SerializerMethodField()
    course_name = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = [
            "id",
            "question_bank",
            "prompt",
            "choices",
            "correct_answer",
            "difficulty",
            "tags",
            "explanation",
            "type",
            "points",
            "course_id",
            "course_code",
            "course_name",
        ]
        extra_kwargs = {
            "difficulty": {"required": False},
        }

    def get_course_id(self, obj):
        print(
            f"[DEBUG] EXAMS QuestionSerializer get_course_id: obj={obj}, "
            f"obj.bank={getattr(obj, 'bank', None)}, "
            f"obj.bank.course={getattr(getattr(obj, 'bank', None), 'course', None)}"
        )
        return obj.bank.course.id if obj.bank and obj.bank.course else None

    def get_course_code(self, obj):
        print(
            f"[DEBUG] EXAMS QuestionSerializer get_course_code: obj={obj}, "
            f"obj.bank={getattr(obj, 'bank', None)}, "
            f"obj.bank.course={getattr(getattr(obj, 'bank', None), 'course', None)}"
        )
        return obj.bank.course.code if obj.bank and obj.bank.course else None

    def get_course_name(self, obj):
        print(
            f"[DEBUG] EXAMS QuestionSerializer get_course_name: obj={obj}, "
            f"obj.bank={getattr(obj, 'bank', None)}, "
            f"obj.bank.course={getattr(getattr(obj, 'bank', None), 'course', None)}"
        )
        return obj.bank.course.name if obj.bank and obj.bank.course else None

    def validate(self, data):
        # Get choices from the data (it comes as 'choices' due to source mapping)
        choices = data.get("choices", {})
        correct_answer = data.get("correct_answer", [])
        errors = {}

        # If choices is a dict (old format), validate as before
        if isinstance(choices, dict):
            valid_keys = {"A", "B", "C", "D", "E"}

            # Check option count
            if not (4 <= len(choices) <= 5):
                errors["choices"] = [
                    "You must provide between 4 and 5 answer options (A–E)."
                ]

            # Check option keys
            invalid_keys = set(choices.keys()) - valid_keys
            if invalid_keys:
                errors.setdefault("choices", []).append(
                    f"Invalid option keys found: {', '.join(invalid_keys)}. "
                    f"Only A–E are allowed."
                )

            # Check correct answers exist in options
            missing = [ans for ans in correct_answer if ans not in choices]
            if missing:
                errors["correct_answer"] = [
                    f"Correct answer '{ans}' is not among the provided options."
                    for ans in missing
                ]

        # If choices is a list (new format), convert for validation
        elif isinstance(choices, list):
            # Convert list to dict for validation
            option_dict = {chr(65 + i): str(choice) for i, choice in enumerate(choices)}
            data["choices"] = option_dict

            # Validate correct_answer indices
            if isinstance(correct_answer, list):
                for ans in correct_answer:
                    if isinstance(ans, int) and ans >= len(choices):
                        errors["correct_answer"] = [
                            f"Answer index {ans} is out of range."
                        ]

        if errors:
            raise serializers.ValidationError(errors)

        return data

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Normalize difficulty to string
        diff = instance.difficulty
        if isinstance(diff, int):
            if diff == 1:
                data["difficulty"] = "Easy"
            elif diff == 2:
                data["difficulty"] = "Medium"
            elif diff == 3:
                data["difficulty"] = "Hard"
            else:
                data["difficulty"] = "Unknown"
        elif isinstance(diff, str):
            if diff in ["Easy", "Medium", "Hard", "Unknown"]:
                data["difficulty"] = diff
            else:
                data["difficulty"] = "Unknown"
        else:
            data["difficulty"] = "Unknown"
        # Normalize correct_answers to array of letters
        correct = instance.correct_answer
        normalized = []
        if isinstance(correct, list):
            for ans in correct:
                if isinstance(ans, int):
                    normalized.append(chr(65 + ans))
                elif isinstance(ans, str):
                    # If it's a single letter or number string
                    if ans.isdigit():
                        normalized.append(chr(65 + int(ans)))
                    else:
                        normalized.append(ans)
        elif isinstance(correct, int):
            normalized = [chr(65 + correct)]
        elif isinstance(correct, str):
            if correct.isdigit():
                normalized = [chr(65 + int(correct))]
            else:
                normalized = [correct]
        data["correct_answers"] = normalized
        return data


class ExamQuestionSerializer(serializers.ModelSerializer):
    """Serializer for ExamQuestion through model"""

    question = QuestionSerializer(read_only=True)

    class Meta:
        model = ExamQuestion
        fields = ["id", "question", "order", "points"]


class VariantQuestionSerializer(serializers.ModelSerializer):
    """Serializer for VariantQuestion through model"""

    question = QuestionSerializer(read_only=True)
    section = ExamSectionSerializer(read_only=True, allow_null=True)
    randomized_choices = serializers.JSONField(read_only=True)
    randomized_correct_answer = serializers.JSONField(read_only=True)

    class Meta:
        model = VariantQuestion
        fields = [
            "id",
            "question",
            "order",
            "section",
            "randomized_choices",
            "randomized_correct_answer",
        ]


class VariantSerializer(serializers.ModelSerializer):
    """Serializer for exam variants"""

    questions = VariantQuestionSerializer(
        source="variantquestion_set", many=True, read_only=True
    )

    class Meta:
        model = Variant
        fields = [
            "id",
            "version_label",
            "questions",
            "created_at",
            "exported_at",
            "docx_exported",
            "pdf_exported",
            "is_locked",
        ]


class ExamExportHistorySerializer(serializers.ModelSerializer):
    """Serializer for exam export history"""

    exported_by_name = serializers.CharField(
        source="exported_by.get_full_name", read_only=True
    )
    variants = VariantSerializer(source="variants_exported", many=True, read_only=True)

    class Meta:
        model = ExamExportHistory
        fields = [
            "id",
            "exported_at",
            "exported_by",
            "exported_by_name",
            "variants",
            "export_format",
        ]


class ExamListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for exam listing"""

    course_code = serializers.CharField(source="course.code", read_only=True)
    course_term = serializers.CharField(
        source="course.term", read_only=True
    )  # Add this
    created_by_name = serializers.CharField(
        source="created_by.get_full_name", read_only=True
    )
    question_count = serializers.IntegerField(source="questions.count", read_only=True)
    variant_count = serializers.IntegerField(source="variants.count", read_only=True)
    weight = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    required_to_pass = serializers.BooleanField(read_only=True)
    scheduled_date = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Exam
        fields = [
            "id",
            "title",
            "description",
            "exam_type",
            "course_code",
            "course_term",
            "created_at",
            "updated_at",
            "created_by_name",
            "question_count",
            "variant_count",
            "weight",
            "required_to_pass",
            "scheduled_date",
            "time_limit",
        ]


class ExamDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for single exam view"""

    questions = ExamQuestionSerializer(
        source="examquestion_set", many=True, read_only=True
    )
    current_variant_questions = serializers.SerializerMethodField()
    variants = VariantSerializer(many=True, read_only=True)
    mandatory_questions = QuestionSerializer(many=True, read_only=True)
    export_history = ExamExportHistorySerializer(many=True, read_only=True)
    sections = ExamSectionSerializer(many=True, read_only=True)
    course_code = serializers.CharField(source="course.code", read_only=True)
    course_term = serializers.CharField(source="course.term", read_only=True)
    created_by_name = serializers.CharField(
        source="created_by.get_full_name", read_only=True
    )
    is_config_valid = serializers.ReadOnlyField()
    difficulty_breakdown = serializers.SerializerMethodField()
    cheating_risk_score = serializers.SerializerMethodField()
    weight = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    required_to_pass = serializers.BooleanField(read_only=True)
    allow_reuse = serializers.BooleanField(read_only=False)
    analytics = serializers.SerializerMethodField()
    unknown_percentage = serializers.IntegerField(required=False, default=0)

    class Meta:
        model = Exam
        fields = [
            "id",
            "title",
            "description",
            "exam_type",
            "course",
            "course_code",
            "course_term",
            "time_limit",
            "num_variants",
            "questions_per_variant",
            "randomize_questions",
            "randomize_choices",
            "show_answers_after",
            "easy_percentage",
            "medium_percentage",
            "hard_percentage",
            "unknown_percentage",
            "question_budget",
            "questions",
            "current_variant_questions",
            "mandatory_questions",
            "variants",
            "export_history",
            "sections",
            "exam_instructions",
            "footer_text",
            "academic_integrity_statement",
            "include_academic_integrity",
            "marking_scheme",
            "created_at",
            "updated_at",
            "created_by",
            "created_by_name",
            "is_config_valid",
            "difficulty_breakdown",
            "cheating_risk_score",
            "total_points",
            "weight",
            "required_to_pass",
            "allow_reuse",
            "analytics",
        ]

    def get_current_variant_questions(self, obj):
        # Get all unique questions used in the latest variants
        question_ids = set()
        for variant in obj.variants.all():
            for vq in variant.variantquestion_set.all():
                question_ids.add(vq.question.id)
        print(
            f"[ExamDetailSerializer] current_variant_questions for exam {obj.id}: {sorted(question_ids)}"
        )
        questions = Question.objects.filter(id__in=question_ids)
        return QuestionSerializer(questions, many=True).data

    def get_difficulty_breakdown(self, obj):
        """Calculate actual difficulty breakdown from generated questions"""
        # Get all questions from all variants
        all_questions = []
        for variant in obj.variants.all():
            for vq in variant.variantquestion_set.all():
                all_questions.append(vq.question)

        if not all_questions:
            # Fallback to configuration percentages if no questions
            return {
                "Easy": obj.easy_percentage,
                "Medium": obj.medium_percentage,
                "Hard": obj.hard_percentage,
                "Unknown": obj.unknown_percentage,
            }

        # For reuse mode, count unique questions only
        # For unique mode, count all questions (since they're different)
        if obj.allow_reuse:
            # In reuse mode, all variants use the same set of questions
            # So we count unique questions only
            unique_questions = list(set(all_questions))
            questions_to_count = unique_questions
        else:
            # In unique mode, count all questions since they're different across variants
            questions_to_count = all_questions

        # Count difficulties
        easy_count = sum(1 for q in questions_to_count if q.difficulty == 1)
        medium_count = sum(1 for q in questions_to_count if q.difficulty == 2)
        hard_count = sum(1 for q in questions_to_count if q.difficulty == 3)
        unknown_count = sum(
            1 for q in questions_to_count if q.difficulty not in [1, 2, 3]
        )

        return {
            "Easy": easy_count,
            "Medium": medium_count,
            "Hard": hard_count,
            "Unknown": unknown_count,
        }

    def get_cheating_risk_score(self, obj):
        # Return a simple risk score calculation
        # This can be enhanced later with more sophisticated algorithms
        variants_count = obj.variants.count()

        # Simple risk calculation based on question reuse and variant count
        if obj.allow_reuse:
            # Higher risk when questions are reused
            risk_score = min(80, 20 + (variants_count * 10))
        else:
            # Lower risk when questions are unique
            risk_score = min(40, 10 + (variants_count * 5))

        return {
            "overall_score": risk_score,
            "explanation": (
                f"Risk score based on {variants_count} variants and "
                f"{'reused' if obj.allow_reuse else 'unique'} questions"
            ),
        }

    def get_analytics(self, obj):
        # Only calculate analytics, do not regenerate variants
        from .services import VariantGenerationService

        variants = obj.variants.all()
        if not variants.exists():
            return None
        # Reuse the analytics calculation logic from generate_variants
        cheating_risk = VariantGenerationService.calculate_cheating_risk(variants)
        all_questions = [
            vq.question.id
            for variant in variants
            for vq in getattr(variant, "variantquestion_set").all()
        ]
        unique_questions = set(all_questions)
        question_reuse_rate = (
            100 * (1 - len(unique_questions) / len(all_questions))
            if all_questions
            else 0
        )
        mandatory_questions = list(getattr(obj, "mandatory_questions").all())
        mandatory_ids = set(q.id for q in mandatory_questions)
        mandatory_overlap = 0.0
        questions_per_variant = obj.questions_per_variant
        if mandatory_ids and len(variants) > 1:
            total_positions = 0
            overlap_count = 0
            for pos in range(questions_per_variant):
                ids_at_pos = [
                    vq.question.id
                    for variant in variants
                    for vq in getattr(variant, "variantquestion_set").order_by("order")
                    if vq.order == pos
                ]
                for mid in mandatory_ids:
                    count = ids_at_pos.count(mid)
                    if count > 1:
                        overlap_count += count - 1
                    total_positions += 1
            if total_positions > 0:
                mandatory_overlap = round(100 * overlap_count / total_positions, 2)
        per_variant_difficulties = [
            {
                "Easy": sum(
                    1
                    for vq in getattr(variant, "variantquestion_set").all()
                    if getattr(vq.question, "difficulty", None) == 1
                ),
                "Medium": sum(
                    1
                    for vq in getattr(variant, "variantquestion_set").all()
                    if getattr(vq.question, "difficulty", None) == 2
                ),
                "Hard": sum(
                    1
                    for vq in getattr(variant, "variantquestion_set").all()
                    if getattr(vq.question, "difficulty", None) == 3
                ),
                "Unknown": sum(
                    1
                    for vq in getattr(variant, "variantquestion_set").all()
                    if getattr(vq.question, "difficulty", None) not in [1, 2, 3]
                ),
            }
            for variant in variants
        ]

        def hamming(a, b):
            return sum(x != y for x, y in zip(a, b))

        answer_patterns = [
            [
                tuple(
                    vq.randomized_correct_answer
                    or (
                        vq.question.correct_answer
                        if isinstance(vq.question.correct_answer, list)
                        else [vq.question.correct_answer]
                    )
                )
                for vq in getattr(variant, "variantquestion_set").order_by("order")
            ]
            for variant in variants
        ]
        hamming_distances = [
            hamming(answer_patterns[i], answer_patterns[j])
            for i in range(len(answer_patterns))
            for j in range(i + 1, len(answer_patterns))
        ]
        max_hamming = questions_per_variant if len(variants) > 1 else 1
        avg_hamming = (
            round(
                (sum(hamming_distances) / len(hamming_distances) / max_hamming * 100), 2
            )
            if hamming_distances and max_hamming
            else 0.0
        )
        unique_patterns = len(set(tuple(p) for p in answer_patterns))
        # Calculate variant_uniqueness and final_score as in generate_variants
        allow_reuse = getattr(obj, "allow_reuse", False)
        if allow_reuse and len(variants) > 0:
            variant_uniqueness = round(100 * unique_patterns / len(variants), 2)
        elif not allow_reuse:
            variant_uniqueness = 100.0
        else:
            variant_uniqueness = None
        if allow_reuse:
            final_score = round((avg_hamming + variant_uniqueness) / 2, 2)
        else:
            final_score = round((avg_hamming + (100 - question_reuse_rate)) / 2, 2)
        analytics = {
            "cheating_risk": cheating_risk,
            "question_reuse_rate": round(question_reuse_rate, 2),
            "mandatory_overlap": mandatory_overlap,
            "per_variant_difficulties": per_variant_difficulties,
            "answer_diversity": avg_hamming,
            "unique_answer_patterns": unique_patterns,
            "variant_uniqueness": variant_uniqueness,
            "final_score": final_score,
        }
        return analytics


class ExamCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating exams"""

    mandatory_question_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False
    )
    sections = ExamSectionSerializer(many=True, required=False)
    course_code = serializers.CharField(source="course.code", read_only=True)
    weight = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        required=False,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    required_to_pass = serializers.BooleanField(required=False)
    allow_reuse = serializers.BooleanField(required=False)
    unknown_percentage = serializers.IntegerField(required=False, default=0)

    class Meta:
        model = Exam
        fields = [
            "id",
            "title",
            "description",
            "exam_type",
            "course",
            "time_limit",
            "num_variants",
            "questions_per_variant",
            "randomize_questions",
            "randomize_choices",
            "show_answers_after",
            "easy_percentage",
            "medium_percentage",
            "hard_percentage",
            "question_budget",
            "available_from",
            "available_until",
            "mandatory_question_ids",
            "sections",
            "exam_instructions",
            "footer_text",
            "academic_integrity_statement",
            "include_academic_integrity",
            "marking_scheme",
            "course_code",
            "weight",
            "required_to_pass",
            "allow_reuse",
            "unknown_percentage",
        ]

    def validate(self, data):
        easy = data.get("easy_percentage", 0) or 0
        medium = data.get("medium_percentage", 0) or 0
        hard = data.get("hard_percentage", 0) or 0
        unknown = data.get("unknown_percentage", 0) or 0
        total = easy + medium + hard + unknown
        if not (total == 100 or total == 0):
            raise serializers.ValidationError(
                "Sum of easy_percentage, medium_percentage, hard_percentage, and unknown_percentage must be 0 (random mode) or 100."
            )
        return data

    def create(self, validated_data):
        sections_data = validated_data.pop("sections", [])
        mandatory_ids = validated_data.pop("mandatory_question_ids", [])
        exam = super().create(validated_data)

        # Create sections
        for section_data in sections_data:
            question_banks = section_data.pop("question_banks", [])
            section = ExamSection.objects.create(exam=exam, **section_data)
            section.question_banks.set(question_banks)

        if mandatory_ids:
            exam.mandatory_questions.set(mandatory_ids)

        return exam

    def update(self, instance, validated_data):
        sections_data = validated_data.pop("sections", None)
        mandatory_ids = validated_data.pop("mandatory_question_ids", None)
        exam = super().update(instance, validated_data)

        # Update sections if provided
        if sections_data is not None:
            # Clear existing sections
            exam.sections.all().delete()
            # Create new sections
            for section_data in sections_data:
                question_banks = section_data.pop("question_banks", [])
                section = ExamSection.objects.create(exam=exam, **section_data)
                section.question_banks.set(question_banks)

        if mandatory_ids is not None:
            exam.mandatory_questions.set(mandatory_ids)

        return exam


# Additional utility serializers that might be useful


class QuestionBankSerializer(serializers.ModelSerializer):
    """Serializer for question banks when needed in exam context"""

    question_count = serializers.IntegerField(source="questions.count", read_only=True)

    class Meta:
        model = QuestionBank
        fields = ["id", "title", "description", "question_count"]


class ExamConfigSerializer(serializers.ModelSerializer):
    """Lightweight serializer for just exam configuration"""

    class Meta:
        model = Exam
        fields = [
            "num_variants",
            "questions_per_variant",
            "randomize_questions",
            "randomize_choices",
            "easy_percentage",
            "medium_percentage",
            "hard_percentage",
            "question_budget",
            "unknown_percentage",
        ]

    def validate(self, data):
        easy = data.get("easy_percentage", 0) or 0
        medium = data.get("medium_percentage", 0) or 0
        hard = data.get("hard_percentage", 0) or 0
        unknown = data.get("unknown_percentage", 0) or 0
        total = easy + medium + hard + unknown
        if not (total == 100 or total == 0):
            raise serializers.ValidationError(
                "Sum of easy_percentage, medium_percentage, hard_percentage, and unknown_percentage must be 0 (random mode) or 100."
            )
        return data


class BulkQuestionAddSerializer(serializers.Serializer):
    """Serializer for bulk adding questions to exam"""

    question_ids = serializers.ListField(
        child=serializers.IntegerField(), allow_empty=False
    )

    def validate_question_ids(self, value):
        # Check if all questions exist
        existing_ids = Question.objects.filter(id__in=value).values_list(
            "id", flat=True
        )
        missing_ids = set(value) - set(existing_ids)

        if missing_ids:
            raise serializers.ValidationError(
                f"Questions with IDs {missing_ids} do not exist."
            )

        return value


class ExamTemplateSerializer(serializers.ModelSerializer):
    """Serializer for ExamTemplate model."""

    class Meta:
        model = ExamTemplate
        fields = [
            "id",
            "name",
            "created_at",
            "updated_at",
            "created_by",
            "layout_data",
            "is_default",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "created_by"]

    def validate_layout_data(self, value):
        """Validate layout_data structure."""
        required_keys = ["instructions", "footer", "academic_integrity", "sections"]

        if not isinstance(value, dict):
            raise serializers.ValidationError("layout_data must be a dictionary")

        for key in required_keys:
            if key not in value:
                raise serializers.ValidationError(f"Missing required key: {key}")

        # Validate instructions
        if not isinstance(value["instructions"], list):
            raise serializers.ValidationError("instructions must be a list")

        # Validate footer
        if not isinstance(value["footer"], str):
            raise serializers.ValidationError("footer must be a string")

        # Validate academic_integrity
        academic_integrity = value["academic_integrity"]
        if not isinstance(academic_integrity, dict):
            raise serializers.ValidationError("academic_integrity must be a dictionary")

        if "enabled" not in academic_integrity or "text" not in academic_integrity:
            raise serializers.ValidationError(
                "academic_integrity must contain 'enabled' and 'text' keys"
            )

        # Validate sections
        if not isinstance(value["sections"], list):
            raise serializers.ValidationError("sections must be a list")

        for section in value["sections"]:
            if not isinstance(section, dict):
                raise serializers.ValidationError("Each section must be a dictionary")

            required_section_keys = [
                "name",
                "title",
                "question_bank_id",
                "instructions",
                "num_questions",
            ]
            for key in required_section_keys:
                if key not in section:
                    raise serializers.ValidationError(
                        f"Each section must contain '{key}' key"
                    )

        return value
