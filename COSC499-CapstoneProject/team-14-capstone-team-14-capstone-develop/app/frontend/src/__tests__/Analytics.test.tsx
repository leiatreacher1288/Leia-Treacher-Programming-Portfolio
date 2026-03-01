// src/__tests__/Analytics.test.tsx
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Analytics } from '../pages/Analytics';
import { AuthProvider } from '../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import { analyticsAPI } from '../api/analyticsAPI';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  GitCompare: () => <div data-testid="git-compare-icon" />,
  BarChart: () => <div data-testid="bar-chart-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Search: () => <div data-testid="search-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  BarChart3: () => <div data-testid="bar-chart-3-icon" />,
  BookOpen: () => <div data-testid="book-open-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  Download: () => <div data-testid="download-icon" />,
  Home: () => <div data-testid="home-icon" />,
  Flag: () => <div data-testid="flag-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  Target: () => <div data-testid="target-icon" />,
  Activity: () => <div data-testid="activity-icon" />,
  Trophy: () => <div data-testid="trophy-icon" />,
  PieChart: () => <div data-testid="pie-chart-icon" />,
  HelpCircle: () => <div data-testid="help-circle-icon" />,
}));

// Mock the analytics API
vi.mock('../api/analyticsAPI', () => ({
  analyticsAPI: {
    searchCourses: vi.fn(),
    getCourseStatistics: vi.fn(),
    getAllCoursesForAnalytics: vi.fn(),
    getInstructorOverview: vi.fn(),
    getQuestionAnalytics: vi.fn(),
    getGradeDistribution: vi.fn(),
    getPerformanceMetrics: vi.fn(),
    getSimilarityFlags: vi.fn(),
    getYearOverYearTrends: vi.fn(),
  },
}));

// Mock the chart components to avoid issues with nivo
vi.mock('../components/Analytics/CourseStatisticsDisplay', () => ({
  CourseStatisticsDisplay: ({ statistics }: any) => (
    <div data-testid="course-statistics-display">
      <h2>{statistics.courseCode}</h2>
      <p>{statistics.courseName}</p>
      <div>Average All Years: {statistics.averageAllYears}%</div>
    </div>
  ),
}));

const mockAnalyticsAPI = vi.mocked(analyticsAPI);

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>{children}</AuthProvider>
  </BrowserRouter>
);

describe('Analytics Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock all analytics API methods with successful responses
    mockAnalyticsAPI.getAllCoursesForAnalytics.mockResolvedValue([]);
    mockAnalyticsAPI.getInstructorOverview.mockResolvedValue({
      overview: {
        total_courses: 5,
        total_students: 150,
        total_exams: 12,
        average_grade: 78.5,
      },
      top_performing_courses: [],
      recent_activity: [],
      grade_trends: [],
    });
    mockAnalyticsAPI.getQuestionAnalytics.mockResolvedValue({
      questionStatistics: [],
      totalQuestions: 0,
      examCount: 0,
      mostMissedPerExam: [],
      mostMissedPerCourse: [],
    });
    mockAnalyticsAPI.getGradeDistribution.mockResolvedValue({
      distribution: [],
      totalResults: 0,
    });
    mockAnalyticsAPI.getPerformanceMetrics.mockResolvedValue({
      mean: 78.5,
      median: 78.0,
      standardDeviation: 12.3,
      skewness: 0.1,
      reliability: 0.85,
      totalResults: 150,
    });
    mockAnalyticsAPI.getSimilarityFlags.mockResolvedValue({
      flags: [],
      totalFlags: 0,
      activeFlags: 0,
      highRiskFlags: 0,
    });
    mockAnalyticsAPI.getYearOverYearTrends.mockResolvedValue({
      trends: [],
      timeframe: 'all',
      totalDataPoints: 0,
    });
  });

  it('renders the analytics page with correct title', async () => {
    render(
      <TestWrapper>
        <Analytics />
      </TestWrapper>
    );

    // Check for the main Analytics title
    expect(screen.getByText('Analytics')).toBeInTheDocument();

    // Check for the Dashboard tab button
    expect(screen.getByText('Dashboard')).toBeInTheDocument();

    // Check for the Refresh button
    expect(screen.getByText('Refresh')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockAnalyticsAPI.getAllCoursesForAnalytics).toHaveBeenCalled();
    });
  });

  it('loads all courses on component mount', async () => {
    const mockAllCourses = [
      {
        id: 1,
        code: 'PHYS 111',
        title: 'General Physics I',
        term: 'Fall 2023',
        description: 'Physics course by Dr. Smith',
      },
      {
        id: 2,
        code: 'MATH 101',
        title: 'Calculus I',
        term: 'Fall 2023',
        description: 'Mathematics course',
      },
    ];

    mockAnalyticsAPI.getAllCoursesForAnalytics.mockResolvedValue(
      mockAllCourses
    );

    render(
      <TestWrapper>
        <Analytics />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockAnalyticsAPI.getAllCoursesForAnalytics).toHaveBeenCalled();
      expect(mockAnalyticsAPI.getInstructorOverview).toHaveBeenCalled();
    });
  });

  it('displays all analytics navigation tabs', async () => {
    render(
      <TestWrapper>
        <Analytics />
      </TestWrapper>
    );

    // Check that all main navigation tabs are present
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Student Reports')).toBeInTheDocument();
    expect(screen.getByText('Compare Courses')).toBeInTheDocument();
    expect(screen.getByText('View Trends')).toBeInTheDocument();
    expect(screen.getByText('Similarity Flags')).toBeInTheDocument();
  });

  it('switches between analytics tabs', async () => {
    render(
      <TestWrapper>
        <Analytics />
      </TestWrapper>
    );

    // Dashboard should be active by default (has primary-btn color)
    const dashboardTab = screen.getByText('Dashboard');
    expect(dashboardTab.closest('button')).toHaveClass('bg-primary-btn');

    // Other tabs should be inactive (gray)
    const studentReportsTab = screen.getByText('Student Reports');
    expect(studentReportsTab.closest('button')).toHaveClass('bg-gray-400');

    // Click on Student Reports tab
    fireEvent.click(studentReportsTab);

    await waitFor(() => {
      // Now Student Reports should be active
      expect(studentReportsTab.closest('button')).toHaveClass('bg-info-btn');
    });
  });

  it('handles refresh button functionality', async () => {
    render(
      <TestWrapper>
        <Analytics />
      </TestWrapper>
    );

    const refreshButton = screen.getByText('Refresh');
    expect(refreshButton).toBeInTheDocument();

    // Click refresh button
    fireEvent.click(refreshButton);

    await waitFor(() => {
      // Should call the analytics APIs again
      expect(mockAnalyticsAPI.getAllCoursesForAnalytics).toHaveBeenCalledTimes(
        2
      ); // Once on mount, once on refresh
    });
  });

  it('displays dashboard section when analytics load successfully', async () => {
    render(
      <TestWrapper>
        <Analytics />
      </TestWrapper>
    );

    // Wait for APIs to be called and component to render without error
    await waitFor(() => {
      expect(mockAnalyticsAPI.getInstructorOverview).toHaveBeenCalled();
      expect(mockAnalyticsAPI.getQuestionAnalytics).toHaveBeenCalled();
      expect(mockAnalyticsAPI.getGradeDistribution).toHaveBeenCalled();
      expect(mockAnalyticsAPI.getPerformanceMetrics).toHaveBeenCalled();
    });

    // Should not show error message when APIs succeed
    expect(
      screen.queryByText(
        'Failed to load analytics data. Please try again later.'
      )
    ).not.toBeInTheDocument();
  });
});
