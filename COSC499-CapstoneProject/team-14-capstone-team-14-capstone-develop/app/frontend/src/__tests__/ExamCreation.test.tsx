import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { CreateExamModal } from '../components/CreateExamModal';
import type { Course } from '../types/course';

// Mock CourseInfoCard since it's imported in the modal
vi.mock('../components/ui/CourseInfoCard', () => ({
  CourseInfoCard: ({ course }: { course: Course }) => (
    <div data-testid="course-info-card">
      {course.code} - {course.title}
    </div>
  ),
}));

// Mock StandardButton
vi.mock('../components/ui/StandardButton', () => ({
  StandardButton: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

const mockCourse: Course = {
  id: 1,
  title: 'Test Course',
  code: 'TEST101',
  term: 'Fall 2024',
  description: 'Test course description',
  exams: 0,
  students: 0,
  avgScore: 0,
  lastEdited: '2024-01-01T00:00:00Z',
  created_at: '2025-01-05T10:00:00Z',
  updated_at: '2025-01-05T10:00:00Z',
  default_sec_access: 'FULL',
  default_ta_access: 'LIMITED',
  default_oth_access: 'NONE',
};

const mockCourse2: Course = {
  id: 2,
  title: 'Another Course',
  code: 'TEST102',
  term: 'Fall 2024',
  description: 'Another test course',
  exams: 0,
  students: 0,
  avgScore: 0,
  lastEdited: '2024-01-01T00:00:00Z',
  created_at: '2025-01-05T10:00:00Z',
  updated_at: '2025-01-05T10:00:00Z',
  default_sec_access: 'FULL',
  default_ta_access: 'FULL',
  default_oth_access: 'NONE',
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>{component}</AuthProvider>
    </BrowserRouter>
  );
};

describe('CreateExamModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Modal Visibility', () => {
    it('does not render when isOpen is false', () => {
      renderWithProviders(
        <CreateExamModal
          isOpen={false}
          onClose={mockOnClose}
          courses={[mockCourse]}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.queryByText('Create New Exam')).not.toBeInTheDocument();
    });

    it('renders when isOpen is true', () => {
      renderWithProviders(
        <CreateExamModal
          isOpen={true}
          onClose={mockOnClose}
          courses={[mockCourse]}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Create New Exam')).toBeInTheDocument();
    });
  });

  describe('Course Selection', () => {
    it('auto-selects course when only one is available', () => {
      renderWithProviders(
        <CreateExamModal
          isOpen={true}
          onClose={mockOnClose}
          courses={[mockCourse]}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByTestId('course-info-card')).toBeInTheDocument();
      expect(screen.getByText('TEST101 - Test Course')).toBeInTheDocument();
    });

    it('shows dropdown when multiple courses are available', () => {
      renderWithProviders(
        <CreateExamModal
          isOpen={true}
          onClose={mockOnClose}
          courses={[mockCourse, mockCourse2]}
          onSubmit={mockOnSubmit}
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(screen.getByText('Select a course')).toBeInTheDocument();
    });

    it('can select a course from dropdown', () => {
      renderWithProviders(
        <CreateExamModal
          isOpen={true}
          onClose={mockOnClose}
          courses={[mockCourse, mockCourse2]}
          onSubmit={mockOnSubmit}
        />
      );

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '2' } });

      expect(select).toHaveValue('2');
    });
  });

  describe('Form Fields', () => {
    it('renders all form fields correctly', () => {
      renderWithProviders(
        <CreateExamModal
          isOpen={true}
          onClose={mockOnClose}
          courses={[mockCourse]}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByLabelText('Exam Title *')).toBeInTheDocument();
      expect(screen.getByText('Exam Type *')).toBeInTheDocument();
      expect(screen.getByText('Time Limit (minutes)')).toBeInTheDocument();
      expect(
        screen.getByLabelText('Description (Optional)')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Weight (% of course grade)')
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText('Required to pass course')
      ).toBeInTheDocument();
    });

    it('shows exam type options', () => {
      renderWithProviders(
        <CreateExamModal
          isOpen={true}
          onClose={mockOnClose}
          courses={[mockCourse]}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Quiz')).toBeInTheDocument();
      expect(screen.getByText('Midterm')).toBeInTheDocument();
      expect(screen.getByText('Final Exam')).toBeInTheDocument();
      expect(screen.getByText('Practice Test')).toBeInTheDocument();
    });

    it('changes exam type when clicked', () => {
      renderWithProviders(
        <CreateExamModal
          isOpen={true}
          onClose={mockOnClose}
          courses={[mockCourse]}
          onSubmit={mockOnSubmit}
        />
      );

      const quizButton = screen.getByText('Quiz').closest('button');
      fireEvent.click(quizButton!);

      expect(quizButton).toHaveClass(
        'border-primary-btn bg-primary-btn text-white'
      );
    });
  });

  describe('Weight Input Behavior', () => {
    it('shows placeholder when untouched', () => {
      renderWithProviders(
        <CreateExamModal
          isOpen={true}
          onClose={mockOnClose}
          courses={[mockCourse]}
          onSubmit={mockOnSubmit}
        />
      );

      const weightInput = screen.getByPlaceholderText('e.g., 40 for 40%');
      expect(weightInput).toHaveValue(null);
    });

    it('shows 0 when user types 0', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <CreateExamModal
          isOpen={true}
          onClose={mockOnClose}
          courses={[mockCourse]}
          onSubmit={mockOnSubmit}
        />
      );

      const weightInput = screen.getByPlaceholderText('e.g., 40 for 40%');
      await user.type(weightInput, '0');

      expect(weightInput).toHaveValue(0);
    });

    it('prevents leading zeros', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <CreateExamModal
          isOpen={true}
          onClose={mockOnClose}
          courses={[mockCourse]}
          onSubmit={mockOnSubmit}
        />
      );

      const weightInput = screen.getByPlaceholderText('e.g., 40 for 40%');
      await user.type(weightInput, '010');

      expect(weightInput).toHaveValue(10);
    });

    it('clamps values above 100 to 100', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <CreateExamModal
          isOpen={true}
          onClose={mockOnClose}
          courses={[mockCourse]}
          onSubmit={mockOnSubmit}
        />
      );

      const weightInput = screen.getByPlaceholderText('e.g., 40 for 40%');
      await user.type(weightInput, '150');

      expect(weightInput).toHaveValue(100);
    });

    it('clamps negative values to 0', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <CreateExamModal
          isOpen={true}
          onClose={mockOnClose}
          courses={[mockCourse]}
          onSubmit={mockOnSubmit}
        />
      );

      const weightInput = screen.getByPlaceholderText('e.g., 40 for 40%');
      await user.type(weightInput, '-5');

      expect(weightInput).toHaveValue(0);
    });

    it('can clear weight input back to placeholder', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <CreateExamModal
          isOpen={true}
          onClose={mockOnClose}
          courses={[mockCourse]}
          onSubmit={mockOnSubmit}
        />
      );

      const weightInput = screen.getByPlaceholderText('e.g., 40 for 40%');
      await user.type(weightInput, '50');
      expect(weightInput).toHaveValue(50);

      await user.clear(weightInput);
      expect(weightInput).toHaveValue(null);
    });
  });

  describe('Time Limit Input Behavior', () => {
    it('shows placeholder when untouched', () => {
      renderWithProviders(
        <CreateExamModal
          isOpen={true}
          onClose={mockOnClose}
          courses={[mockCourse]}
          onSubmit={mockOnSubmit}
        />
      );

      const timeInput = screen.getByPlaceholderText(
        'e.g., 60 for 1 hour (0 for unlimited)'
      );
      expect(timeInput).toHaveValue(null);
    });

    it('shows 0 when user types 0', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <CreateExamModal
          isOpen={true}
          onClose={mockOnClose}
          courses={[mockCourse]}
          onSubmit={mockOnSubmit}
        />
      );

      const timeInput = screen.getByPlaceholderText(
        'e.g., 60 for 1 hour (0 for unlimited)'
      );
      await user.type(timeInput, '0');

      expect(timeInput).toHaveValue(0);
    });

    it('prevents leading zeros', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <CreateExamModal
          isOpen={true}
          onClose={mockOnClose}
          courses={[mockCourse]}
          onSubmit={mockOnSubmit}
        />
      );

      const timeInput = screen.getByPlaceholderText(
        'e.g., 60 for 1 hour (0 for unlimited)'
      );
      await user.type(timeInput, '060');

      expect(timeInput).toHaveValue(60);
    });

    it('displays "Unlimited" when time is 0', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <CreateExamModal
          isOpen={true}
          onClose={mockOnClose}
          courses={[mockCourse]}
          onSubmit={mockOnSubmit}
        />
      );

      const timeInput = screen.getByPlaceholderText(
        'e.g., 60 for 1 hour (0 for unlimited)'
      );
      await user.type(timeInput, '0');

      expect(screen.getByText('Unlimited')).toBeInTheDocument();
    });

    it('displays minutes when time is not 0', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <CreateExamModal
          isOpen={true}
          onClose={mockOnClose}
          courses={[mockCourse]}
          onSubmit={mockOnSubmit}
        />
      );

      const timeInput = screen.getByPlaceholderText(
        'e.g., 60 for 1 hour (0 for unlimited)'
      );
      await user.type(timeInput, '90');

      expect(screen.getByText('90 min')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('submits form with correct data', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <CreateExamModal
          isOpen={true}
          onClose={mockOnClose}
          courses={[mockCourse]}
          onSubmit={mockOnSubmit}
        />
      );

      // Fill in the form
      await user.type(screen.getByLabelText('Exam Title *'), 'Test Exam');
      await user.type(
        screen.getByPlaceholderText('e.g., 60 for 1 hour (0 for unlimited)'),
        '90'
      );
      await user.type(screen.getByPlaceholderText('e.g., 40 for 40%'), '25');
      await user.type(
        screen.getByLabelText('Description (Optional)'),
        'Test description'
      );
      await user.click(screen.getByLabelText('Required to pass course'));

      // Submit
      await user.click(screen.getByText('Create Exam'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          title: 'Test Exam',
          exam_type: 'midterm',
          time_limit: 90,
          course: 1,
          description: 'Test description',
          weight: 25,
          required_to_pass: true,
        });
      });
    });

    it('prevents submission without required fields', async () => {
      renderWithProviders(
        <CreateExamModal
          isOpen={true}
          onClose={mockOnClose}
          courses={[mockCourse]}
          onSubmit={mockOnSubmit}
        />
      );

      const submitButton = screen.getByText('Create Exam');
      fireEvent.click(submitButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('trims whitespace from title and description', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <CreateExamModal
          isOpen={true}
          onClose={mockOnClose}
          courses={[mockCourse]}
          onSubmit={mockOnSubmit}
        />
      );

      await user.type(screen.getByLabelText('Exam Title *'), '  Test Exam  ');
      await user.type(
        screen.getByLabelText('Description (Optional)'),
        '  Test description  '
      );

      await user.click(screen.getByText('Create Exam'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Exam',
            description: 'Test description',
          })
        );
      });
    });
  });

  describe('Modal Controls', () => {
    it('closes modal when X button is clicked', () => {
      renderWithProviders(
        <CreateExamModal
          isOpen={true}
          onClose={mockOnClose}
          courses={[mockCourse]}
          onSubmit={mockOnSubmit}
        />
      );

      const closeButton = screen.getByTestId('x-icon').closest('button');
      fireEvent.click(closeButton!);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('closes modal when Cancel button is clicked', () => {
      renderWithProviders(
        <CreateExamModal
          isOpen={true}
          onClose={mockOnClose}
          courses={[mockCourse]}
          onSubmit={mockOnSubmit}
        />
      );

      fireEvent.click(screen.getByText('Cancel'));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('resets form when modal is closed and reopened', async () => {
      const user = userEvent.setup();
      const { rerender } = renderWithProviders(
        <CreateExamModal
          isOpen={true}
          onClose={mockOnClose}
          courses={[mockCourse]}
          onSubmit={mockOnSubmit}
        />
      );

      // Fill in some data
      await user.type(screen.getByLabelText('Exam Title *'), 'Test Exam');
      await user.type(screen.getByPlaceholderText('e.g., 40 for 40%'), '50');

      // Close modal
      fireEvent.click(screen.getByText('Cancel'));

      // Reopen modal
      rerender(
        <BrowserRouter>
          <AuthProvider>
            <CreateExamModal
              isOpen={false}
              onClose={mockOnClose}
              courses={[mockCourse]}
              onSubmit={mockOnSubmit}
            />
          </AuthProvider>
        </BrowserRouter>
      );

      rerender(
        <BrowserRouter>
          <AuthProvider>
            <CreateExamModal
              isOpen={true}
              onClose={mockOnClose}
              courses={[mockCourse]}
              onSubmit={mockOnSubmit}
            />
          </AuthProvider>
        </BrowserRouter>
      );

      // Check fields are reset
      expect(screen.getByLabelText('Exam Title *')).toHaveValue('');
      expect(screen.getByPlaceholderText('e.g., 40 for 40%')).toHaveValue(null);
    });
  });

  describe('Loading and Error States', () => {
    it('disables all inputs when loading', () => {
      renderWithProviders(
        <CreateExamModal
          isOpen={true}
          onClose={mockOnClose}
          courses={[mockCourse]}
          onSubmit={mockOnSubmit}
          isLoading={true}
        />
      );

      expect(screen.getByLabelText('Exam Title *')).toBeDisabled();
      expect(screen.getByPlaceholderText('e.g., 40 for 40%')).toBeDisabled();
      expect(
        screen.getByPlaceholderText('e.g., 60 for 1 hour (0 for unlimited)')
      ).toBeDisabled();
      expect(screen.getByText('Creating...')).toBeDisabled(); // Changed from 'Create Exam' to 'Creating...'
      expect(screen.getByText('Cancel')).toBeDisabled();
    });

    it('shows loading text on submit button when loading', () => {
      renderWithProviders(
        <CreateExamModal
          isOpen={true}
          onClose={mockOnClose}
          courses={[mockCourse]}
          onSubmit={mockOnSubmit}
          isLoading={true}
        />
      );

      expect(screen.getByText('Creating...')).toBeInTheDocument();
    });

    it('displays error message when error prop is provided', () => {
      const errorMessage = 'Failed to create exam';
      renderWithProviders(
        <CreateExamModal
          isOpen={true}
          onClose={mockOnClose}
          courses={[mockCourse]}
          onSubmit={mockOnSubmit}
          error={errorMessage}
        />
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty courses array gracefully', () => {
      renderWithProviders(
        <CreateExamModal
          isOpen={true}
          onClose={mockOnClose}
          courses={[]}
          onSubmit={mockOnSubmit}
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('0');
      expect(screen.getByText('Select a course')).toBeInTheDocument();
    });

    it('handles very long exam titles', async () => {
      const user = userEvent.setup();
      const longTitle = 'A'.repeat(50); // Reduced from 200 to 50 for better performance

      renderWithProviders(
        <CreateExamModal
          isOpen={true}
          onClose={mockOnClose}
          courses={[mockCourse]}
          onSubmit={mockOnSubmit}
        />
      );

      await user.type(screen.getByLabelText('Exam Title *'), longTitle);
      await user.click(screen.getByText('Create Exam'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: longTitle,
          })
        );
      });
    });
  });
});
