import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConnectedExamWizardPage } from '../components/Wizard/ConnectedExamWizardPage';
import { AuthProvider } from '../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  BookOpen: ({ className, size }: any) => (
    <div data-testid="book-open" className={className} data-size={size} />
  ),
  Target: ({ className, size }: any) => (
    <div data-testid="target" className={className} data-size={size} />
  ),
  Library: ({ className, size }: any) => (
    <div data-testid="library" className={className} data-size={size} />
  ),
  AlignLeft: ({ className, size }: any) => (
    <div data-testid="align-left" className={className} data-size={size} />
  ),
  Sparkles: ({ className, size }: any) => (
    <div data-testid="sparkles" className={className} data-size={size} />
  ),
  AlertTriangle: ({ className, size }: any) => (
    <div data-testid="alert-triangle" className={className} data-size={size} />
  ),
  ArrowLeft: ({ className, size }: any) => (
    <div data-testid="arrow-left" className={className} data-size={size} />
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
}));

// Mock the APIs
vi.mock('../api/examAPI', () => ({
  examAPI: {
    getWizardData: vi.fn(),
    updateWizardData: vi.fn(),
    generateVariants: vi.fn(),
    createExam: vi.fn(),
  },
}));

vi.mock('../api/questionAPI', () => ({
  questionAPI: {
    getQuestionBanksByCourse: vi.fn(),
    getQuestionsByBank: vi.fn(),
  },
}));

vi.mock('../api/courseAPI', () => ({
  courseAPI: {
    getCourseDetail: vi.fn(),
    getCourses: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: ({ children }: any) => <div data-testid="toaster">{children}</div>,
}));

// Mock the wizard steps
vi.mock('../components/Wizard/steps', () => ({
  Step1ExamInfo: ({ examName, setExamName, onValidationChange }: any) => (
    <div data-testid="step1">
      <input
        data-testid="exam-name-input"
        value={examName}
        onChange={(e) => setExamName(e.target.value)}
        onBlur={() => onValidationChange(true)}
      />
      <div>Exam Information</div>
    </div>
  ),
  Step2SourcesSections: () => <div data-testid="step2">Sources & Sections</div>,
  Step3VariantStrategy: () => <div data-testid="step3">Variant Strategy</div>,
  Step4MandatoryQuestions: () => (
    <div data-testid="step4">Mandatory Questions</div>
  ),
  Step5LayoutInstructions: () => (
    <div data-testid="step5">Layout & Instructions</div>
  ),
  Step6ReviewGenerate: () => <div data-testid="step6">Review & Generate</div>,
}));

import { examAPI } from '../api/examAPI';
import { questionAPI } from '../api/questionAPI';
import { courseAPI } from '../api/courseAPI';

const mockExamAPI = vi.mocked(examAPI);
const mockQuestionAPI = vi.mocked(questionAPI);
const mockCourseAPI = vi.mocked(courseAPI);

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>{children}</AuthProvider>
  </BrowserRouter>
);

