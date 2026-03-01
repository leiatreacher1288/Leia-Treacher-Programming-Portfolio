import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  BookOpen,
  TrendingUp,
  Trophy,
  Target,
  AlertTriangle,
  BarChart3,
  PieChart,
  Activity,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveScatterPlot } from '@nivo/scatterplot';
import { analyticsAPI, type InstructorOverview } from '../../api/analyticsAPI';

interface QuestionStatistics {
  questionNumber: number;
  difficulty: number;
  discrimination: number;
  pointBiserial: number;
  missedCount: number;
  correctPercent: number;
  averageTime: number;
  examId: number;
  examTitle?: string;
}

interface GradeDistribution {
  range: string;
  count: number;
  percentage: number;
}

interface PerformanceMetrics {
  mean: number;
  median: number;
  standardDeviation: number;
  skewness: number;
  reliability: number;
}

interface SimilarityFlag {
  id: number;
  type: 'high' | 'medium' | 'low';
  course: string;
  exam: string;
  studentPair: {
    student1: { name: string; id: string };
    student2: { name: string; id: string };
  };
  similarityScore: number;
  flaggedQuestions: number[];
  dateDetected: string;
  status: 'pending' | 'reviewed' | 'dismissed' | 'confirmed';
  reviewer?: string;
  notes?: string;
}

interface MostMissedQuestion {
  examId?: number; // Make optional since the API might not return this
  examTitle?: string; // Make optional since the API might not return this
  courseCode: string;
  courseName: string;
  questionId: string | number;
  questionNumber: string | number;
  questionText: string;
  missedCount: number;
  totalAttempts: number;
  missRate: number;
}

interface AnalyticsData {
  questionStats: QuestionStatistics[];
  gradeDistribution: GradeDistribution[];
  performanceMetrics: PerformanceMetrics;
  similarityFlags: SimilarityFlag[];
  yearOverYearTrends: Array<{
    year: number;
    term: string;
    average: number;
    count: number;
    isFuture?: boolean;
  }>;
  mostMissedPerExam: MostMissedQuestion[];
}

interface ExamForDropdown {
  examId: number;
  examTitle: string;
  courseCode: string;
}

