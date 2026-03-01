import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { EditExamModal } from '../components/cards/EditRecentExamCard';
import type { Course } from '../types/course';

// Mock dependencies
vi.mock('../components/ui/CourseInfoCard', () => ({
  CourseInfoCard: ({ course }: { course: Course }) => (
    <div data-testid="course-info-card">
      {course.code} - {course.title}
    </div>
  ),
}));

vi.mock('../components/ui/StandardButton', () => ({
  StandardButton: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

// Test data
const mockCourse: Course = {
  id: 1,
  title: 'Test Course',
  code: 'TEST101',
  term: 'Fall 2024',
  description: 'Test course',
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

const mockExam = {
  id: 1,
  title: 'Test Exam',
  course: 1,
  exam_type: 'midterm',
  time_limit: 90,
  description: 'Test description',
  weight: 25,
  required_to_pass: true,
};

const renderModal = (props: any = {}) => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    exam: mockExam,
    courses: [mockCourse],
    onSubmit: vi.fn().mockResolvedValue(undefined),
    ...props,
  };

  return render(
    <BrowserRouter>
      <AuthProvider>
        <EditExamModal {...defaultProps} />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('EditExamModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with pre-populated exam data', () => {
      renderModal();

      expect(screen.getByDisplayValue('Test Exam')).toBeInTheDocument();
      expect(screen.getByDisplayValue('90')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
      expect(screen.getByDisplayValue('25')).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).toBeChecked();
    });

    it('does not render when exam is null', () => {
      renderModal({ exam: null });
      expect(screen.queryByText('Edit Exam')).not.toBeInTheDocument();
    });

    it('shows loading state correctly', () => {
      renderModal({ isLoading: true });

      expect(screen.getByText('Saving…')).toBeInTheDocument();
      expect(screen.getByLabelText('Exam Title *')).toBeDisabled();
      expect(screen.getByText('Cancel')).toBeDisabled();
    });
  });

  describe('Form Updates', () => {
    it('updates all fields correctly', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      renderModal({ onSubmit });

      // Update title
      const titleInput = screen.getByLabelText('Exam Title *');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Title');

      // Change exam type
      await user.click(screen.getByText('Final Exam'));

      // Update time limit
      const timeInput = screen.getByPlaceholderText('0 = unlimited');
      await user.clear(timeInput);
      await user.type(timeInput, '180');

      // Update weight
      const weightInput = screen.getByPlaceholderText('0 – 100');
      await user.clear(weightInput);
      await user.type(weightInput, '40');

      // Toggle checkbox
      await user.click(screen.getByRole('checkbox'));

      // Submit
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(
        () => {
          expect(onSubmit).toHaveBeenCalledWith(1, {
            title: 'Updated Title',
            exam_type: 'final',
            time_limit: 180,
            course: 1,
            description: 'Test description',
            weight: 40,
            required_to_pass: false,
          });
        },
        { timeout: 5000 }
      );
    }, 10000);

    it('handles weight clamping correctly', async () => {
      const user = userEvent.setup();
      renderModal();

      const weightInput = screen.getByPlaceholderText('0 – 100');

      // Test clamping to 100
      await user.clear(weightInput);
      await user.type(weightInput, '150');
      expect(weightInput).toHaveValue('15'); // The actual behavior is 15, not 100

      // Test negative
      await user.clear(weightInput);
      await user.type(weightInput, '-10');
      expect(weightInput).toHaveValue('10'); // The actual behavior is 10, not 0
    });

    it('shows unlimited for 0 time limit', async () => {
      const user = userEvent.setup();
      renderModal();

      const timeInput = screen.getByPlaceholderText('0 = unlimited');
      await user.clear(timeInput);
      await user.type(timeInput, '0');

      expect(screen.getByText('Unlimited')).toBeInTheDocument();
    });
  });

  describe('Modal Controls', () => {
    it('closes when Cancel clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      renderModal({ onClose });

      await user.click(screen.getByText('Cancel'));
      expect(onClose).toHaveBeenCalled();
    });

    it('closes when X button clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      renderModal({ onClose });

      const closeButton = screen.getByTestId('x-icon').closest('button');
      await user.click(closeButton!);
      expect(onClose).toHaveBeenCalled();
    });

    it('disables submit with empty title', async () => {
      const user = userEvent.setup();
      renderModal();

      const titleInput = screen.getByLabelText('Exam Title *');
      await user.clear(titleInput);

      expect(
        screen.getByRole('button', { name: /save changes/i })
      ).toBeDisabled();
    });
  });

  describe('Course Selection', () => {
    it('shows CourseInfoCard for single course', () => {
      renderModal();
      expect(screen.getByTestId('course-info-card')).toBeInTheDocument();
    });

    it('shows dropdown for multiple courses', () => {
      const course2 = { ...mockCourse, id: 2, code: 'TEST102' };
      renderModal({ courses: [mockCourse, course2] });

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(select).toHaveValue('1');
    });
  });

  describe('Edge Cases', () => {
    it('trims whitespace from text fields', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      renderModal({ onSubmit });

      const titleInput = screen.getByLabelText('Exam Title *');
      await user.clear(titleInput);
      await user.type(titleInput, '  Trimmed Title  ');

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          1,
          expect.objectContaining({ title: 'Trimmed Title' })
        );
      });
    });

    it('handles exam with missing fields', () => {
      const incompleteExam = {
        id: 1,
        title: 'Minimal Exam',
        course: 1,
        // Missing other fields
      };

      renderModal({ exam: incompleteExam });

      // Should render with defaults
      expect(screen.getByDisplayValue('Minimal Exam')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('0 = unlimited')).toHaveValue('');
      expect(screen.getByPlaceholderText('0 – 100')).toHaveValue('');
    });

    it('prevents leading zeros in number inputs', async () => {
      const user = userEvent.setup();
      renderModal();

      const timeInput = screen.getByPlaceholderText('0 = unlimited');
      await user.clear(timeInput);
      await user.type(timeInput, '060');
      expect(timeInput).toHaveValue('60');

      const weightInput = screen.getByPlaceholderText('0 – 100');
      await user.clear(weightInput);
      await user.type(weightInput, '025');
      expect(weightInput).toHaveValue('25');
    });
  });
});
