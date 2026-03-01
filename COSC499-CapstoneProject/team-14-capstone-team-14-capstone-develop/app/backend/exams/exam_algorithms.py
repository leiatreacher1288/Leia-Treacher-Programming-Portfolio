# exam_algorithms.py
"""
Algorithms for exam variant generation,
answer choice shuffling, and anti-cheating optimization.
"""
import random
from typing import Any, Dict, List, Optional, Tuple

from exams.models import Exam, Question, Variant, VariantQuestion


def round_robin_shuffle_choices(
    vq_group: List[Any],
    original_choices: List[str],
    correct_answers: Any,
    choice_keys: List[str],
):
    """
    Algorithmically shuffle answer choices for each variant in a round-robin fashion.
    Updates randomized_choices and randomized_correct_answer for each VariantQuestion in vq_group.
    Handles multi-correct answers by deduplicating and sorting.
    """
    len(vq_group)
    n_options = len(original_choices)
    for i, vq in enumerate(vq_group):
        shift = i % n_options
        randomized = original_choices[shift:] + original_choices[:shift]
        # Map old indices to new indices
        old_to_new = {
            orig_idx: (orig_idx - shift) % n_options for orig_idx in range(n_options)
        }
        letter_to_idx = {chr(65 + idx): idx for idx in range(n_options)}
        # Handle single or multi-correct, robust to int or letter
        if isinstance(correct_answers, list):
            indices = []
            for ca in correct_answers:
                if isinstance(ca, int) and 0 <= ca < n_options:
                    indices.append(ca)
                elif isinstance(ca, str):
                    if ca.isdigit() and 0 <= int(ca) < n_options:
                        indices.append(int(ca))
                    elif ca.upper() in letter_to_idx:
                        indices.append(letter_to_idx[ca.upper()])
            new_correct = sorted(set([old_to_new[idx] for idx in indices]))
        else:
            if isinstance(correct_answers, int) and 0 <= correct_answers < n_options:
                idx = correct_answers
            elif isinstance(correct_answers, str):
                if correct_answers.isdigit() and 0 <= int(correct_answers) < n_options:
                    idx = int(correct_answers)
                elif correct_answers.upper() in letter_to_idx:
                    idx = letter_to_idx[correct_answers.upper()]
                else:
                    idx = None
            else:
                idx = None
            new_correct = [old_to_new[idx]] if idx is not None else []
        if len(choice_keys) == len(randomized):
            vq.randomized_choices = {
                choice_keys[j]: randomized[j] for j in range(len(choice_keys))
            }
            vq.randomized_correct_answer = new_correct
            vq.save()
        else:
            # fallback logic can be added here
            pass


def apply_choice_randomization_to_variants(variants: List[Variant]) -> None:
    """
    Apply choice randomization to all variants.
    This function ensures choice randomization is always enabled.
    """
    for variant in variants:
        vqs = variant.variantquestion_set.select_related("question").all()

        # Group variant questions by question ID to apply round-robin shuffling
        question_groups = {}
        for vq in vqs:
            question_id = vq.question.id
            if question_id not in question_groups:
                question_groups[question_id] = []
            question_groups[question_id].append(vq)

        # Apply choice randomization to each question group
        for question_id, vq_group in question_groups.items():
            question = vq_group[0].question

            # Handle different choice formats
            if isinstance(question.choices, dict):
                # Dictionary format: {"A": "text", "B": "text", ...}
                choice_keys = list(question.choices.keys())
                original_choices = list(question.choices.values())
                correct_answers = question.correct_answer

                round_robin_shuffle_choices(
                    vq_group, original_choices, correct_answers, choice_keys
                )

            elif isinstance(question.choices, list):
                # List format: ["text1", "text2", "text3", ...]
                original_choices = question.choices
                choice_keys = [
                    chr(65 + i) for i in range(len(original_choices))
                ]  # A, B, C, D, ...
                correct_answers = question.correct_answer

                round_robin_shuffle_choices(
                    vq_group, original_choices, correct_answers, choice_keys
                )


