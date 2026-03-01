import React, { useState, useEffect } from 'react';
import { Activity, HelpCircle } from 'lucide-react';
import { NivoPieChart } from '../Analytics/charts/nivo/NivoPieChart';
import { NivoRadialProgress } from '../Analytics/charts/nivo/NivoRadialProgress';
import type { ExamDetail } from '../../api/examAPI';
import { analyticsAPI, type VariantSetAnalytics } from '../../api/analyticsAPI';

type MainScore = {
  value: number;
  label: string;
};

function getMainScore(analytics: any, currentVariantSet?: any): MainScore {
  // Use actual analytics data if available (this is the correct approach)
  if (analytics && analytics.final_score !== undefined) {
    return {
      value: analytics.final_score,
      label: 'Exam Integrity',
    };
  }

  // If we have a selected variant set but no analytics data, calculate basic integrity score
  if (
    currentVariantSet &&
    currentVariantSet.variants &&
    currentVariantSet.variants.length > 0
  ) {
    const firstVariant = currentVariantSet.variants[0];

    // Calculate basic integrity score based on the variant's questions
    if (firstVariant.questions && firstVariant.questions.length > 0) {
      const questionCount = firstVariant.questions.length;
      const uniqueDifficulties = new Set(
        firstVariant.questions
          .map((q: any) => q.question?.difficulty)
          .filter(Boolean)
      );

      // More sophisticated integrity calculation based on question distribution
      const difficultyBalance =
        uniqueDifficulties.size >= 3
          ? 90
          : uniqueDifficulties.size >= 2
            ? 80
            : 65; // Higher score for more balanced difficulty
      const questionQuality =
        questionCount >= 8 ? 95 : questionCount >= 5 ? 85 : 70; // Higher score for more questions
      const variantCount = currentVariantSet.variants.length;
      const variantDiversity =
        variantCount >= 3 ? 90 : variantCount >= 2 ? 80 : 70; // Higher score for more variants

      const integrityScore = Math.round(
        (difficultyBalance + questionQuality + variantDiversity) / 3
      );

      console.log('getMainScore variant calculation (fallback):', {
        variantSetId: currentVariantSet.id,
        questionCount,
        uniqueDifficulties: Array.from(uniqueDifficulties),
        variantCount,
        difficultyBalance,
        questionQuality,
        variantDiversity,
        integrityScore,
      });

      return {
        value: integrityScore,
        label: 'Variant Integrity',
      };
    }
  }

  // Fallback to original analytics calculation
  const fields = [
    { key: 'final_score', label: 'Final Score' },
    { key: 'cheating_risk', label: 'Cheating Risk' },
    { key: 'answer_diversity', label: 'Answer Diversity' },
    { key: 'variant_uniqueness', label: 'Variant Uniqueness' },
    { key: 'question_reuse_rate', label: 'Question Reuse Rate' },
    { key: 'mandatory_overlap', label: 'Mandatory Overlap' },
  ];

  const components = fields
    .map(({ key, label }) => {
      const v = analytics[key];
      return typeof v === 'number' ? { label, value: v } : null;
    })
    .filter((c): c is { label: string; value: number } => Boolean(c));

  if (components.length === 0) return { value: 0, label: 'Exam Integrity' };

  let sum = 0;
  let count = 0;
  components.forEach(({ label, value }) => {
    if (
      label === 'Cheating Risk' ||
      label === 'Question Reuse Rate' ||
      label === 'Mandatory Overlap'
    ) {
      sum += 100 - value; // lower is better
    } else {
      sum += value; // higher is better
    }
    count++;
  });

  return {
    value: Math.round(sum / count),
    label: 'Exam Integrity',
  };
}