interface DashboardSectionProps {
  refreshTrigger?: number;
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({
  refreshTrigger,
}) => {
  const [instructorData, setInstructorData] =
    useState<InstructorOverview | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1year');

  // New state for exam selection in difficulty chart
  const [availableExams, setAvailableExams] = useState<ExamForDropdown[]>([]);
  const [selectedExamForDifficulty, setSelectedExamForDifficulty] =
    useState<string>('all');
  const [filteredQuestionStats, setFilteredQuestionStats] = useState<
    QuestionStatistics[]
  >([]);

  const fetchAnalyticsData = useCallback(async (): Promise<AnalyticsData> => {
    try {
      console.log('=== FETCHING ANALYTICS DATA ===');

      // Fetch real data from APIs
      const [
        questionData,
        gradeDistData,
        performanceData,
        similarityData,
        trendsData,
      ] = await Promise.all([
        analyticsAPI.getQuestionAnalytics(),
        analyticsAPI.getGradeDistribution(),
        analyticsAPI.getPerformanceMetrics(),
        analyticsAPI.getSimilarityFlags(),
        analyticsAPI.getYearOverYearTrends(selectedTimeframe),
      ]);

      console.log('Question analytics response:', questionData);
      console.log('Most missed per exam:', questionData.mostMissedPerExam);
      console.log('Most missed per course:', questionData.mostMissedPerCourse);

      return {
        questionStats: questionData.questionStatistics || [],
        gradeDistribution: gradeDistData.distribution || [],
        performanceMetrics: performanceData || {
          mean: 0,
          median: 0,
          standardDeviation: 0,
          skewness: 0,
          reliability: 0,
        },
        similarityFlags: similarityData.flags || [],
        yearOverYearTrends: trendsData.trends || [],
        mostMissedPerExam: questionData.mostMissedPerCourse || [], // Use mostMissedPerCourse instead of mostMissedPerExam
      };
    } catch (error) {
      console.error('Failed to fetch analytics data from APIs:', error);
      throw error;
    }
  }, [selectedTimeframe]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch instructor overview
      const instructorOverview = await analyticsAPI.getInstructorOverview();
      setInstructorData(instructorOverview);

      // Fetch comprehensive analytics data
      const analytics = await fetchAnalyticsData();
      setAnalyticsData(analytics);

      // Extract unique exams from mostMissedPerExam data
      if (
        analytics.mostMissedPerExam &&
        analytics.mostMissedPerExam.length > 0
      ) {
        const uniqueExams = Array.from(
          new Map(
            analytics.mostMissedPerExam
              .filter((item) => item.courseCode != null) // Filter out items with null courseCode
              .map((item) => [
                item.examId || item.courseCode, // Use examId if available, otherwise use courseCode
                {
                  examId:
                    item.examId ||
                    parseInt(item.courseCode.replace(/\D/g, '')) ||
                    0, // Generate a numeric ID if examId is not available
                  examTitle:
                    item.examTitle || item.courseName || 'Unknown Exam',
                  courseCode: item.courseCode || 'Unknown Course',
                },
              ])
          ).values()
        );
        setAvailableExams(uniqueExams);
        console.log('Available exams for dropdown:', uniqueExams);
      } else {
        console.log('No most missed exam data available for dropdown');
        setAvailableExams([]);
      }

      // Set initial filtered stats
      setFilteredQuestionStats(analytics.questionStats);
    } catch (err) {
      console.error('Failed to fetch analytics data:', err);
      setError('Failed to load analytics data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [fetchAnalyticsData]);

  // Filter question stats when exam selection changes
  useEffect(() => {
    if (!analyticsData) return;

    console.log('Raw question stats:', analyticsData.questionStats);
    console.log('First question structure:', analyticsData.questionStats[0]);

    if (selectedExamForDifficulty === 'all') {
      setFilteredQuestionStats(analyticsData.questionStats);
      console.log(
        'Showing all question stats:',
        analyticsData.questionStats.length
      );
    } else {
      // Try different possible field names for exam ID
      const filtered = analyticsData.questionStats.filter((q) => {
        console.log('Checking question:', q);
        console.log('q.examId:', q.examId);
        console.log('q.exam_id:', (q as any).exam_id);
        console.log('q.exam:', (q as any).exam);
        console.log('q.examId:', (q as any).examId);

        return (
          q.examId === parseInt(selectedExamForDifficulty) ||
          (q as any).exam_id === parseInt(selectedExamForDifficulty) ||
          (q as any).exam === parseInt(selectedExamForDifficulty) ||
          (q as any).examId === parseInt(selectedExamForDifficulty)
        );
      });
      setFilteredQuestionStats(filtered);

      // Debug logging
      const selectedExam = availableExams.find(
        (e) => e.examId.toString() === selectedExamForDifficulty
      );
      console.log(
        `Filtered questions for ${selectedExam?.examTitle}:`,
        filtered.length
      );
      console.log('Filtered question details:', filtered);

      // Check if we're getting all expected questions
      if (filtered.length < 5) {
        console.warn(
          'Only found',
          filtered.length,
          'questions for exam',
          selectedExamForDifficulty
        );
        console.log(
          'All question stats examIds:',
          analyticsData.questionStats.map((q) => q.examId)
        );
      }
    }
  }, [selectedExamForDifficulty, analyticsData, availableExams]);

  // Initial load and when timeframe changes
  useEffect(() => {
    fetchData();
  }, [selectedTimeframe, fetchData]);

  // Refresh when parent triggers it
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchData();
    }
  }, [refreshTrigger, fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-btn border-t-transparent mr-3"></div>
        <span className="text-gray-600">Loading analytics data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center">
          <AlertTriangle className="text-red-600 mr-3" size={20} />
          <span className="text-red-800">{error}</span>
        </div>
      </div>
    );
  }

