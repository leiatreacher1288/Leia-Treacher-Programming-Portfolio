import statistics

# analytics/services.py
from typing import Any, Dict, List

from exams.models import Variant, VariantQuestion


class VariantSetAnalyticsService:
    """Service for calculating comprehensive analytics for variant sets"""

    @staticmethod
    def calculate_variant_set_analytics(variants: List[Variant]) -> Dict[str, Any]:
        """
        Calculate comprehensive analytics for a set of variants

        Args:
            variants: List of variants in the set

        Returns:
            Dictionary containing all analytics metrics
        """
        if not variants:
            return {}

        # Get all variant questions with their details
        all_variant_questions = []
        for variant in variants:
            vqs = variant.variantquestion_set.select_related("question").order_by(
                "order"
            )
            all_variant_questions.extend(vqs)

        if not all_variant_questions:
            return {}

        # Calculate core metrics
        question_diversity = VariantSetAnalyticsService._calculate_question_diversity(
            variants
        )
        difficulty_distribution = (
            VariantSetAnalyticsService._calculate_difficulty_distribution(
                all_variant_questions
            )
        )
        answer_pattern_analysis = (
            VariantSetAnalyticsService._calculate_answer_pattern_analysis(variants)
        )
        integrity_score = VariantSetAnalyticsService._calculate_integrity_score(
            question_diversity,
            difficulty_distribution,
            answer_pattern_analysis,
            variants,
        )

        # Calculate additional metrics
        question_reuse_rate = VariantSetAnalyticsService._calculate_question_reuse_rate(
            all_variant_questions
        )
        mandatory_overlap = VariantSetAnalyticsService._calculate_mandatory_overlap(
            variants
        )
        hamming_distances = VariantSetAnalyticsService._calculate_hamming_distances(
            variants
        )

        return {
            "integrity_score": integrity_score,
            "question_diversity": question_diversity,
            "difficulty_distribution": difficulty_distribution,
            "answer_pattern_analysis": answer_pattern_analysis,
            "question_reuse_rate": question_reuse_rate,
            "mandatory_overlap": mandatory_overlap,
            "hamming_distances": hamming_distances,
            "variant_count": len(variants),
            "total_questions": len(all_variant_questions),
            "unique_questions": len(
                set(vq.question.id for vq in all_variant_questions)
            ),
        }

    @staticmethod
    def _calculate_question_diversity(variants: List[Variant]) -> Dict[str, Any]:
        """Calculate question diversity metrics"""
        all_questions = []
        for variant in variants:
            vqs = variant.variantquestion_set.select_related("question").order_by(
                "order"
            )
            all_questions.extend([vq.question.id for vq in vqs])

        unique_questions = set(all_questions)
        total_questions = len(all_questions)

        diversity_ratio = (
            len(unique_questions) / total_questions if total_questions > 0 else 0
        )
        diversity_percentage = diversity_ratio * 100

        return {
            "total_questions": total_questions,
            "unique_questions": len(unique_questions),
            "diversity_ratio": round(diversity_ratio, 3),
            "diversity_percentage": round(diversity_percentage, 1),
            "reuse_rate": round((1 - diversity_ratio) * 100, 1),
        }

    @staticmethod
    def _calculate_difficulty_distribution(
        variant_questions: List[VariantQuestion],
    ) -> Dict[str, Any]:
        """Calculate difficulty distribution metrics"""
        difficulty_counts = {}
        total_questions = len(variant_questions)

        for vq in variant_questions:
            difficulty = vq.question.difficulty
            if difficulty is None:
                difficulty = "Unknown"
            elif difficulty == 1:
                difficulty = "Easy"
            elif difficulty == 2:
                difficulty = "Medium"
            elif difficulty == 3:
                difficulty = "Hard"

            difficulty_counts[difficulty] = difficulty_counts.get(difficulty, 0) + 1

        # Calculate percentages
        difficulty_percentages = {}
        for difficulty, count in difficulty_counts.items():
            percentage = (count / total_questions) * 100 if total_questions > 0 else 0
            difficulty_percentages[difficulty] = round(percentage, 1)

        # Calculate balance score (how well distributed the difficulties are)
        if len(difficulty_counts) >= 3:
            balance_score = 85  # Good balance
        elif len(difficulty_counts) == 2:
            balance_score = 65  # Moderate balance
        else:
            balance_score = 40  # Poor balance

        return {
            "counts": difficulty_counts,
            "percentages": difficulty_percentages,
            "balance_score": balance_score,
            "total_questions": total_questions,
        }

    @staticmethod
    def _calculate_answer_pattern_analysis(variants: List[Variant]) -> Dict[str, Any]:
        """Calculate answer pattern analysis"""
        if len(variants) < 2:
            return {
                "hamming_distance": 0,
                "pattern_diversity": 0,
                "risk_score": 0,
                "unique_patterns": 1,
            }

        # Get answer patterns for each variant
        answer_patterns = []
        for variant in variants:
            vqs = variant.variantquestion_set.select_related("question").order_by(
                "order"
            )
            pattern = []
            for vq in vqs:
                if vq.randomized_correct_answer:
                    pattern.append(tuple(sorted(vq.randomized_correct_answer)))
                else:
                    correct_answer = vq.question.correct_answer
                    if isinstance(correct_answer, list):
                        pattern.append(tuple(sorted(correct_answer)))
                    else:
                        pattern.append(tuple([correct_answer]))
            answer_patterns.append(pattern)

        # Calculate Hamming distances between all pairs
        hamming_distances = []
        for i in range(len(answer_patterns)):
            for j in range(i + 1, len(answer_patterns)):
                distance = sum(
                    1 for a, b in zip(answer_patterns[i], answer_patterns[j]) if a != b
                )
                hamming_distances.append(distance)

        avg_hamming = statistics.mean(hamming_distances) if hamming_distances else 0
        max_possible_hamming = len(answer_patterns[0]) if answer_patterns else 1
        hamming_percentage = (
            (avg_hamming / max_possible_hamming) * 100
            if max_possible_hamming > 0
            else 0
        )

        # Calculate pattern diversity
        unique_patterns = len(set(tuple(p) for p in answer_patterns))
        pattern_diversity = (unique_patterns / len(variants)) * 100 if variants else 0

        # Calculate risk score (lower is better)
        risk_score = max(0, 100 - hamming_percentage)

        return {
            "hamming_distance": round(avg_hamming, 2),
            "hamming_percentage": round(hamming_percentage, 1),
            "pattern_diversity": round(pattern_diversity, 1),
            "risk_score": round(risk_score, 1),
            "unique_patterns": unique_patterns,
            "total_variants": len(variants),
        }

    @staticmethod
    def _calculate_integrity_score(
        question_diversity: Dict[str, Any],
        difficulty_distribution: Dict[str, Any],
        answer_pattern_analysis: Dict[str, Any],
        variants: List[Variant],
    ) -> Dict[str, Any]:
        """Calculate comprehensive integrity score"""

        # Base scores from different components
        diversity_score = question_diversity.get("diversity_percentage", 0)
        balance_score = difficulty_distribution.get("balance_score", 0)
        pattern_score = 100 - answer_pattern_analysis.get("risk_score", 0)

        # Weight the components
        weighted_score = (
            diversity_score * 0.3 + balance_score * 0.3 + pattern_score * 0.4
        )

        # Apply penalties
        variant_count = len(variants)
        if variant_count == 1:
            weighted_score *= 0.7  # Penalty for single variant
        elif variant_count < 3:
            weighted_score *= 0.9  # Small penalty for few variants

        # Check for reuse mode
        exam = variants[0].exam if variants else None
        if exam and getattr(exam, "allow_reuse", False):
            weighted_score *= 0.6  # Significant penalty for reuse mode

        final_score = round(weighted_score, 1)

        # Determine grade
        if final_score >= 85:
            grade = "Excellent"
            color = "green"
        elif final_score >= 70:
            grade = "Good"
            color = "blue"
        elif final_score >= 50:
            grade = "Fair"
            color = "yellow"
        else:
            grade = "Poor"
            color = "red"

        return {
            "score": final_score,
            "grade": grade,
            "color": color,
            "components": {
                "diversity_score": round(diversity_score, 1),
                "balance_score": round(balance_score, 1),
                "pattern_score": round(pattern_score, 1),
            },
            "penalties": {
                "variant_count_penalty": variant_count < 3,
                "reuse_penalty": (
                    exam and getattr(exam, "allow_reuse", False) if exam else False
                ),
            },
        }

    @staticmethod
    def _calculate_question_reuse_rate(
        variant_questions: List[VariantQuestion],
    ) -> float:
        """Calculate question reuse rate"""
        total_questions = len(variant_questions)
        unique_questions = len(set(vq.question.id for vq in variant_questions))

        if total_questions == 0:
            return 0.0

        reuse_rate = ((total_questions - unique_questions) / total_questions) * 100
        return round(reuse_rate, 1)

    @staticmethod
    def _calculate_mandatory_overlap(variants: List[Variant]) -> float:
        """Calculate mandatory question overlap"""
        if len(variants) < 2:
            return 0.0

        exam = variants[0].exam
        mandatory_questions = set(exam.mandatory_questions.all())

        if not mandatory_questions:
            return 0.0

        total_positions = 0
        overlap_count = 0

        for variant in variants:
            vqs = variant.variantquestion_set.select_related("question").order_by(
                "order"
            )
            for vq in vqs:
                if vq.question in mandatory_questions:
                    total_positions += 1
                    # Check if this mandatory question appears in other variants at the same position
                    for other_variant in variants:
                        if other_variant != variant:
                            other_vq = other_variant.variantquestion_set.filter(
                                order=vq.order
                            ).first()
                            if other_vq and other_vq.question == vq.question:
                                overlap_count += 1

        if total_positions == 0:
            return 0.0

        overlap_percentage = (overlap_count / total_positions) * 100
        return round(overlap_percentage, 1)

    @staticmethod
    def _calculate_hamming_distances(variants: List[Variant]) -> List[float]:
        """Calculate Hamming distances between all variant pairs"""
        if len(variants) < 2:
            return []

        distances = []
        for i in range(len(variants)):
            for j in range(i + 1, len(variants)):
                vqs1 = (
                    variants[i]
                    .variantquestion_set.select_related("question")
                    .order_by("order")
                )
                vqs2 = (
                    variants[j]
                    .variantquestion_set.select_related("question")
                    .order_by("order")
                )

                distance = 0
                for vq1, vq2 in zip(vqs1, vqs2):
                    if vq1.question.id != vq2.question.id:
                        distance += 1

                distances.append(distance)

        return distances