function getDifficultyPieData(
  exam: ExamDetail,
  currentVariantSet?: any,
  variantSetAnalytics?: VariantSetAnalytics
) {
  console.log('getDifficultyPieData called with:', {
    examId: exam.id,
    currentVariantSet: currentVariantSet?.id,
    variantSetAnalytics: variantSetAnalytics ? 'loaded' : 'not loaded',
    examDifficultyBreakdown: exam.difficulty_breakdown,
  });

  // If we have variant set analytics data, use it for per-variant difficulty
  if (variantSetAnalytics && currentVariantSet) {
    console.log('Using variant set analytics data:', {
      difficultyCounts: variantSetAnalytics.difficulty_distribution.counts,
      totalQuestions:
        variantSetAnalytics.difficulty_distribution.total_questions,
    });

    const difficultyCounts = variantSetAnalytics.difficulty_distribution.counts;
    const total = variantSetAnalytics.difficulty_distribution.total_questions;

    if (total === 0) {
      console.log('Total questions is 0, returning null');
      return null;
    }

    // Map numeric difficulty keys to string labels
    const difficultyMapping: Record<string | number, string> = {
      1: 'Easy',
      2: 'Medium',
      3: 'Hard',
      Easy: 'Easy',
      Medium: 'Medium',
      Hard: 'Hard',
      Unknown: 'Unknown',
      null: 'Unknown',
    };

    const pieData = [
      {
        id: 'Easy',
        label: 'Easy',
        value: difficultyCounts[1] || difficultyCounts.Easy || 0,
        color: '#22c55e',
      },
      {
        id: 'Medium',
        label: 'Medium',
        value: difficultyCounts[2] || difficultyCounts.Medium || 0,
        color: '#facc15',
      },
      {
        id: 'Hard',
        label: 'Hard',
        value: difficultyCounts[3] || difficultyCounts.Hard || 0,
        color: '#8b5cf6',
      },
    ];

    // Add unknown difficulty if present
    const unknownCount = difficultyCounts.null || difficultyCounts.Unknown || 0;
    if (unknownCount > 0) {
      pieData.push({
        id: 'Unknown',
        label: 'Unknown',
        value: unknownCount,
        color: '#6b7280',
      });
    }

    const filteredData = pieData.filter((d) => d.value > 0);
    console.log('Generated pie data from variant set analytics:', filteredData);
    return filteredData;
  }

  // If we have a selected variant set, calculate difficulty from the first variant's questions
  if (
    currentVariantSet &&
    currentVariantSet.variants &&
    currentVariantSet.variants.length > 0
  ) {
    const firstVariant = currentVariantSet.variants[0];

    // Calculate difficulty breakdown from the variant's questions
    if (firstVariant.questions && firstVariant.questions.length > 0) {
      const difficultyCounts = {
        Easy: 0,
        Medium: 0,
        Hard: 0,
        Unknown: 0,
      };

      // Count difficulties from the first variant's questions
      firstVariant.questions.forEach((variantQuestion: any) => {
        const difficulty = variantQuestion.question?.difficulty || 'Unknown';
        if (
          Object.prototype.hasOwnProperty.call(difficultyCounts, difficulty)
        ) {
          difficultyCounts[difficulty as keyof typeof difficultyCounts]++;
        } else {
          difficultyCounts.Unknown++;
        }
      });

      const total =
        difficultyCounts.Easy +
        difficultyCounts.Medium +
        difficultyCounts.Hard +
        difficultyCounts.Unknown;
      if (total === 0) return null;

      const pieData = [
        {
          id: 'Easy',
          label: 'Easy',
          value: difficultyCounts.Easy,
          color: '#22c55e',
        }, // green
        {
          id: 'Medium',
          label: 'Medium',
          value: difficultyCounts.Medium,
          color: '#facc15',
        }, // yellow
        {
          id: 'Hard',
          label: 'Hard',
          value: difficultyCounts.Hard,
          color: '#8b5cf6',
        }, // purple
      ];

      // Add unknown difficulty if present
      if (difficultyCounts.Unknown > 0) {
        pieData.push({
          id: 'Unknown',
          label: 'Unknown',
          value: difficultyCounts.Unknown,
          color: '#6b7280',
        }); // gray
      }

      return pieData.filter((d) => d.value > 0);
    }
  }

  // Use actual difficulty breakdown from generated variants if available
  if (exam.difficulty_breakdown) {
    const { Easy, Medium, Hard, Unknown } = exam.difficulty_breakdown;
    const total = Easy + Medium + Hard + (Unknown || 0);
    if (total === 0) return null;

    const pieData = [
      { id: 'Easy', label: 'Easy', value: Easy, color: '#22c55e' }, // green
      { id: 'Medium', label: 'Medium', value: Medium, color: '#facc15' }, // yellow
      { id: 'Hard', label: 'Hard', value: Hard, color: '#8b5cf6' }, // purple
    ];

    // Add unknown difficulty if present
    if (Unknown && Unknown > 0) {
      pieData.push({
        id: 'Unknown',
        label: 'Unknown',
        value: Unknown,
        color: '#6b7280',
      }); // gray
    }

    return pieData.filter((d) => d.value > 0);
  } else {
    // Fallback to configuration percentages only if no variants exist
    const {
      easy_percentage,
      medium_percentage,
      hard_percentage,
      unknown_percentage,
    } = exam;
    const total =
      easy_percentage +
      medium_percentage +
      hard_percentage +
      (unknown_percentage || 0);
    if (total === 0) return null;

    const pieData = [
      { id: 'Easy', label: 'Easy', value: easy_percentage, color: '#22c55e' }, // green
      {
        id: 'Medium',
        label: 'Medium',
        value: medium_percentage,
        color: '#facc15',
      }, // yellow
      { id: 'Hard', label: 'Hard', value: hard_percentage, color: '#8b5cf6' }, // purple
    ];

    // Add unknown difficulty if present
    if (unknown_percentage && unknown_percentage > 0) {
      pieData.push({
        id: 'Unknown',
        label: 'Unknown',
        value: unknown_percentage,
        color: '#6b7280',
      }); // gray
    }

    return pieData.filter((d) => d.value > 0);
  }
}

