/**
 * Vitest test-suite for <QuestionBank />
 * – Tests the new course-based question bank card view
 * – Uses RTL best-practice queries (role / label / placeholder / test-id)
 * – Fully mocks questionAPI, courseAPI, examAPI
 * – Seeds minimal data so the page renders & behaves
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

import { QuestionBank } from '../pages/QuestionBank';
import { AuthProvider } from '../context/AuthContext';

/* ─────────────── 1. Minimal reference data ──────────────────────────── */
const mockCourses = [
  {
    id: 1,
    title: 'Introduction to Computer Science',
    code: 'CS101',
    term: '2025W1',
  },
  {
    id: 2,
    title: 'Calculus',
    code: 'MATH101',
    term: '2025W1',
  },
];

const mockQuestionBanks = [
  {
    id: 1,
    title: 'CS101 - 2025W1 QB #1',
    description: 'Question bank for CS101',
    course: 1,
    question_count: 5,
    difficulty_breakdown: {
      easy: 40,
      medium: 40,
      hard: 20,
      unknown: 0,
    },
    tag_counts: {
      math: 3,
      programming: 2,
    },
  },
  {
    id: 2,
    title: 'CS101 - 2025W1 QB #2',
    description: 'Advanced questions for CS101',
    course: 1,
    question_count: 3,
    difficulty_breakdown: {
      easy: 0,
      medium: 67,
      hard: 33,
      unknown: 0,
    },
    tag_counts: {
      advanced: 2,
      algorithms: 1,
    },
  },
];

/* ─────────────── 2. Module mocks (must be hoisted) ──────────────────── */
vi.mock('../api/questionAPI', () => ({
  questionAPI: {
    getQuestionBanksByCourse: vi.fn(async (courseId) => {
      // Return different banks based on course ID
      if (courseId === 1) {
        return mockQuestionBanks;
      } else if (courseId === 2) {
        return [
          {
            id: 3,
            title: 'MATH101 - 2025W1 QB #1',
            description: 'Question bank for MATH101',
            course: 2,
            question_count: 4,
            difficulty_breakdown: {
              easy: 25,
              medium: 50,
              hard: 25,
              unknown: 0,
            },
            tag_counts: {
              calculus: 2,
              algebra: 2,
            },
          },
        ];
      }
      return [];
    }),
    createQuestionBank: vi.fn(async (data) => ({
      id: 999,
      ...data,
      question_count: 0,
      difficulty_breakdown: { easy: 0, medium: 0, hard: 0, unknown: 0 },
      tag_counts: {},
    })),
    updateQuestionBank: vi.fn(async (_id, data) => ({ id: _id, ...data })),
    deleteQuestionBank: vi.fn(async (id) => ({ success: true })),
    uploadQuestionsFile: vi.fn(async () => ({ success: true })),
    getDifficultyLabel: (difficulty: number) => {
      return difficulty === 1
        ? 'Easy'
        : difficulty === 2
          ? 'Medium'
          : difficulty === 3
            ? 'Hard'
            : 'Unknown';
    },
  },
}));

vi.mock('../api/courseAPI', () => ({
  courseAPI: {
    getCourses: vi.fn(async () => mockCourses),
  },
}));

vi.mock('../api/examAPI', () => ({
  examAPI: {
    getExams: vi.fn(async () => []),
    addQuestions: vi.fn(async () => ({})),
    getExamDetail: vi.fn(async () => ({ title: 'Exam' })),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => null,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon" />,
  ChevronDown: () => <div data-testid="chevrondown-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
  Upload: () => <div data-testid="upload-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  BookOpen: () => <div data-testid="bookopen-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  Edit: () => <div data-testid="edit-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  BarChart2: () => <div data-testid="barchart-icon" />,
}));

/* ─────────────── 3. Utils: render with providers ─────────────────────── */
const renderPage = () =>
  render(
    <BrowserRouter>
      <AuthProvider>
        <QuestionBank />
      </AuthProvider>
    </BrowserRouter>
  );

/* ─────────────── 4. Tests ─────────────────────────────────────────────── */
describe('QuestionBank page', () => {
  /* stub localStorage for AuthProvider */
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => {
          if (key === 'token' || key === 'adminToken') return 'mock-token';
          if (key === 'user' || key === 'adminUser')
            return JSON.stringify({ id: 1, name: 'Mock User' });
          return null;
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.resetAllMocks();
  });

  it('renders question banks page with header', async () => {
    renderPage();

    expect(
      await screen.findByRole('heading', { name: /question banks/i })
    ).toBeInTheDocument();

    expect(
      screen.getByText(/manage question banks across all courses/i)
    ).toBeInTheDocument();
  });

  it('displays course headers with question bank counts', async () => {
    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText('CS101 - Introduction to Computer Science')
      ).toBeInTheDocument();
      expect(screen.getByText('2 question banks')).toBeInTheDocument();
    });
  });

  it('shows question bank cards with correct information', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('CS101 - 2025W1 QB #1')).toBeInTheDocument();
      expect(screen.getByText('CS101 - 2025W1 QB #2')).toBeInTheDocument();
      expect(screen.getByText('5 questions')).toBeInTheDocument();
      expect(screen.getByText('3 questions')).toBeInTheDocument();
    });
  });

  it('displays difficulty breakdown on question bank cards', async () => {
    renderPage();

    await waitFor(() => {
      // Check for difficulty labels with percentages
      expect(screen.getByText('Easy 40%')).toBeInTheDocument();
      expect(screen.getByText('Medium 40%')).toBeInTheDocument();
      expect(screen.getByText('Hard 20%')).toBeInTheDocument();
    });
  });

  it('shows tag counts on question bank cards', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('math (3)')).toBeInTheDocument();
      expect(screen.getByText('programming (2)')).toBeInTheDocument();
      expect(screen.getByText('advanced (2)')).toBeInTheDocument();
    });
  });

  it('renders action buttons in header', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Import Questions')).toBeInTheDocument();
      expect(screen.getByText('Create Bank')).toBeInTheDocument();
    });
  });

  it('shows search functionality', async () => {
    renderPage();

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/search question banks/i)
      ).toBeInTheDocument();
    });
  });

  it('shows course filter dropdown', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('All Courses')).toBeInTheDocument();
    });
  });

  it('displays empty state when no question banks exist', async () => {
    // Mock empty response
    const { questionAPI } = await import('../api/questionAPI');
    vi.mocked(questionAPI.getQuestionBanksByCourse).mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/no question banks found/i)).toBeInTheDocument();
      expect(
        screen.getByText(/try adjusting your search or filters/i)
      ).toBeInTheDocument();
    });
  });

  it('handles loading state', async () => {
    // Mock slow response
    const { questionAPI } = await import('../api/questionAPI');
    vi.mocked(questionAPI.getQuestionBanksByCourse).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
    );

    renderPage();

    expect(screen.getByText(/loading question banks/i)).toBeInTheDocument();
  });

  it('handles error state', async () => {
    // Mock error response for courseAPI to trigger main error handler
    const { courseAPI } = await import('../api/courseAPI');
    vi.mocked(courseAPI.getCourses).mockRejectedValue(new Error('API Error'));

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText(/failed to load courses and question banks/i)
      ).toBeInTheDocument();
    });
  });
});
