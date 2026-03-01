// src/components/Analytics/__tests__/CourseDataInsights.test.tsx
import { render, screen, within } from '@testing-library/react';
import { vi } from 'vitest';
import { CourseDataInsights } from '../CourseDataInsights';
import type { Course } from '../../../types/course';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  BarChartBig: ({ size }: { size?: number }) => (
    <svg data-testid="bar-chart-big-icon" width={size} height={size}>
      <rect width="100%" height="100%" />
    </svg>
  ),
  TrendingUp: ({ className, size }: { className?: string; size?: number }) => (
    <svg
      data-testid="trending-up-icon"
      className={className}
      width={size}
      height={size}
    >
      <rect width="100%" height="100%" />
    </svg>
  ),
  XCircle: ({ className, size }: { className?: string; size?: number }) => (
    <svg
      data-testid="x-circle-icon"
      className={className}
      width={size}
      height={size}
    >
      <rect width="100%" height="100%" />
    </svg>
  ),
  Info: ({ className, size }: { className?: string; size?: number }) => (
    <svg
      data-testid="info-icon"
      className={className}
      width={size}
      height={size}
    >
      <rect width="100%" height="100%" />
    </svg>
  ),
  CircleDot: ({ className, size }: { className?: string; size?: number }) => (
    <svg
      data-testid="circle-dot-icon"
      className={className}
      width={size}
      height={size}
    >
      <rect width="100%" height="100%" />
    </svg>
  ),
  Users: ({ size, className }: { size?: number; className?: string }) => (
    <svg
      data-testid="users-icon"
      className={className}
      width={size}
      height={size}
    >
      <rect width="100%" height="100%" />
    </svg>
  ),
  BookText: ({ size, className }: { size?: number; className?: string }) => (
    <svg
      data-testid="book-text-icon"
      className={className}
      width={size}
      height={size}
    >
      <rect width="100%" height="100%" />
    </svg>
  ),
}));

// Mock the child components
vi.mock('../DataInsightCard', () => ({
  DataInsightCard: ({
    title,
    value,
    subtitle,
    subDetail,
    'data-testid': dataTestId,
  }: {
    title: string;
    value: string;
    subtitle: string;
    subDetail?: string;
    'data-testid'?: string;
  }) => (
    <div data-testid={dataTestId || 'data-insight-card'}>
      <h3>{title}</h3>
      <div>{value}</div>
      <div>{subtitle}</div>
      {subDetail && <div>{subDetail}</div>}
    </div>
  ),
}));

vi.mock('../../cards/SectionTitle', () => ({
  SectionTitle: ({ title }: { title: string }) => (
    <h2 data-testid="section-title">{title}</h2>
  ),
}));

const mockCourse: Course = {
  id: 1,
  code: 'CS101',
  title: 'Introduction to Computer Science',
  description: 'Basic computer science concepts',
  term: 'W1 2025',
  bannerURL: undefined,
  exams: 3,
  students: 25,
  avgScore: 82,
  lastEdited: '2025-01-15',
  created_at: '2025-07-01T00:00:00Z',
  updated_at: '2025-07-12T12:34:00Z',
  instructor: 'Prof. Smith',
  default_sec_access: 'FULL',
  default_ta_access: 'LIMITED',
  default_oth_access: 'NONE',
};

const mockCourseNoExams: Course = {
  ...mockCourse,
  exams: 0,
  students: 0,
  avgScore: 0,
};

describe('CourseDataInsights', () => {
  it('renders course analytics title with course code', () => {
    render(<CourseDataInsights course={mockCourse} />);

    expect(screen.getByTestId('section-title')).toHaveTextContent(
      'CS101 - Course Analytics'
    );
  });

  it('displays correct analytics when course has exams', () => {
    render(<CourseDataInsights course={mockCourse} />);

    // Check that all specific cards are rendered
    expect(screen.getByTestId('highest-exam-score-card')).toBeInTheDocument();
    expect(screen.getByTestId('challenging-question-card')).toBeInTheDocument();
    expect(screen.getByTestId('pending-exams-card')).toBeInTheDocument();
    expect(screen.getByTestId('variants-card')).toBeInTheDocument();
    expect(screen.getByTestId('passing-rate-card')).toBeInTheDocument();

    // Check if exam data is displayed correctly in specific cards
    const highestScoreCard = screen.getByTestId('highest-exam-score-card');
    expect(within(highestScoreCard).getByText('Midterm')).toBeInTheDocument();
    expect(within(highestScoreCard).getByText('82%')).toBeInTheDocument();
  });

  it('shows "No Exams" state when course has no exams', () => {
    render(<CourseDataInsights course={mockCourseNoExams} />);

    const highestScoreCard = screen.getByTestId('highest-exam-score-card');
    expect(within(highestScoreCard).getByText('No Exams')).toBeInTheDocument();
    expect(within(highestScoreCard).getByText('N/A')).toBeInTheDocument();
    expect(
      within(highestScoreCard).getByText(/Create an exam to see insights/)
    ).toBeInTheDocument();
  });

  it('calculates passing rate correctly', () => {
    render(<CourseDataInsights course={mockCourse} />);

    // Check the passing rate in the specific card
    const passingRateCard = screen.getByTestId('passing-rate-card');
    expect(within(passingRateCard).getByText('82%')).toBeInTheDocument();
  });

  it('displays correct number of pending exams', () => {
    render(<CourseDataInsights course={mockCourse} />);

    // Check the pending exams in the specific card
    const pendingExamsCard = screen.getByTestId('pending-exams-card');
    expect(within(pendingExamsCard).getByText('2')).toBeInTheDocument();
    expect(
      within(pendingExamsCard).getByText('exams pending')
    ).toBeInTheDocument();
  });

  it('shows student performance statistics', () => {
    render(<CourseDataInsights course={mockCourse} />);

    const studentPerfSection = screen.getByTestId(
      'student-performance-section'
    );
    expect(
      within(studentPerfSection).getByText('Student Performance')
    ).toBeInTheDocument();
    expect(within(studentPerfSection).getByText('25')).toBeInTheDocument(); // students count
    // Check for Average Score and Passing Rate labels instead of the ambiguous value
    expect(
      within(studentPerfSection).getByText('Average Score')
    ).toBeInTheDocument();
    expect(
      within(studentPerfSection).getByText('Passing Rate')
    ).toBeInTheDocument();
  });

  it('displays exam statistics correctly', () => {
    render(<CourseDataInsights course={mockCourse} />);

    const examStatsSection = screen.getByTestId('exam-statistics-section');
    expect(
      within(examStatsSection).getByText('Exam Statistics')
    ).toBeInTheDocument();
    expect(within(examStatsSection).getByText('3')).toBeInTheDocument(); // total exams
    expect(within(examStatsSection).getByText('1')).toBeInTheDocument(); // completed exams (3-2)
  });
});
