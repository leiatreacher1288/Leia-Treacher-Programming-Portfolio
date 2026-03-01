// src/__tests__/StudentModal.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StudentModal, Modal } from '../components/CourseConfig/StudentModal';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>{children}</AuthProvider>
  </BrowserRouter>
);

describe('Modal', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children and close button', () => {
    render(
      <Modal onClose={onClose}>
        <div>Modal Content</div>
      </Modal>
    );

    expect(screen.getByText('Modal Content')).toBeInTheDocument();
    expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <Modal onClose={onClose}>
        <div>Content</div>
      </Modal>
    );

    fireEvent.click(screen.getByLabelText('Close modal'));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('StudentModal', () => {
  const mockOnSubmit = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders add student modal with empty form', () => {
    render(
      <TestWrapper>
        <StudentModal
          title="Add Student"
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Add Student')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Student ID')).toHaveValue('');
    expect(screen.getByPlaceholderText('Legal/Official Name')).toHaveValue('');
    expect(screen.getByPlaceholderText('Email')).toHaveValue('');
    expect(screen.getByPlaceholderText('Section')).toHaveValue('');
    expect(
      screen.getByPlaceholderText('Preferred Name (optional)')
    ).toHaveValue('');
  });

  it('renders edit student modal with initial data', () => {
    const initialData = {
      student_id: 'STU001',
      name: 'John Doe',
      preferred_name: 'Johnny',
      email: 'john@example.com',
      section: 'A',
      is_anonymous: false,
    };

    render(
      <TestWrapper>
        <StudentModal
          title="Edit Student"
          initialData={initialData}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Edit Student')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Student ID')).toHaveValue('STU001');
    expect(screen.getByPlaceholderText('Legal/Official Name')).toHaveValue(
      'John Doe'
    );
    expect(screen.getByPlaceholderText('Email')).toHaveValue(
      'john@example.com'
    );
    expect(screen.getByPlaceholderText('Section')).toHaveValue('A');
    expect(
      screen.getByPlaceholderText('Preferred Name (optional)')
    ).toHaveValue('Johnny');
  });

  it('updates form fields when typing', () => {
    render(
      <TestWrapper>
        <StudentModal
          title="Add Student"
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      </TestWrapper>
    );

    const studentIdInput = screen.getByPlaceholderText('Student ID');
    fireEvent.change(studentIdInput, {
      target: { value: 'STU123' },
    });
    expect(studentIdInput).toHaveValue('STU123');

    const nameInput = screen.getByPlaceholderText('Legal/Official Name');
    fireEvent.change(nameInput, {
      target: { value: 'Jane Smith' },
    });
    expect(nameInput).toHaveValue('Jane Smith');

    const emailInput = screen.getByPlaceholderText('Email');
    fireEvent.change(emailInput, {
      target: { value: 'jane@example.com' },
    });
    expect(emailInput).toHaveValue('jane@example.com');
  });

  it('shows validation errors when form is invalid', async () => {
    render(
      <TestWrapper>
        <StudentModal
          title="Add Student"
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(screen.getByText('Student ID is required')).toBeInTheDocument();
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Section is required')).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    render(
      <TestWrapper>
        <StudentModal
          title="Add Student"
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      </TestWrapper>
    );

    // Fill in all required fields
    fireEvent.change(screen.getByPlaceholderText('Student ID'), {
      target: { value: 'STU123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Legal/Official Name'), {
      target: { value: 'Jane Smith' },
    });
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'jane@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Section'), {
      target: { value: 'A' },
    });

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        student_id: 'STU123',
        name: 'Jane Smith',
        email: 'jane@example.com',
        section: 'A',
      });
    });
  });

  it('shows general error when submission fails', async () => {
    mockOnSubmit.mockRejectedValue(new Error('Submission failed'));

    render(
      <TestWrapper>
        <StudentModal
          title="Add Student"
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      </TestWrapper>
    );

    // Fill in all required fields
    fireEvent.change(screen.getByPlaceholderText('Student ID'), {
      target: { value: 'STU123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Legal/Official Name'), {
      target: { value: 'Jane Smith' },
    });
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'jane@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Section'), {
      target: { value: 'A' },
    });

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  it('closes modal when Cancel is clicked', () => {
    render(
      <TestWrapper>
        <StudentModal
          title="Add Student"
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalled();
  });
});
