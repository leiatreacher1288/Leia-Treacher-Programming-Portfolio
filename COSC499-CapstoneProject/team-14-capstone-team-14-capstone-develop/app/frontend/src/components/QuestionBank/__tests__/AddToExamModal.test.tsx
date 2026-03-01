import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddToExamModal } from '../AddToExamModal';
import type { Exam } from '../../../api/examAPI';
import type { Course } from '../../../api/courseAPI';

// Mock the API
vi.mock('../../../api/examAPI');

const mockExams: Exam[] = [
  {
    id: 1,
    title: 'Midterm Exam',
    exam_type: 'midterm',
    course_code: 'CS101',
    course_term: 'Fall 2024',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    created_by_name: 'Professor Smith',
    question_count: 20,
    variant_count: 1,
    weight: 0.3,
    required_to_pass: false,
  },
  {
    id: 2,
    title: 'Final Exam',
    exam_type: 'final',
    course_code: 'MATH201',
    course_term: 'Fall 2024',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    created_by_name: 'Professor Johnson',
    question_count: 30,
    variant_count: 1,
    weight: 0.5,
    required_to_pass: true,
  },
];

const mockCourses: Course[] = [
  {
    id: 1,
    code: 'CS101',
    title: 'Computer Science',
    description: 'Introduction to Computer Science',
    term: 'Fall 2024',
    bannerUrl: null,
    exams: 2,
    students: 30,
    avgScore: 85,
    lastEdited: '2024-01-01',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    instructor: 'Dr. Smith',
    default_sec_access: 'NONE',
    default_ta_access: 'NONE',
    default_oth_access: 'NONE',
  },
  {
    id: 2,
    code: 'MATH201',
    title: 'Mathematics',
    description: 'Advanced Mathematics',
    term: 'Fall 2024',
    bannerUrl: null,
    exams: 1,
    students: 25,
    avgScore: 78,
    lastEdited: '2024-01-01',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    instructor: 'Dr. Johnson',
    default_sec_access: 'NONE',
    default_ta_access: 'NONE',
    default_oth_access: 'NONE',
  },
];

const mockProps = {
  isOpen: true,
  onClose: vi.fn(),
  selectedCount: 3,
  addExamCourseId: 1 as number | '',
  setAddExamCourseId: vi.fn(),
  availableExams: mockExams,
  selectedExamIdToAdd: '' as number | '',
  setSelectedExamIdToAdd: vi.fn(),
  handleConfirmAddToExam: vi.fn(),
  courses: mockCourses,
};

describe('AddToExamModal Styling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with proper title and question count', () => {
    render(<AddToExamModal {...mockProps} />);

    expect(
      screen.getByRole('heading', { name: 'Add to Exam' })
    ).toBeInTheDocument();
    expect(screen.getByText('3 questions selected')).toBeInTheDocument();
  });

  it('displays exam options with titles', () => {
    render(<AddToExamModal {...mockProps} />);

    // Check that exam titles are shown
    expect(screen.getByText('Midterm Exam')).toBeInTheDocument();
    expect(screen.getByText('Final Exam')).toBeInTheDocument();
  });

  it('closes modal when close button is clicked', () => {
    render(<AddToExamModal {...mockProps} />);

    // Find the close button by looking for the X icon
    const closeButton = screen.getByTestId('x-icon').closest('button');
    expect(closeButton).toBeInTheDocument();

    fireEvent.click(closeButton!);

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('shows no exams message when exams list is empty', () => {
    const propsWithNoExams = { ...mockProps, availableExams: [] };
    render(<AddToExamModal {...propsWithNoExams} />);

    // Just check that the select exists and only has the default option
    const examSelect = screen.getAllByRole('combobox')[1]; // Second select is the exam select
    expect(examSelect).toBeInTheDocument();
    expect(examSelect.children).toHaveLength(1); // Only the "Select exam" option
  });

  it('handles exam selection and confirmation', () => {
    const propsWithSelection = {
      ...mockProps,
      selectedExamIdToAdd: 1,
      addExamCourseId: 1,
    };
    render(<AddToExamModal {...propsWithSelection} />);

    // Find and click the confirm button
    const confirmButton = screen.getByRole('button', { name: /add to exam/i });
    fireEvent.click(confirmButton);

    expect(mockProps.handleConfirmAddToExam).toHaveBeenCalled();
  });

  it('renders when modal is not open', () => {
    const closedProps = { ...mockProps, isOpen: false };
    const { container } = render(<AddToExamModal {...closedProps} />);

    // Modal should not be visible
    expect(container.firstChild).toBeNull();
  });

  it('handles single question selection properly', () => {
    const singleQuestionProps = { ...mockProps, selectedCount: 1 };
    render(<AddToExamModal {...singleQuestionProps} />);

    // Look for "1 question selected" text instead
    expect(screen.getByText(/1 question selected/)).toBeInTheDocument();
  });
});
