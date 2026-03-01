import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FilterPanel } from '../FilterPanel';

describe('FilterPanel', () => {
  const mockCourses = [
    { id: 1, code: 'CS101', title: 'Introduction to Computer Science' },
    { id: 2, code: 'MATH200', title: 'Linear Algebra' },
    { id: 3, code: 'PHYS101', title: 'Physics I' },
  ];

  const mockFilters = {
    course: 'All Courses',
    difficulty: 'All Difficulties',
    tags: [],
  };

  const mockProps = {
    filters: mockFilters,
    courses: mockCourses,
    onFilterChange: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders filter panel with all sections', () => {
    render(<FilterPanel {...mockProps} />);

    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('Course')).toBeInTheDocument();
    expect(screen.getByText('Difficulty')).toBeInTheDocument();
    expect(screen.getByText('Tags')).toBeInTheDocument();
  });

  it('displays courses with "CODE - TITLE" format in dropdown', () => {
    render(<FilterPanel {...mockProps} />);

    // Check that course options include both code and title in the correct format
    expect(
      screen.getByText('CS101 - Introduction to Computer Science')
    ).toBeInTheDocument();
    expect(screen.getByText('MATH200 - Linear Algebra')).toBeInTheDocument();
    expect(screen.getByText('PHYS101 - Physics I')).toBeInTheDocument();
  });

  it('includes "All Courses" as default option', () => {
    render(<FilterPanel {...mockProps} />);

    expect(screen.getByText('All Courses')).toBeInTheDocument();
  });

  it('calls onFilterChange when course selection changes', () => {
    render(<FilterPanel {...mockProps} />);

    const courseSelect = screen.getByDisplayValue('All Courses');
    fireEvent.change(courseSelect, {
      target: { value: 'Introduction to Computer Science' },
    });

    expect(mockProps.onFilterChange).toHaveBeenCalledWith(
      'course',
      'Introduction to Computer Science'
    );
  });

  it('calls onFilterChange when difficulty selection changes', () => {
    render(<FilterPanel {...mockProps} />);

    const difficultySelect = screen.getByDisplayValue('All Difficulties');
    fireEvent.change(difficultySelect, { target: { value: 'Medium' } });

    expect(mockProps.onFilterChange).toHaveBeenCalledWith(
      'difficulty',
      'Medium'
    );
  });

  it('calls onFilterChange when tags input changes', () => {
    render(<FilterPanel {...mockProps} />);

    const tagsInput = screen.getByPlaceholderText(
      'Enter tags separated by commas'
    );
    fireEvent.change(tagsInput, { target: { value: 'programming, basics' } });

    expect(mockProps.onFilterChange).toHaveBeenCalledWith('tags', [
      'programming',
      'basics',
    ]);
  });

  it('filters out empty tags when parsing tag input', () => {
    render(<FilterPanel {...mockProps} />);

    const tagsInput = screen.getByPlaceholderText(
      'Enter tags separated by commas'
    );
    fireEvent.change(tagsInput, {
      target: { value: 'programming, , basics,  , advanced' },
    });

    // Should filter out empty strings and whitespace-only strings
    expect(mockProps.onFilterChange).toHaveBeenCalledWith('tags', [
      'programming',
      'basics',
      'advanced',
    ]);
  });

  it('calls onClose when close button is clicked', () => {
    render(<FilterPanel {...mockProps} />);

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('includes all difficulty options', () => {
    render(<FilterPanel {...mockProps} />);

    expect(screen.getByText('All Difficulties')).toBeInTheDocument();
    expect(screen.getByText('Easy')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Hard')).toBeInTheDocument();
  });

  it('displays current filter values correctly', () => {
    const filtersWithValues = {
      course: 'Introduction to Computer Science',
      difficulty: 'Medium',
      tags: ['programming', 'algorithms'],
    };

    render(<FilterPanel {...mockProps} filters={filtersWithValues} />);

    // Check that the correct values are selected
    const selects = screen.getAllByRole('combobox');
    const courseSelect = selects[0]; // First select is course
    const difficultySelect = selects[1]; // Second select is difficulty

    expect(courseSelect).toHaveValue('Introduction to Computer Science');
    expect(difficultySelect).toHaveValue('Medium');

    expect(
      screen.getByDisplayValue('programming, algorithms')
    ).toBeInTheDocument();
  });

  it('has proper grid layout styling', () => {
    const { container } = render(<FilterPanel {...mockProps} />);

    const gridContainer = container.querySelector('.grid');
    expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-3', 'gap-4');
  });
});
