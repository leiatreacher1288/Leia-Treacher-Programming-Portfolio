import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuestionBank } from '../../../pages/QuestionBank';
import { BrowserRouter } from 'react-router-dom';

// Mock the APIs with proper vi.fn() functions
vi.mock('../../../api/questionAPI', () => ({
  questionAPI: {
    getQuestionBanksByCourse: vi.fn().mockResolvedValue([
      {
        id: 1,
        title: 'CS101 - 2025W1 QB #1',
        description: 'Test question bank',
        course: 1,
        question_count: 5,
        difficulty_breakdown: {
          easy: 2,
          medium: 2,
          hard: 1,
          unknown: 0,
        },
        tag_counts: {
          test: 3,
          math: 2,
        },
      },
    ]),
    createQuestionBank: vi.fn().mockResolvedValue({ id: 999 }),
    updateQuestionBank: vi.fn().mockResolvedValue({ id: 1 }),
    deleteQuestionBank: vi.fn().mockResolvedValue({ success: true }),
    uploadQuestionsFile: vi.fn().mockResolvedValue({ success: true }),
    getDifficultyLabel: vi.fn((difficulty) => {
      return difficulty === 1
        ? 'Easy'
        : difficulty === 2
          ? 'Medium'
          : difficulty === 3
            ? 'Hard'
            : 'Unknown';
    }),
  },
}));

vi.mock('../../../api/courseAPI', () => ({
  courseAPI: {
    getCourses: vi.fn().mockResolvedValue([
      {
        id: 1,
        title: 'Introduction to Computer Science',
        code: 'CS101',
        term: '2025W1',
      },
    ]),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => null,
}));

// Mock URL methods
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(() => 'mock-url'),
});
Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: vi.fn(),
});

// Mock HTMLAnchorElement click method
HTMLAnchorElement.prototype.click = vi.fn();

describe('QuestionBank Export Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderQuestionBank = () => {
    return render(
      <BrowserRouter>
        <QuestionBank />
      </BrowserRouter>
    );
  };

  it('renders question banks page with export functionality', async () => {
    renderQuestionBank();

    await waitFor(() => {
      expect(screen.getByText('Question Banks')).toBeInTheDocument();
      expect(screen.getByText('Import Questions')).toBeInTheDocument();
      expect(screen.getByText('Create Bank')).toBeInTheDocument();
    });
  });

  it('displays question bank cards with export options', async () => {
    renderQuestionBank();

    await waitFor(() => {
      expect(screen.getByText('CS101 - 2025W1 QB #1')).toBeInTheDocument();
      expect(screen.getByText('5 questions')).toBeInTheDocument();
    });
  });

  it('shows import questions button in header', async () => {
    renderQuestionBank();

    await waitFor(() => {
      expect(screen.getByText('Import Questions')).toBeInTheDocument();
    });
  });

  it('shows create bank button in header', async () => {
    renderQuestionBank();

    await waitFor(() => {
      expect(screen.getByText('Create Bank')).toBeInTheDocument();
    });
  });

  it('displays course information correctly', async () => {
    renderQuestionBank();

    await waitFor(() => {
      expect(
        screen.getByText('CS101 - Introduction to Computer Science')
      ).toBeInTheDocument();
      expect(screen.getByText('1 question bank')).toBeInTheDocument();
    });
  });

  it('shows difficulty breakdown on question bank cards', async () => {
    renderQuestionBank();

    await waitFor(() => {
      // Check for difficulty labels
      expect(screen.getByText(/Easy.*%/)).toBeInTheDocument();
      expect(screen.getByText(/Medium.*%/)).toBeInTheDocument();
      expect(screen.getByText(/Hard.*%/)).toBeInTheDocument();
    });
  });

  it('displays tag counts on question bank cards', async () => {
    renderQuestionBank();

    await waitFor(() => {
      expect(screen.getByText('test (3)')).toBeInTheDocument();
      expect(screen.getByText('math (2)')).toBeInTheDocument();
    });
  });

  it('shows search functionality', async () => {
    renderQuestionBank();

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/search question banks/i)
      ).toBeInTheDocument();
    });
  });

  it('shows course filter dropdown', async () => {
    renderQuestionBank();

    await waitFor(() => {
      expect(screen.getByText('All Courses')).toBeInTheDocument();
    });
  });

  it('handles empty state when no question banks exist', async () => {
    // Mock empty response
    const { questionAPI } = await import('../../../api/questionAPI');
    vi.mocked(questionAPI.getQuestionBanksByCourse).mockResolvedValue([]);

    renderQuestionBank();

    await waitFor(() => {
      expect(screen.getByText('No Question Banks Found')).toBeInTheDocument();
      expect(screen.getByText('Create First Bank')).toBeInTheDocument();
    });
  });

  it('handles loading state', async () => {
    // Mock slow response
    const { questionAPI } = await import('../../../api/questionAPI');
    vi.mocked(questionAPI.getQuestionBanksByCourse).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
    );

    renderQuestionBank();

    expect(screen.getByText(/loading question banks/i)).toBeInTheDocument();
  });

  it('handles error state', async () => {
    // Mock error response for both APIs
    const { questionAPI } = await import('../../../api/questionAPI');
    const { courseAPI } = await import('../../../api/courseAPI');
    vi.mocked(questionAPI.getQuestionBanksByCourse).mockRejectedValue(
      new Error('API Error')
    );
    vi.mocked(courseAPI.getCourses).mockRejectedValue(new Error('API Error'));

    renderQuestionBank();

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load courses and question banks')
      ).toBeInTheDocument();
    });
  });
});
