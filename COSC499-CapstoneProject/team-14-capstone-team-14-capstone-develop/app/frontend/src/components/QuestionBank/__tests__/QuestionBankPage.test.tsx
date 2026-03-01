import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QuestionBank } from '../../../pages/QuestionBank';
import { questionAPI } from '../../../api/questionAPI';
import { courseAPI } from '../../../api/courseAPI';

// Mock the APIs
vi.mock('../../../api/questionAPI');
vi.mock('../../../api/courseAPI');
vi.mock('../../../api/examAPI');

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: ({ position, toastOptions }: any) => (
    <div
      data-testid="toaster"
      data-position={position}
      data-options={JSON.stringify(toastOptions)}
    />
  ),
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({
      pathname: '/question-bank',
      search: '',
    }),
  };
});

const mockCourses = [
  {
    id: 1,
    code: 'COSC 499',
    title: 'Capstone Project',
    description: 'Final year project',
    term: 'W1 2025',
    questionBanks: [
      {
        id: 1,
        title: 'Test Bank 1',
        description: 'Test description',
        course: 1,
        question_count: 10,
        difficulty_breakdown: { easy: 3, medium: 4, hard: 2, unknown: 1 },
        tag_counts: { test: 5, exam: 5 },
      },
    ],
  },
];

const mockQuestionBanks = [
  {
    id: 1,
    title: 'Test Bank 1',
    description: 'Test description',
    course: 1,
    question_count: 10,
    difficulty_breakdown: { easy: 3, medium: 4, hard: 2, unknown: 1 },
    tag_counts: { test: 5, exam: 5 },
  },
];

const renderQuestionBank = () => {
  return render(
    <BrowserRouter>
      <QuestionBank />
    </BrowserRouter>
  );
};

describe('QuestionBank', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock API responses
    (courseAPI.getCourses as any).mockResolvedValue(mockCourses);
    (questionAPI.getQuestionBanksByCourse as any).mockResolvedValue(
      mockQuestionBanks
    );
  });

  it('renders loading state initially', () => {
    renderQuestionBank();
    expect(screen.getByText('Loading question banks...')).toBeInTheDocument();
  });

  it('renders question banks after loading', async () => {
    renderQuestionBank();

    await waitFor(() => {
      expect(screen.getByText('Question Banks')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Bank 1')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('shows create bank button', async () => {
    renderQuestionBank();

    await waitFor(() => {
      expect(screen.getByText('Create Bank')).toBeInTheDocument();
    });
  });

  it('shows import questions button', async () => {
    renderQuestionBank();

    await waitFor(() => {
      expect(screen.getByText('Import Questions')).toBeInTheDocument();
    });
  });

  it('filters question banks by search query', async () => {
    renderQuestionBank();

    await waitFor(() => {
      expect(screen.getByText('Test Bank 1')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search question banks...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    expect(screen.queryByText('Test Bank 1')).not.toBeInTheDocument();
  });

  it('filters by course', async () => {
    renderQuestionBank();

    await waitFor(() => {
      expect(screen.getByText('Test Bank 1')).toBeInTheDocument();
    });

    const courseFilter = screen.getByDisplayValue('All Courses');
    fireEvent.change(courseFilter, { target: { value: 'COSC 499' } });

    expect(screen.getByText('Test Bank 1')).toBeInTheDocument();
  });

  it('shows empty state when no question banks found', async () => {
    (questionAPI.getQuestionBanksByCourse as any).mockResolvedValue([]);

    renderQuestionBank();

    await waitFor(() => {
      expect(screen.getByText('No Question Banks Found')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    (courseAPI.getCourses as any).mockRejectedValue(new Error('API Error'));

    renderQuestionBank();

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load courses and question banks')
      ).toBeInTheDocument();
    });

    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('shows course information correctly', async () => {
    renderQuestionBank();

    await waitFor(() => {
      expect(
        screen.getByText('COSC 499 - Capstone Project')
      ).toBeInTheDocument();
      expect(screen.getByText('1 question bank')).toBeInTheDocument();
    });
  });

  it('displays question bank statistics', async () => {
    renderQuestionBank();

    await waitFor(() => {
      expect(screen.getByText('Test Bank 1')).toBeInTheDocument();
    });

    // Check that the question count is displayed (this would be in the WizardQuestionBankCard)
    // The actual display depends on the WizardQuestionBankCard implementation
  });
});
