import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';

import { CreateQuestionModal } from '../components/QuestionBank/CreateQuestionModal';

// Mock the API calls
const mockQuestion = {
  id: 1,
  prompt: 'What is the capital of France?',
  choices: { A: 'London', B: 'Berlin', C: 'Paris', D: 'Madrid' },
  correct_answer: ['C'],
  difficulty: 2,
  tags: ['geography'],
  explanation: 'The capital of Fance is Paris.',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  created_by: 1,
  course_id: 1,
};

const renderEditQuestion = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <CreateQuestionModal
          isOpen={true}
          onClose={() => {
            vi.fn();
          }}
          onCreate={vi.fn()}
          examId={1}
          courses={[]} // Pass courses prop
          initialValues={{
            prompt: mockQuestion.prompt,
            choices: mockQuestion.choices,
            correct_answer: mockQuestion.correct_answer,
            difficulty: mockQuestion.difficulty,
            tags: mockQuestion.tags,
            explanation: mockQuestion.explanation,
            course_id: mockQuestion.course_id,
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CreateQuestionModal', () => {
  it('renders Edit Question', async () => {
    renderEditQuestion();

    /* ----------  Basic form elements ---------- */
    expect(screen.getByText('Edit Question')).toBeInTheDocument();
    expect(screen.getByText('Course *')).toBeInTheDocument();
    expect(screen.getByText('Question Content')).toBeInTheDocument();
    expect(screen.getByText('Options')).toBeInTheDocument();

    /* ----------  Question content ---------- */
    expect(
      screen.getByDisplayValue('What is the capital of France?')
    ).toBeInTheDocument();

    /* ----------  Options ---------- */
    expect(screen.getByDisplayValue('London')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Berlin')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Madrid')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Paris')).toBeInTheDocument();

    /* ----------  Close button ---------- */
    const closeButtons = screen.getAllByTestId('icon-fix');
    expect(closeButtons.length).toBeGreaterThan(0);
  });
});
