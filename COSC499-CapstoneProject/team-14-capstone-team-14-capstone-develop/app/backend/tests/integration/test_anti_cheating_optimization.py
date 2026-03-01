#!/usr/bin/env python3
"""
Test script to demonstrate anti-cheating optimization effectiveness
Run this script to see how the algorithm optimizes variant arrangements
"""

import os

import django

from exams.models import Course, Exam
from questions.models import Question, QuestionBank
from users.models import User

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "examvault.settings")
django.setup()


def create_test_data():
    """Create test data for anti-cheating optimization demonstration"""
    # Create test user
    user, created = User.objects.get_or_create(
        email="test@example.com", defaults={"name": "Test User", "role": "instructor"}
    )

    # Create test course
    course, created = Course.objects.get_or_create(
        code="TEST101",
        defaults={
            "name": "Test Course",
            "description": "Demo course",
            "term": "Fall 2025",
        },
    )
    if created or user not in course.instructors.all():
        course.instructors.add(user)
        course.save()

    # Create test question bank
    bank, created = QuestionBank.objects.get_or_create(
        title="Test Bank",
        course=course,
        defaults={"description": "Demo bank", "created_by": user},
    )

    return user, course, bank


def create_vulnerable_exam(user, course, bank):
    """Create an exam with questions that would create cheating vulnerabilities"""
    # Create exam
    exam = Exam.objects.create(
        title="Anti-Cheating Optimization Demo",
        exam_type="quiz",
        course=course,
        created_by=user,
        num_variants=3,
        questions_per_variant=5,
        randomize_questions=True,
        randomize_choices=True,
        allow_reuse=False,
    )

    # Create questions with similar answer patterns to create vulnerabilities
    questions = []
    for i in range(15):
        # Create questions where many have the same correct answer (A)
        # This will create vulnerabilities that the optimization should fix
        if i < 10:
            correct_answer = [0]  # First 10 have A as correct answer
        else:
            correct_answer = [i % 4]  # Rest vary

        q = Question.objects.create(
            bank=bank,
            prompt=f"Demo question {i+1}",
            difficulty=1,
            points=1,
            choices=["A", "B", "C", "D"],
            correct_answer=correct_answer,
        )
        questions.append(q)
        exam.questions.add(q)

    return exam


def calculate_cheating_risk(variants):
    """Calculate cheating risk score for variants"""
    variant_questions = []
    for variant in variants:
        questions = variant.variantquestion_set.select_related("question").order_by(
            "order"
        )
        variant_questions.append([vq for vq in questions])

    max_questions = max(len(qs) for qs in variant_questions)
    vulnerabilities_found = 0
    total_positions = 0

    for pos in range(max_questions):
        position_answers = []
        for variant_qs in variant_questions:
            if pos < len(variant_qs):
                vq = variant_qs[pos]
                if vq.randomized_correct_answer:
                    correct_answer = vq.randomized_correct_answer
                else:
                    correct_answer = vq.question.correct_answer

                if isinstance(correct_answer, list):
                    answer_key = tuple(sorted(correct_answer))
                else:
                    answer_key = (correct_answer,)
                position_answers.append(answer_key)
            else:
                position_answers.append(None)

        if len([a for a in position_answers if a is not None]) > 1:
            total_positions += 1

            # Check for adjacent vulnerabilities
            for i in range(len(position_answers) - 1):
                if (
                    position_answers[i] is not None
                    and position_answers[i + 1] is not None
                    and position_answers[i] == position_answers[i + 1]
                ):
                    vulnerabilities_found += 1

    if total_positions > 0:
        return (vulnerabilities_found / total_positions) * 100
    return 0


