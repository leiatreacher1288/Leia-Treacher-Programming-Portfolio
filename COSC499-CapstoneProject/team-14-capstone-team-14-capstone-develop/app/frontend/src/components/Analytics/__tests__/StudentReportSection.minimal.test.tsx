// Minimal test to isolate the DOM issue
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { StudentReportSection } from '../StudentReportSection';

// Mock all APIs
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

// Mock SearchBar
vi.mock('../../../components/ui/SearchBar', () => ({
  SearchBar: ({ placeholder }: { placeholder: string }) => (
    <input data-testid="search-bar" placeholder={placeholder} />
  ),
}));

// Mock AnalyticsErrorBoundary
vi.mock('../AnalyticsErrorBoundary', () => ({
  AnalyticsErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

const mockCourses = [
  {
    id: 1,
    code: 'COSC499',
    title: 'Capstone Project',
    term: 'W1 2024',
    description: 'Final year capstone project course',
  },
];

describe('StudentReportSection - Minimal Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without DOM errors', () => {
    render(<StudentReportSection allCourses={mockCourses} />);

    // Just check if something renders
    expect(document.body).toBeTruthy();
  });
});
