import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { VariantEditModal } from '../components/variants/VariantEditModal';
import { AuthProvider } from '../context/AuthContext';

vi.mock('../api/examAPI', async () => {
  const actual = await vi.importActual('../api/examAPI');
  return {
    ...actual,
    reorderVariantQuestions: vi.fn().mockResolvedValue({}),
  };
});

// Mock Questions
const mockQuestions = [
  {
    id: 1,
    prompt: 'What is 2+2?',
    choices: { A: '3', B: '4', C: '5', D: '6' },
    correct_answer: ['B'],
    difficulty: 'Easy',
    tags: ['math', 'easy'],
    explanation: '',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    question_type: 'multiple_choice',
    created_by: 1,
    bank: 1,
    points: 1,
  },
  {
    id: 2,
    prompt: 'What is the capital of France?',
    choices: { A: 'London', B: 'Berlin', C: 'Paris', D: 'Madrid' },
    correct_answer: ['C'],
    difficulty: 'Medium',
    tags: ['geography'],
    explanation: '',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    question_type: 'multiple_choice',
    created_by: 1,
    bank: 1,
    points: 1,
  },
];

const mockVariant = {
  id: 1,
  created_at: '2025-01-01T00:00:00Z',
  docx_exported: false,
  exported_at: null,
  course: 1,
  is_locked: false,
  pdf_exported: false,
  questions: mockQuestions,
  version_label: 'A',
};

const renderVariantEditModal = () => {
  let editingVariant: any = null;
  const normalizedQuestions = (mockVariant.questions || []).map(
    (q: any, idx: number) => {
      if (q && 'question' in q && typeof q.question === 'object') {
        // Already wrapped
        return q;
      }
      // Wrap raw question object
      return {
        id: q?.id ?? idx,
        question: q,
        order: idx + 1,
      };
    }
  );
  const handleEditVariant = (variant: any) => {
    editingVariant = {
      ...variant,
      questions: normalizedQuestions,
    };
  };

  const tmp_variant = mockVariant;
  handleEditVariant(tmp_variant);

  return render(
    <BrowserRouter>
      <AuthProvider>
        <VariantEditModal
          isOpen={true}
          onClose={() => {
            vi.fn();
          }}
          variant={editingVariant}
          onSave={vi.fn()}
          onExport={vi.fn()}
        />
      </AuthProvider>
    </BrowserRouter>
  );
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ExamQuestionTab', () => {
  test('renders Variant Edit Modal', async () => {
    renderVariantEditModal();
    await waitFor(() => {
      expect(screen.getByText('Edit Variant A')).toBeInTheDocument();
      expect(screen.getByLabelText('Close')).toBeInTheDocument();
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
      expect(
        screen.getByText('What is the capital of France?')
      ).toBeInTheDocument();
      expect(screen.getByText('What is 2+2?')).toBeInTheDocument();
      expect(screen.getByText('London')).toBeInTheDocument();
      expect(screen.getByText('Madrid')).toBeInTheDocument();
      expect(screen.getByText('Paris')).toBeInTheDocument();
      expect(screen.getByText('Berlin')).toBeInTheDocument();
      expect(screen.getByText('geography')).toBeInTheDocument();
    });
  });
});
