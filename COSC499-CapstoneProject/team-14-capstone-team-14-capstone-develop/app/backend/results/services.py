# results/services.py
import csv
import io
from typing import Dict, List, Optional, Tuple

from django.db import transaction
from django.utils import timezone

from analytics.models import QuestionPerformance
from courses.models import Student
from exams.models import Exam, Variant, VariantQuestion

from .models import ExamResult, OMRImportSession


class OMRParser:
    """
    Handles parsing of different OMR formats.
    """

    @staticmethod
    def parse_csv(
        file_content: str, field_mapping: Optional[Dict] = None
    ) -> List[Dict]:
        """
        Parse CSV format OMR data.
        Now supports comma-separated answers for multi-answer questions.
        Also supports optional total_score field from OMR machines.
        """
        default_mapping = {
            "student_id": "student_id",
            "variant_code": "variant_code",
        }

        mapping = field_mapping or default_mapping
        results = []

        reader = csv.DictReader(io.StringIO(file_content))
        for row_num, row in enumerate(reader, start=2):
            try:
                student_id = row.get(mapping["student_id"], "").strip()
                variant_code = row.get(mapping["variant_code"], "").strip()

                responses = {}
                for key, value in row.items():
                    if key.lower().startswith("q") and key[1:].isdigit():
                        question_num = int(key[1:])
                        # Convert to uppercase here!
                        if value and value.strip():
                            responses[str(question_num)] = value.strip().upper()
                        else:
                            responses[str(question_num)] = None

                # Extract optional total_score from OMR machine
                total_score = None
                if "total_score" in row and row["total_score"].strip():
                    try:
                        total_score = float(row["total_score"].strip())
                    except (ValueError, TypeError):
                        # If total_score is not a valid number, ignore it
                        pass

                results.append(
                    {
                        "row_number": row_num,
                        "student_id": student_id,
                        "variant_code": variant_code,
                        "responses": responses,
                        "total_score": total_score,
                        "raw_data": row,
                    }
                )
            except Exception as e:
                results.append(
                    {"row_number": row_num, "error": str(e), "raw_data": row}
                )

        return results

    @staticmethod
    def parse_aiken_txt(file_content: str) -> List[Dict]:
        """
        Parse Aiken format text file.
        """
        results = []
        lines = file_content.strip().split("\n")

        current_record = {}
        responses = {}
        row_number = 1

        for line in lines:
            line = line.strip()
            if not line:
                if current_record and responses:
                    current_record["responses"] = responses
                    current_record["row_number"] = row_number
                    results.append(current_record)
                    current_record = {}
                    responses = {}
                    row_number += 1
                continue

            if line.startswith("STUDENT_ID:"):
                current_record["student_id"] = line.split(":", 1)[1].strip()
            elif line.startswith("VARIANT:"):
                current_record["variant_code"] = line.split(":", 1)[1].strip()
            elif line[0].isdigit() and "." in line:
                parts = line.split(".", 1)
                if len(parts) == 2:
                    q_num = int(parts[0])
                    answer = parts[1].strip().upper()
                    responses[str(q_num)] = answer

        if current_record and responses:
            current_record["responses"] = responses
            current_record["row_number"] = row_number
            results.append(current_record)

        return results