def generate_section_based_variants_reuse(
    exam: Exam,
    mandatory_questions: List[Question],
    section_questions: Dict,
    section_allocation: Dict,
    num_variants: int,
    num_non_mandatory: int,
    question_to_section: Dict,
) -> Tuple[List[Variant], Optional[str], dict]:
    """Generate variants with section-based question allocation (reuse mode)"""
    # Create master question list based on section allocation
    master_questions = []
    used_question_ids = set()  # Track used questions to avoid duplicates

    # Add mandatory questions
    for question in mandatory_questions:
        original_section = question_to_section.get(question.id)
        master_questions.append(
            {"question": question, "section": original_section, "is_mandatory": True}
        )
        used_question_ids.add(question.id)

    # Add non-mandatory questions based on section allocation
    questions_added = 0
    for section_id, num_questions in section_allocation.items():
        if questions_added >= num_non_mandatory:
            break
        section_data = section_questions[section_id]
        section = section_data["section"]
        available_section_questions = section_data["questions"]

        # Filter out questions that have already been used
        unused_questions = [
            q for q in available_section_questions if q.id not in used_question_ids
        ]
        questions_to_take = min(
            num_questions, len(unused_questions), num_non_mandatory - questions_added
        )

        if questions_to_take > 0:
            # Try to maintain difficulty distribution within this section
            from collections import defaultdict

            questions_by_difficulty = defaultdict(list)
            for question in unused_questions:
                difficulty = getattr(question, "difficulty", None)
                questions_by_difficulty[difficulty].append(question)

            # Calculate proportional distribution for this section
            total_available = len(unused_questions)
            difficulty_targets = {}
            for difficulty, questions in questions_by_difficulty.items():
                if questions:  # Only consider difficulties that have questions
                    proportion = len(questions) / total_available
                    difficulty_targets[difficulty] = max(
                        1, round(questions_to_take * proportion)
                    )

            # Adjust to ensure we get exactly questions_to_take
            total_targeted = sum(difficulty_targets.values())
            if total_targeted != questions_to_take:
                # Adjust the largest difficulty group
                largest_difficulty = max(
                    difficulty_targets.items(), key=lambda x: x[1]
                )[0]
                difficulty_targets[largest_difficulty] += (
                    questions_to_take - total_targeted
                )

            # Select questions from each difficulty
            selected_questions = []
            for difficulty, target_count in difficulty_targets.items():
                available = questions_by_difficulty[difficulty]
                if available and target_count > 0:
                    actual_count = min(target_count, len(available))
                    if actual_count > 0:
                        selected = random.sample(available, actual_count)
                        selected_questions.extend(selected)

            # If we didn't get enough questions, fill from remaining
            if len(selected_questions) < questions_to_take:
                remaining_needed = questions_to_take - len(selected_questions)
                remaining_questions = [
                    q for q in unused_questions if q not in selected_questions
                ]
                if len(remaining_questions) >= remaining_needed:
                    additional = random.sample(remaining_questions, remaining_needed)
                    selected_questions.extend(additional)

            # Ensure we don't exceed the target
            if len(selected_questions) > questions_to_take:
                selected_questions = selected_questions[:questions_to_take]

            for question in selected_questions:
                master_questions.append(
                    {"question": question, "section": section, "is_mandatory": False}
                )
                used_question_ids.add(question.id)
                questions_added += 1

    # Ensure we have exactly the right number of questions
    if len(master_questions) != len(mandatory_questions) + num_non_mandatory:
        return (
            [],
            f"Could not select exactly {num_non_mandatory} non-mandatory questions. Selected {len(master_questions) - len(mandatory_questions)}",
            {},
        )

    # Create variants with the same master question set
    variants = []
    for variant_num in range(num_variants):
        variant = Variant.objects.create(
            exam=exam,
            version_label=chr(65 + variant_num),
        )

        # Shuffle the master questions for this variant
        shuffled_questions = master_questions.copy()
        random.shuffle(shuffled_questions)

        # Create VariantQuestion objects
        for i, q_data in enumerate(shuffled_questions):
            # Ensure section is saved if it's a new object
            section = q_data["section"]
            if section and section.pk is None:
                section.save()

            VariantQuestion.objects.create(
                variant=variant, question=q_data["question"], section=section, order=i
            )

        variants.append(variant)

    # Always apply choice randomization
    apply_choice_randomization_to_variants(variants)

    return variants, None, {"auto_balance_disabled": True}


