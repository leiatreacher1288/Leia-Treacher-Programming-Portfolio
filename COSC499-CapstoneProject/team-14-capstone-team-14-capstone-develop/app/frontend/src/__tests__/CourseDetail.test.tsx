// src/__tests__/CourseDetail.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// 1️⃣ Use MemoryRouter for initialEntries
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CourseDetail } from '../pages/CourseDetail';
import type { Course } from '../api/courseAPI';

// Mock the API module
vi.mock('../api/courseAPI', () => ({
  courseAPI: {
    getCourseDetail: vi.fn(),
  },
}));
import { courseAPI } from '../api/courseAPI';

// Mock child components exactly as before
vi.mock('../components/CourseConfig/OverviewTab', () => ({
  OverviewTab: ({ courseId }: { courseId: number }) => (
    <div>Overview Tab - Course ID: {courseId}</div>
  ),
}));
vi.mock('../components/CourseConfig/ExamsTab', () => ({
  ExamsTab: ({ courseId }: { courseId: number }) => (
    <div>Exams Tab - Course ID: {courseId}</div>
  ),
}));
vi.mock('../components/CourseConfig/StudentsTab', () => ({
  StudentsTab: ({ courseId }: { courseId: number }) => (
    <div>Students Tab - Course ID: {courseId}</div>
  ),
}));
vi.mock('../components/CourseConfig/CourseSettings', () => ({
  CourseSettings: ({ courseId }: { courseId: number }) => (
    <div>Settings Tab - Course ID: {courseId}</div>
  ),
}));
vi.mock('../components/cards/CourseHeader', () => ({
  CourseHeader: ({ course }: { course: Course }) => (
    <div>Course Header - {course.title}</div>
  ),
}));
vi.mock('../components/Layouts/InstructorLayout', () => ({
  InstructorLayout: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
vi.mock('../components/navigation/TabSwitcher', () => ({
  TabSwitcher: ({ tabs, activeTab, onTabChange }: any) => (
    <div>
      {tabs.map((tab: any) => (
        <button
          key={tab.value}
          onClick={() => onTabChange(tab.value)}
          className={activeTab === tab.value ? 'active' : ''}
        >
          {tab.label}
        </button>
      ))}
    </div>
  ),
}));

describe('CourseDetail', () => {
  const mockCourse: Course = {
    id: 1,
    code: 'CS101',
    title: 'Introduction to Computer Science',
    description: 'Basic CS concepts',
    term: 'Fall 2025',
    bannerUrl: '/banner.jpg',
    exams: 5,
    students: 30,
    avgScore: 85.5,
    lastEdited: '2025-06-27',
    created_at: '2025-01-05T10:00:00Z',
    updated_at: '2025-01-05T10:00:00Z',
    instructor: null,
    default_sec_access: 'LIMITED',
    default_ta_access: 'LIMITED',
    default_oth_access: 'NONE',
  };

  const mockedGetCourseDetail = vi.mocked(courseAPI.getCourseDetail);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 2️⃣ Replace render wrapper + remove invalid second arg
  const renderCourseDetail = (courseId: string = '1') =>
    render(
      <MemoryRouter initialEntries={[`/courses/${courseId}`]}>
        <Routes>
          <Route path="/courses/:id" element={<CourseDetail />} />
        </Routes>
      </MemoryRouter>
    );

  it('shows loading state initially', () => {
    mockedGetCourseDetail.mockImplementation(() => new Promise(() => {}));
    renderCourseDetail();
    expect(screen.getByText('Loading course...')).toBeInTheDocument();
  });

  it('loads and displays course data successfully', async () => {
    mockedGetCourseDetail.mockResolvedValue(mockCourse);
    renderCourseDetail();
    await waitFor(() =>
      expect(
        screen.getByText('Course Header - Introduction to Computer Science')
      ).toBeInTheDocument()
    );
    expect(screen.getByText(/Overview Tab - Course ID:/)).toBeInTheDocument();
  });

  it('shows error state when course loading fails', async () => {
    mockedGetCourseDetail.mockRejectedValue(new Error('Network error'));
    renderCourseDetail();
    await waitFor(() =>
      expect(
        screen.getByText('Failed to load course. Please try again.')
      ).toBeInTheDocument()
    );
    expect(screen.getByText('Go Back')).toBeInTheDocument();
  });

  it('shows course not found when course is null', async () => {
    // cast null to any so TS will allow this call
    mockedGetCourseDetail.mockResolvedValue(null as any);
    renderCourseDetail();
    await waitFor(() =>
      expect(screen.getByText('Course Not Found')).toBeInTheDocument()
    );
  });

  it('navigates back when Go Back button is clicked', async () => {
    const mockHistoryBack = vi.fn();
    Object.defineProperty(window, 'history', {
      writable: true,
      value: { back: mockHistoryBack },
      configurable: true,
    });

    mockedGetCourseDetail.mockRejectedValue(new Error('Not found'));
    renderCourseDetail();
    await waitFor(() =>
      expect(screen.getByText('Go Back')).toBeInTheDocument()
    );
    fireEvent.click(screen.getByText('Go Back'));
    expect(mockHistoryBack).toHaveBeenCalled();
  });

  it('switches between tabs correctly', async () => {
    mockedGetCourseDetail.mockResolvedValue(mockCourse);
    renderCourseDetail();
    await waitFor(() =>
      expect(screen.getByText('Overview')).toBeInTheDocument()
    );

    // Overview
    expect(screen.getByText(/Overview Tab - Course ID:/)).toBeInTheDocument();

    // Exams
    fireEvent.click(screen.getByText('Exams'));
    expect(screen.getByText('Exams Tab - Course ID: 1')).toBeInTheDocument();

    // Students
    fireEvent.click(screen.getByText('Students'));
    expect(screen.getByText('Students Tab - Course ID: 1')).toBeInTheDocument();

    // Settings
    fireEvent.click(screen.getByText('Instructors'));
    expect(screen.getByText(/Settings Tab - Course ID:/)).toBeInTheDocument();
  });

  it('calls getCourseDetail with correct courseId from URL params', async () => {
    mockedGetCourseDetail.mockResolvedValue(mockCourse);
    renderCourseDetail('42');
    await waitFor(() => {
      expect(courseAPI.getCourseDetail).toHaveBeenCalledWith(42);
    });
  });

  it('does not call loadCourse if id param is missing', () => {
    render(
      <MemoryRouter>
        <CourseDetail />
      </MemoryRouter>
    );
    expect(courseAPI.getCourseDetail).not.toHaveBeenCalled();
  });
});
