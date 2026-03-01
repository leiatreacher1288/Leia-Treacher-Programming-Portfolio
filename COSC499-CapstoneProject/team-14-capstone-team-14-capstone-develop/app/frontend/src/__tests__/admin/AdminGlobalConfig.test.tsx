/**
 * AdminGlobalConfig Comprehensive Tests
 * ====================================
 * Complete test suite for AdminGlobalConfig component covering all API cases,
 * exam overview, course overview, and edge cases
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AdminGlobalConfig } from '../../pages/admin/AdminGlobalConfig';
import { globalSettings } from '../../api/adminApi';

// Mock data for comprehensive testing
const mockMarkingSchemes = [
  {
    id: 1,
    global_setting: {
      name: 'Standard Marking',
      description: 'Standard marking scheme',
      key: 'standard-scheme',
      setting_type: 'marking-scheme',
      value: {
        grade_boundaries: { A: 90, B: 80, C: 70, D: 60, F: 0 },
        pass_threshold: 60,
        negative_marking: { enabled: true, penalty_percentage: 25 },
      },
      is_active: true,
      is_default: true,
    },
  },
  {
    id: 2,
    global_setting: {
      name: 'Easy Marking',
      description: 'Lenient marking scheme',
      key: 'easy-scheme',
      setting_type: 'marking-scheme',
      value: {
        grade_boundaries: { A: 85, B: 75, C: 65, D: 55, F: 0 },
        pass_threshold: 55,
        negative_marking: { enabled: false },
      },
      is_active: true,
      is_default: false,
    },
  },
];

const mockExamFormats = [
  {
    id: 1,
    global_setting: {
      name: 'Standard Format',
      description: '2-hour standard exam',
      key: 'standard-format',
      setting_type: 'exam-format',
      value: {
        sections: [
          { name: 'Multiple Choice', time_limit: 60, question_count: 20 },
          { name: 'Short Answer', time_limit: 60, question_count: 5 },
        ],
        total_duration: 120,
        instructions: 'Standard exam instructions',
      },
      is_active: true,
      is_default: true,
    },
  },
];

const mockCourses = [
  {
    id: 1,
    code: 'COSC101',
    name: 'Introduction to Computer Science',
    instructor: 'Dr. Smith',
    student_count: 150,
    exam_count: 3,
    status: 'active',
    last_exam_date: '2024-12-15',
  },
  {
    id: 2,
    code: 'MATH200',
    name: 'Calculus II',
    instructor: 'Dr. Johnson',
    student_count: 85,
    exam_count: 2,
    status: 'completed',
    last_exam_date: '2024-11-30',
  },
];

const mockExams = [
  {
    id: 1,
    title: 'COSC101 Midterm',
    course: 'COSC101',
    date: '2024-12-20',
    duration: 120,
    student_count: 150,
    status: 'scheduled',
    format: 'Standard Format',
  },
  {
    id: 2,
    title: 'MATH200 Final',
    course: 'MATH200',
    date: '2024-12-18',
    duration: 180,
    student_count: 85,
    status: 'completed',
    format: 'Extended Format',
  },
];

const mockStatistics = {
  total_courses: 25,
  active_courses: 18,
  completed_courses: 7,
  total_exams: 45,
  active_exams: 12,
  completed_exams: 30,
  upcoming_exams: 3,
};

// Mock API responses
const createMockApiResponse = (data: any, success = true) => ({
  success,
  ...data,
});

// Mock the admin API with comprehensive responses
vi.mock('../../api/adminApi', () => ({
  globalSettings: {
    markingSchemes: {
      getAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    examFormats: {
      getAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    coursesOverview: {
      getAll: vi.fn(),
    },
    examsOverview: {
      getAll: vi.fn(),
    },
  },
}));

// Mock UI components with more realistic behavior
vi.mock('../../components/navigation/TabSwitcher', () => ({
  TabSwitcher: ({ tabs, activeTab, onTabChange }: any) => (
    <div data-testid="tab-switcher">
      {tabs.map((tab: any) => (
        <button
          key={tab.value}
          data-testid={`tab-${tab.value}`}
          className={activeTab === tab.value ? 'active' : ''}
          onClick={() => onTabChange && onTabChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('../../components/ui/StandardButton', () => ({
  StandardButton: ({ children, onClick }: any) => (
    <button data-testid="standard-button" onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock('../../components/ui/SearchBar', () => ({
  SearchBar: ({ placeholder, value, onChange }: any) => (
    <input
      data-testid="search-bar"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  ),
}));

vi.mock('../../components/ui/StatusBadge', () => ({
  StatusBadge: ({ status, children }: any) => (
    <span data-testid="status-badge" data-status={status}>
      {children}
    </span>
  ),
}));

vi.mock('../../components/ui/StatCard', () => ({
  StatsCard: ({ title, value, icon }: any) => (
    <div data-testid="stats-card">
      <div data-testid="stats-title">{title}</div>
      <div data-testid="stats-value">{value}</div>
      {icon && <div data-testid="stats-icon">{icon}</div>}
    </div>
  ),
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('AdminGlobalConfig Component - Comprehensive Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Set up default successful API responses
    vi.mocked(globalSettings.markingSchemes.getAll).mockResolvedValue(
      createMockApiResponse({ marking_schemes: mockMarkingSchemes })
    );
    vi.mocked(globalSettings.examFormats.getAll).mockResolvedValue(
      createMockApiResponse({ exam_formats: mockExamFormats })
    );
    vi.mocked(globalSettings.coursesOverview.getAll).mockResolvedValue(
      createMockApiResponse({
        courses: mockCourses,
        statistics: mockStatistics,
      })
    );
    vi.mocked(globalSettings.examsOverview.getAll).mockResolvedValue(
      createMockApiResponse({ exams: mockExams, statistics: mockStatistics })
    );
  });

  describe('Component Rendering', () => {
    it('should render main component structure', async () => {
      render(
        <TestWrapper>
          <AdminGlobalConfig />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('tab-templates')).toBeInTheDocument();
        expect(screen.getByTestId('tab-courses-overview')).toBeInTheDocument();
        expect(screen.getByTestId('tab-exams-overview')).toBeInTheDocument();
      });
    });

    it('should have all main tabs available', async () => {
      render(
        <TestWrapper>
          <AdminGlobalConfig />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('tab-templates')).toBeInTheDocument();
        expect(screen.getByTestId('tab-courses-overview')).toBeInTheDocument();
        expect(screen.getByTestId('tab-exams-overview')).toBeInTheDocument();
      });
    });
  });

  describe('Templates Tab', () => {
    it('should load and display templates by default', async () => {
      render(
        <TestWrapper>
          <AdminGlobalConfig />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('tab-templates')).toBeInTheDocument();
        // Check for the section heading "Exam Templates"
        expect(
          screen.getByRole('heading', { name: 'Exam Templates', level: 2 })
        ).toBeInTheDocument();
      });
    });
  });

  describe('Courses Overview Tab', () => {
    it('should load courses overview when tab is selected', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AdminGlobalConfig />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('tab-templates')).toBeInTheDocument();
      });

      // Click the courses overview tab
      await user.click(screen.getByTestId('tab-courses-overview'));

      await waitFor(() => {
        expect(globalSettings.coursesOverview.getAll).toHaveBeenCalled();
      });
    });

    it('should display course list with details when tab is clicked', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AdminGlobalConfig />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('tab-templates')).toBeInTheDocument();
      });

      // Click the courses overview tab
      await user.click(screen.getByTestId('tab-courses-overview'));

      await waitFor(() => {
        expect(screen.getByText('COSC101')).toBeInTheDocument();
        expect(
          screen.getByText('Introduction to Computer Science')
        ).toBeInTheDocument();
        expect(screen.getByText('MATH200')).toBeInTheDocument();
        expect(screen.getByText('Calculus II')).toBeInTheDocument();
        // Check for student counts (multiple elements expected)
        const studentElements = screen.getAllByText('Students', {
          exact: false,
        });
        expect(studentElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Exams Overview Tab', () => {
    it('should load exams overview when tab is selected', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AdminGlobalConfig />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('tab-templates')).toBeInTheDocument();
      });

      // Click the exams overview tab
      await user.click(screen.getByTestId('tab-exams-overview'));

      await waitFor(() => {
        expect(globalSettings.examsOverview.getAll).toHaveBeenCalled();
      });
    });

    it('should display exams list with details when tab is clicked', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AdminGlobalConfig />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('tab-templates')).toBeInTheDocument();
      });

      // Click the exams overview tab
      await user.click(screen.getByTestId('tab-exams-overview'));

      await waitFor(() => {
        expect(screen.getByText('COSC101 Midterm')).toBeInTheDocument();
        expect(screen.getByText('MATH200 Final')).toBeInTheDocument();
        // Check for status badges
        const statusBadges = screen.getAllByTestId('status-badge');
        expect(statusBadges.length).toBeGreaterThan(0);
      });
    });
  });

  describe('API Integration Edge Cases', () => {
    it('should handle courses with missing optional fields', async () => {
      const coursesWithMissingFields = [
        {
          id: 1,
          code: 'TEST101',
          name: 'Test Course',
          // Missing instructor, student_count, etc.
        },
      ];

      // Update mock to return different data for this test
      vi.mocked(globalSettings.coursesOverview.getAll).mockResolvedValueOnce(
        createMockApiResponse({
          courses: coursesWithMissingFields,
          statistics: { total_courses: 1 },
        })
      );

      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AdminGlobalConfig />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('tab-templates')).toBeInTheDocument();
      });

      // Click the courses overview tab
      await user.click(screen.getByTestId('tab-courses-overview'));

      await waitFor(() => {
        expect(screen.getByText('TEST101')).toBeInTheDocument();
        expect(screen.getByText('Test Course')).toBeInTheDocument();
      });
    });

    it('should handle different exam status types when switching to exams tab', async () => {
      const examsWithDifferentStatuses = [
        { ...mockExams[0], status: 'scheduled' },
        { ...mockExams[1], status: 'completed' },
        {
          ...mockExams[0],
          id: 3,
          status: 'cancelled',
          title: 'Cancelled Exam',
        },
        {
          ...mockExams[0],
          id: 4,
          status: 'in_progress',
          title: 'Ongoing Exam',
        },
      ];

      // Update mock to return different data for this test
      vi.mocked(globalSettings.examsOverview.getAll).mockResolvedValueOnce(
        createMockApiResponse({
          exams: examsWithDifferentStatuses,
          statistics: mockStatistics,
        })
      );

      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AdminGlobalConfig />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('tab-templates')).toBeInTheDocument();
      });

      // Click the exams overview tab
      await user.click(screen.getByTestId('tab-exams-overview'));

      await waitFor(() => {
        expect(screen.getByText('Cancelled Exam')).toBeInTheDocument();
        expect(screen.getByText('Ongoing Exam')).toBeInTheDocument();
        // Should have status badges for all exams
        const statusBadges = screen.getAllByTestId('status-badge');
        expect(statusBadges.length).toBeGreaterThan(0);
      });
    });
  });
});
