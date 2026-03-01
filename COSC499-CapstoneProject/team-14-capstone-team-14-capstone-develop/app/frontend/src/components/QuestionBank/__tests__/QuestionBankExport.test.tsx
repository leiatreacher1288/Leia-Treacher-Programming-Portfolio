import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuestionHeader } from '../QuestionHeader';

// Simple test focusing just on the header component
describe('QuestionBank Export Functionality', () => {
  const mockProps = {
    onImportClick: vi.fn(),
    onExportClick: vi.fn(),
    onCreateClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Export Questions button in header', () => {
    render(<QuestionHeader {...mockProps} />);

    expect(screen.getByText('Export Questions')).toBeInTheDocument();
  });

  it('handles export functionality', () => {
    render(<QuestionHeader {...mockProps} />);

    expect(screen.getByText('Export Questions')).toBeInTheDocument();

    // Click the Export Questions button
    fireEvent.click(screen.getByText('Export Questions'));

    // Verify the onClick handler was called
    expect(mockProps.onExportClick).toHaveBeenCalledTimes(1);
  });
});