class ResultGradingService:
    """
    Handles grading of exam results with partial credit support.
    """

    @staticmethod
    def calculate_partial_credit(
        correct_answers,
        student_answers,
        partial_credit_enabled=False,
        incorrect_penalty=0.0,
    ):
        """
        Calculate partial credit for multiple-answer questions.

        Args:
            correct_answers: List of correct answer choices
            student_answers: List of student's selected choices
            partial_credit_enabled: Whether partial credit is allowed
            incorrect_penalty: Penalty for incorrect selections (0-1)

        Returns:
            Tuple of (percentage_correct, detailed_breakdown)
        """
        if not partial_credit_enabled or len(correct_answers) <= 1:
            # No partial credit - it's all or nothing
            if set(student_answers) == set(correct_answers):
                return 1.0, {"method": "all_or_nothing", "correct": True}
            else:
                return 0.0, {"method": "all_or_nothing", "correct": False}

        # Convert to sets for easier comparison
        correct_set = set(correct_answers)
        student_set = set(student_answers)

        # Calculate correct selections
        correct_selections = correct_set.intersection(student_set)
        incorrect_selections = student_set - correct_set
        missed_selections = correct_set - student_set

        total_possible = len(correct_set)
        correct_count = len(correct_selections)
        incorrect_count = len(incorrect_selections)

        # Calculate base score as proportion of correct answers selected
        base_score = correct_count / total_possible if total_possible > 0 else 0

        # Special handling for when student has all correct answers but also incorrect ones
        # This represents overconfidence - selecting extra answers when you already have all correct
        if len(missed_selections) == 0 and incorrect_count > 0:
            # Apply a harsher penalty when student added unnecessary incorrect answers
            # Each incorrect answer has a greater impact
            effective_penalty = min(
                1.0, incorrect_penalty * 2
            )  # Double the penalty, max 1.0
            total_penalty = incorrect_count * effective_penalty
            final_score = max(0, base_score - total_penalty)
            penalty = total_penalty  # Define penalty for the breakdown
        else:
            # Standard penalty calculation for other cases
            penalty = incorrect_count * incorrect_penalty
            final_score = max(0, base_score - penalty)

        breakdown = {
            "method": "proportional_with_penalty",
            "correct_selections": list(correct_selections),
            "incorrect_selections": list(incorrect_selections),
            "missed_selections": list(missed_selections),
            "base_score": base_score,
            "penalty": penalty,
            "final_score": final_score,
        }

        return final_score, breakdown

    # In services.py, replace the grade_exam_result method with this updated version:

    @staticmethod
    def grade_exam_result(
        exam: Exam, variant: Variant, responses: Dict[str, str]
    ) -> Dict:
        """
        Grade a student's responses with partial credit and variable points support.
        Uses exam marking scheme configuration if available.
        """

        print(f"Student responses: {responses}")

        # Get exam marking scheme configuration
        marking_scheme = exam.marking_scheme or {}
        multi_correct_policy = marking_scheme.get(
            "multiCorrectPolicy", "partial_credit"
        )
        negative_marking = marking_scheme.get("negativeMarking", {})
        section_weighting = marking_scheme.get("sectionWeighting", {})

        # Extract negative marking settings
        negative_marking_enabled = negative_marking.get("enabled", False)
        negative_marking_penalty = negative_marking.get("penalty", 0.25)
        negative_marking_apply_to = negative_marking.get("applyTo", "all_questions")

        variant_questions = (
            VariantQuestion.objects.filter(variant=variant)
            .select_related("question")
            .order_by("order")
        )

        total_questions = variant_questions.count()
        total_points_possible = 0
        total_points_earned = 0
        correct_answers = 0
        incorrect_answers = 0
        unanswered = 0
        grading_details = []

        for vq in variant_questions:
            question = vq.question
            question_num = vq.order
            # The response key should be 1-based string
            response_key = str(question_num + 1)
            student_answer = responses.get(response_key)

            # Get question points and settings
            question_points = float(question.points)

            # Apply section weighting if configured
            section_id = getattr(vq.section, "id", None) if vq.section else None
            if section_id:
                # Handle both string and integer keys in section_weighting
                weight_multiplier = None
                if section_id in section_weighting:
                    weight_multiplier = section_weighting[section_id]
                elif str(section_id) in section_weighting:
                    weight_multiplier = section_weighting[str(section_id)]

                if weight_multiplier:
                    question_points *= weight_multiplier
                    print(
                        f"Applied section weighting {weight_multiplier}x to question {question_num + 1}"
                    )

            total_points_possible += question_points

            # Get correct answer(s) - use randomized version if available
            if vq.randomized_correct_answer:
                correct_answer = vq.randomized_correct_answer
            else:
                correct_answer = question.correct_answer
            if isinstance(correct_answer, list):
                correct_labels = correct_answer
            else:
                correct_labels = [correct_answer] if correct_answer else []

            # Ensure correct answers are strings and uppercase
            correct_labels = [str(label).upper() for label in correct_labels]

            # Handle student answer
            if not student_answer:
                unanswered += 1
                status = "unanswered"
                points_earned = 0
                percentage_correct = 0
                partial_credit_info = None
                print("Result: UNANSWERED")
            else:
                # Parse student answer - could be comma-separated or space-separated for multi-answer
                if "," in student_answer:
                    # Multiple answers provided with commas
                    student_answers = [
                        ans.strip().upper() for ans in student_answer.split(",")
                    ]
                elif " " in student_answer and len(student_answer.strip()) > 1:
                    # Multiple answers provided with spaces (e.g., "B C A")
                    student_answers = [
                        ans.strip().upper() for ans in student_answer.split()
                    ]
                else:
                    student_answers = [student_answer.upper()]

                print(f"Parsed student answers: {student_answers}")

                # Check if this is a multi-answer question
                is_multi_answer = len(correct_labels) > 1

                # Determine partial credit policy based on exam marking scheme
                if is_multi_answer:
                    if multi_correct_policy == "all_or_nothing":
                        partial_credit_enabled = False
                    else:
                        partial_credit_enabled = True
                else:
                    # For single-answer questions, respect the database setting
                    partial_credit_enabled = getattr(
                        question, "partial_credit_enabled", False
                    )

                print(f"Is multi-answer question: {is_multi_answer}")
                print(f"Partial credit enabled: {partial_credit_enabled}")
                print(f"Multi-correct policy: {multi_correct_policy}")

                # Determine the grading approach based on the question type
                if is_multi_answer:
                    print("Multi-answer question detected")
                    # Multi-answer question
                    if partial_credit_enabled:
                        # Calculate partial credit
                        if set(student_answers) == set(correct_labels):
                            # All correct
                            correct_answers += 1
                            status = "correct"
                            points_earned = question_points
                            percentage_correct = 1.0
                            partial_credit_info = {
                                "method": "multi_answer",
                                "all_correct": True,
                            }
                            print("Result: CORRECT (100%)")
                        else:
                            # Not all correct - calculate partial credit
                            # Use penalty from marking scheme or question default
                            incorrect_penalty = float(
                                getattr(question, "incorrect_penalty", 0.0)
                            )

                            # Override with marking scheme penalty if configured
                            if multi_correct_policy == "partial_with_penalty":
                                incorrect_penalty = negative_marking_penalty

                            percentage_correct, partial_credit_info = (
                                ResultGradingService.calculate_partial_credit(
                                    correct_labels,
                                    student_answers,
                                    True,  # partial_credit_enabled
                                    incorrect_penalty,
                                )
                            )

                            points_earned = question_points * percentage_correct

                            if percentage_correct > 0:
                                status = "partial"
                                # Don't count partial credit as fully incorrect
                                # This is a partially correct answer
                                incorrect_answers += 1
                                print(f"Result: PARTIAL ({percentage_correct * 100}%)")
                            else:
                                status = "incorrect"
                                incorrect_answers += 1
                                print("Result: INCORRECT (0%)")
                    else:
                        # No partial credit - must have ALL correct answers
                        if set(student_answers) == set(correct_labels):
                            correct_answers += 1
                            status = "correct"
                            points_earned = question_points
                            percentage_correct = 1.0
                            partial_credit_info = {
                                "method": "all_or_nothing",
                                "correct": True,
                            }
                            print("Result: CORRECT (all or nothing)")
                        else:
                            incorrect_answers += 1
                            status = "incorrect"
                            points_earned = 0
                            percentage_correct = 0
                            partial_credit_info = {
                                "method": "all_or_nothing",
                                "correct": False,
                            }
                            print("Result: INCORRECT (all or nothing)")
                            print(f"  Expected: {set(correct_labels)}")
                            print(f"  Got: {set(student_answers)}")
                else:
                    print("Single answer question")
                    # Single answer question
                    if (
                        len(student_answers) == 1
                        and student_answers[0] in correct_labels
                    ):
                        correct_answers += 1
                        status = "correct"
                        points_earned = question_points
                        percentage_correct = 1.0
                        partial_credit_info = {
                            "method": "single_answer",
                            "correct": True,
                        }
                        print("Result: CORRECT")
                    else:
                        incorrect_answers += 1
                        status = "incorrect"
                        points_earned = 0
                        percentage_correct = 0
                        partial_credit_info = {
                            "method": "single_answer",
                            "correct": False,
                        }
                        print("Result: INCORRECT")

                # Apply negative marking if enabled
                if negative_marking_enabled and status == "incorrect":
                    # Check if negative marking applies to this question type
                    should_apply_negative = False
                    if negative_marking_apply_to == "all_questions":
                        should_apply_negative = True
                    elif (
                        negative_marking_apply_to == "single_choice_only"
                        and not is_multi_answer
                    ):
                        should_apply_negative = True
                    elif (
                        negative_marking_apply_to == "multi_choice_only"
                        and is_multi_answer
                    ):
                        should_apply_negative = True

                    if should_apply_negative:
                        negative_penalty = question_points * negative_marking_penalty
                        points_earned -= negative_penalty
                        print(
                            f"Applied negative marking penalty: -{negative_penalty} points"
                        )

                total_points_earned += points_earned

            grading_details.append(
                {
                    "question_id": question.id,
                    "question_number": question_num + 1,
                    "student_answer": student_answer,
                    "correct_answers": correct_labels,
                    "status": status,
                    "points": question_points,
                    "points_possible": question_points,
                    "points_earned": round(points_earned, 2),
                    "percentage_correct": (
                        round(percentage_correct * 100, 2) if student_answer else 0
                    ),
                    "partial_credit_info": partial_credit_info,
                }
            )

        # Calculate overall score as percentage
        score = (
            (total_points_earned / total_points_possible * 100)
            if total_points_possible > 0
            else 0
        )

        # Cap the score at 0% minimum (no negative scores)
        score = max(0, score)

        print("\n=== FINAL RESULTS ===")
        print(f"Total points earned: {total_points_earned} / {total_points_possible}")
        print(f"Score: {score}%")
        print(
            f"Correct: {correct_answers}, Incorrect: {incorrect_answers}, Unanswered: {unanswered}"
        )
        print("===================\n")

        return {
            "score": round(score, 2),
            "total_questions": total_questions,
            "total_points_possible": round(total_points_possible, 2),
            "total_points_earned": round(total_points_earned, 2),
            "correct_answers": correct_answers,
            "incorrect_answers": incorrect_answers,
            "unanswered": unanswered,
            "grading_details": grading_details,
        }


