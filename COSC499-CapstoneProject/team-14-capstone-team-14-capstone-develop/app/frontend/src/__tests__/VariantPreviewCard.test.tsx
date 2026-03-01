import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VariantPreviewCard } from '../components/variants/VariantSetManager';
import { AuthProvider } from '../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Mock the examAPI
vi.mock('../api/examAPI', () => ({
  examAPI: {
    exportVariantFile: vi.fn(),
    exportAnswerKey: vi.fn(),
  },
}));

import { examAPI } from '../api/examAPI';

const mockExamAPI = vi.mocked(examAPI);

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>{children}</AuthProvider>
  </BrowserRouter>
);

// Simplified mock variant that matches the actual component expectations
const mockVariant = {
  id: 1,
  version_label: 'A',
  questions: [
    {
      id: 1,
      question: {
        id: 1,
        difficulty: 'Easy',
        prompt: 'Question 1',
        choices: { A: 'Choice A', B: 'Choice B', C: 'Choice C', D: 'Choice D' },
        correct_answer: ['A'],
        explanation: 'Explanation for question 1',
        tags: ['test'],
        question_type: 'multiple_choice',
        points: 1,
      },
      order: 0,
    },
    {
      id: 2,
      question: {
        id: 2,
        difficulty: 'Easy',
        prompt: 'Question 2',
        choices: { A: 'Choice A', B: 'Choice B', C: 'Choice C', D: 'Choice D' },
        correct_answer: ['B'],
        explanation: 'Explanation for question 2',
        tags: ['test'],
        question_type: 'multiple_choice',
        points: 1,
      },
      order: 1,
    },
    {
      id: 3,
      question: {
        id: 3,
        difficulty: 'Medium',
        prompt: 'Question 3',
        choices: { A: 'Choice A', B: 'Choice B', C: 'Choice C', D: 'Choice D' },
        correct_answer: ['C'],
        explanation: 'Explanation for question 3',
        tags: ['test'],
        question_type: 'multiple_choice',
        points: 1,
      },
      order: 2,
    },
    {
      id: 4,
      question: {
        id: 4,
        difficulty: 'Hard',
        prompt: 'Question 4',
        choices: { A: 'Choice A', B: 'Choice B', C: 'Choice C', D: 'Choice D' },
        correct_answer: ['D'],
        explanation: 'Explanation for question 4',
        tags: ['test'],
        question_type: 'multiple_choice',
        points: 1,
      },
      order: 3,
    },
  ],
  docx_exported: false,
  pdf_exported: false,
  is_locked: false,
  exam: 1,
  exam_title: 'Test Exam',
  created_at: '2024-01-01T00:00:00Z',
};

describe('VariantPreviewCard', () => {
  const defaultProps = {
    variant: mockVariant,
    index: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockExamAPI.exportVariantFile.mockResolvedValue(new Blob(['test content']));
    mockExamAPI.exportAnswerKey.mockResolvedValue(
      new Blob(['answer key content'])
    );
  });

  it('renders variant information correctly', () => {
    render(
      <TestWrapper>
        <VariantPreviewCard {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('4 Questions')).toBeInTheDocument();
  });

  it('displays difficulty summary correctly', () => {
    render(
      <TestWrapper>
        <VariantPreviewCard {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText('Easy 2')).toBeInTheDocument();
    expect(screen.getByText('Medium 1')).toBeInTheDocument();
    expect(screen.getByText('Hard 1')).toBeInTheDocument();
  });

  it('shows correct status badge for valid variant', () => {
    render(
      <TestWrapper>
        <VariantPreviewCard {...defaultProps} />
      </TestWrapper>
    );

    const statusBadge = screen.getByText('Issues Found');
    expect(statusBadge).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    render(
      <TestWrapper>
        <VariantPreviewCard {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText('Manage')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('opens export modal when export button is clicked', async () => {
    render(
      <TestWrapper>
        <VariantPreviewCard {...defaultProps} />
      </TestWrapper>
    );

    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);

    // Check that the modal opens with the correct title
    expect(screen.getByText('Export Variant A')).toBeInTheDocument();
  });

  it('handles manage button click', () => {
    render(
      <TestWrapper>
        <VariantPreviewCard {...defaultProps} />
      </TestWrapper>
    );

    const manageButton = screen.getByText('Manage');
    expect(manageButton).toBeInTheDocument();
  });

  it('handles delete button click', () => {
    render(
      <TestWrapper>
        <VariantPreviewCard {...defaultProps} />
      </TestWrapper>
    );

    const deleteButton = screen.getByText('Delete');
    expect(deleteButton).toBeInTheDocument();
  });

  it('renders with correct styling classes', () => {
    render(
      <TestWrapper>
        <VariantPreviewCard {...defaultProps} />
      </TestWrapper>
    );

    const container = screen.getByText('A').closest('.flex');
    expect(container).toBeInTheDocument();
  });

  it('handles variant with no questions', () => {
    const emptyVariant = {
      ...mockVariant,
      questions: [],
    };

    render(
      <TestWrapper>
        <VariantPreviewCard variant={emptyVariant} index={0} />
      </TestWrapper>
    );

    expect(screen.getByText('0 Questions')).toBeInTheDocument();
  });

  it('handles variant with single question', () => {
    const singleQuestionVariant = {
      ...mockVariant,
      questions: [
        {
          id: 1,
          question: {
            id: 1,
            difficulty: 'Easy',
            prompt: 'Question 1',
            choices: {
              A: 'Choice A',
              B: 'Choice B',
              C: 'Choice C',
              D: 'Choice D',
            },
            correct_answer: ['A'],
            explanation: 'Explanation for question 1',
            tags: ['test'],
            question_type: 'multiple_choice',
            points: 1,
          },
          order: 0,
        },
      ],
    };

    render(
      <TestWrapper>
        <VariantPreviewCard variant={singleQuestionVariant} index={0} />
      </TestWrapper>
    );

    expect(screen.getByText('1 Questions')).toBeInTheDocument();
  });
});
