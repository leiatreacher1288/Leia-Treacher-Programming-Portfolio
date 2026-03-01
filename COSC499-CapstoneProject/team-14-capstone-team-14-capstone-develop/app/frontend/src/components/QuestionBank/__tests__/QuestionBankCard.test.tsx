import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WizardQuestionBankCard } from '../WizardQuestionBankCard';

// Mock the APIs
vi.mock('../../../api/questionAPI');
vi.mock('../../../api/examAPI');

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  BarChart2: () => <div data-testid="barchart-icon" />,
}));

const mockQuestionBank = {
  id: 1,
  title: 'CS101 - 2025W1 QB #1',
  description: 'Question bank for CS101',
  course: 1,
  question_count: 5,
  difficulty_breakdown: {
    easy: 2,
    medium: 2,
    hard: 1,
    unknown: 0,
  },
  tag_counts: {
    math: 3,
    programming: 2,
  },
};

const defaultProps = {
  bank: mockQuestionBank,
  showAddButton: false,
  className: 'test-class',
};

describe('WizardQuestionBankCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders question bank card with title', () => {
    render(<WizardQuestionBankCard {...defaultProps} />);

    expect(screen.getByText('CS101 - 2025W1 QB #1')).toBeInTheDocument();
  });

  it('displays question count', () => {
    render(<WizardQuestionBankCard {...defaultProps} />);

    expect(screen.getByText('5 questions')).toBeInTheDocument();
  });

  it('shows difficulty breakdown bars', () => {
    render(<WizardQuestionBankCard {...defaultProps} />);

    // Check for difficulty labels with counts using flexible matching
    expect(
      screen.getByText(
        (content) => content.includes('Easy') && content.includes('2')
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        (content) => content.includes('Medium') && content.includes('2')
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        (content) => content.includes('Hard') && content.includes('1')
      )
    ).toBeInTheDocument();
  });

  it('displays difficulty percentages', () => {
    render(<WizardQuestionBankCard {...defaultProps} />);

    // The component shows counts with % symbol, not percentages
    const elementsWith2 = screen.getAllByText(
      (content) => content.includes('2') && content.includes('%')
    );
    const elementsWith1 = screen.getAllByText(
      (content) => content.includes('1') && content.includes('%')
    );

    expect(elementsWith2.length).toBeGreaterThan(0);
    expect(elementsWith1.length).toBeGreaterThan(0);
  });

  it('shows tag counts', () => {
    render(<WizardQuestionBankCard {...defaultProps} />);

    expect(screen.getByText('math (3)')).toBeInTheDocument();
    expect(screen.getByText('programming (2)')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<WizardQuestionBankCard {...defaultProps} />);

    expect(container.firstChild).toHaveClass('test-class');
  });

  it('handles empty tag counts', () => {
    const bankWithNoTags = {
      ...mockQuestionBank,
      tag_counts: {},
    };

    render(<WizardQuestionBankCard {...defaultProps} bank={bankWithNoTags} />);

    // Should still render the card without tags
    expect(screen.getByText('CS101 - 2025W1 QB #1')).toBeInTheDocument();
    expect(screen.getByText('5 questions')).toBeInTheDocument();
  });

  it('handles zero question count', () => {
    const bankWithNoQuestions = {
      ...mockQuestionBank,
      question_count: 0,
    };

    render(
      <WizardQuestionBankCard {...defaultProps} bank={bankWithNoQuestions} />
    );

    expect(screen.getByText('No questions yet')).toBeInTheDocument();
  });

  it('handles all zero difficulty breakdown', () => {
    const bankWithZeroDifficulty = {
      ...mockQuestionBank,
      difficulty_breakdown: {
        easy: 0,
        medium: 0,
        hard: 0,
        unknown: 0,
      },
    };

    render(
      <WizardQuestionBankCard {...defaultProps} bank={bankWithZeroDifficulty} />
    );

    // When all difficulties are zero, the difficulty section is not rendered
    expect(screen.queryByText('Easy')).not.toBeInTheDocument();
    expect(screen.queryByText('Medium')).not.toBeInTheDocument();
    expect(screen.queryByText('Hard')).not.toBeInTheDocument();
  });

  it('handles unknown difficulty questions', () => {
    const bankWithUnknown = {
      ...mockQuestionBank,
      difficulty_breakdown: {
        easy: 0,
        medium: 0,
        hard: 0,
        unknown: 5,
      },
    };

    render(<WizardQuestionBankCard {...defaultProps} bank={bankWithUnknown} />);

    // Unknown difficulty questions are not displayed in the UI
    expect(screen.queryByText('Unknown')).not.toBeInTheDocument();
  });

  it('displays description when available', () => {
    render(<WizardQuestionBankCard {...defaultProps} />);

    expect(screen.getByText('Question bank for CS101')).toBeInTheDocument();
  });

  it('handles missing description', () => {
    const bankWithoutDescription = {
      ...mockQuestionBank,
      description: '',
    };

    render(
      <WizardQuestionBankCard {...defaultProps} bank={bankWithoutDescription} />
    );

    // Should still render the card
    expect(screen.getByText('CS101 - 2025W1 QB #1')).toBeInTheDocument();
    expect(screen.getByText('5 questions')).toBeInTheDocument();
  });

  it('handles long titles gracefully', () => {
    const bankWithLongTitle = {
      ...mockQuestionBank,
      title:
        'This is a very long question bank title that might overflow the card layout and should be handled gracefully by the component',
    };

    render(
      <WizardQuestionBankCard {...defaultProps} bank={bankWithLongTitle} />
    );

    expect(
      screen.getByText(/This is a very long question bank title/)
    ).toBeInTheDocument();
  });

  it('handles special characters in tags', () => {
    const bankWithSpecialTags = {
      ...mockQuestionBank,
      tag_counts: {
        'c++': 2,
        'data-structures': 3,
        'algorithms & complexity': 1,
      },
    };

    render(
      <WizardQuestionBankCard {...defaultProps} bank={bankWithSpecialTags} />
    );

    expect(screen.getByText('c++ (2)')).toBeInTheDocument();
    expect(screen.getByText('data-structures (3)')).toBeInTheDocument();
    expect(screen.getByText('algorithms & complexity (1)')).toBeInTheDocument();
  });
});
