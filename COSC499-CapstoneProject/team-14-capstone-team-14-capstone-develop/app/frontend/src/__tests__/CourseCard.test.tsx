// src/__tests__/CourseCard.test.tsx
// Frontend test: CourseCard component (Vitest + Testing Library)

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CourseCard } from '../components/cards/CourseCard';
import type { Course } from '../types/course';

vi.mock('lucide-react', () => {
  const createIconMock = (name: string) => {
    const IconComponent = () => (
      <div data-testid={`icon-${name.toLowerCase()}`}>{name}</div>
    );
    IconComponent.displayName = name;
    return IconComponent;
  };

  return {
    Users: createIconMock('Users'),
    CalendarDays: createIconMock('CalendarDays'),
    MoreVertical: createIconMock('MoreVertical'),
    MoreHorizontal: createIconMock('MoreHorizontal'),
    Edit: createIconMock('Edit'),
    Trash2: createIconMock('Trash2'),
    Eye: createIconMock('Eye'),
    Star: createIconMock('Star'),
    BookText: createIconMock('BookText'),
    FileText: createIconMock('FileText'),
    BarChart3: createIconMock('BarChart3'),
    Settings: createIconMock('Settings'),
    Download: createIconMock('Download'),
    Share2: createIconMock('Share2'),
    Plus: createIconMock('Plus'),
    Minus: createIconMock('Minus'),
    Check: createIconMock('Check'),
    X: createIconMock('X'),
    ChevronDown: createIconMock('ChevronDown'),
    ChevronUp: createIconMock('ChevronUp'),
    ChevronLeft: createIconMock('ChevronLeft'),
    ChevronRight: createIconMock('ChevronRight'),
    ArrowLeft: createIconMock('ArrowLeft'),
    ArrowRight: createIconMock('ArrowRight'),
    Home: createIconMock('Home'),
    Search: createIconMock('Search'),
    Bell: createIconMock('Bell'),
    User: createIconMock('User'),
    LogOut: createIconMock('LogOut'),
    Menu: createIconMock('Menu'),
    Close: createIconMock('Close'),
    Info: createIconMock('Info'),
    AlertCircle: createIconMock('AlertCircle'),
    CheckCircle: createIconMock('CheckCircle'),
    XCircle: createIconMock('XCircle'),
    AlertTriangle: createIconMock('AlertTriangle'),
    HelpCircle: createIconMock('HelpCircle'),
    ExternalLink: createIconMock('ExternalLink'),
    Link: createIconMock('Link'),
    Copy: createIconMock('Copy'),
    Save: createIconMock('Save'),
    RefreshCw: createIconMock('RefreshCw'),
    RotateCcw: createIconMock('RotateCcw'),
    RotateCw: createIconMock('RotateCw'),
    ZoomIn: createIconMock('ZoomIn'),
    ZoomOut: createIconMock('ZoomOut'),
    Maximize: createIconMock('Maximize'),
    Minimize: createIconMock('Minimize'),
    Fullscreen: createIconMock('Fullscreen'),
    FullscreenExit: createIconMock('FullscreenExit'),
    Volume: createIconMock('Volume'),
    VolumeX: createIconMock('VolumeX'),
    Volume1: createIconMock('Volume1'),
    Volume2: createIconMock('Volume2'),
    Play: createIconMock('Play'),
    Pause: createIconMock('Pause'),
    SkipBack: createIconMock('SkipBack'),
    SkipForward: createIconMock('SkipForward'),
    Rewind: createIconMock('Rewind'),
    FastForward: createIconMock('FastForward'),
    Repeat: createIconMock('Repeat'),
    Shuffle: createIconMock('Shuffle'),
    Heart: createIconMock('Heart'),
    ThumbsUp: createIconMock('ThumbsUp'),
    ThumbsDown: createIconMock('ThumbsDown'),
    MessageCircle: createIconMock('MessageCircle'),
    MessageSquare: createIconMock('MessageSquare'),
    Mail: createIconMock('Mail'),
    Phone: createIconMock('Phone'),
    Video: createIconMock('Video'),
    VideoOff: createIconMock('VideoOff'),
    Mic: createIconMock('Mic'),
    MicOff: createIconMock('MicOff'),
    Camera: createIconMock('Camera'),
    CameraOff: createIconMock('CameraOff'),
    Image: createIconMock('Image'),
    File: createIconMock('File'),
    Folder: createIconMock('Folder'),
    FolderOpen: createIconMock('FolderOpen'),
    FolderPlus: createIconMock('FolderPlus'),
    FolderMinus: createIconMock('FolderMinus'),
    FolderX: createIconMock('FolderX'),
    FolderCheck: createIconMock('FolderCheck'),
    FolderSearch: createIconMock('FolderSearch'),
    FolderHeart: createIconMock('FolderHeart'),
    FolderKey: createIconMock('FolderKey'),
    FolderLock: createIconMock('FolderLock'),
    FolderUnlock: createIconMock('FolderUnlock'),
    FolderCog: createIconMock('FolderCog'),
    FolderKanban: createIconMock('FolderKanban'),
    FolderGit2: createIconMock('FolderGit2'),
    FolderGit: createIconMock('FolderGit'),
    FolderClock: createIconMock('FolderClock'),
    FolderInput: createIconMock('FolderInput'),
    FolderOutput: createIconMock('FolderOutput'),
  };
});

describe('CourseCard', () => {
  let onEditRequest: ReturnType<typeof vi.fn>;
  let onDeleteRequest: ReturnType<typeof vi.fn>;
  let onExportRequest: ReturnType<typeof vi.fn>;
  const mockCourse: Course = {
    id: 1,
    code: 'C1',
    title: 'Test Course',
    description: 'Test Description',
    term: 'Fall 2024',
    bannerURL: '',
    exams: 5,
    students: 25,
    avgScore: 85,
    lastEdited: '2024-01-01',
    instructor: 'Test Instructor',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    default_sec_access: 'FULL',
    default_ta_access: 'LIMITED',
    default_oth_access: 'NONE',
  };

  beforeEach(() => {
    onEditRequest = vi.fn();
    onDeleteRequest = vi.fn();
    onExportRequest = vi.fn();
  });

  it('renders default zeros for exams and students', () => {
    const courseWithZeros = {
      ...mockCourse,
      exams: 0,
      students: 0,
    };

    render(
      <BrowserRouter>
        <CourseCard
          course={courseWithZeros}
          onEditRequest={onEditRequest}
          onDeleteRequest={onDeleteRequest}
          onExportRequest={onExportRequest}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('Exams: 0')).toBeInTheDocument();
    expect(screen.getByText('Students: 0')).toBeInTheDocument();
  });

  it('toggles menu and invokes handlers', async () => {
    render(
      <BrowserRouter>
        <CourseCard
          course={mockCourse}
          onEditRequest={onEditRequest}
          onDeleteRequest={onDeleteRequest}
          onExportRequest={onExportRequest}
        />
      </BrowserRouter>
    );

    // open menu by clicking the first button (ellipsis)
    const [ellipsisBtn] = screen.getAllByRole('button');
    fireEvent.click(ellipsisBtn);

    // click Edit
    const editItem = screen.getByText('Edit');
    fireEvent.click(editItem);
    expect(onEditRequest).toHaveBeenCalledWith(mockCourse);

    // reopen and click Delete
    fireEvent.click(ellipsisBtn);
    const deleteItem = screen.getByText('Delete');
    fireEvent.click(deleteItem);
    expect(onDeleteRequest).toHaveBeenCalledWith(mockCourse);
  });
});
