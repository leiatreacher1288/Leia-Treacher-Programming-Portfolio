// src/__tests__/Courses.test.tsx
import React from 'react';
import { vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Courses from '../pages/Courses';
import { courseAPI } from '../api/courseAPI';
import type { Course } from '../api/courseAPI';

// Mock the components
vi.mock('../components/cards/CourseCard', () => ({
  CourseCard: ({ course, onEditRequest, onDeleteRequest }: any) => (
    <div data-testid={`course-card-${course.id}`}>
      <h3>{course.code}</h3>
      <p>{course.title}</p>
      <button onClick={() => onEditRequest(course)}>Edit</button>
      <button onClick={() => onDeleteRequest(course)}>Delete</button>
    </div>
  ),
}));

vi.mock('../components/AddCourseModal', () => ({
  AddCourseModal: ({ isOpen, onClose, onSubmit }: any) =>
    isOpen ? (
      <div data-testid="add-course-modal">
        <button onClick={onClose}>Close</button>
        <button
          onClick={() =>
            onSubmit({
              code: 'NEW101',
              name: 'New Course',
              description: 'New Description',
              term: 'Fall 2024',
            })
          }
        >
          Submit
        </button>
      </div>
    ) : null,
}));

vi.mock('../components/EditCourseModal', () => ({
  EditCourseModal: ({ isOpen, course, onClose, onSubmit }: any) =>
    isOpen ? (
      <div data-testid="edit-course-modal">
        <button onClick={onClose}>Close</button>
        <button
          onClick={() =>
            onSubmit({
              code: course.code + ' EDITED',
              name: course.title + ' EDITED',
              term: course.term,
            })
          }
        >
          Save
        </button>
      </div>
    ) : null,
}));

vi.mock('../components/ui/SearchBar', () => ({
  SearchBar: ({ placeholder, value, onChange }: any) => (
    <input
      data-testid="search-bar"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  ),
}));

// Mock the new collaboration components
vi.mock('../components/CollaborationInviteModal', () => ({
  CollaborationInvitesModal: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="collaboration-invites-modal">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

vi.mock('../components/ui/CollaborationInvitesButton', () => ({
  CollaborationInvitesButton: ({ inviteCount, onClick }: any) => (
    <button data-testid="collaboration-invites-button" onClick={onClick}>
      Collaboration Invites {inviteCount > 0 && `(${inviteCount})`}
    </button>
  ),
}));

// Mock courseAPI
vi.mock('../api/courseAPI', () => ({
  courseAPI: {
    getCourses: vi.fn(),
    createCourse: vi.fn(),
    updateCourse: vi.fn(),
    deleteCourse: vi.fn(),
    leaveCourse: vi.fn(), // Add this mock
    getPendingInvites: vi.fn(), // Add this mock
    acceptInvite: vi.fn(),
    declineInvite: vi.fn(),
  },
}));

// Mock lucide-react - UPDATED to include Users icon
vi.mock('lucide-react', () => {
  const mockIcon = (name: string) => {
    const MockedIcon = (props: any) => {
      return React.createElement(
        'div',
        {
          'data-testid': `icon-${name.toLowerCase()}`,
          className: props.className,
          ...props,
        },
        name
      );
    };
    MockedIcon.displayName = name;
    return MockedIcon;
  };

  return {
    PlusCircle: mockIcon('PlusCircle'),
    X: mockIcon('X'),
    UserPlus: mockIcon('UserPlus'),
    Check: mockIcon('Check'),
    XCircle: mockIcon('XCircle'),
    Users: mockIcon('Users'),
    CheckCircle2: mockIcon('CheckCircle2'),
  };
});

describe('Courses', () => {
  const mockCourses: Course[] = [
    {
      id: 1,
      code: 'CS101',
      title: 'Introduction to CS',
      description: 'Basic CS concepts',
      term: 'Fall 2024',
      bannerUrl: null,
      exams: 2,
      students: 30,
      avgScore: 85,
      lastEdited: '2024-01-01',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      instructor: 'Dr. Smith',
      default_sec_access: 'LIMITED',
      default_ta_access: 'LIMITED',
      default_oth_access: 'NONE',
    },
    {
      id: 2,
      code: 'MATH201',
      title: 'Calculus II',
      description: 'Advanced calculus',
      term: 'Spring 2024',
      bannerUrl: null,
      exams: 3,
      students: 25,
      avgScore: 78,
      lastEdited: '2024-01-02',
      created_at: '2024-01-02',
      updated_at: '2024-01-02',
      instructor: 'Prof. Johnson',
      default_sec_access: 'FULL',
      default_ta_access: 'LIMITED',
      default_oth_access: 'NONE',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Set default mock implementations
    vi.mocked(courseAPI.getCourses).mockResolvedValue(mockCourses);
    vi.mocked(courseAPI.getPendingInvites).mockResolvedValue([]); // Add this - no invites by default
  });

  it('shows loading then renders course cards and positions Create button left of SearchBar', async () => {
    render(<Courses />);

    // Initially shows loading
    expect(screen.getByText('Loading courses...')).toBeInTheDocument();

    // Wait for courses to load
    await waitFor(() => {
      expect(screen.queryByText('Loading courses...')).not.toBeInTheDocument();
    });

    // Check course cards are rendered
    expect(screen.getByTestId('course-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('course-card-2')).toBeInTheDocument();

    // Check course content
    expect(screen.getByText('CS101')).toBeInTheDocument();
    expect(screen.getByText('Introduction to CS')).toBeInTheDocument();
    expect(screen.getByText('MATH201')).toBeInTheDocument();
    expect(screen.getByText('Calculus II')).toBeInTheDocument();

    // Check that both Create Course button and SearchBar exist
    const createButton = screen.getByText('Create Course');
    const searchBar = screen.getByTestId('search-bar');

    expect(createButton).toBeInTheDocument();
    expect(searchBar).toBeInTheDocument();

    // Check collaboration invites button is present
    expect(
      screen.getByTestId('collaboration-invites-button')
    ).toBeInTheDocument();
  });

  it('shows collaboration invites button with count', async () => {
    const mockInvites = [
      {
        id: 1,
        courseId: 101,
        courseCode: 'CS301',
        courseTitle: 'Advanced CS',
        inviterName: 'Dr. Brown',
        inviterEmail: 'brown@university.edu',
        role: 'SEC' as const,
        permissions: 'FULL' as const,
        createdAt: new Date().toISOString(),
      },
    ];

    vi.mocked(courseAPI.getPendingInvites).mockResolvedValue(mockInvites);

    render(<Courses />);

    await waitFor(() => {
      const invitesButton = screen.getByTestId('collaboration-invites-button');
      expect(invitesButton).toHaveTextContent('Collaboration Invites (1)');
    });
  });

  it('opens collaboration invites modal when button clicked', async () => {
    const user = userEvent.setup();

    render(<Courses />);

    await waitFor(() => {
      expect(screen.queryByText('Loading courses...')).not.toBeInTheDocument();
    });

    const invitesButton = screen.getByTestId('collaboration-invites-button');
    await user.click(invitesButton);

    expect(
      screen.getByTestId('collaboration-invites-modal')
    ).toBeInTheDocument();
  });

  it('filters by term select only', async () => {
    const user = userEvent.setup();

    render(<Courses />);

    await waitFor(() => {
      expect(screen.getByTestId('course-card-1')).toBeInTheDocument();
    });

    // Both courses should be visible initially
    expect(screen.getByTestId('course-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('course-card-2')).toBeInTheDocument();

    // Select Fall 2024
    const termSelect = screen.getAllByRole('combobox')[0];
    await user.selectOptions(termSelect, 'Fall 2024');

    // Only CS101 should be visible
    expect(screen.getByTestId('course-card-1')).toBeInTheDocument();
    expect(screen.queryByTestId('course-card-2')).not.toBeInTheDocument();
  });

  it('filters by year select only', async () => {
    const user = userEvent.setup();

    render(<Courses />);

    await waitFor(() => {
      expect(screen.getByTestId('course-card-1')).toBeInTheDocument();
    });

    // Select 2024
    const yearSelect = screen.getAllByRole('combobox')[1];
    await user.selectOptions(yearSelect, '2024');

    // Both courses should still be visible (both are 2024)
    expect(screen.getByTestId('course-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('course-card-2')).toBeInTheDocument();
  });

  it('search input filters by code or title', async () => {
    const user = userEvent.setup();

    render(<Courses />);

    await waitFor(() => {
      expect(screen.getByTestId('course-card-1')).toBeInTheDocument();
    });

    const searchBar = screen.getByTestId('search-bar');

    // Search for "CS"
    await user.type(searchBar, 'CS');

    // Only CS101 should be visible
    expect(screen.getByTestId('course-card-1')).toBeInTheDocument();
    expect(screen.queryByTestId('course-card-2')).not.toBeInTheDocument();

    // Clear and search for "Calculus"
    await user.clear(searchBar);
    await user.type(searchBar, 'Calculus');

    // Only MATH201 should be visible
    expect(screen.queryByTestId('course-card-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('course-card-2')).toBeInTheDocument();
  });

  it('loads and displays courses', async () => {
    render(<Courses />);

    expect(courseAPI.getCourses).toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByText('CS101')).toBeInTheDocument();
      expect(screen.getByText('MATH201')).toBeInTheDocument();
    });
  });

  it('handles edit course with 403 error', async () => {
    const user = userEvent.setup();

    vi.mocked(courseAPI.updateCourse).mockRejectedValue({
      response: { status: 403 },
      message: 'Forbidden',
    });

    render(<Courses />);

    await waitFor(() => {
      expect(screen.getByTestId('course-card-1')).toBeInTheDocument();
    });

    // Click edit on first course
    const editButtons = screen.getAllByText('Edit');
    await user.click(editButtons[0]);

    // Modal should open
    expect(screen.getByTestId('edit-course-modal')).toBeInTheDocument();

    // Click save
    await user.click(screen.getByText('Save'));

    // Wait for the error modal to appear
    await waitFor(() => {
      expect(
        screen.getByText(
          'Permission denied: You do not have permission to edit this course.'
        )
      ).toBeInTheDocument();
    });

    // Check that the OK button is present
    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it('handles delete course with 403 error', async () => {
    const user = userEvent.setup();

    vi.mocked(courseAPI.deleteCourse).mockRejectedValue({
      response: { status: 403 },
    });
    vi.mocked(courseAPI.leaveCourse).mockResolvedValue(undefined);

    render(<Courses />);

    await waitFor(() => {
      expect(screen.getByTestId('course-card-1')).toBeInTheDocument();
    });

    // Click delete on first course
    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);

    // Confirmation dialog should appear - check for the specific elements in the modal
    const allCS101Elements = screen.getAllByText('CS101');
    // The modal should have CS101 in a <strong> tag, which will be the second occurrence
    expect(allCS101Elements.length).toBe(2);

    // Check for Yes/No buttons in the modal
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();

    // Confirm delete
    await user.click(screen.getByText('Yes'));

    // Wait for the deleteCourse to fail and leaveCourse to be called
    await waitFor(() => {
      expect(courseAPI.deleteCourse).toHaveBeenCalledWith(1);
      expect(courseAPI.leaveCourse).toHaveBeenCalledWith(1);
    });

    // Course should be removed from the list
    expect(screen.queryByTestId('course-card-1')).not.toBeInTheDocument();
  });

  it('successfully creates a new course', async () => {
    const user = userEvent.setup();
    const newCourse: Course = {
      id: 3,
      code: 'NEW101',
      title: 'New Course',
      description: 'New Description',
      term: 'Fall 2024',
      bannerUrl: null,
      exams: 0,
      students: 0,
      avgScore: 0,
      lastEdited: '2024-01-03',
      created_at: '2024-01-03',
      updated_at: '2024-01-03',
      instructor: 'Dr. New',
      default_sec_access: 'FULL',
      default_ta_access: 'FULL',
      default_oth_access: 'NONE',
    };

    vi.mocked(courseAPI.createCourse).mockResolvedValue(newCourse);

    render(<Courses />);

    await waitFor(() => {
      expect(screen.getByText('Create Course')).toBeInTheDocument();
    });

    // Click create course button
    await user.click(screen.getByText('Create Course'));

    // Modal should open
    expect(screen.getByTestId('add-course-modal')).toBeInTheDocument();

    // Submit form
    await user.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(courseAPI.createCourse).toHaveBeenCalledWith({
        code: 'NEW101',
        name: 'New Course',
        description: 'New Description',
        term: 'Fall 2024',
      });
    });

    // Modal should close
    expect(screen.queryByTestId('add-course-modal')).not.toBeInTheDocument();
  });

  it('shows empty state when no courses', async () => {
    vi.mocked(courseAPI.getCourses).mockResolvedValue([]);

    render(<Courses />);

    await waitFor(() => {
      expect(
        screen.getByText('No courses yet. Create your first course!')
      ).toBeInTheDocument();
      expect(screen.getByText('Create Course')).toBeInTheDocument();
    });
  });

  it('filters courses by term', async () => {
    const user = userEvent.setup();
    const mixedCourses: Course[] = [
      { ...mockCourses[0], term: 'Fall 2024' } as Course,
      { ...mockCourses[1], term: 'Spring 2024' } as Course,
      {
        id: 3,
        code: 'PHYS301',
        title: 'Physics III',
        description: 'Advanced physics',
        term: 'Fall 2024',
        bannerUrl: null,
        exams: 2,
        students: 20,
        avgScore: 80,
        lastEdited: '2024-01-03',
        created_at: '2024-01-03',
        updated_at: '2024-01-03',
        instructor: 'Dr. Wilson',
        default_sec_access: 'FULL',
        default_ta_access: 'LIMITED',
        default_oth_access: 'NONE',
      } as Course,
    ];

    vi.mocked(courseAPI.getCourses).mockResolvedValue(mixedCourses);

    render(<Courses />);

    await waitFor(() => {
      expect(screen.getByTestId('course-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('course-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('course-card-3')).toBeInTheDocument();
    });

    // Filter by Fall 2024
    const termSelect = screen.getAllByRole('combobox')[0];
    await user.selectOptions(termSelect, 'Fall 2024');

    // Only Fall courses should be visible
    expect(screen.getByTestId('course-card-1')).toBeInTheDocument();
    expect(screen.queryByTestId('course-card-2')).not.toBeInTheDocument();
    expect(screen.getByTestId('course-card-3')).toBeInTheDocument();
  });
});
