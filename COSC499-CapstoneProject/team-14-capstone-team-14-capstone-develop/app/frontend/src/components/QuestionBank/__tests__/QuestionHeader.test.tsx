import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QuestionHeader } from '../QuestionHeader';

describe('QuestionHeader', () => {
  const mockProps = {
    onImportClick: vi.fn(),
    onExportClick: vi.fn(),
    onCreateClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Question Bank title', () => {
    render(<QuestionHeader {...mockProps} />);
    expect(screen.getByText('Question Bank')).toBeInTheDocument();
  });

  it('renders all three action buttons', () => {
    render(<QuestionHeader {...mockProps} />);

    expect(screen.getByText('Import Questions')).toBeInTheDocument();
    expect(screen.getByText('Export Questions')).toBeInTheDocument();
    expect(screen.getByText('Create New Question')).toBeInTheDocument();
  });

  it('has buttons in the correct order: Import, Export, Create', () => {
    render(<QuestionHeader {...mockProps} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveTextContent('Import Questions');
    expect(buttons[1]).toHaveTextContent('Export Questions');
    expect(buttons[2]).toHaveTextContent('Create New Question');
  });

  it('calls onImportClick when Import button is clicked', () => {
    render(<QuestionHeader {...mockProps} />);

    fireEvent.click(screen.getByText('Import Questions'));
    expect(mockProps.onImportClick).toHaveBeenCalledTimes(1);
  });

  it('calls onExportClick when Export button is clicked', () => {
    render(<QuestionHeader {...mockProps} />);

    fireEvent.click(screen.getByText('Export Questions'));
    expect(mockProps.onExportClick).toHaveBeenCalledTimes(1);
  });

  it('calls onCreateClick when Create button is clicked', () => {
    render(<QuestionHeader {...mockProps} />);

    fireEvent.click(screen.getByText('Create New Question'));
    expect(mockProps.onCreateClick).toHaveBeenCalledTimes(1);
  });

  it('Export button uses secondary-btn styling', () => {
    render(<QuestionHeader {...mockProps} />);

    const exportButton = screen.getByText('Export Questions').closest('button');
    expect(exportButton).toHaveClass('bg-secondary-btn');
  });

  it('Create button uses primary-btn styling', () => {
    render(<QuestionHeader {...mockProps} />);

    const createButton = screen
      .getByText('Create New Question')
      .closest('button');
    expect(createButton).toHaveClass('bg-primary-btn');
  });

  it('buttons have proper icons', () => {
    render(<QuestionHeader {...mockProps} />);

    // Check that buttons have icon elements (mocked as div with data-testid)
    const importButton = screen.getByText('Import Questions').closest('button');
    const exportButton = screen.getByText('Export Questions').closest('button');
    const createButton = screen
      .getByText('Create New Question')
      .closest('button');

    // Check for mocked icon elements instead of SVG
    expect(
      importButton?.querySelector('[data-testid="upload-icon"]')
    ).toBeInTheDocument();
    expect(
      exportButton?.querySelector('[data-testid="download-icon"]')
    ).toBeInTheDocument();
    expect(
      createButton?.querySelector('[data-testid="icon-fiplus"]')
    ).toBeInTheDocument();
  });
});
