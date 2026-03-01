import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StudentReportSection } from '../StudentReportSection';

// Mock the API
vi.mock('../../../services/api', () => ({
  fetchStudentPerformance: vi.fn(),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Download: () => <div data-testid="download-icon" />,
  Search: () => <div data-testid="search-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  FileSpreadsheet: () => <div data-testid="file-spreadsheet-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  Users: () => <div data-testid="users-icon" />,
  BookOpen: () => <div data-testid="book-open-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  BarChart3: () => <div data-testid="bar-chart-icon" />,
}));

const mockCourses = [
  {
    id: 1,
    code: 'COSC101',
    title: 'Introduction to Computer Science',
    term: 'Fall 2024',
    description: 'Basic computer science concepts',
  },
];

describe('StudentReportSection', () => {
  it('renders without crashing', () => {
    render(<StudentReportSection allCourses={mockCourses} />);
    expect(screen.getByText('Student Reports')).toBeInTheDocument();
  });

  it('renders course selection dropdown', () => {
    render(<StudentReportSection allCourses={mockCourses} />);
    expect(screen.getByText('Choose a course...')).toBeInTheDocument();
    expect(screen.getByText('Select Course')).toBeInTheDocument();
  });

  it('renders initial state message', () => {
    render(<StudentReportSection allCourses={mockCourses} />);
    expect(screen.getByText('Select a Course')).toBeInTheDocument();
    expect(
      screen.getByText('Please select a course to view student reports.')
    ).toBeInTheDocument();
  });
});
