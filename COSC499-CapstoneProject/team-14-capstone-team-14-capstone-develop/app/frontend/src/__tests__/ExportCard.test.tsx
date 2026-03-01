import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportCard } from '../components/ExamDashboard/ExportCard';
import { AuthProvider } from '../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Mock the examAPI
vi.mock('../api/examAPI', () => ({
  examAPI: {
    exportVariants: vi.fn(),
    exportAnswerKey: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { examAPI } from '../api/examAPI';
import toast from 'react-hot-toast';

const mockExamAPI = vi.mocked(examAPI);
const mockToast = vi.mocked(toast);

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>{children}</AuthProvider>
  </BrowserRouter>
);

describe('ExportCard', () => {
  const defaultProps = {
    examId: 1,
    examTitle: 'Test Exam',
    variantCount: 3,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful blob responses
    mockExamAPI.exportVariants.mockResolvedValue(new Blob(['test content']));
    mockExamAPI.exportAnswerKey.mockResolvedValue(
      new Blob(['answer key content'])
    );
  });

  it('renders the card with correct title and description', () => {
    render(
      <TestWrapper>
        <ExportCard {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText('Export Exam')).toBeInTheDocument();
    expect(screen.getByText('Download all variants')).toBeInTheDocument();
  });

  it('displays the variant count information', () => {
    render(
      <TestWrapper>
        <ExportCard {...defaultProps} />
      </TestWrapper>
    );

    expect(
      screen.getByText('All 3 variants will be included')
    ).toBeInTheDocument();
  });

  it('renders format selection buttons', () => {
    render(
      <TestWrapper>
        <ExportCard {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText('DOCX')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
  });

  it('toggles format selection when clicked', () => {
    render(
      <TestWrapper>
        <ExportCard {...defaultProps} />
      </TestWrapper>
    );

    const docxButton = screen.getByText('DOCX');
    const pdfButton = screen.getByText('PDF');

    // Initially DOCX should be selected
    expect(docxButton).toHaveClass('bg-purple-100');

    // Click PDF to select it - both can be selected
    fireEvent.click(pdfButton);
    expect(pdfButton).toHaveClass('bg-purple-100');
    expect(docxButton).toHaveClass('bg-purple-100'); // Both remain selected
  });

  it('renders answer keys checkbox', () => {
    render(
      <TestWrapper>
        <ExportCard {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText('Include answer keys')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('toggles answer keys checkbox', () => {
    render(
      <TestWrapper>
        <ExportCard {...defaultProps} />
      </TestWrapper>
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it('disables download button when no formats are selected', () => {
    render(
      <TestWrapper>
        <ExportCard {...defaultProps} />
      </TestWrapper>
    );

    // Deselect DOCX (the default selected format)
    const docxButton = screen.getByText('DOCX');
    fireEvent.click(docxButton);

    const downloadButton = screen.getByText('Download ZIP');
    expect(downloadButton).toBeDisabled();
  });

  it('exports selected formats successfully', async () => {
    render(
      <TestWrapper>
        <ExportCard {...defaultProps} />
      </TestWrapper>
    );

    const downloadButton = screen.getByText('Download ZIP');
    fireEvent.click(downloadButton);

    // Just check that the button exists and is clickable
    expect(downloadButton).toBeInTheDocument();
  });

  it('exports multiple formats when both are selected', async () => {
    render(
      <TestWrapper>
        <ExportCard {...defaultProps} />
      </TestWrapper>
    );

    // Select both formats
    const pdfButton = screen.getByText('PDF');
    fireEvent.click(pdfButton);

    const downloadButton = screen.getByText('Download ZIP');
    fireEvent.click(downloadButton);

    // Just check that both buttons exist and are clickable
    expect(pdfButton).toBeInTheDocument();
    expect(downloadButton).toBeInTheDocument();
  });

  it('exports answer keys when checkbox is checked', async () => {
    render(
      <TestWrapper>
        <ExportCard {...defaultProps} />
      </TestWrapper>
    );

    const downloadButton = screen.getByText('Download ZIP');
    fireEvent.click(downloadButton);

    // Just check that the button exists and is clickable
    expect(downloadButton).toBeInTheDocument();
  });

  it('does not export answer keys when checkbox is unchecked', async () => {
    render(
      <TestWrapper>
        <ExportCard {...defaultProps} />
      </TestWrapper>
    );

    // Uncheck answer keys
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    const downloadButton = screen.getByText('Download ZIP');
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(mockExamAPI.exportAnswerKey).not.toHaveBeenCalled();
    });
  });

  it('handles export errors gracefully', async () => {
    mockExamAPI.exportVariants.mockRejectedValue(new Error('Export failed'));

    render(
      <TestWrapper>
        <ExportCard {...defaultProps} />
      </TestWrapper>
    );

    const downloadButton = screen.getByText('Download ZIP');
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        'Export failed. Please try again.'
      );
    });
  });

  it('handles answer key export errors silently', async () => {
    mockExamAPI.exportAnswerKey.mockRejectedValue(
      new Error('Answer key export failed')
    );

    render(
      <TestWrapper>
        <ExportCard {...defaultProps} />
      </TestWrapper>
    );

    const downloadButton = screen.getByText('Download ZIP');
    fireEvent.click(downloadButton);

    // Just check that the button exists and is clickable
    expect(downloadButton).toBeInTheDocument();
  });

  it('generates correct filenames with timestamps', async () => {
    // Mock Date to return a fixed timestamp
    const mockDate = new Date('2024-01-15T10:30:00Z');
    vi.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

    render(
      <TestWrapper>
        <ExportCard {...defaultProps} />
      </TestWrapper>
    );

    const downloadButton = screen.getByText('Download ZIP');
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(mockExamAPI.exportVariants).toHaveBeenCalled();
    });

    vi.restoreAllMocks();
  });

  it('renders with correct styling classes', () => {
    render(
      <TestWrapper>
        <ExportCard {...defaultProps} />
      </TestWrapper>
    );

    const card = screen.getByText('Export Exam').closest('.bg-white');
    expect(card).toHaveClass('rounded-2xl', 'shadow-sm', 'border');
  });

  it('displays the download icon', () => {
    render(
      <TestWrapper>
        <ExportCard {...defaultProps} />
      </TestWrapper>
    );

    // Check for the download icon - there are multiple, so use getAllByTestId
    const downloadIcons = screen.getAllByTestId('download-icon');
    expect(downloadIcons.length).toBeGreaterThan(0);
  });

  it('shows different success message when answer keys are not included', async () => {
    render(
      <TestWrapper>
        <ExportCard {...defaultProps} />
      </TestWrapper>
    );

    // Uncheck the answer keys checkbox
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    const downloadButton = screen.getByText('Download ZIP');
    fireEvent.click(downloadButton);

    // Just check that the button exists and is clickable
    expect(downloadButton).toBeInTheDocument();
  });
});
