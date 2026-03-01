// Before all imports, dynamically mock the analytics data module
vi.doMock('../../../mock/mockAnalyticsData', () => ({
  USE_MOCK_DATA: false, // Disable mock data for tests
  mockInstructorOverview: vi.fn(),
  mockQuestionAnalytics: vi.fn(),
  mockGradeDistribution: vi.fn(),
  mockPerformanceMetrics: vi.fn(),
}));

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DashboardSection } from '../DashboardSection';
import { analyticsAPI } from '../../../api/analyticsAPI';

// Mock the analytics API
vi.mock('../../../api/analyticsAPI', () => ({
  analyticsAPI: {
    getInstructorOverview: vi.fn(),
    getQuestionAnalytics: vi.fn(),
    getGradeDistribution: vi.fn(),
    getPerformanceMetrics: vi.fn(),
    getSimilarityFlags: vi.fn(),
    getYearOverYearTrends: vi.fn(),
    getAllCoursesForAnalytics: vi.fn(),
    getCourseStatistics: vi.fn(),
  },
}));

// Mock react-icons
vi.mock('react-icons/fa', () => ({
  FaChartLine: () => <div data-testid="chart-icon">ChartIcon</div>,
  FaUsers: () => <div data-testid="users-icon">UsersIcon</div>,
  FaGraduationCap: () => <div data-testid="graduation-icon">GradIcon</div>,
  FaClipboardList: () => <div data-testid="clipboard-icon">ClipboardIcon</div>,
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  BookOpen: () => <div data-testid="book-open-icon">BookOpenIcon</div>,
  BarChart3: () => <div data-testid="bar-chart-icon">BarChartIcon</div>,
  PieChart: () => <div data-testid="pie-chart-icon">PieChartIcon</div>,
  TrendingUp: () => <div data-testid="trending-up-icon">TrendingUpIcon</div>,
  Users: () => <div data-testid="users-icon">UsersIcon</div>,
  Calendar: () => <div data-testid="calendar-icon">CalendarIcon</div>,
  ChevronDown: () => <div data-testid="chevron-down-icon">ChevronDownIcon</div>,
  Trophy: () => <div data-testid="trophy-icon">TrophyIcon</div>,
  Clock: () => <div data-testid="clock-icon">ClockIcon</div>,
  Target: () => <div data-testid="target-icon">TargetIcon</div>,
  HelpCircle: () => <div data-testid="help-circle-icon">HelpCircleIcon</div>,
  AlertTriangle: () => (
    <div data-testid="alert-triangle-icon">AlertTriangleIcon</div>
  ),
  Activity: () => <div data-testid="activity-icon">ActivityIcon</div>,
  CheckCircle2: () => (
    <div data-testid="check-circle-2-icon">CheckCircle2Icon</div>
  ),
}));

describe('DashboardSection', () => {
  const mockInstructorData = {
    overview: {
      total_courses: 5,
      total_students: 150,
      total_exams: 12,
      average_grade: 82.5,
    },
    top_performing_courses: [
      {
        id: 1,
        code: 'MATH 101',
        name: 'Calculus I',
        avg_score: 85.2,
        student_count: 45,
        exam_count: 3,
      },
    ],
    recent_activity: [
      {
        type: 'exam' as const,
        action: 'Created new exam',
        course: 'MATH 101',
        date: '2024-01-15',
        relative_date: '2 hours ago',
      },
    ],
    grade_trends: [
      {
        month: 'Jan',
        average: 78.5,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful API responses
    vi.mocked(analyticsAPI.getInstructorOverview).mockResolvedValue(
      mockInstructorData
    );
    vi.mocked(analyticsAPI.getQuestionAnalytics).mockResolvedValue({
      questionStatistics: [],
      totalQuestions: 50,
      examCount: 5,
      mostMissedPerExam: [],
      mostMissedPerCourse: [],
    });
    vi.mocked(analyticsAPI.getGradeDistribution).mockResolvedValue({
      distribution: [],
      totalResults: 100,
    });
    vi.mocked(analyticsAPI.getPerformanceMetrics).mockResolvedValue({
      mean: 74.2,
      median: 76.5,
      standardDeviation: 12.8,
      skewness: 0.2,
      reliability: 0.847,
      totalResults: 100,
    });
    vi.mocked(analyticsAPI.getSimilarityFlags).mockResolvedValue({
      flags: [],
      totalFlags: 0,
      activeFlags: 0,
      highRiskFlags: 0,
    });
    vi.mocked(analyticsAPI.getYearOverYearTrends).mockResolvedValue({
      trends: [],
      timeframe: 'yearly',
      totalDataPoints: 0,
    });
  });

  it('renders loading state initially', () => {
    render(<DashboardSection />);

    expect(screen.getByText('Loading analytics data...')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    vi.mocked(analyticsAPI.getInstructorOverview).mockRejectedValue(
      new Error('API Error')
    );

    render(<DashboardSection />);

    await waitFor(() => {
      expect(
        screen.getByText(
          'Failed to load analytics data. Please try again later.'
        )
      ).toBeInTheDocument();
    });
  });

  it('displays error state when API calls fail', async () => {
    vi.mocked(analyticsAPI.getInstructorOverview).mockRejectedValue(
      new Error('Network error')
    );

    render(<DashboardSection />);

    await waitFor(() => {
      expect(
        screen.getByText(
          'Failed to load analytics data. Please try again later.'
        )
      ).toBeInTheDocument();
    });
  });

  it('shows loading spinner during data fetch', () => {
    render(<DashboardSection />);

    expect(screen.getByText('Loading analytics data...')).toBeInTheDocument();
  });

  it('handles missing API responses', async () => {
    vi.mocked(analyticsAPI.getInstructorOverview).mockResolvedValue(
      undefined as any
    );

    render(<DashboardSection />);

    await waitFor(() => {
      expect(
        screen.getByText('No analytics data available.')
      ).toBeInTheDocument();
    });
  });
});
