// src/components/Analytics/__tests__/StudentReportSection.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { StudentReportSection } from '../StudentReportSection';

// Mock all APIs - keep it simple
vi.mock('../../../api/axiosInstance', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../../api/courseAPI', () => ({
  courseAPI: {
    getStudents: vi.fn(),
  },
}));

vi.mock('../../../api/analyticsAPI', () => ({
  analyticsAPI: {
    getStudentReport: vi.fn(),
  },
}));

// Mock components to avoid router dependencies
vi.mock('../../../components/ui/SearchBar', () => ({
  SearchBar: ({
    onSearch,
    placeholder,
  }: {
    onSearch: (value: string) => void;
    placeholder: string;
  }) => (
    <input
      data-testid="search-bar"
      placeholder={placeholder}
      onChange={(e) => onSearch(e.target.value)}
    />
  ),
}));

vi.mock('../AnalyticsErrorBoundary', () => ({
  AnalyticsErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="analytics-error-boundary">{children}</div>
  ),
}));

// Simple mock data - no complex types needed
const mockCourses = [
  {
    id: 1,
    code: 'COSC499',
    title: 'Capstone Project',
    term: 'W1 2024',
    description: 'Final year capstone project course',
  },
  {
    id: 2,
    code: 'COSC304',
    title: 'Introduction to Database Systems',
    term: 'W1 2024',
    description: 'Database fundamentals course',
  },
];

const mockStudents = [
  {
    id: 1,
    student_id: 'S001',
    display_id: 'S001',
    name: 'John Doe',
    display_name: 'John Doe',
    email: 'john.doe@student.com',
    section: 'L01',
    is_active: true,
    enrolled_at: '2024-01-15T00:00:00Z',
    created_at: '2024-01-15T00:00:00Z',
    notes: '',
    is_anonymous: false,
    overall_score: 85.5,
  },
  {
    id: 2,
    student_id: 'S002',
    display_id: 'S002',
    name: 'Jane Smith',
    display_name: 'Jane Smith',
    email: 'jane.smith@student.com',
    section: 'L01',
    is_active: true,
    enrolled_at: '2024-01-15T00:00:00Z',
    created_at: '2024-01-15T00:00:00Z',
    notes: '',
    is_anonymous: false,
    overall_score: 87.2,
  },
];

const mockStudentReport = {
  student: mockStudents[0],
  coursePerformance: {
    examsCompleted: 3,
    studentAverage: 85.5,
    studentBest: 95,
    studentWorst: 78,
    classAverage: 82.3,
    classMedian: 83.0,
    classBest: 98,
    totalClassStudents: 25,
  },
  examResults: [
    {
      examId: 1,
      examTitle: 'Midterm Exam',
      studentScore: 85,
      maxScore: 100,
      submittedAt: '2024-03-15T10:30:00Z',
    },
    {
      examId: 2,
      examTitle: 'Final Exam',
      studentScore: 92,
      maxScore: 100,
      submittedAt: '2024-04-20T14:30:00Z',
    },
  ],
};