  if (!instructorData || !analyticsData) {
    return (
      <div className="text-center py-20">
        <span className="text-gray-600">No analytics data available.</span>
      </div>
    );
  }

  const { overview, top_performing_courses, recent_activity } = instructorData;

  // Additional safety check for overview data
  if (!overview) {
    return (
      <div className="text-center py-20">
        <span className="text-gray-600">Overview data not available.</span>
      </div>
    );
  }

  // Check for empty data state
  if (
    overview.total_courses === 0 &&
    overview.total_students === 0 &&
    overview.total_exams === 0 &&
    top_performing_courses.length === 0 &&
    recent_activity.length === 0
  ) {
    return (
      <div className="bg-gray-50 rounded-xl p-8 text-center">
        <BookOpen className="text-gray-400 mx-auto mb-4" size={48} />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          No Data Available
        </h3>
        <p className="text-gray-600">
          Start by creating courses and exams to see analytics data here.
        </p>
      </div>
    );
  }

  const {
    questionStats,
    gradeDistribution,
    performanceMetrics,
    similarityFlags,
    yearOverYearTrends,
    mostMissedPerExam,
  } = analyticsData;

  // Prepare data for Most Missed Questions chart
  const mostMissedQuestionsData =
    mostMissedPerExam && mostMissedPerExam.length > 0
      ? mostMissedPerExam.map((item) => ({
          exam: item.examTitle || item.courseName || 'Unknown Exam',
          missed: item.missedCount,
          missRate: item.missRate,
          questionText: item.questionText,
          questionNumber: item.questionNumber,
          totalAttempts: item.totalAttempts,
          color: '#ef4444',
        }))
      : [];

  const gradeDistributionData =
    gradeDistribution && gradeDistribution.length > 0
      ? gradeDistribution.map((g) => ({
          id: g.range,
          label: g.range,
          value: g.count,
          percentage: g.percentage,
        }))
      : [];

  // Prepare data for difficulty vs discrimination - restructure for proper coloring
  const difficultyDiscriminationData = [];

  if (filteredQuestionStats && filteredQuestionStats.length > 0) {
    // Group questions by quality type
    const excellent: any[] = [];
    const good: any[] = [];
    const fair: any[] = [];
    const tooEasyHard: any[] = [];
    const poor: any[] = [];

    filteredQuestionStats.forEach((q) => {
      const point = {
        x: q.difficulty,
        y: q.discrimination,
        questionNumber: q.questionNumber,
        pointBiserial: q.pointBiserial,
      };

      if (q.discrimination < 0) {
        poor.push(point);
      } else if (q.difficulty < 0.2 && q.discrimination < 0.3) {
        tooEasyHard.push(point);
      } else if (q.difficulty > 0.8 && q.discrimination < 0.3) {
        tooEasyHard.push(point);
      } else if (
        q.discrimination >= 0.3 &&
        q.difficulty >= 0.3 &&
        q.difficulty <= 0.7
      ) {
        excellent.push(point);
      } else if (q.discrimination >= 0.2) {
        good.push(point);
      } else {
        fair.push(point);
      }
    });

    // Add each group as a separate series
    if (excellent.length > 0) {
      difficultyDiscriminationData.push({ id: 'Excellent', data: excellent });
    }
    if (good.length > 0) {
      difficultyDiscriminationData.push({ id: 'Good', data: good });
    }
    if (fair.length > 0) {
      difficultyDiscriminationData.push({ id: 'Fair', data: fair });
    }
    if (tooEasyHard.length > 0) {
      difficultyDiscriminationData.push({
        id: 'Too Easy/Hard',
        data: tooEasyHard,
      });
    }
    if (poor.length > 0) {
      difficultyDiscriminationData.push({ id: 'Poor', data: poor });
    }
  }