def analyze_variant_patterns(variants):
    """Analyze and display variant answer patterns"""
    print("\n" + "=" * 60)
    print("VARIANT ANSWER PATTERN ANALYSIS")
    print("=" * 60)

    variant_questions = []
    for variant in variants:
        questions = variant.variantquestion_set.select_related("question").order_by(
            "order"
        )
        variant_questions.append([vq for vq in questions])

    max_questions = max(len(qs) for qs in variant_questions)

    # Display answer patterns
    print(
        (
            f"\nAnswer patterns for {len(variants)} variants with "
            f"{max_questions} questions each:"
        )
    )

    print("-" * 60)

    for pos in range(max_questions):
        print(f"Position {pos+1}:", end=" ")
        position_answers = []

        for variant_idx, variant_qs in enumerate(variant_questions):
            if pos < len(variant_qs):
                vq = variant_qs[pos]
                if vq.randomized_correct_answer:
                    correct_answer = vq.randomized_correct_answer
                else:
                    correct_answer = vq.question.correct_answer

                # Convert to letter representation
                if isinstance(correct_answer, list):
                    letters = []
                    for idx in correct_answer:
                        if idx < len(vq.question.choices):
                            letters.append(chr(65 + idx))  # A, B, C, D
                    answer_str = "".join(letters)
                else:
                    if correct_answer < len(vq.question.choices):
                        answer_str = chr(65 + correct_answer)
                    else:
                        answer_str = str(correct_answer)

                position_answers.append(answer_str)
                print(f"V{variant_idx+1}:{answer_str}", end=" ")
            else:
                position_answers.append(None)
                print(f"V{variant_idx+1}:--", end=" ")

        # Check for adjacent vulnerabilities
        vulnerabilities = []
        for i in range(len(position_answers) - 1):
            if (
                position_answers[i] is not None
                and position_answers[i + 1] is not None
                and position_answers[i] == position_answers[i + 1]
            ):
                vulnerabilities.append(f"V{i+1}-V{i+2}")

        if vulnerabilities:
            print(f"  [VULNERABLE: {' '.join(vulnerabilities)}]")
        else:
            print("  [SAFE]")

    # Calculate detailed statistics
    print("\n" + "-" * 60)
    print("DETAILED STATISTICS")
    print("-" * 60)

    total_adjacent_pairs = (len(variants) - 1) * max_questions
    adjacent_overlaps = 0

    for pos in range(max_questions):
        position_answers = []
        for variant_qs in variant_questions:
            if pos < len(variant_qs):
                vq = variant_qs[pos]
                if vq.randomized_correct_answer:
                    correct_answer = vq.randomized_correct_answer
                else:
                    correct_answer = vq.question.correct_answer

                if isinstance(correct_answer, list):
                    answer_key = tuple(sorted(correct_answer))
                else:
                    answer_key = (correct_answer,)
                position_answers.append(answer_key)
            else:
                position_answers.append(None)

        # Check for adjacent overlaps
        for i in range(len(position_answers) - 1):
            if (
                position_answers[i] is not None
                and position_answers[i + 1] is not None
                and position_answers[i] == position_answers[i + 1]
            ):
                adjacent_overlaps += 1

    overlap_percentage = (
        (adjacent_overlaps / total_adjacent_pairs) * 100
        if total_adjacent_pairs > 0
        else 0
    )

    print(f"Total adjacent pairs: {total_adjacent_pairs}")
    print(f"Adjacent overlaps found: {adjacent_overlaps}")
    print(f"Adjacent overlap percentage: {overlap_percentage:.1f}%")

    if overlap_percentage == 0:
        print("🎉 PERFECT: No adjacent vulnerabilities detected!")
    elif overlap_percentage <= 20:
        print("✅ GOOD: Low cheating risk")
    elif overlap_percentage <= 50:
        print("⚠️  MODERATE: Some cheating risk")
    else:
        print("❌ HIGH: Significant cheating risk")


def main():
    """Main demonstration function"""
    print("ANTI-CHEATING OPTIMIZATION DEMONSTRATION")
    print("=" * 60)
    print("This script demonstrates how the anti-cheating algorithm")
    print("optimizes variant arrangements to minimize cheating risk.")
    print()

    # Create test data
    print("Creating test data...")
    user, course, bank = create_test_data()

    # Create exam with vulnerabilities
    print("Creating exam with intentional vulnerabilities...")
    exam = create_vulnerable_exam(user, course, bank)

    print(f"Created exam: {exam.title}")
    print(f"Questions: {exam.questions.count()}")
    print(f"Variants to generate: {exam.num_variants}")
    print(f"Questions per variant: {exam.questions_per_variant}")
    print()

    # Generate variants with optimization
    print("Generating variants with anti-cheating optimization...")
    variants = exam.generate_variants()

    print(f"Generated {len(variants)} variants successfully!")
    print()

    # Calculate cheating risk
    risk_score = calculate_cheating_risk(variants)
    print(f"FINAL CHEATING RISK SCORE: {risk_score:.1f}%")

    # Analyze patterns
    analyze_variant_patterns(variants)

    print("\n" + "=" * 60)
    print("OPTIMIZATION SUMMARY")
    print("=" * 60)
    print("The algorithm has optimized the variant arrangement to:")
    print("1. Minimize adjacent seat vulnerabilities")
    print("2. Distribute correct answers strategically")
    print("3. Use seating patterns (A-B-C-D-E) effectively")
    print("4. Swap questions when beneficial")
    print()

    if risk_score == 0:
        print("🎉 SUCCESS: Achieved optimal anti-cheating arrangement!")
    elif risk_score <= 20:
        print("✅ GOOD: Low cheating risk achieved")
    else:
        print("⚠️  NOTE: Some vulnerabilities remain due to question pool limitations")

    print("\nThe optimization algorithm:")
    print("- Detects adjacent vulnerabilities")
    print("- Swaps questions strategically to break patterns")
    print("- Uses seating pattern optimization")
    print("- Provides detailed risk assessment")


if __name__ == "__main__":
    main()