describe('StudentReportSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock basic globals needed for download functionality
    global.URL.createObjectURL = vi.fn(() => 'mock-url');
    global.URL.revokeObjectURL = vi.fn();
    window.alert = vi.fn();

    // Mock document createElement for download links
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
      remove: vi.fn(),
    };
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
  });

  it('renders without crashing', () => {
    render(<StudentReportSection allCourses={mockCourses} />);
    expect(screen.getByText('Student Reports (UR2.17)')).toBeInTheDocument();
  });

  it('displays course selection dropdown', () => {
    render(<StudentReportSection allCourses={mockCourses} />);
    expect(screen.getByText('Select Course')).toBeInTheDocument();
  });

  it('loads students when course is selected', async () => {
    const { courseAPI } = await import('../../../api/courseAPI');
    vi.mocked(courseAPI.getStudents).mockResolvedValue(mockStudents);

    render(<StudentReportSection allCourses={mockCourses} />);

    const courseSelect = screen.getByDisplayValue('');
    fireEvent.change(courseSelect, { target: { value: 'COSC499' } });

    await waitFor(() => {
      expect(courseAPI.getStudents).toHaveBeenCalledWith(1);
    });
  });

  it('displays student list after course selection', async () => {
    const { courseAPI } = await import('../../../api/courseAPI');
    vi.mocked(courseAPI.getStudents).mockResolvedValue(mockStudents);

    render(<StudentReportSection allCourses={mockCourses} />);

    const courseSelect = screen.getByDisplayValue('');
    fireEvent.change(courseSelect, { target: { value: 'COSC499' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('filters students based on search input', async () => {
    const { courseAPI } = await import('../../../api/courseAPI');
    vi.mocked(courseAPI.getStudents).mockResolvedValue(mockStudents);

    render(<StudentReportSection allCourses={mockCourses} />);

    const courseSelect = screen.getByDisplayValue('');
    fireEvent.change(courseSelect, { target: { value: 'COSC499' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('search-bar');
    fireEvent.change(searchInput, { target: { value: 'Jane' } });

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  it('loads student report when student is selected', async () => {
    const { courseAPI } = await import('../../../api/courseAPI');
    const { analyticsAPI } = await import('../../../api/analyticsAPI');

    vi.mocked(courseAPI.getStudents).mockResolvedValue(mockStudents);
    vi.mocked(analyticsAPI.getStudentReport).mockResolvedValue(
      mockStudentReport
    );

    render(<StudentReportSection allCourses={mockCourses} />);

    const courseSelect = screen.getByDisplayValue('');
    fireEvent.change(courseSelect, { target: { value: 'COSC499' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const studentButton = screen.getByText('John Doe');
    fireEvent.click(studentButton);

    await waitFor(() => {
      expect(analyticsAPI.getStudentReport).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('Export Functionality', () => {
    it('renders export buttons when student report is loaded', async () => {
      const { courseAPI } = await import('../../../api/courseAPI');
      const { analyticsAPI } = await import('../../../api/analyticsAPI');

      vi.mocked(courseAPI.getStudents).mockResolvedValue(mockStudents);
      vi.mocked(analyticsAPI.getStudentReport).mockResolvedValue(
        mockStudentReport
      );

      render(<StudentReportSection allCourses={mockCourses} />);

      const courseSelect = screen.getByDisplayValue('');
      fireEvent.change(courseSelect, { target: { value: 'COSC499' } });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const studentButton = screen.getByText('John Doe');
      fireEvent.click(studentButton);

      await waitFor(() => {
        expect(screen.getByText('Export as PDF')).toBeInTheDocument();
        expect(screen.getByText('Export as DOCX')).toBeInTheDocument();
        expect(screen.getByText('Export as CSV')).toBeInTheDocument();
      });
    });

    it('calls correct API endpoint when PDF export is clicked', async () => {
      const { courseAPI } = await import('../../../api/courseAPI');
      const { analyticsAPI } = await import('../../../api/analyticsAPI');
      const axiosInstance = await import('../../../api/axiosInstance');

      vi.mocked(courseAPI.getStudents).mockResolvedValue(mockStudents);
      vi.mocked(analyticsAPI.getStudentReport).mockResolvedValue(
        mockStudentReport
      );

      const mockGet = vi.fn().mockResolvedValue({
        data: new Blob(['pdf content'], { type: 'application/pdf' }),
      });
      vi.mocked(axiosInstance.default.get).mockImplementation(mockGet);

      render(<StudentReportSection allCourses={mockCourses} />);

      const courseSelect = screen.getByDisplayValue('');
      fireEvent.change(courseSelect, { target: { value: 'COSC499' } });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const studentButton = screen.getByText('John Doe');
      fireEvent.click(studentButton);

      await waitFor(() => {
        expect(screen.getByText('Export as PDF')).toBeInTheDocument();
      });

      const pdfButton = screen.getByText('Export as PDF');
      fireEvent.click(pdfButton);

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalledWith(
          '/analytics/export/student-report/pdf/',
          expect.objectContaining({
            params: { course_id: 1, student_id: 1 },
            responseType: 'blob',
          })
        );
      });
    });

    it('calls correct API endpoint when DOCX export is clicked', async () => {
      const { courseAPI } = await import('../../../api/courseAPI');
      const { analyticsAPI } = await import('../../../api/analyticsAPI');
      const axiosInstance = await import('../../../api/axiosInstance');

      vi.mocked(courseAPI.getStudents).mockResolvedValue(mockStudents);
      vi.mocked(analyticsAPI.getStudentReport).mockResolvedValue(
        mockStudentReport
      );

      const mockGet = vi.fn().mockResolvedValue({
        data: new Blob(['docx content'], {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        }),
      });
      vi.mocked(axiosInstance.default.get).mockImplementation(mockGet);

      render(<StudentReportSection allCourses={mockCourses} />);

      const courseSelect = screen.getByDisplayValue('');
      fireEvent.change(courseSelect, { target: { value: 'COSC499' } });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const studentButton = screen.getByText('John Doe');
      fireEvent.click(studentButton);

      await waitFor(() => {
        expect(screen.getByText('Export as DOCX')).toBeInTheDocument();
      });

      const docxButton = screen.getByText('Export as DOCX');
      fireEvent.click(docxButton);

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalledWith(
          '/analytics/export/student-report/docx/',
          expect.objectContaining({
            params: { course_id: 1, student_id: 1 },
            responseType: 'blob',
          })
        );
      });
    });

    it('calls correct API endpoint when CSV export is clicked', async () => {
      const { courseAPI } = await import('../../../api/courseAPI');
      const { analyticsAPI } = await import('../../../api/analyticsAPI');
      const axiosInstance = await import('../../../api/axiosInstance');

      vi.mocked(courseAPI.getStudents).mockResolvedValue(mockStudents);
      vi.mocked(analyticsAPI.getStudentReport).mockResolvedValue(
        mockStudentReport
      );

      const mockGet = vi.fn().mockResolvedValue({
        data: new Blob(['csv content'], { type: 'text/csv' }),
      });
      vi.mocked(axiosInstance.default.get).mockImplementation(mockGet);

      render(<StudentReportSection allCourses={mockCourses} />);

      const courseSelect = screen.getByDisplayValue('');
      fireEvent.change(courseSelect, { target: { value: 'COSC499' } });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const studentButton = screen.getByText('John Doe');
      fireEvent.click(studentButton);

      await waitFor(() => {
        expect(screen.getByText('Export as CSV')).toBeInTheDocument();
      });

      const csvButton = screen.getByText('Export as CSV');
      fireEvent.click(csvButton);

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalledWith(
          '/analytics/export/student-report/csv/',
          expect.objectContaining({
            params: { course_id: 1, student_id: 1 },
            responseType: 'blob',
          })
        );
      });
    });

    it('handles export errors gracefully', async () => {
      const { courseAPI } = await import('../../../api/courseAPI');
      const { analyticsAPI } = await import('../../../api/analyticsAPI');
      const axiosInstance = await import('../../../api/axiosInstance');

      vi.mocked(courseAPI.getStudents).mockResolvedValue(mockStudents);
      vi.mocked(analyticsAPI.getStudentReport).mockResolvedValue(
        mockStudentReport
      );

      const mockGet = vi.fn().mockRejectedValue(new Error('Export failed'));
      vi.mocked(axiosInstance.default.get).mockImplementation(mockGet);

      render(<StudentReportSection allCourses={mockCourses} />);

      const courseSelect = screen.getByDisplayValue('');
      fireEvent.change(courseSelect, { target: { value: 'COSC499' } });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const studentButton = screen.getByText('John Doe');
      fireEvent.click(studentButton);

      await waitFor(() => {
        expect(screen.getByText('Export as PDF')).toBeInTheDocument();
      });

      const pdfButton = screen.getByText('Export as PDF');
      fireEvent.click(pdfButton);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          'Failed to export PDF. Please try again.'
        );
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty course list', () => {
      render(<StudentReportSection allCourses={[]} />);
      expect(screen.getByText('Student Reports (UR2.17)')).toBeInTheDocument();
    });

    it('handles API errors when loading students', async () => {
      const { courseAPI } = await import('../../../api/courseAPI');
      vi.mocked(courseAPI.getStudents).mockRejectedValue(
        new Error('API Error')
      );

      render(<StudentReportSection allCourses={mockCourses} />);

      const courseSelect = screen.getByDisplayValue('');
      fireEvent.change(courseSelect, { target: { value: 'COSC499' } });

      await waitFor(() => {
        expect(courseAPI.getStudents).toHaveBeenCalledWith(1);
      });
    });

    it('handles API errors when loading student report', async () => {
      const { courseAPI } = await import('../../../api/courseAPI');
      const { analyticsAPI } = await import('../../../api/analyticsAPI');

      vi.mocked(courseAPI.getStudents).mockResolvedValue(mockStudents);
      vi.mocked(analyticsAPI.getStudentReport).mockRejectedValue(
        new Error('Report API Error')
      );

      render(<StudentReportSection allCourses={mockCourses} />);

      const courseSelect = screen.getByDisplayValue('');
      fireEvent.change(courseSelect, { target: { value: 'COSC499' } });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const studentButton = screen.getByText('John Doe');
      fireEvent.click(studentButton);

      await waitFor(() => {
        expect(analyticsAPI.getStudentReport).toHaveBeenCalled();
      });
    });
  });
});