  // Prepare year over year data - filter out null values for line chart
  const yearOverYearData = [
    {
      id: 'Performance',
      color: '#3b82f6',
      data: yearOverYearTrends
        ? yearOverYearTrends
            .filter(
              (trend) => trend.average !== null && trend.average !== undefined
            )
            .map((trend) => ({
              x: trend.term,
              y: trend.average,
            }))
        : [],
    },
  ];

  // Custom tooltip for scatter plot
  const CustomScatterTooltip = ({ node }: any) => {
    const difficulty = node.data.x;
    const discrimination = node.data.y;
    const questionNum = node.data.questionNumber;

    // Add null checks and fallbacks
    if (difficulty === undefined || discrimination === undefined) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-sm">
          <div className="font-semibold text-gray-900 mb-2">
            Question {questionNum || 'Unknown'}
          </div>
          <div className="text-sm text-gray-600">
            Data not available for this question
          </div>
        </div>
      );
    }

    // Interpret the values
    const getDifficultyInterpretation = (val: number) => {
      // Convert to percentage for display
      const percent = val * 100;
      if (percent < 20) return 'Very Easy';
      if (percent < 40) return 'Easy';
      if (percent < 60) return 'Moderate';
      if (percent < 80) return 'Hard';
      return 'Very Hard';
    };

    const getDiscriminationInterpretation = (val: number) => {
      if (val < 0) return "Poor - Negative discrimination (something's wrong)";
      if (val < 0.2) return "Weak - Doesn't differentiate students well";
      if (val < 0.3) return 'Acceptable - Some differentiation';
      if (val < 0.4) return 'Good - Differentiates well';
      return 'Excellent - Strong differentiation';
    };

    const getQuestionQuality = (diff: number, disc: number) => {
      // Question quality based on educational assessment best practices
      if (disc < 0)
        return {
          quality: 'Poor',
          color: '#ef4444',
          advice:
            'Question may be flawed or confusing - high performers do worse!',
        };
      if (diff < 0.2 && disc < 0.3)
        return {
          quality: 'Too Easy',
          color: '#f59e0b',
          advice: 'Almost everyone gets it right - not useful for assessment',
        };
      if (diff > 0.8 && disc < 0.3)
        return {
          quality: 'Too Hard',
          color: '#f59e0b',
          advice: 'Almost everyone gets it wrong - not useful for assessment',
        };
      if (disc >= 0.3 && diff >= 0.3 && diff <= 0.7)
        return {
          quality: 'Excellent',
          color: '#10b981',
          advice: 'Well-balanced - good difficulty with strong discrimination',
        };
      if (disc >= 0.2)
        return {
          quality: 'Good',
          color: '#3b82f6',
          advice: 'Acceptable for use',
        };
      return {
        quality: 'Fair',
        color: '#6b7280',
        advice: 'Consider revising for better discrimination',
      };
    };

    const quality = getQuestionQuality(difficulty, discrimination);
    const difficultyPercent = (difficulty * 100).toFixed(0);

    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-sm">
        <div className="font-semibold text-gray-900 mb-2">
          Question {questionNum || 'Unknown'}
        </div>

        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium text-gray-700">Difficulty:</span>
            <div className="text-gray-600">
              {difficultyPercent}% got it wrong
            </div>
            <div className="text-gray-500 text-xs">
              {getDifficultyInterpretation(difficulty)} difficulty
            </div>
          </div>

          <div>
            <span className="font-medium text-gray-700">Discrimination:</span>
            <div className="text-gray-600">{discrimination.toFixed(2)}</div>
            <div className="text-gray-500 text-xs">
              {getDiscriminationInterpretation(discrimination)}
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">Assessment:</span>
              <span
                className={`px-2 py-1 rounded text-xs font-medium text-white`}
                style={{ backgroundColor: quality.color }}
              >
                {quality.quality}
              </span>
            </div>
            <div className="text-gray-500 text-xs mt-1">{quality.advice}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Timeframe Selector */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Analytics Overview
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Comprehensive performance data across all your courses
          </p>
        </div>
        <div className="flex space-x-2">
          {(
            [
              { value: 'all', label: 'All Time' },
              { value: '1year', label: 'Past Year' },
              { value: '1month', label: 'Past Month' },
              { value: '1week', label: 'Past Week' },
            ] as const
          ).map((timeframe) => (
            <button
              key={timeframe.value}
              onClick={() => setSelectedTimeframe(timeframe.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedTimeframe === timeframe.value
                  ? 'bg-primary-btn text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {timeframe.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900">
                {overview.total_courses}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <BookOpen className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Students
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {overview.total_students}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Exams</p>
              <p className="text-2xl font-bold text-gray-900">
                {overview.total_exams}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Target className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Average Grade (All Courses)
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {overview.average_grade.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <TrendingUp className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="text-blue-600 mr-2" size={20} />
            Total Performance Metrics
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Mean Score:</span>
              <span className="font-semibold">
                {performanceMetrics.mean.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Median Score:</span>
              <span className="font-semibold">
                {performanceMetrics.median.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Std Deviation:</span>
              <span className="font-semibold">
                {performanceMetrics.standardDeviation.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Reliability:</span>
              <span className="font-semibold">
                {performanceMetrics.reliability.toFixed(3)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="text-red-600 mr-2" size={20} />
            Total Similarity Flags
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Pending Review:</span>
              <span className="font-semibold text-red-600">
                {similarityFlags.filter((f) => f.status === 'pending').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Under Review:</span>
              <span className="font-semibold text-yellow-600">
                {similarityFlags.filter((f) => f.status === 'reviewed').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Dismissed:</span>
              <span className="font-semibold text-green-600">
                {similarityFlags.filter((f) => f.status === 'dismissed').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Confirmed Violations:</span>
              <span className="font-semibold text-purple-600">
                {similarityFlags.filter((f) => f.status === 'confirmed').length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Trophy className="text-yellow-600 mr-2" size={20} />
            Top Performing Course
          </h3>
          {top_performing_courses.length > 0 ? (
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-gray-900">
                  {top_performing_courses[0].code}
                </p>
                <p className="text-sm text-gray-600">
                  {top_performing_courses[0].name}
                </p>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Average Score:</span>
                <span className="font-semibold">
                  {top_performing_courses[0].avg_score.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Students:</span>
                <span className="font-semibold">
                  {top_performing_courses[0].student_count}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No course data available</p>
          )}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Missed Questions Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="text-red-600 mr-2" size={20} />
            Most Missed Questions (Recent Exams)
          </h3>
          <div style={{ height: '300px' }}>
            {mostMissedQuestionsData.length > 0 ? (
              <ResponsiveBar
                data={mostMissedQuestionsData}
                keys={['missed']}
                indexBy="exam"
                margin={{ top: 20, right: 30, bottom: 80, left: 60 }}
                padding={0.3}
                valueScale={{ type: 'linear' }}
                indexScale={{ type: 'band', round: true }}
                colors={{ datum: 'data.color' }}
                borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -45,
                  legend: 'Exam',
                  legendPosition: 'middle',
                  legendOffset: 65,
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Number of Students Wrong',
                  legendPosition: 'middle',
                  legendOffset: -50,
                  format: (d) => (Number.isInteger(d) ? d : ''),
                }}
                labelSkipWidth={12}
                labelSkipHeight={12}
                labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                animate={true}
                tooltip={({ data }) => (
                  <div
                    style={{
                      padding: 12,
                      background: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    <strong>{data.exam}</strong>
                    <br />
                    <div style={{ marginTop: '8px' }}>
                      <strong>Question:</strong> {data.questionText}
                    </div>
                    <div style={{ marginTop: '4px' }}>
                      <strong>Students who missed:</strong> {data.missed} /{' '}
                      {data.totalAttempts} ({data.missRate}%)
                    </div>
                  </div>
                )}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <BarChart3 className="text-gray-300 mx-auto mb-3" size={48} />
                  <p>No exam results data available</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Results will appear here after students complete exams
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Grade Distribution Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <PieChart className="text-green-600 mr-2" size={20} />
            Total Grade Distribution
          </h3>
          <div style={{ height: '300px' }}>
            {gradeDistributionData.length > 0 ? (
              <ResponsivePie
                data={gradeDistributionData}
                margin={{ top: 20, right: 80, bottom: 80, left: 80 }}
                innerRadius={0.5}
                padAngle={0.7}
                cornerRadius={3}
                activeOuterRadiusOffset={8}
                borderWidth={1}
                borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                arcLinkLabelsSkipAngle={10}
                arcLinkLabelsTextColor="#333333"
                arcLinkLabelsThickness={2}
                arcLinkLabelsColor={{ from: 'color' }}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor={{
                  from: 'color',
                  modifiers: [['darker', 2]],
                }}
                colors={{ scheme: 'category10' }}
                animate={true}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No grade distribution data available
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Difficulty vs Discrimination Scatter Plot */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Difficulty vs Discrimination Analysis
            </h3>
            <div className="flex items-center gap-2">
              {/* Exam Selector */}
              {availableExams.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedExamForDifficulty}
                    onChange={(e) =>
                      setSelectedExamForDifficulty(e.target.value)
                    }
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-1.5 pr-8 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-btn focus:border-transparent"
                  >
                    <option value="all">All Exam Results</option>
                    {availableExams.map((exam) => (
                      <option
                        key={exam.examId}
                        value={exam.examId?.toString() || 'unknown'}
                      >
                        {exam.courseCode} - {exam.examTitle} Results
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                    size={14}
                  />
                </div>
              )}

              <div className="relative group">
                <HelpCircle
                  className="text-gray-400 hover:text-gray-600 transition-colors cursor-help"
                  size={20}
                />

                {/* Info tooltip on hover - positioned above */}
                <div className="absolute z-10 w-96 p-4 bg-white rounded-lg shadow-xl border border-gray-200 -right-2 bottom-8 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200">
                  <div className="font-semibold text-gray-900 mb-3">
                    Understanding This Chart
                  </div>

                  <div className="space-y-3 text-sm text-gray-700">
                    <div>
                      <div className="font-medium text-gray-800">
                        What This Chart Shows:
                      </div>
                      <p className="text-gray-600">
                        Each dot represents a question from{' '}
                        {selectedExamForDifficulty === 'all'
                          ? 'all your exam results'
                          : 'the selected exam results'}
                        . The position shows how difficult it was and how well
                        it separated strong from weak students.
                      </p>
                    </div>

                    <div>
                      <div className="font-medium text-gray-800">
                        Difficulty (X-axis):
                      </div>
                      <p className="text-gray-600">
                        The percentage of students who got the question wrong.
                        <br />• 0% = Everyone got it right (too easy)
                        <br />• 50% = Half got it wrong (moderate)
                        <br />• 100% = Everyone got it wrong (too hard)
                      </p>
                    </div>

                    <div>
                      <div className="font-medium text-gray-800">
                        Discrimination (Y-axis):
                      </div>
                      <p className="text-gray-600">
                        How well the question separates students who did well on
                        the exam from those who didn't.
                        <br />• 0 = No discrimination
                        <br />• 0.3+ = Good discrimination
                        <br />• Negative = Problem (weak students did better!)
                      </p>
                    </div>

                    <div className="pt-2 border-t border-gray-200">
                      <div className="font-medium text-gray-800 mb-2">
                        The Green Box:
                      </div>
                      <p className="text-gray-600">
                        Shows the "sweet spot" for questions - moderate
                        difficulty (30-70% got it wrong) with good
                        discrimination. Questions here are ideal for assessment.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-gray-200">
                      <div className="font-medium text-gray-800 mb-2">
                        What to Look For:
                      </div>
                      <ul className="space-y-1 text-gray-600">
                        <li>
                          •{' '}
                          <span className="font-medium">
                            Dots in the green box:
                          </span>{' '}
                          Keep these questions!
                        </li>
                        <li>
                          • <span className="font-medium">Dots below 0:</span>{' '}
                          Fix or remove these
                        </li>
                        <li>
                          •{' '}
                          <span className="font-medium">Dots in corners:</span>{' '}
                          Too easy or too hard
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ height: '300px' }}>
            {difficultyDiscriminationData.length > 0 ? (
              <ResponsiveScatterPlot
                data={difficultyDiscriminationData}
                margin={{ top: 20, right: 30, bottom: 50, left: 60 }}
                xScale={{ type: 'linear', min: 0, max: 1 }}
                yScale={{ type: 'linear', min: -0.2, max: 1 }}
                blendMode="multiply"
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Difficulty (% of students who got it wrong)',
                  legendPosition: 'middle',
                  legendOffset: 40,
                  format: (v: number) => `${(v * 100).toFixed(0)}%`,
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Discrimination Index',
                  legendPosition: 'middle',
                  legendOffset: -45,
                }}
                colors={['#000000']}
                nodeSize={10}
                animate={true}
                tooltip={CustomScatterTooltip}
                enableGridX={true}
                enableGridY={true}
                gridXValues={[0, 0.25, 0.5, 0.75, 1]}
                gridYValues={[0, 0.2, 0.3, 0.4, 0.6, 0.8, 1]}
                layers={[
                  'grid',
                  'axes',
                  ({ xScale, yScale, innerWidth, innerHeight }: any) => (
                    <>
                      {/* Ideal zone box */}
                      <rect
                        x={xScale(0.3)}
                        y={yScale(1)}
                        width={xScale(0.7) - xScale(0.3)}
                        height={yScale(0.3) - yScale(1)}
                        fill="green"
                        fillOpacity={0.05}
                        stroke="green"
                        strokeWidth={1}
                        strokeDasharray="4,4"
                        strokeOpacity={0.3}
                      />
                      {/* Minimum acceptable discrimination line */}
                      <line
                        x1={0}
                        y1={yScale(0.2)}
                        x2={innerWidth}
                        y2={yScale(0.2)}
                        stroke="#ef4444"
                        strokeWidth={1}
                        strokeDasharray="2,2"
                        strokeOpacity={0.5}
                      />
                      {/* Zero discrimination line */}
                      <line
                        x1={0}
                        y1={yScale(0)}
                        x2={innerWidth}
                        y2={yScale(0)}
                        stroke="#ef4444"
                        strokeWidth={2}
                        strokeOpacity={0.5}
                      />
                    </>
                  ),
                  'nodes',
                  'annotations',
                ]}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <p>No difficulty analysis data available</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Data will appear here after students complete exams
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Year-over-Year Performance Trends */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="text-blue-600 mr-2" size={20} />
            Overall Performance Trend
          </h3>
          <div style={{ height: '300px' }}>
            {yearOverYearData[0].data.length > 0 ? (
              <ResponsiveLine
                data={yearOverYearData}
                margin={{ top: 20, right: 30, bottom: 50, left: 60 }}
                xScale={{ type: 'point' }}
                yScale={{
                  type: 'linear',
                  min: 0,
                  max: 100,
                  stacked: false,
                  reverse: false,
                }}
                yFormat=" >-.2f"
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -45,
                  legend: 'Period',
                  legendPosition: 'middle',
                  legendOffset: 40,
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Average Score (%)',
                  legendPosition: 'middle',
                  legendOffset: -45,
                }}
                pointSize={10}
                pointColor={{ theme: 'background' }}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor' }}
                pointLabelYOffset={-12}
                useMesh={true}
                animate={true}
                enableGridX={true}
                enableGridY={true}
                curve="monotoneX"
                enablePoints={true}
                enableArea={yearOverYearData[0].data.length === 1}
                areaOpacity={0.1}
                colors={
                  yearOverYearData[0].data.length === 1
                    ? ['#3b82f6']
                    : undefined
                }
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No trend data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSection;
