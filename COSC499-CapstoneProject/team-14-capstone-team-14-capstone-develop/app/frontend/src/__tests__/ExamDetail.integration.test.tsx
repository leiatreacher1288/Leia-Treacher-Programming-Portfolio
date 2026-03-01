// src/__tests__/ExamDetail.integration.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { ExamDetail } from '../pages/ExamDetail';

// Mock the APIs
vi.mock('../api/examAPI');
vi.mock('../api/courseAPI');

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: '1' }),
    useNavigate: () => mockNavigate,
    useLocation: () => ({
      pathname: '/exam/1',
      search: '',
    }),
  };
});

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ArrowLeft: ({ className, size }: any) => (
    <div data-testid="arrow-left" className={className} data-size={size} />
  ),
  Wand2: ({ className, size }: any) => (
    <div data-testid="wand2" className={className} data-size={size} />
  ),
  Users: ({ className, size }: any) => (
    <div data-testid="users" className={className} data-size={size} />
  ),
  Calendar: ({ className, size }: any) => (
    <div data-testid="calendar" className={className} data-size={size} />
  ),
  BookOpen: ({ className, size }: any) => (
    <div data-testid="book-open" className={className} data-size={size} />
  ),
  Hash: ({ className, size }: any) => (
    <div data-testid="hash" className={className} data-size={size} />
  ),
  Target: ({ className, size }: any) => (
    <div data-testid="target" className={className} data-size={size} />
  ),
  Scale: ({ className, size }: any) => (
    <div data-testid="scale" className={className} data-size={size} />
  ),
  FileText: ({ className, size }: any) => (
    <div data-testid="file-text" className={className} data-size={size} />
  ),
  Library: ({ className, size }: any) => (
    <div data-testid="library" className={className} data-size={size} />
  ),
  AlertTriangle: ({ className, size }: any) => (
    <div data-testid="alert-triangle" className={className} data-size={size} />
  ),
  AlignLeft: ({ className, size }: any) => (
    <div data-testid="align-left" className={className} data-size={size} />
  ),
  Sparkles: ({ className, size }: any) => (
    <div data-testid="sparkles" className={className} data-size={size} />
  ),
  ArrowRight: ({ className, size }: any) => (
    <div data-testid="arrow-right" className={className} data-size={size} />
  ),
  CheckCircle2: ({ className, size }: any) => (
    <div data-testid="check-circle" className={className} data-size={size} />
  ),
  Save: ({ className, size }: any) => (
    <div data-testid="save" className={className} data-size={size} />
  ),
  FileSpreadsheet: ({ className, size }: any) => (
    <div
      data-testid="file-spreadsheet"
      className={className}
      data-size={size}
    />
  ),
  History: ({ className, size }: any) => (
    <div data-testid="history" className={className} data-size={size} />
  ),
}));

describe('ExamDetail integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(
      <BrowserRouter>
        <ExamDetail />
      </BrowserRouter>
    );

    expect(screen.getByText('Loading exam...')).toBeInTheDocument();
  });

  it('renders exam detail component without crashing', () => {
    render(
      <BrowserRouter>
        <ExamDetail />
      </BrowserRouter>
    );

    // Should render the component without throwing errors
    expect(screen.getByText('Loading exam...')).toBeInTheDocument();
  });
});
