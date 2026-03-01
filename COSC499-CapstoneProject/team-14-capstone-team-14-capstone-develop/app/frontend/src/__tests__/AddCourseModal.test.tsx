// src/__tests__/AddCourseModal.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AddCourseModal } from '../components/AddCourseModal';

describe('AddCourseModal', () => {
  const onClose = vi.fn();
  const onSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <BrowserRouter>
        <AddCourseModal isOpen={false} onClose={onClose} onSubmit={onSubmit} />
      </BrowserRouter>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders form fields when open', () => {
    render(
      <BrowserRouter>
        <AddCourseModal isOpen onClose={onClose} onSubmit={onSubmit} />
      </BrowserRouter>
    );
    expect(screen.getByLabelText('Course Code')).toBeInTheDocument();
    expect(screen.getByLabelText('Course Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Course Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Term')).toBeInTheDocument();
    expect(screen.getByLabelText('Year')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /create course/i })
    ).toBeInTheDocument();
  });

  it('calls onSubmit with required fields only when submitted', async () => {
    onSubmit.mockResolvedValueOnce(undefined);
    render(
      <BrowserRouter>
        <AddCourseModal isOpen onClose={onClose} onSubmit={onSubmit} />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText('Course Code'), {
      target: { value: 'COSC123' },
    });
    fireEvent.change(screen.getByLabelText('Course Name'), {
      target: { value: 'Test Course' },
    });
    fireEvent.change(screen.getByLabelText('Course Description'), {
      target: { value: 'A fun test course' },
    });
    fireEvent.change(screen.getByLabelText('Term'), {
      target: { value: 'S1' },
    });
    fireEvent.change(screen.getByLabelText('Year'), {
      target: { value: '2026' },
    });
    // leave banner empty

    fireEvent.click(screen.getByRole('button', { name: /create course/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'COSC123',
          name: 'Test Course',
          term: expect.any(String),
        })
      );
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('includes banner when provided and valid', async () => {
    onSubmit.mockResolvedValueOnce(undefined);
    render(
      <BrowserRouter>
        <AddCourseModal isOpen onClose={onClose} onSubmit={onSubmit} />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText('Course Code'), {
      target: { value: 'COSC456' },
    });
    fireEvent.change(screen.getByLabelText('Course Name'), {
      target: { value: 'Another Course' },
    });
    fireEvent.change(screen.getByLabelText('Course Description'), {
      target: { value: 'Another test course' },
    });
    fireEvent.change(screen.getByLabelText('Term'), {
      target: { value: 'W2' },
    });
    fireEvent.change(screen.getByLabelText('Year'), {
      target: { value: '2027' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create course/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'COSC456',
          name: 'Another Course',
          term: expect.any(String),
        })
      );
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('keeps modal open when submission fails validation', async () => {
    onSubmit.mockRejectedValueOnce({
      response: { status: 400, data: { code: ['Invalid code'] } },
    });
    render(
      <BrowserRouter>
        <AddCourseModal isOpen onClose={onClose} onSubmit={onSubmit} />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText('Course Code'), {
      target: { value: 'BAD' },
    });
    fireEvent.change(screen.getByLabelText('Course Name'), {
      target: { value: 'Name' },
    });
    fireEvent.change(screen.getByLabelText('Course Description'), {
      target: { value: 'Some description' },
    });
    fireEvent.change(screen.getByLabelText('Term'), {
      target: { value: 'S2' },
    });
    fireEvent.change(screen.getByLabelText('Year'), {
      target: { value: '2025' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create course/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });

    // modal should remain open
    expect(screen.getByLabelText('Course Code')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /create course/i })
    ).toBeEnabled();
  });

  it('calls onClose when Cancel button clicked', () => {
    render(
      <BrowserRouter>
        <AddCourseModal isOpen onClose={onClose} onSubmit={onSubmit} />
      </BrowserRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