interface AnalyticsPreviewCardProps {
  exam: ExamDetail;
  onViewFull: () => void;
  currentVariantSet?: any;
}

const IntegrityScoreHelpModal: React.FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] shadow-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <HelpCircle className="text-blue-600" size={24} />
            <h3 className="text-xl font-semibold text-gray-900">
              Exam Integrity Score Explained
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Goal */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-blue-900 mb-3">Goal</h4>
            <p className="text-sm text-blue-800">
              The Exam Integrity Score (0-100%) measures how well your exam
              protects against cheating by answer copying, especially among
              adjacent students who likely get adjacent variants like A/B/C.
            </p>
            <p className="text-sm text-blue-700 mt-2">
              This helps you understand: "How different are these variants?" and
              "Would it be hard for students sitting next to each other to
              copy?"
            </p>
          </div>

          {/* Key Ideas */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-green-900 mb-3">
              Key Ideas
            </h4>
            <p className="text-sm text-green-800 mb-3">
              Cheating is most likely when:
            </p>
            <ul className="text-sm text-green-700 space-y-2">
              <li>
                • Two students have the same question at the same index with the
                same correct answer
              </li>
              <li>
                • Their answer keys are structurally identical (same patterns)
              </li>
              <li>• Variants are too similar overall</li>
              <li>
                • Variants are seated in predictable orders (A-B-C-A-B...)
              </li>
            </ul>
            <p className="text-sm text-green-800 mt-3">
              So we want variants to shuffle question order, shuffle choices per
              question, distribute difficulty fairly, and make matching answer
              patterns across adjacent variants hard.
            </p>
          </div>

          {/* Analysis Components */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-purple-900 mb-3">
              What We Analyze
            </h4>
            <p className="text-sm text-purple-800 mb-3">
              For each pair of adjacent variants (e.g., A vs B, B vs C):
            </p>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-purple-800">
                  Shared Questions in Same Position
                </p>
                <p className="text-sm text-purple-700">
                  Percentage of questions that are the same question ID at the
                  same index. High percentage = bad.
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-purple-800">
                  Shared Correct Answers at Same Index
                </p>
                <p className="text-sm text-purple-700">
                  Even if different questions, if both have "A" as correct at
                  position 5, copying is easier. High percentage = bad.
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-purple-800">
                  Answer Pattern Similarity
                </p>
                <p className="text-sm text-purple-700">
                  Compare the sequence of correct answers (e.g., ['A', 'D', 'B',
                  ...]). High similarity = bad.
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-purple-800">
                  Choice Set Similarity
                </p>
                <p className="text-sm text-purple-700">
                  For multi-correct questions, compare sorted correct answers.
                  If same set like ["A", "C"] at same index = bad.
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-purple-800">
                  Difficulty Distribution
                </p>
                <p className="text-sm text-purple-700">
                  If both variants have very similar difficulty progression,
                  that could aid collaboration.
                </p>
              </div>
            </div>
          </div>

          {/* Score Interpretation */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-amber-900 mb-3">
              Score Interpretation
            </h4>
            <div className="space-y-2 text-sm text-amber-800">
              <p>
                <strong>90-100%:</strong> Excellent - Variants are very
                different, low cheating risk
              </p>
              <p>
                <strong>70-89%:</strong> Good - Variants are reasonably
                different, moderate protection
              </p>
              <p>
                <strong>50-69%:</strong> Fair - Some similarity, consider
                improving variant generation
              </p>
              <p>
                <strong>Below 50%:</strong> Poor - Variants are too similar,
                high cheating risk
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export const AnalyticsPreviewCard: React.FC<AnalyticsPreviewCardProps> = ({
  exam,
  onViewFull,
  currentVariantSet,
}) => {
  const [variantSetAnalytics, setVariantSetAnalytics] =
    useState<VariantSetAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [showIntegrityHelp, setShowIntegrityHelp] = useState(false);

  // Fetch variant set analytics when currentVariantSet changes
  useEffect(() => {
    const fetchVariantSetAnalytics = async () => {
      if (
        !currentVariantSet ||
        !currentVariantSet.variants ||
        currentVariantSet.variants.length === 0
      ) {
        setVariantSetAnalytics(null);
        return;
      }

      try {
        setLoadingAnalytics(true);
        const variantIds = currentVariantSet.variants.map((v: any) => v.id);
        const analytics = await analyticsAPI.getVariantSetAnalytics(
          exam.id,
          variantIds
        );
        setVariantSetAnalytics(analytics);
      } catch (error) {
        console.error('Failed to fetch variant set analytics:', error);
        setVariantSetAnalytics(null);
      } finally {
        setLoadingAnalytics(false);
      }
    };

    fetchVariantSetAnalytics();
  }, [currentVariantSet, exam.id]);

  const analytics: any = exam.analytics || {};

  // Use variant set analytics if available, otherwise fall back to exam analytics
  const mainScore = variantSetAnalytics
    ? {
        value: variantSetAnalytics.integrity_score.score,
        label: 'Exam Integrity',
      }
    : getMainScore(analytics, currentVariantSet);

  const pieData = getDifficultyPieData(
    exam,
    currentVariantSet,
    variantSetAnalytics || undefined
  );
  const showDifficulty = pieData && pieData.length > 0;

  // Debug logging
  console.log('AnalyticsPreviewCard render:', {
    currentVariantSet: currentVariantSet?.id,
    mainScore,
    pieDataLength: pieData?.length,
    variantSetAnalytics: variantSetAnalytics ? 'loaded' : 'not loaded',
    loadingAnalytics,
  });

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100/80 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Exam Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Quick snapshot of integrity and difficulty balance
            </p>
          </div>
        </div>
        <button
          onClick={onViewFull}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          See Full Analytics →
        </button>
      </div>

      {/* Content */}
      <div className="flex items-center justify-center gap-20 px-4">
        {/* Left: Integrity Score */}
        <div className="flex flex-col items-center justify-center">
          <div
            className="w-50 h-50 mb-6"
            aria-label={`Exam Integrity ${mainScore.value}%`}
          >
            <NivoRadialProgress
              key={`radial-${currentVariantSet?.id || 'default'}-${mainScore.value}-${loadingAnalytics ? 'loading' : 'loaded'}`}
              value={mainScore.value}
              height={200}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-medium">
              {mainScore.label}
            </span>
            <button
              onClick={() => setShowIntegrityHelp(true)}
              className="text-blue-600 hover:text-blue-700 transition-colors"
              title="How is integrity calculated?"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Difficulty Distribution */}
        {showDifficulty ? (
          <div className="flex flex-col items-center justify-center">
            <div
              className="w-64 h-66"
              aria-label="Difficulty Distribution Chart"
            >
              <NivoPieChart
                key={`pie-${currentVariantSet?.id || 'default'}-${loadingAnalytics ? 'loading' : 'loaded'}`}
                data={pieData}
                height={240}
                legend={true}
              />
            </div>
            <span className="text-sm text-muted-foreground font-medium">
              Difficulty Distribution
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            No difficulty tags assigned
          </div>
        )}
      </div>

      {/* Integrity Score Help Modal */}
      {showIntegrityHelp && (
        <IntegrityScoreHelpModal onClose={() => setShowIntegrityHelp(false)} />
      )}
    </div>
  );
};