class OMRImportService:
    """
    Handles the complete OMR import process.
    """

    @staticmethod
    def validate_import_data(exam: Exam, parsed_data: List[Dict]) -> Dict:
        """
        Validate parsed OMR data before import.
        """
        errors = []
        warnings = []
        valid_records = []

        # Only use locked variants for grading - these are the official variants
        # Only use locked variants for grading - these are the official variants
        locked_variants = exam.variants.filter(is_locked=True)
        print(
            f"DEBUG: Found {locked_variants.count()} locked variants for exam {exam.id}"
        )
        for v in locked_variants:
            print(f"DEBUG: Locked variant {v.id}: {v.version_label}")

        valid_variants = {v.version_label: v for v in locked_variants}

        if not valid_variants:
            return {
                "valid": False,
                "total_records": len(parsed_data),
                "valid_records": 0,
                "errors": [
                    {
                        "row": "N/A",
                        "type": "no_locked_variants",
                        "message": f"No locked variants found for exam {exam.id}. Please lock a variant set before importing results.",
                    }
                ],
                "warnings": [],
                "preview": [],
                "parsed_records": [],
            }

        valid_students = {
            s.display_id: s
            for s in Student.objects.filter(course=exam.course, is_active=True)
        }

        for record in parsed_data:
            if "error" in record:
                errors.append(
                    {
                        "row": record.get("row_number", "Unknown"),
                        "type": "parse_error",
                        "message": record["error"],
                    }
                )
                continue

            student_id = record.get("student_id", "")
            variant_code = record.get("variant_code", "")
            responses = record.get("responses", {})

            if not student_id:
                errors.append(
                    {
                        "row": record.get("row_number", "Unknown"),
                        "type": "missing_student_id",
                        "message": "Student ID is missing",
                    }
                )
                continue

            if student_id not in valid_students:
                warnings.append(
                    {
                        "row": record.get("row_number", "Unknown"),
                        "type": "invalid_student_id",
                        "message": f"Student ID {student_id} not found in course roster - will be skipped",
                    }
                )
                continue

            if not variant_code:
                errors.append(
                    {
                        "row": record.get("row_number", "Unknown"),
                        "type": "missing_variant",
                        "message": "Variant code is missing",
                    }
                )
                continue

            if variant_code not in valid_variants:
                errors.append(
                    {
                        "row": record.get("row_number", "Unknown"),
                        "type": "invalid_variant",
                        "message": f"Variant code {variant_code} not found for this exam",
                    }
                )
                continue

            if not responses:
                warnings.append(
                    {
                        "row": record.get("row_number", "Unknown"),
                        "type": "no_responses",
                        "message": f"No responses found for student {student_id}",
                    }
                )

            existing_result = ExamResult.objects.filter(
                exam=exam, student=valid_students[student_id]
            ).first()

            if existing_result:
                warnings.append(
                    {
                        "row": record.get("row_number", "Unknown"),
                        "type": "duplicate_result",
                        "message": f"Result already exists for student {student_id}. Will be overwritten.",
                    }
                )

            valid_records.append(
                {
                    "student": valid_students[student_id],
                    "variant": valid_variants[variant_code],
                    "responses": responses,
                    "total_score": record.get("total_score"),
                    "raw_data": record.get("raw_data", {}),
                }
            )

        return {
            "valid": len(errors) == 0,
            "total_records": len(parsed_data),
            "valid_records": len(valid_records),
            "errors": errors,
            "warnings": warnings,
            "preview": valid_records[:5],
            "parsed_records": valid_records,
        }

    @staticmethod
    @transaction.atomic
    def import_validated_data(
        exam: Exam, validated_data: List[Dict], import_session: OMRImportSession, user
    ) -> Tuple[List[ExamResult], List[Dict]]:
        """
        Import validated OMR data with variable points and partial credit support.
        """
        created_results = []
        import_errors = []

        for record in validated_data:
            try:
                student = record["student"]
                variant = record["variant"]
                responses = record["responses"]

                grading_result = ResultGradingService.grade_exam_result(
                    exam, variant, responses
                )

                # Store OMR total_score if provided (for reference only)
                import_metadata = {
                    "session_id": import_session.id,
                    "file_name": import_session.file_name,
                    "raw_data": record.get("raw_data", {}),
                }

                # Add OMR total_score to metadata if available
                if record.get("total_score") is not None:
                    import_metadata["omr_total_score"] = record["total_score"]

                exam_result, created = ExamResult.objects.update_or_create(
                    exam=exam,
                    student=student,
                    defaults={
                        "variant": variant,
                        "raw_responses": responses,
                        "score": grading_result["score"],
                        "total_questions": grading_result["total_questions"],
                        "total_points_possible": grading_result.get(
                            "total_points_possible"
                        ),
                        "total_points_earned": grading_result.get(
                            "total_points_earned"
                        ),
                        "correct_answers": grading_result["correct_answers"],
                        "incorrect_answers": grading_result["incorrect_answers"],
                        "unanswered": grading_result["unanswered"],
                        "grading_details": grading_result["grading_details"],
                        "graded_at": timezone.now(),
                        "imported_by": user,
                        "import_source": f"omr_{import_session.file_format}",
                        "import_metadata": import_metadata,
                    },
                )

                created_results.append(exam_result)

                # Update question performance statistics
                # In import_validated_data method, replace the performance tracking section:

                # Update question performance statistics
                for detail in grading_result["grading_details"]:
                    if detail["status"] != "unanswered":
                        try:
                            perf, _ = QuestionPerformance.objects.get_or_create(
                                question_id=detail["question_id"]
                            )
                            perf.total_attempts += 1

                            # Determine if this should count as incorrect
                            if detail["status"] == "incorrect":
                                # Definitely incorrect
                                perf.incorrect_attempts += 1
                            elif detail["status"] == "partial":
                                # For partial credit, check if they're missing correct answers
                                partial_info = detail.get("partial_credit_info", {})

                                # Only count as incorrect if they're missing correct answers
                                # Students who have all correct answers but added extra wrong ones
                                # (like INT003) should NOT count as incorrect attempts
                                if partial_info.get("missed_selections", []):
                                    # Missing correct answers = incorrect attempt
                                    perf.incorrect_attempts += 1
                                # else: Has all correct answers, just added extras - don't count as incorrect

                            perf.save()
                        except Exception as e:
                            # Log but don't fail the import
                            print(
                                f"Failed to update performance for question {detail['question_id']}: {e}"
                            )

            except Exception as e:
                import_errors.append(
                    {"student_id": student.display_id, "error": str(e)}
                )

        return created_results, import_errors
