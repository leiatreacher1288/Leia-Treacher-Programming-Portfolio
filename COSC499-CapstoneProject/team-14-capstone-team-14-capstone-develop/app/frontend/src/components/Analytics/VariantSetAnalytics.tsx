import React, { useState, useEffect } from 'react';
import {
  analyticsAPI,
  type VariantSetAnalytics as VariantSetAnalyticsData,
} from '../../api/analyticsAPI';
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  Files,
  List,
  ListChecks,
  Info,
  BarChart3,
  Target,
  CheckCircle,
} from 'lucide-react';
import { NivoPieChart } from '../Analytics/charts/nivo/NivoPieChart';
import { NivoRadialProgress } from '../Analytics/charts/nivo/NivoRadialProgress';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/Tooltip';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';

interface VariantSetAnalyticsProps {
  examId: number;
  variantIds: number[];
  onClose?: () => void;
  // Add exam data to check if variants are locked
  exam?: {
    variants?: Array<{
      id: number;
      is_locked: boolean;
      version_label: string;
      questions?: Array<{
        id: number;
        question: {
          difficulty: string;
        };
      }>;
    }>;
  };
  // Add currentVariantSet to access variant questions
  currentVariantSet?: any;
}

const IntegrityScoreInfoCard: React.FC<{ integrityScore: number }> = ({
  integrityScore,
}) => {
  const getScoreInfo = () => {
    if (integrityScore < 50) {
      return {
        color: 'bg-red-50 border-red-200 text-red-800',
        icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
        title: 'Low Integrity Score',
        message:
          'Your exam variants have significant similarities that could enable cheating. Consider increasing the number of questions or reducing the number of variants to improve security.',
        recommendations: [
          'Increase number of questions',
          'Reduce number of variants',
          'Add more question diversity',
        ],
      };
    } else if (integrityScore < 75) {
      return {
        color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        icon: <Info className="w-5 h-5 text-yellow-600" />,
        title: 'Moderate Integrity Score',
        message:
          'Your exam has decent integrity but could be improved. Consider adding more question variety or adjusting variant configurations.',
        recommendations: [
          'Add more question diversity',
          'Review variant configurations',
          'Consider reducing variants',
        ],
      };
    } else {
      return {
        color: 'bg-green-50 border-green-200 text-green-800',
        icon: <CheckCircle className="w-5 h-5 text-green-600" />,
        title: 'Excellent Integrity Score',
        message:
          'Great job! Your exam variants are well-designed to prevent cheating. Students should have difficulty copying from adjacent variants.',
        recommendations: [
          'Maintain current configuration',
          'Consider adding more questions for even better security',
        ],
      };
    }
  };

  const scoreInfo = getScoreInfo();

  return (
    <div className={`p-4 rounded-lg border ${scoreInfo.color} mb-6`}>
      <div className="flex items-start gap-3">
        {scoreInfo.icon}
        <div className="flex-1">
          <h3 className="font-semibold mb-1">{scoreInfo.title}</h3>
          <p className="text-sm mb-2">{scoreInfo.message}</p>
          <div className="text-xs">
            <span className="font-medium">Recommendations:</span>
            <ul className="list-disc list-inside mt-1 space-y-1">
              {scoreInfo.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export const VariantSetAnalytics: React.FC<VariantSetAnalyticsProps> = ({
  examId,
  variantIds,
  exam,
  currentVariantSet,
}) => {
  const [analytics, setAnalytics] = useState<VariantSetAnalyticsData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await analyticsAPI.getVariantSetAnalytics(
          examId,
          variantIds
        );
        setAnalytics(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch analytics'
        );
      } finally {
        setLoading(false);
      }
    };

    if (examId && variantIds.length > 0) {
      fetchAnalytics();
    }
  }, [examId, variantIds]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Calculating analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">Error: {error}</span>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center">
          <Info className="h-5 w-5 text-yellow-500 mr-2" />
          <span className="text-yellow-700">No analytics data available</span>
        </div>
      </div>
    );
  }

  // Create difficulty pie data similar to AnalyticsPreviewCard
  const getDifficultyPieData = () => {
    // If we have currentVariantSet data, calculate difficulty per variant (like AnalyticsPreviewCard)
    if (currentVariantSet?.variants && currentVariantSet.variants.length > 0) {
      const firstVariant = currentVariantSet.variants[0];

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
        if (total === 0) return [];

        const pieData = [
          {
            id: 'Easy',
            label: 'Easy',
            value: difficultyCounts.Easy,
            color: '#22c55e',
          },
          {
            id: 'Medium',
            label: 'Medium',
            value: difficultyCounts.Medium,
            color: '#facc15',
          },
          {
            id: 'Hard',
            label: 'Hard',
            value: difficultyCounts.Hard,
            color: '#8b5cf6',
          },
        ];

        // Add unknown difficulty if present
        if (difficultyCounts.Unknown > 0) {
          pieData.push({
            id: 'Unknown',
            label: 'Unknown',
            value: difficultyCounts.Unknown,
            color: '#6b7280',
          });
        }

        return pieData.filter((d) => d.value > 0);
      }
    }

    // Fallback to analytics API data (combined difficulty)
    const difficultyCounts = analytics.difficulty_distribution.counts;
    const total = analytics.difficulty_distribution.total_questions;

    if (total === 0) return [];

    const pieData = [
      {
        id: 'Easy',
        label: 'Easy',
        value: difficultyCounts.Easy || 0,
        color: '#22c55e',
      },
      {
        id: 'Medium',
        label: 'Medium',
        value: difficultyCounts.Medium || 0,
        color: '#facc15',
      },
      {
        id: 'Hard',
        label: 'Hard',
        value: difficultyCounts.Hard || 0,
        color: '#8b5cf6',
      },
    ];

    // Add unknown difficulty if present
    if (difficultyCounts.Unknown && difficultyCounts.Unknown > 0) {
      pieData.push({
        id: 'Unknown',
        label: 'Unknown',
        value: difficultyCounts.Unknown,
        color: '#6b7280',
      });
    }

    return pieData.filter((d) => d.value > 0);
  };

  const difficultyPieData = getDifficultyPieData();
  const showDifficulty = difficultyPieData.length > 0;

  // Calculate main score for radial chart
  const mainScore = {
    value: analytics.integrity_score.score,
    label: 'Exam Integrity',
  };

  // Mock exam data for summary (you'll need to pass this from parent)
  const examData = {
    questions_per_variant:
      analytics.total_questions / analytics.variant_count || 0,
  };
  const variantCount = analytics.variant_count;
  const mandatoryCount = analytics.mandatory_overlap || 0;

  // Check if variants have results (are locked)
  const hasResults =
    exam?.variants?.some(
      (variant) => variantIds.includes(variant.id) && variant.is_locked
    ) || false;

  // Create data for additional charts (only shown if has results)
  const getAnswerPatternData = () => {
    if (!hasResults) return [];

    return [
      {
        id: 'Pattern Diversity',
        data: [
          {
            x: 'Variant A',
            y: analytics.answer_pattern_analysis.pattern_diversity,
          },
          {
            x: 'Variant B',
            y: analytics.answer_pattern_analysis.pattern_diversity * 0.9,
          },
          {
            x: 'Variant C',
            y: analytics.answer_pattern_analysis.pattern_diversity * 1.1,
          },
        ],
      },
    ];
  };

  const getQuestionReuseData = () => {
    if (!hasResults) return [];

    return [
      {
        id: 'Reuse Rate',
        data: [
          { x: 'Easy', y: analytics.question_reuse_rate * 0.3 },
          { x: 'Medium', y: analytics.question_reuse_rate * 0.5 },
          { x: 'Hard', y: analytics.question_reuse_rate * 0.2 },
        ],
      },
    ];
  };

  return (
    <div className="space-y-6">
      {/* Integrity Score Info Card */}
      <IntegrityScoreInfoCard integrityScore={mainScore.value} />

      {/* Primary Analytics Cards - 2x2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Left: Exam Integrity */}
        <div className="bg-white rounded-2xl shadow-card border border-border-light p-6 flex flex-col items-center justify-center min-h-[340px]">
          <div className="text-base font-semibold text-heading mb-4">
            Exam Integrity
          </div>
          <NivoRadialProgress value={mainScore.value} height={200} />
          <span className="text-xs text-gray-500 mt-4 text-center max-w-[280px]">
            Higher integrity indicates lower possibility of cheating and better
            exam security
          </span>
        </div>

        {/* Top Right: Difficulty Distribution - Bigger chart */}
        {showDifficulty && difficultyPieData && (
          <div className="bg-white rounded-2xl shadow-card border border-border-light p-6 flex flex-col items-center justify-center min-h-[340px]">
            <div className="text-base font-semibold text-heading mb-4">
              Difficulty Distribution
            </div>
            <NivoPieChart data={difficultyPieData} height={280} legend={true} />
          </div>
        )}
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bottom Left: Exam Summary (Unified Card) */}
        <div className="bg-white rounded-2xl shadow-card border border-border-light p-6 min-h-[220px]">
          <div className="text-base font-semibold text-heading mb-6 text-center">
            Exam Summary
          </div>
          <div className="grid grid-cols-3 gap-4">
            {/* Variants */}
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-3">
                <Files className="w-6 h-6 text-indigo-600" />
              </div>
              <span
                className="text-2xl font-bold text-heading"
                aria-label={`${variantCount} total variants`}
              >
                {variantCount}
              </span>
              <span className="text-sm text-muted-foreground mt-1">
                Variants
              </span>
            </div>

            {/* Questions */}
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                <List className="w-6 h-6 text-emerald-600" />
              </div>
              <span
                className="text-2xl font-bold text-heading"
                aria-label={`${examData.questions_per_variant} questions per variant`}
              >
                {examData.questions_per_variant}
              </span>
              <span className="text-sm text-muted-foreground mt-1">
                Questions
              </span>
            </div>

            {/* Mandatory Questions */}
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-3">
                <ListChecks className="w-6 h-6 text-amber-600" />
              </div>
              <span
                className="text-2xl font-bold text-heading"
                aria-label={`${mandatoryCount} mandatory questions`}
              >
                {mandatoryCount}
              </span>
              <span className="text-sm text-muted-foreground mt-1">
                Mandatory
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Right: Question Reuse Analysis with Tooltips */}
        <div className="bg-white rounded-2xl shadow-card border border-border-light p-6 min-h-[220px]">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Question Reuse Analysis
            </h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Analysis of how questions are reused across variants. Some reuse is
            normal, but too much can be problematic.
          </p>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Reuse Rate</span>
              <span className="font-semibold">
                {analytics.question_reuse_rate}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-600">Hamming Distance</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3 h-3 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Average number of different answer choices between variants.
                    Higher distance means more diverse answer patterns, reducing
                    cheating risk. Good: 2-3+ differences per question.
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="font-semibold">
                {analytics.answer_pattern_analysis.hamming_distance}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Analytics Cards - Only show if variant has results */}
      {hasResults && (
        <>
          {/* Results-based Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricCard
              title="Question Diversity"
              value={`${analytics.question_diversity.diversity_percentage}%`}
              subtitle={`${analytics.question_diversity.unique_questions} unique out of ${analytics.question_diversity.total_questions} total`}
              description="How many different questions are used across variants. Higher is better for preventing cheating."
              trend={
                analytics.question_diversity.diversity_percentage > 70
                  ? 'up'
                  : 'down'
              }
              color="blue"
            />
            <MetricCard
              title="Difficulty Balance"
              value={`${analytics.difficulty_distribution.balance_score}%`}
              subtitle="Well distributed across Easy, Medium, and Hard"
              description="How well the questions are distributed across difficulty levels. Balanced exams are fairer."
              trend={
                analytics.difficulty_distribution.balance_score > 70
                  ? 'up'
                  : 'down'
              }
              color="green"
            />
            <MetricCard
              title="Answer Pattern Diversity"
              value={`${analytics.answer_pattern_analysis.pattern_diversity}%`}
              subtitle={`${analytics.answer_pattern_analysis.unique_patterns} unique patterns`}
              description="How different the answer patterns are between variants. Higher diversity reduces cheating risk."
              trend={
                analytics.answer_pattern_analysis.pattern_diversity > 80
                  ? 'up'
                  : 'down'
              }
              color="purple"
            />
          </div>

          {/* Results-based Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Answer Pattern Analysis Chart */}
            <div className="bg-white rounded-2xl shadow-card border border-border-light p-6 min-h-[300px]">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Answer Pattern Analysis
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Analysis of answer pattern diversity across variants. Higher
                diversity indicates better exam security.
              </p>
              {getAnswerPatternData().length > 0 && (
                <div className="h-64">
                  <ResponsiveLine
                    data={getAnswerPatternData()}
                    margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
                    xScale={{ type: 'point' }}
                    yScale={{ type: 'linear', min: 0, max: 100 }}
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: 'Variant',
                      legendOffset: 36,
                      legendPosition: 'middle',
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: 'Diversity %',
                      legendOffset: -40,
                      legendPosition: 'middle',
                    }}
                    pointSize={10}
                    pointColor={{ theme: 'background' }}
                    pointBorderWidth={2}
                    pointBorderColor={{ from: 'serieColor' }}
                    pointLabelYOffset={-12}
                    useMesh={true}
                    legends={[
                      {
                        anchor: 'bottom',
                        direction: 'row',
                        justify: false,
                        translateX: 0,
                        translateY: 0,
                        itemsSpacing: 0,
                        itemDirection: 'left-to-right',
                        itemWidth: 80,
                        itemHeight: 20,
                        symbolSize: 12,
                        symbolShape: 'circle',
                        symbolBorderColor: 'rgba(0, 0, 0, .5)',
                        effects: [
                          {
                            on: 'hover',
                            style: {
                              itemBackground: 'rgba(0, 0, 0, .03)',
                              itemOpacity: 1,
                            },
                          },
                        ],
                      },
                    ]}
                  />
                </div>
              )}
            </div>

            {/* Question Reuse by Difficulty Chart */}
            <div className="bg-white rounded-2xl shadow-card border border-border-light p-6 min-h-[300px]">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Question Reuse by Difficulty
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Breakdown of question reuse rates by difficulty level. Shows
                which difficulty levels are most reused.
              </p>
              {getQuestionReuseData().length > 0 && (
                <div className="h-64">
                  <ResponsiveBar
                    data={getQuestionReuseData()[0].data}
                    keys={['y']}
                    indexBy="x"
                    margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
                    padding={0.3}
                    valueScale={{ type: 'linear' }}
                    indexScale={{ type: 'band', round: true }}
                    colors={{ scheme: 'nivo' }}
                    borderColor={{
                      from: 'color',
                      modifiers: [['darker', 1.6]],
                    }}
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: 'Difficulty',
                      legendPosition: 'middle',
                      legendOffset: 32,
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: 'Reuse Rate %',
                      legendPosition: 'middle',
                      legendOffset: -40,
                    }}
                    labelSkipWidth={12}
                    labelSkipHeight={12}
                    labelTextColor={{
                      from: 'color',
                      modifiers: [['darker', 1.6]],
                    }}
                    legends={[
                      {
                        dataFrom: 'keys',
                        anchor: 'bottom',
                        direction: 'row',
                        justify: false,
                        translateX: 0,
                        translateY: 0,
                        itemsSpacing: 2,
                        itemWidth: 100,
                        itemHeight: 20,
                        itemDirection: 'left-to-right',
                        itemOpacity: 0.85,
                        symbolSize: 20,
                        effects: [
                          {
                            on: 'hover',
                            style: {
                              itemOpacity: 1,
                            },
                          },
                        ],
                      },
                    ]}
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  description: string;
  trend: 'up' | 'down';
  color: 'blue' | 'green' | 'purple' | 'red' | 'yellow';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  description,
  trend,
  color,
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <div className={`p-2 rounded-full ${colorClasses[color]}`}>
          {trend === 'up' ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-600 mb-3">{subtitle}</div>
      <div className="text-xs text-gray-500">{description}</div>
    </div>
  );
};