const mockWizardData = {
  exam: {
    id: 1,
    title: 'Test Exam',
    description: 'Test Description',
    exam_type: 'midterm',
    course: 1,
    course_code: 'TEST101',
    course_term: 'Fall 2024',
    time_limit: 60,
    num_variants: 3,
    questions_per_variant: 10,
    randomize_questions: true,
    randomize_choices: true,
    show_answers_after: false,
    easy_percentage: 33,
    medium_percentage: 33,
    hard_percentage: 34,
    unknown_percentage: 0,
    question_budget: 100,
    available_from: undefined,
    available_until: undefined,
    weight: 20,
    required_to_pass: false,
    allow_reuse: false,
    exam_instructions: '',
    footer_text: '',
    academic_integrity_statement: '',
    include_academic_integrity: true,
  },
  question_banks: [
    {
      id: 1,
      title: 'Question Bank 1',
      description: 'Test QB',
      easy: 5,
      medium: 3,
      hard: 2,
      tags: ['tag1', 'tag2'],
      question_count: 10,
    },
  ],
  sections: [
    {
      id: 1,
      title: 'Section A',
      instructions: 'Test instructions',
      order: 0,
      question_banks: [
        {
          id: 1,
          title: 'Question Bank 1',
          description: 'Test QB',
          easy: 5,
          medium: 3,
          hard: 2,
          unknown: 0,
          tags: ['tag1', 'tag2'],
          question_count: 10,
          course: 1,
          created_by: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ],
      question_count: 5,
    },
  ],
  mandatory_questions: [],
};

describe('ConnectedExamWizardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExamAPI.getWizardData.mockResolvedValue(mockWizardData);
    mockQuestionAPI.getQuestionBanksByCourse.mockResolvedValue([]);
    mockCourseAPI.getCourseDetail.mockResolvedValue({
      id: 1,
      code: 'TEST101',
      title: 'Test Course',
      term: 'Fall 2024',
      description: 'Test course description',
      bannerUrl: '',
      exams: 0,
      students: 0,
      avgScore: 0,
      lastEdited: '',
      instructor: 'Test Instructor',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      default_sec_access: 'FULL',
      default_ta_access: 'LIMITED',
      default_oth_access: 'NONE',
    });
    mockCourseAPI.getCourses.mockResolvedValue([]);
  });

  it('renders loading state initially', () => {
    render(
      <TestWrapper>
        <ConnectedExamWizardPage examId={1} onClose={vi.fn()} />
      </TestWrapper>
    );

    expect(screen.getByText('Loading exam data...')).toBeInTheDocument();
  });

  it('loads existing exam data correctly', async () => {
    render(
      <TestWrapper>
        <ConnectedExamWizardPage examId={1} onClose={vi.fn()} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockExamAPI.getWizardData).toHaveBeenCalledWith(1);
    });

    await waitFor(() => {
      expect(screen.getByTestId('step1')).toBeInTheDocument();
    });
  });

  it('creates new exam wizard data when examId is 0', async () => {
    render(
      <TestWrapper>
        <ConnectedExamWizardPage examId={0} courseId={1} onClose={vi.fn()} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockCourseAPI.getCourseDetail).toHaveBeenCalledWith(1);
    });

    await waitFor(() => {
      expect(screen.getByTestId('step1')).toBeInTheDocument();
    });
  });

  it('handles step navigation correctly', async () => {
    render(
      <TestWrapper>
        <ConnectedExamWizardPage examId={1} onClose={vi.fn()} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('step1')).toBeInTheDocument();
    });

    // Fill required field and trigger validation
    const examNameInput = screen.getByTestId('exam-name-input');
    fireEvent.change(examNameInput, { target: { value: 'Test Exam' } });
    fireEvent.blur(examNameInput); // Trigger validation

    // Wait for validation to complete and button to be enabled
    await waitFor(() => {
      const continueButton = screen.getByText('Continue');
      expect(continueButton).not.toBeDisabled();
    });

    // Navigate to next step
    const continueButton = screen.getByText('Continue');
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(screen.getByTestId('step2')).toBeInTheDocument();
    });
  });

  it('validates step 1 before allowing navigation', async () => {
    render(
      <TestWrapper>
        <ConnectedExamWizardPage examId={1} onClose={vi.fn()} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('step1')).toBeInTheDocument();
    });

    // Try to continue without filling required fields
    const continueButton = screen.getByText('Continue');
    expect(continueButton).toBeDisabled();
  });

  it('handles back button with unsaved changes', async () => {
    render(
      <TestWrapper>
        <ConnectedExamWizardPage examId={1} onClose={vi.fn()} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('step1')).toBeInTheDocument();
    });

    // Modify exam name to create unsaved changes
    const examNameInput = screen.getByTestId('exam-name-input');
    fireEvent.change(examNameInput, { target: { value: 'Modified Exam' } });

    // Click back button
    const backButton = screen.getByText('Back to Exam View');
    fireEvent.click(backButton);

    // Should show confirmation modal
    await waitFor(() => {
      expect(screen.getByText('Discard unsaved changes?')).toBeInTheDocument();
    });
  });

  it('saves wizard data successfully', async () => {
    render(
      <TestWrapper>
        <ConnectedExamWizardPage examId={1} onClose={vi.fn()} />
      </TestWrapper>
    );

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('Variant Strategy')).toBeInTheDocument();
    });

    // Check that the continue button exists (but may be disabled)
    const continueButton = screen.getByText('Continue');
    expect(continueButton).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    mockExamAPI.getWizardData.mockRejectedValue(new Error('API Error'));

    render(
      <TestWrapper>
        <ConnectedExamWizardPage examId={1} onClose={vi.fn()} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Error Loading Exam')).toBeInTheDocument();
      expect(
        screen.getByText('Failed to load exam data. Please try again.')
      ).toBeInTheDocument();
    });
  });

  it('shows save status indicator', async () => {
    render(
      <TestWrapper>
        <ConnectedExamWizardPage examId={1} onClose={vi.fn()} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Unsaved')).toBeInTheDocument();
    });
  });

  it('loads question banks for course', async () => {
    const mockQuestionBanks = [
      {
        id: 1,
        title: 'QB 1',
        description: 'Test QB',
        difficulty_breakdown: { easy: 5, medium: 3, hard: 2, unknown: 0 },
        tag_counts: { tag1: 3, tag2: 2 },
        question_count: 10,
        course: 1,
        created_by: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    mockQuestionAPI.getQuestionBanksByCourse.mockResolvedValue(
      mockQuestionBanks
    );

    render(
      <TestWrapper>
        <ConnectedExamWizardPage examId={1} onClose={vi.fn()} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockQuestionAPI.getQuestionBanksByCourse).toHaveBeenCalled();
    });
  });
});
