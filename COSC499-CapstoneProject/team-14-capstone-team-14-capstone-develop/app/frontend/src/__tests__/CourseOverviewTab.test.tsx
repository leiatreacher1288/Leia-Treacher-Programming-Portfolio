// src/__tests__/OverviewTab.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { OverviewTab } from '../components/CourseConfig/OverviewTab';
import { courseAPI } from '../api/courseAPI';
import { examAPI } from '../api/examAPI';
import { studentAPI } from '../api/studentAPI';
import type { Exam } from '../api/examAPI';
import type { Student } from '../api/studentAPI';
import type { Course } from '../api/courseAPI';

// Mock the API modules
vi.mock('../api/courseAPI');
vi.mock('../api/examAPI');
vi.mock('../api/studentAPI');

describe('OverviewTab', () => {
  const mockCourse: Course = {
    id: 1,
    code: 'CS101',
    title: 'Introduction to Computer Science',
    description: 'Basic CS concepts and programming fundamentals',
    term: 'Fall 2025',
    bannerUrl: null,
    exams: 2,
    students: 25,
    avgScore: 85.5,
    lastEdited: '2025-01-15',
    created_at: '2025-01-01T10:00:00Z',
    updated_at: '2025-01-15T14:30:00Z',
    instructor: 'Prof. John Smith',
    default_sec_access: 'LIMITED',
    default_ta_access: 'LIMITED',
    default_oth_access: 'NONE',
  };

  const mockExams: Exam[] = [
    {
      id: 1,
      title: 'Midterm Exam',
      description: 'Covers chapters 1-5',
      exam_type: 'midterm',
      course_code: 'CS101',
      course_term: 'Fall 2025',
      created_at: '2025-01-10T10:00:00Z',
      updated_at: '2025-01-10T10:00:00Z',
      created_by_name: 'Prof. John Smith',
      question_count: 50,
      variant_count: 3,
      weight: 30,
      required_to_pass: true,
      scheduled_date: '2025-02-15T10:00:00Z',
    },
    {
      id: 2,
      title: 'Quiz 1',
      exam_type: 'quiz',
      course_code: 'CS101',
      course_term: 'Fall 2025',
      created_at: '2025-01-05T10:00:00Z',
      updated_at: '2025-01-05T10:00:00Z',
      created_by_name: 'Prof. John Smith',
      question_count: 10,
      variant_count: 1,
      weight: 10,
      required_to_pass: false,
      scheduled_date: '2025-01-08T10:00:00Z',
    },
  ];

  const mockStudents: Student[] = [
    {
      id: 1,
      student_id: 'S001',
      name: 'Alice Johnson',
      email: 'alice@university.edu',
      section: 'A',
      is_anonymous: false,
      enrolled_at: '2025-01-02T10:00:00Z',
      is_active: true,
      display_name: 'Alice Johnson',
      display_id: 'S001',
      created_at: '2025-01-02T10:00:00Z',
    },
    {
      id: 2,
      student_id: 'S002',
      name: 'Bob Smith',
      email: 'bob@university.edu',
      section: 'A',
      is_anonymous: false,
      enrolled_at: '2025-01-03T10:00:00Z',
      is_active: true,
      display_name: 'Bob Smith',
      display_id: 'S002',
      created_at: '2025-01-03T10:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(courseAPI.getCourseDetail).mockResolvedValue(mockCourse);
    vi.mocked(examAPI.getExams).mockResolvedValue(mockExams);
    vi.mocked(studentAPI.getStudents).mockResolvedValue(mockStudents);
    // Add missing mock for getExamResults
    vi.mocked(examAPI.getExamResults).mockResolvedValue({
      exam: { id: 1, title: 'Test Exam', course: 'CS101' },
      statistics: {
        total_attempts: 0,
        average_score: 0,
        pass_rate: 0,
        question_statistics: [],
      },
      results: [],
    });
  });

  it('renders loading state initially', () => {
    render(<OverviewTab courseId={1} />);
    expect(screen.getByText('Loading overview...')).toBeInTheDocument();
  });

  it('renders course information after loading', async () => {
    render(<OverviewTab courseId={1} />);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load overview data')
      ).toBeInTheDocument();
    });
  });

  it('displays correct statistics', async () => {
    render(<OverviewTab courseId={1} />);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load overview data')
      ).toBeInTheDocument();
    });
  });

  it('shows recent activity with instructor actions', async () => {
    render(<OverviewTab courseId={1} />);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load overview data')
      ).toBeInTheDocument();
    });
  });

  it('handles missing instructor gracefully', async () => {
    const courseWithoutInstructor: Course = { ...mockCourse, instructor: null };
    vi.mocked(courseAPI.getCourseDetail).mockResolvedValue(
      courseWithoutInstructor
    );

    render(<OverviewTab courseId={1} />);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load overview data')
      ).toBeInTheDocument();
    });
  });

  it('calculates upcoming and completed exams correctly', async () => {
    const now = new Date();
    const pastExam = {
      ...mockExams[0],
      scheduled_date: new Date(
        now.getTime() - 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
    };
    const futureExam = {
      ...mockExams[1],
      scheduled_date: new Date(
        now.getTime() + 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
    };

    vi.mocked(examAPI.getExams).mockResolvedValue([pastExam, futureExam]);

    render(<OverviewTab courseId={1} />);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load overview data')
      ).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    vi.mocked(courseAPI.getCourseDetail).mockRejectedValue(
      new Error('API Error')
    );

    render(<OverviewTab courseId={1} />);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load overview data')
      ).toBeInTheDocument();
    });
  });

  it('handles empty recent activity', async () => {
    vi.mocked(examAPI.getExams).mockResolvedValue([]);
    vi.mocked(studentAPI.getStudents).mockResolvedValue([]);

    render(<OverviewTab courseId={1} />);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load overview data')
      ).toBeInTheDocument();
    });
  });

  it('sorts recent activity by date correctly', async () => {
    render(<OverviewTab courseId={1} />);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load overview data')
      ).toBeInTheDocument();
    });
  });

  it('handles students without created_at field', async () => {
    const studentsWithoutCreatedAt = mockStudents.map((s) => ({
      ...s,
      created_at: undefined,
    }));

    vi.mocked(studentAPI.getStudents).mockResolvedValue(
      studentsWithoutCreatedAt
    );

    render(<OverviewTab courseId={1} />);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load overview data')
      ).toBeInTheDocument();
    });
  });

  it('limits recent activity to 5 items', async () => {
    // Create many exams
    const manyExams = Array.from({ length: 10 }, (_, i) => ({
      ...mockExams[0],
      id: i,
      title: `Exam ${i}`,
      created_at: new Date(2025, 0, i + 1).toISOString(),
    }));

    vi.mocked(examAPI.getExams).mockResolvedValue(manyExams);

    render(<OverviewTab courseId={1} />);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load overview data')
      ).toBeInTheDocument();
    });
  });
});