def generate_section_based_variants_unique(
    exam: Exam,
    mandatory_questions: List[Question],
    section_questions: Dict,
    section_allocation: Dict,
    num_variants: int,
    num_non_mandatory: int,
    question_to_section: Dict,
) -> Tuple[List[Variant], Optional[str], dict]:
    """Generate variants with section-based question allocation (unique mode with difficulty fairness)"""
    from collections import defaultdict

    # First, validate that we have enough questions for each section allocation
    total_needed_by_section = {}
    for section_id, num_questions in section_allocation.items():
        total_needed_by_section[section_id] = num_questions * num_variants
        available_in_section = len(section_questions[section_id]["questions"])
        if available_in_section < total_needed_by_section[section_id]:
            return (
                [],
                f"Section {section_id} needs {total_needed_by_section[section_id]} questions but only has {available_in_section}",
                {},
            )

    # Group questions by section and difficulty
    section_difficulty_questions = {}
    for section_id, section_data in section_questions.items():
        section_difficulty_questions[section_id] = defaultdict(list)
        for question in section_data["questions"]:
            difficulty = getattr(question, "difficulty", None)
            section_difficulty_questions[section_id][difficulty].append(question)

    # Create variants
    variants = []
    used_questions = set()

    for variant_num in range(num_variants):
        variant = Variant.objects.create(
            exam=exam,
            version_label=chr(65 + variant_num),
        )

        # Collect questions for this variant based on section allocation
        variant_questions = []

        for section_id, num_questions_needed in section_allocation.items():
            section_questions_pool = section_difficulty_questions[section_id]

            # Try to maintain difficulty distribution within this section
            # Calculate target distribution based on available difficulties
            total_available_in_section = sum(
                len(questions) for questions in section_questions_pool.values()
            )
            if total_available_in_section == 0:
                continue

            # Calculate proportional distribution for this section
            difficulty_targets = {}
            if num_questions_needed <= 2:
                # For small sections, just take from the largest difficulty groups
                sorted_difficulties = sorted(
                    [
                        (difficulty, len(questions))
                        for difficulty, questions in section_questions_pool.items()
                        if questions
                    ],
                    key=lambda x: x[1],
                    reverse=True,
                )
                remaining_needed = num_questions_needed
                for difficulty, count in sorted_difficulties:
                    if remaining_needed > 0:
                        take = min(remaining_needed, count)
                        difficulty_targets[difficulty] = take
                        remaining_needed -= take
            else:
                # For larger sections, try to maintain proportional distribution
                for difficulty, questions in section_questions_pool.items():
                    if questions:  # Only consider difficulties that have questions
                        proportion = len(questions) / total_available_in_section
                        difficulty_targets[difficulty] = max(
                            1, round(num_questions_needed * proportion)
                        )

                # Adjust to ensure we get exactly num_questions_needed
                total_targeted = sum(difficulty_targets.values())
                if total_targeted != num_questions_needed:
                    # Adjust the largest difficulty group
                    largest_difficulty = max(
                        difficulty_targets.items(), key=lambda x: x[1]
                    )[0]
                    difficulty_targets[largest_difficulty] += (
                        num_questions_needed - total_targeted
                    )

            # Ensure no negative targets
            difficulty_targets = {k: max(0, v) for k, v in difficulty_targets.items()}

            # Select questions from each difficulty
            questions_selected_from_section = []
            for difficulty, target_count in difficulty_targets.items():
                available_questions = [
                    q
                    for q in section_questions_pool[difficulty]
                    if q.id not in used_questions
                ]
                if available_questions and target_count > 0:
                    # Take up to target_count questions, but don't exceed what's available
                    actual_count = min(target_count, len(available_questions))
                    if actual_count > 0:
                        selected = random.sample(available_questions, actual_count)
                        questions_selected_from_section.extend(selected)
                        used_questions.update(q.id for q in selected)

            # If we didn't get enough questions from this section, try to fill from other difficulties
            if len(questions_selected_from_section) < num_questions_needed:
                remaining_needed = num_questions_needed - len(
                    questions_selected_from_section
                )
                all_available = []
                for difficulty, questions in section_questions_pool.items():
                    all_available.extend(
                        [q for q in questions if q.id not in used_questions]
                    )

                if len(all_available) >= remaining_needed:
                    additional = random.sample(all_available, remaining_needed)
                    questions_selected_from_section.extend(additional)
                    used_questions.update(q.id for q in additional)
                else:
                    # We can't fulfill the section allocation
                    return (
                        [],
                        f"Cannot fulfill section {section_id} allocation. Need {num_questions_needed}, can only provide {len(questions_selected_from_section)}",
                        {},
                    )

            # Add section information to selected questions
            section = section_questions[section_id]["section"]
            for question in questions_selected_from_section:
                variant_questions.append(
                    {"question": question, "section": section, "is_mandatory": False}
                )

        # Verify we have the right number of questions
        if len(variant_questions) != num_non_mandatory:
            return (
                [],
                f"Variant {variant.version_label} has {len(variant_questions)} questions instead of {num_non_mandatory}. Cannot ensure fair distribution.",
                {},
            )

        # Shuffle the non-mandatory questions for this variant
        random.shuffle(variant_questions)

        # Create the final question list with mandatory questions in shuffled positions
        final_questions = []

        # Create shuffled positions for each mandatory question
        total_positions = len(mandatory_questions) + len(variant_questions)
        available_positions = list(range(total_positions))

        # Assign positions for mandatory questions
        mandatory_positions_for_variant = []
        for i, mandatory_question in enumerate(mandatory_questions):
            if available_positions:
                pos = random.choice(available_positions)
                mandatory_positions_for_variant.append(pos)
                available_positions.remove(pos)

        # Build the final question list
        mandatory_idx = 0
        variant_idx = 0

        for i in range(total_positions):
            if i in mandatory_positions_for_variant and mandatory_idx < len(
                mandatory_questions
            ):
                # Insert mandatory question
                final_questions.append(
                    {
                        "question": mandatory_questions[mandatory_idx],
                        "section": question_to_section.get(
                            mandatory_questions[mandatory_idx].id
                        ),
                        "is_mandatory": True,
                    }
                )
                mandatory_idx += 1
            elif variant_idx < len(variant_questions):
                # Insert non-mandatory question
                final_questions.append(
                    {
                        "question": variant_questions[variant_idx]["question"],
                        "section": variant_questions[variant_idx]["section"],
                        "is_mandatory": False,
                    }
                )
                variant_idx += 1

        # Create VariantQuestion objects
        for i, q_data in enumerate(final_questions):
            try:
                # Ensure section is saved if it's a new object
                section = q_data["section"]
                if section and section.pk is None:
                    section.save()

                VariantQuestion.objects.create(
                    variant=variant,
                    question=q_data["question"],
                    section=section,
                    order=i,
                )
            except Exception as e:
                print(
                    f"Warning: Skipping duplicate VariantQuestion for variant {variant.id}, question {q_data['question'].id}: {e}"
                )

        variants.append(variant)

    # Always apply choice randomization
    apply_choice_randomization_to_variants(variants)

    return variants, None, {"auto_balance_disabled": False}
