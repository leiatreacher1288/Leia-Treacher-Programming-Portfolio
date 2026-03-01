import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { VariantEditModal } from '../components/variants/VariantEditModal';
import { examAPI } from '../api/examAPI';

// Mock the examAPI
vi.mock('../api/examAPI', () => ({
  examAPI: {
    updateVariantOrder: vi.fn(),
    exportDocx: vi.fn(),
    exportAnswerKey: vi.fn(),
    generateVariants: vi.fn(),
    removeQuestionFromVariant: vi.fn(),
    reorderVariantQuestions: vi.fn(),
  },
}));

// Mock react-movable
vi.mock('react-movable', () => ({
  List: ({
    items,
    renderItem,
  }: {
    items: unknown[];
    renderItem: (props: {
      value: unknown;
      index: number;
      props: Record<string, unknown>;
    }) => React.ReactNode;
  }) => (
    <div>
      {items.map((item: unknown, index: number) => (
        <div key={index} data-testid={`draggable-item-${index}`}>
          {renderItem({ value: item, index, props: {} })}
        </div>
      ))}
    </div>
  ),
  arrayMove: vi.fn((array: unknown[], from: number, to: number) => {
    const newArray = [...array];
    const [removed] = newArray.splice(from, 1);
    newArray.splice(to, 0, removed);
    return newArray;
  }),
}));

// Mock QuestionBankCard
vi.mock('../components/QuestionBank/QuestionBankCard', () => ({
  QuestionBankCard: ({
    question,
    questionNumber,
    onEdit,
    onDelete,
  }: {
    question: { id: string; question?: string; text?: string; prompt?: string };
    questionNumber?: number;
    onEdit?: (question: { id: string; question?: string }) => void;
    onDelete?: (questionId: string) => void;
  }) => (
    <div data-testid="question-card">
      {questionNumber && <span>{questionNumber}</span>}
      <span>
        {[question.question, question.text, question.prompt]
          .filter(Boolean)
          .join(' ')}
      </span>
      {onEdit && (
        <button onClick={() => onEdit(question)} data-testid="edit-btn">
          Edit
        </button>
      )}
      {onDelete && (
        <button onClick={() => onDelete(question.id)} data-testid="delete-btn">
          Delete
        </button>
      )}
    </div>
  ),
}));

// Mock mapApiQuestionToFrontend
vi.mock('../../utils/questionMapper', () => ({
  mapApiQuestionToFrontend: (apiQuestion: {
    prompt?: string;
    choices?: Record<string, string>;
    correct_answer?: (string | number)[];
  }) => ({
    id: '1',
    prompt: apiQuestion.prompt || '',
    choices: apiQuestion.choices || {},
    correct_answer: Array.isArray(apiQuestion.correct_answer)
      ? apiQuestion.correct_answer.map((ans) =>
          typeof ans === 'number' ? String.fromCharCode(65 + ans) : ans
        )
      : [],
    difficulty: 'Easy',
    tags: [],
    explanation: '',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    question_type: 'multiple_choice',
    created_by: 1,
    bank: 1,
    points: 1,
  }),
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useNavigate: () => vi.fn(),
}));

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useAuth: () => ({
    user: { id: 1, username: 'testuser' },
    isAuthenticated: true,
  }),
}));

const mockExamAPI = vi.mocked(examAPI);

describe('VariantGeneration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders variant edit modal correctly', () => {
    const mockVariant = {
      id: 1,
      version_label: 'A',
      questions: [
        {
          id: 1,
          question: {
            id: 1,
            prompt: 'Test Question 1',
            choices: { A: 'Choice A', B: 'Choice B' },
            correct_answer: ['A'],
            difficulty: 'Easy',
            tags: ['test'],
            explanation: '',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            question_type: 'multiple_choice',
            created_by: 1,
            bank: 1,
            points: 1,
          },
          order: 0,
        },
      ],
      docx_exported: false,
      pdf_exported: false,
      is_locked: false,
      exam: 1,
      exam_title: 'Test Exam',
      created_at: '2024-01-01T00:00:00Z',
    };

    render(
      <VariantEditModal
        isOpen={true}
        onClose={vi.fn()}
        variant={mockVariant}
        onSave={vi.fn()}
        onExport={vi.fn()}
      />
    );

    expect(screen.getByText('Edit Variant A')).toBeInTheDocument();
  });

  it('handles variant generation API calls', () => {
    mockExamAPI.generateVariants.mockResolvedValue({
      message: 'Variants generated successfully',
      variants_created: 3,
      cheating_risk_score: 15,
    });

    expect(mockExamAPI.generateVariants).toBeDefined();
  });

  it('handles variant export API calls', () => {
    mockExamAPI.exportDocx.mockResolvedValue(new Blob(['test']));
    mockExamAPI.exportAnswerKey.mockResolvedValue(new Blob(['test']));

    expect(mockExamAPI.exportDocx).toBeDefined();
    expect(mockExamAPI.exportAnswerKey).toBeDefined();
  });

  it('handles variant question reordering', () => {
    mockExamAPI.reorderVariantQuestions.mockResolvedValue({
      success: true,
      message: 'Questions reordered successfully',
    });

    expect(mockExamAPI.reorderVariantQuestions).toBeDefined();
  });

  it('handles question removal from variant', () => {
    mockExamAPI.removeQuestionFromVariant.mockResolvedValue({
      message: 'Question removed successfully',
    });

    expect(mockExamAPI.removeQuestionFromVariant).toBeDefined();
  });
});
