import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { PreviewImportModal } from '../PreviewImportModel';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import * as questionAPI from '../../../api/questionAPI';

vi.mock('../../../api/questionAPI', () => ({
  questionAPI: {
    getQuestions: vi.fn().mockResolvedValue([{ prompt: 'What is 2+2?' }]),
  },
}));

const validQuestion = {
  id: '1',
  prompt: 'What is 2+2?',
  choices: { A: '3', B: '4', C: '5', D: '6' },
  correct_answer: ['B'],
  difficulty: 'Easy' as const,
  tags: [] as string[],
  explanation: '',
  is_duplicate: false,
};

describe('PreviewImportModal', () => {
  test('renders modal with a question', () => {
    render(
      <PreviewImportModal
        questions={[validQuestion]}
        onClose={vi.fn()}
        onImport={vi.fn()}
      />
    );
    expect(screen.getByText('Preview Imported Questions')).toBeInTheDocument();
    expect(screen.getByText('What is 2+2?')).toBeInTheDocument();
  });

  test('shows duplicate warning if is_duplicate is true', () => {
    render(
      <PreviewImportModal
        questions={[{ ...validQuestion, is_duplicate: true }]}
        onClose={vi.fn()}
        onImport={vi.fn()}
      />
    );
    expect(screen.getByText(/Duplicate detected/i)).toBeInTheDocument();
  });

  test('allows editing a question and saving changes', async () => {
    render(
      <PreviewImportModal
        questions={[validQuestion]}
        onClose={vi.fn()}
        onImport={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /edit question/i }));
    const textarea = screen.getAllByRole('textbox')[0];
    fireEvent.change(textarea, { target: { value: 'What is 3+3?' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(await screen.findByText('What is 3+3?')).toBeInTheDocument();
  });

  test('calls onImport only with valid questions', async () => {
    const handleImport = vi.fn();
    render(
      <PreviewImportModal
        questions={[
          validQuestion,
          { ...validQuestion, id: '2', prompt: '', correct_answer: [] },
        ]}
        onClose={vi.fn()}
        onImport={handleImport}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /import questions/i }));
    await screen.findByRole('button', { name: /import questions/i });
    expect(handleImport).toHaveBeenCalledTimes(1);
    expect(handleImport.mock.calls[0][0].length).toBe(1);
  });
});
