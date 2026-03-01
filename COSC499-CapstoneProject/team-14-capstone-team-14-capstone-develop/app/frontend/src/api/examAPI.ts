// src/api/examAPI.ts
import axiosInstance from './axiosInstance';
// allowed formats for exportResults
export type ExportFormat = 'csv' | 'docx' | 'pdf' | 'answer_key';
export type ResultExportFormat = 'csv';

// Define the Exam type to match frontend expectations
export interface Exam {
  id: number;
  title: string;
  description?: string;
  exam_type: string;
  course_code: string;
  course_term: string;
  created_at: string;
  updated_at: string;
  created_by_name: string;
  question_count: number;
  variant_count: number;
  time_limit?: number;
  weight: number;
  required_to_pass: boolean;
  scheduled_date?: string;
  // Frontend-specific fields
  lastOpened?: string;
  subject?: 'math' | 'physics' | 'chem';
  image?: string;
  canExport?: boolean;
}

export interface ImportResult {
  session_id: number;
  status: string;
  imported: number;
  failed: number;
  warnings: Array<{ row: number; type: string; message: string }>;
}

export interface ExamResultRow {
  id: number;
  student: number;
  student_name: string;
  student_id: string;
  variant_label: string;
  score: number;
  percentage_score: number;
  submitted_at: string;
}

export interface ExamResultsResponse {
  exam: { id: number; title: string; course?: string };
  statistics: ExamStatistics;
  results: ExamResultRow[];
}

// Wizard-specific interfaces
export interface QuestionBank {
  id: number;
  title: string;
  description: string;
  easy: number;
  medium: number;
  hard: number;
  tags: string[];
  question_count: number;
}

export interface ExamSection {
  id: number;
  title: string;
  instructions: string;
  order: number;
  question_banks: QuestionBank[];
  question_count: number;
  configured_question_count?: number;
}

export interface MandatoryQuestion {
  id: number;
  prompt: string;
  difficulty: string;
  tags: string[];
  fromBank: {
    id: number;
    title: string;
    description: string;
  } | null;
}

export interface WizardData {
  exam: {
    id: number;
    title: string;
    description?: string;
    exam_type: string;
    course: number;
    course_code: string;
    course_term: string;
    time_limit: number;
    num_variants: number;
    questions_per_variant: number;
    randomize_questions: boolean;
    randomize_choices: boolean;
    show_answers_after: boolean;
    easy_percentage: number;
    medium_percentage: number;
    hard_percentage: number;
    unknown_percentage: number;
    question_budget: number;
    available_from?: string;
    available_until?: string;
    weight: number;
    required_to_pass: boolean;
    allow_reuse: boolean;
    exam_instructions: string;
    footer_text: string;
    academic_integrity_statement: string;
    include_academic_integrity: boolean;
    marking_scheme?: {
      multiCorrectPolicy:
        | 'all_or_nothing'
        | 'partial_credit'
        | 'partial_with_penalty';
      negativeMarking: {
        enabled: boolean;
        penalty: number;
        applyTo: 'all_questions' | 'single_choice_only' | 'multi_choice_only';
      };
      sectionWeighting: {
        [sectionId: number]: number;
      };
    };
  };
  question_banks: QuestionBank[];
  sections: ExamSection[];
  mandatory_questions: MandatoryQuestion[];
}

// Extended Exam interface for detailed view
export interface ExamDetail {
  id: number;
  title: string;
  description?: string;
  exam_type: string;
  course: number;
  course_code: string;
  course_term: string;
  time_limit: number;
  num_variants: number;
  questions_per_variant: number;
  randomize_questions: boolean;
  randomize_choices: boolean;
  show_answers_after: boolean;
  easy_percentage: number;
  medium_percentage: number;
  hard_percentage: number;
  question_budget: number;
  available_from?: string;
  available_until?: string;
  questions: ExamQuestion[];
  mandatory_questions: Question[];
  variants: Variant[];
  export_history: ExportHistory[];
  sections: ExamSection[];
  exam_instructions: string;
  footer_text: string;
  academic_integrity_statement: string;
  include_academic_integrity: boolean;
  created_at: string;
  updated_at: string;
  created_by: number;
  created_by_name: string;
  is_config_valid: boolean;
  difficulty_breakdown: {
    Easy: number;
    Medium: number;
    Hard: number;
    Unknown?: number;
  };
  cheating_risk_score?: {
    overall_score: number;
    position_scores: number[];
    explanation: string;
    details: {
      total_variants: number;
      max_questions: number;
      position_details: Array<{
        position: number;
        answers: string[];
        unique_answers: string[];
        diversity_ratio: number;
        score: number;
      }>;
    };
  };
  total_points: number;
  weight: number;
  required_to_pass: boolean;
  allow_reuse: boolean;
  is_published?: boolean;
  attempts_allowed?: number;
  distribution_info?: any;
  auto_balance_status?: boolean;
  analytics?: {
    cheating_risk: any;
    question_reuse_rate: number;
    mandatory_overlap: number;
    per_variant_difficulties: any[];
    answer_diversity: number;
    unique_answer_patterns: number;
  };
  current_variant_questions?: Question[];
  unknown_percentage: number;
}

export interface ExamQuestion {
  id: number;
  question: Question;
  order: number;
  points: number;
}

export interface Question {
  id: number;
  prompt: string;
  choices: Record<string, string>;
  correct_answer: string[];
  difficulty: string;
  explanation: string;
  tags: string[];
  question_type: string;
  points: number;
}

export interface VariantQuestion {
  id: number;
  question: Question;
  order: number;
  section?: {
    id: number;
    title: string;
    order: number;
    instructions?: string;
  };
  randomized_choices?: Record<string, string>;
  randomized_correct_answer?: (string | number)[];
}

export interface Variant {
  id: number;
  version_label: string;
  questions: VariantQuestion[];
  question_count?: number;
  created_at: string;
  exported_at?: string;
  docx_exported: boolean;
  pdf_exported: boolean;
  is_locked: boolean;
}

export interface ExportHistory {
  id: number;
  exported_at: string;
  exported_by: string;
  variants_exported: Variant[];
  export_format: string;
}

export interface ExamStatistics {
  total_attempts: number;
  average_score: number;
  pass_rate: number;
  question_statistics: {
    question_id: number;
    correct_rate: number; // e.g. 0.85 for 85%
    average_time: number; // in seconds
  }[];
}

// Backend response interfaces
interface BackendExam {
  id: number;
  title: string;
  description?: string;
  exam_type: string;
  course_code: string;
  course_term: string;
  created_at: string;
  updated_at: string;
  created_by_name: string;
  time_limit?: number;
  question_count: number;
  variant_count: number;
  weight: number;
  required_to_pass: boolean;
  scheduled_date?: string; // Add this line
}

interface BackendExamDetail {
  id: number;
  title: string;
  description?: string;
  exam_type: string;
  course: number;
  course_code: string;
  course_term: string;
  time_limit: number;
  num_variants: number;
  questions_per_variant: number;
  randomize_questions: boolean;
  randomize_choices: boolean;
  show_answers_after: boolean;
  easy_percentage: number;
  medium_percentage: number;
  hard_percentage: number;
  question_budget: number;
  available_from?: string;
  available_until?: string;
  questions: ExamQuestion[];
  mandatory_questions: Question[];
  variants: BackendVariant[];
  export_history: ExportHistory[];
  sections: ExamSection[];
  exam_instructions: string;
  footer_text: string;
  academic_integrity_statement: string;
  include_academic_integrity: boolean;
  created_at: string;
  updated_at: string;
  created_by: number;
  created_by_name: string;
  is_config_valid: boolean;
  difficulty_breakdown?: {
    Easy: number;
    Medium: number;
    Hard: number;
  };
  cheating_risk_score?: {
    overall_score: number;
    position_scores: number[];
    explanation: string;
    details: {
      total_variants: number;
      max_questions: number;
      position_details: Array<{
        position: number;
        answers: string[];
        unique_answers: string[];
        diversity_ratio: number;
        score: number;
      }>;
    };
  };
  total_points: number;
  weight: number;
  required_to_pass: boolean;
  allow_reuse: boolean;
  is_published?: boolean;
  attempts_allowed?: number;
  distribution_info?: any;
  auto_balance_status?: boolean;
  analytics?: {
    cheating_risk: any;
    question_reuse_rate: number;
    mandatory_overlap: number;
    per_variant_difficulties: any[];
    answer_diversity: number;
    unique_answer_patterns: number;
  };
  current_variant_questions?: Question[];
  unknown_percentage: number;
}

interface BackendVariant {
  id: number;
  version_label: string;
  questions: Array<{
    id: number;
    question: {
      id: number;
      prompt: string;
      choices: Record<string, string>;
      correct_answer: string[];
      difficulty: string | null;
      tags: string[];
      type: string;
      points: string;
      explanation?: string; // Added explanation field
    };
    order: number;
    randomized_choices?: Record<string, string>;
    randomized_correct_answer?: string[];
  }>;
  created_at: string;
  exported_at?: string;
  docx_exported: boolean;
  pdf_exported: boolean;
  is_locked?: boolean;
}

// API response types
interface VariantGenerationResponse {
  message: string;
  variants_created?: number;
  cheating_risk_score?: number;
  warning?: string;
}

interface AnswerKeyResponse {
  answer_key: Array<{
    variant_id: number;
    version_label: string;
    answers: Array<{
      question_number: number;
      correct_answer: string[];
    }>;
  }>;
}

interface ApiResponse {
  success: boolean;
  message: string;
}

// Transform backend response to match frontend Exam type
const transformExam = (backendExam: BackendExam): Exam => ({
  id: backendExam.id,
  title: backendExam.title,
  description: backendExam.description,
  exam_type: backendExam.exam_type,
  course_code: backendExam.course_code,
  course_term: backendExam.course_term,
  created_at: backendExam.created_at,
  updated_at: backendExam.updated_at,
  created_by_name: backendExam.created_by_name,
  question_count: backendExam.question_count,
  variant_count: backendExam.variant_count,
  scheduled_date: backendExam.scheduled_date,
  time_limit: backendExam.time_limit ?? 0,
  // Add frontend-specific fields
  lastOpened: new Date(backendExam.updated_at).toLocaleDateString(),
  subject: getSubjectFromCourseCode(backendExam.course_code),
  image: getRandomImage(backendExam.id),
  canExport: backendExam.variant_count > 0,
  weight: Number(backendExam.weight ?? 0), // 👈 always a number like 100
  required_to_pass: !!backendExam.required_to_pass,
});

// Transform backend response to match frontend ExamDetail type
const transformExamDetail = (backendExam: BackendExamDetail): ExamDetail => ({
  id: backendExam.id,
  title: backendExam.title,
  description: backendExam.description,
  exam_type: backendExam.exam_type,
  course: backendExam.course,
  course_code: backendExam.course_code,
  course_term: backendExam.course_term,
  time_limit: backendExam.time_limit,
  num_variants: backendExam.num_variants,
  questions_per_variant: backendExam.questions_per_variant,
  randomize_questions: backendExam.randomize_questions,
  randomize_choices: backendExam.randomize_choices,
  show_answers_after: backendExam.show_answers_after,
  easy_percentage: backendExam.easy_percentage,
  medium_percentage: backendExam.medium_percentage,
  hard_percentage: backendExam.hard_percentage,
  question_budget: backendExam.question_budget,
  available_from: backendExam.available_from,
  available_until: backendExam.available_until,
  questions: backendExam.questions || [],
  mandatory_questions: backendExam.mandatory_questions || [],
  variants: (backendExam.variants || []).map((variant: BackendVariant) => ({
    id: variant.id,
    version_label: variant.version_label,
    questions: variant.questions.map((q) => ({
      id: q.id,
      question: {
        id: q.question.id,
        prompt: q.question.prompt,
        choices: q.randomized_choices || q.question.choices,
        correct_answer:
          q.randomized_correct_answer || q.question.correct_answer,
        difficulty: q.question.difficulty || 'Easy',
        tags: q.question.tags,
        question_type: q.question.type,
        points: parseFloat(q.question.points) || 1,
        explanation: q.question.explanation || '',
      },
      order: q.order,
    })),
    created_at: variant.created_at,
    exported_at: variant.exported_at,
    docx_exported: variant.docx_exported,
    pdf_exported: variant.pdf_exported,
    is_locked: variant.is_locked || false,
  })),
  export_history: backendExam.export_history || [],
  sections: backendExam.sections || [],
  exam_instructions: backendExam.exam_instructions || '',
  footer_text: backendExam.footer_text || '',
  academic_integrity_statement: backendExam.academic_integrity_statement || '',
  include_academic_integrity: backendExam.include_academic_integrity ?? true,
  created_at: backendExam.created_at,
  updated_at: backendExam.updated_at,
  created_by: backendExam.created_by,
  created_by_name: backendExam.created_by_name,
  is_config_valid: backendExam.is_config_valid,
  difficulty_breakdown: backendExam.difficulty_breakdown || {
    Easy: 30,
    Medium: 50,
    Hard: 20,
  },
  cheating_risk_score: backendExam.cheating_risk_score,
  total_points: backendExam.total_points || 0,
  weight: Number(backendExam.weight ?? 0),
  required_to_pass: !!backendExam.required_to_pass,
  allow_reuse: backendExam.allow_reuse ?? false,
  distribution_info: backendExam.distribution_info,
  auto_balance_status: backendExam.auto_balance_status,
  analytics: backendExam.analytics,
  current_variant_questions: backendExam.current_variant_questions || [],
  unknown_percentage: backendExam.unknown_percentage,
});

// Helper function to determine subject from course code
const getSubjectFromCourseCode = (
  courseCode: string
): 'math' | 'physics' | 'chem' => {
  const code = courseCode.toLowerCase();
  if (code.includes('math') || code.includes('calc') || code.includes('stat')) {
    return 'math';
  } else if (
    code.includes('phys') ||
    code.includes('mech') ||
    code.includes('thermo')
  ) {
    return 'physics';
  } else if (
    code.includes('chem') ||
    code.includes('bio') ||
    code.includes('org')
  ) {
    return 'chem';
  }
  // Default to math for unknown subjects
  return 'math';
};

// Helper function to get random image based on exam ID
const getRandomImage = (examId: number): string => {
  const images = [
    'https://images.unsplash.com/photo-1676917870168-aeb9803b2016?q=80&w=2023&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://plus.unsplash.com/premium_photo-1720189952226-5d72d4b73554?q=80&w=2067&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://plus.unsplash.com/premium_photo-1676490655747-d9c21023be84?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=200&fit=crop',
    'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=200&fit=crop',
    'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&h=200&fit=crop',
  ];
  return images[examId % images.length];
};

export const examAPI = {
  // Get all exams
  async getExams(courseId?: number): Promise<Exam[]> {
    const params = courseId ? { course: courseId } : {};
    const response = await axiosInstance.get('/exams/', { params });

    // Ensure we always return an array
    const data = response.data;
    if (Array.isArray(data)) {
      return data.map(transformExam);
    } else if (data && Array.isArray(data.results)) {
      return data.results.map(transformExam);
    } else {
      console.warn('Unexpected exam API response format:', data);
      return [];
    }
  },

  // Get single exam details
  async getExamDetail(examId: number): Promise<ExamDetail> {
    const response = await axiosInstance.get(`/exams/${examId}/`);
    return transformExamDetail(response.data);
  },

  // Create a new exam
  async createExam(examData: {
    title: string;
    exam_type: string;
    time_limit: number;
    course: number;
    description?: string;
  }): Promise<Exam> {
    const response = await axiosInstance.post('/exams/', examData);
    return transformExam(response.data);
  },

  // Update exam
  // Update exam
  async updateExam(
    examId: number,
    examData: Partial<{
      title: string;
      description: string;
      exam_type: string;
      course: number;
      time_limit: number;
      weight: number;
      required_to_pass: boolean | 0 | 1;
      num_variants: number;
      questions_per_variant: number;
      randomize_questions: boolean;
      randomize_choices: boolean;
      show_answers_after: boolean;
      easy_percentage: number;
      medium_percentage: number;
      hard_percentage: number;
      question_budget: number;
      allow_reuse: boolean;
      unknown_percentage: number;
    }>
  ): Promise<Exam> {
    // Always include unknown_percentage in the payload
    const payload = {
      ...examData,
      unknown_percentage:
        typeof examData.unknown_percentage === 'number'
          ? examData.unknown_percentage
          : 0,
    };

    // Send the update
    await axiosInstance.patch(`/exams/${examId}/`, payload);

    // Fetch the updated exam to ensure we get all fields including time_limit
    const response = await axiosInstance.get(`/exams/${examId}/`);

    // Transform and return
    return transformExam(response.data);
  },

  // Delete exam
  async deleteExam(examId: number): Promise<void> {
    await axiosInstance.delete(`/exams/${examId}/`);
  },

  // NEW: Wizard-specific methods
  async getWizardData(examId: number): Promise<WizardData> {
    const response = await axiosInstance.get(`/exams/${examId}/wizard_data/`);
    return response.data;
  },

  async updateWizardData(
    examId: number,
    wizardData: {
      title?: string;
      description?: string;
      exam_type?: string;
      time_limit?: number;
      num_variants?: number;
      questions_per_variant?: number;
      randomize_questions?: boolean;
      randomize_choices?: boolean;
      show_answers_after?: boolean;
      easy_percentage?: number;
      medium_percentage?: number;
      hard_percentage?: number;
      unknown_percentage?: number;
      question_budget?: number;
      available_from?: string;
      available_until?: string;
      weight?: number;
      required_to_pass?: boolean;
      allow_reuse?: boolean;
      exam_instructions?: string;
      footer_text?: string;
      academic_integrity_statement?: string;
      include_academic_integrity?: boolean;
      marking_scheme?: {
        multiCorrectPolicy:
          | 'all_or_nothing'
          | 'partial_credit'
          | 'partial_with_penalty';
        negativeMarking: {
          enabled: boolean;
          penalty: number;
          applyTo: 'all_questions' | 'single_choice_only' | 'multi_choice_only';
        };
        sectionWeighting: {
          [sectionId: number]: number;
        };
      };
      sections?: ExamSection[];
      mandatory_question_ids?: number[];
    }
  ): Promise<{ message: string; exam_id: number }> {
    const response = await axiosInstance.post(
      `/exams/${examId}/update_wizard_data/`,
      wizardData
    );
    return response.data;
  },

  async getAvailableQuestionBanks(examId: number): Promise<QuestionBank[]> {
    const response = await axiosInstance.get(
      `/exams/${examId}/available_question_banks/`
    );
    return response.data;
  },

  /**
   * Generate exam variants with anti-cheating measures
   * Implements adjacent seat prevention and difficulty distribution
   */
  async generateVariants(examId: number): Promise<VariantGenerationResponse> {
    try {
      const response = await axiosInstance.post(
        `/exams/${examId}/generate_variants/`
      );
      return response.data;
    } catch (error) {
      console.error('Error generating variants:', error);
      throw error;
    }
  },

  /**
   * Update variant questions (before export)
   */
  async updateVariant(
    variantId: number,
    questions: ExamQuestion[]
  ): Promise<ApiResponse> {
    try {
      const response = await axiosInstance.post(
        `/exams/variants/${variantId}/update_order/`,
        {
          question_orders: questions.reduce(
            (acc, q, index) => {
              acc[q.id] = index + 1;
              return acc;
            },
            {} as Record<number, number>
          ),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating variant:', error);
      throw error;
    }
  },

  async getExamResults(examId: number): Promise<ExamResultsResponse> {
    const { data } = await axiosInstance.get<ExamResultsResponse>(
      `/results/instructor/exams/${examId}/results/`
    );
    // coerce percentage_score on every row
    data.results = data.results.map((r) => ({
      ...r,
      percentage_score: Number(r.percentage_score),
    }));
    return data;
  },

  /**
   * Export variant (locks it and generates DOCX)
   */
  async exportVariant(variantId: number, examId: number): Promise<Blob> {
    try {
      const response = await axiosInstance.post(
        `/exams/${examId}/export_docx/`,
        {
          variant_ids: [variantId],
        },
        {
          responseType: 'blob',
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error exporting variant:', error);
      throw error;
    }
  },

  /**
   * Get answer key for all variants
   */
  async getAnswerKey(examId: number): Promise<AnswerKeyResponse> {
    try {
      const response = await axiosInstance.get(`/exams/${examId}/answer-key/`);
      return response.data;
    } catch (error) {
      console.error('Error getting answer key:', error);
      throw error;
    }
  },

  // Publish an exam
  async publishExam(examId: number): Promise<ApiResponse> {
    const response = await axiosInstance.post(`/exams/${examId}/publish/`);
    return response.data;
  },

  // Unpublish an exam
  async unpublishExam(examId: number): Promise<ApiResponse> {
    const response = await axiosInstance.post(`/exams/${examId}/unpublish/`);
    return response.data;
  },

  // Add questions to an exam
  async addQuestions(
    examId: number,
    questionIds: number[]
  ): Promise<ApiResponse> {
    const response = await axiosInstance.post(
      `/exams/${examId}/add_questions/`,
      {
        question_ids: questionIds,
      }
    );
    return response.data;
  },

  // Remove questions from an exam (plural endpoint, expects array)
  async removeQuestion(
    examId: number,
    questionId: number
  ): Promise<ApiResponse> {
    try {
      const response = await axiosInstance.post(
        `/exams/${examId}/remove_questions/`,
        {
          question_ids: [questionId],
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error removing question:', error);
      throw error;
    }
  },

  // Get exam statistics
  async getExamStatistics(examId: number): Promise<ExamStatistics> {
    const { data } = await axiosInstance.get<ExamResultsResponse>(
      `/results/instructor/exams/${examId}/results/`
    );
    return data.statistics;
  },

  async deleteAllResults(examId: number): Promise<void> {
    await axiosInstance.delete(`/results/instructor/exams/${examId}/results/`);
  },

  // Get exam export history
  async getExportHistory(examId: number): Promise<ExportHistory[]> {
    const response = await axiosInstance.get(
      `/exams/${examId}/export_history/`
    );
    return response.data;
  },

  // Update mandatory questions for an exam
  async updateMandatoryQuestions(
    examId: number,
    questionIds: number[]
  ): Promise<ApiResponse> {
    const response = await axiosInstance.patch(`/exams/${examId}/`, {
      mandatory_question_ids: questionIds,
    });
    return response.data;
  },

  /**
   * Export exam variants to DOCX format
   */
  async exportDocx(examId: number, variantIds?: number[]): Promise<Blob> {
    try {
      const response = await axiosInstance.post(
        `/exams/${examId}/export_docx/`,
        {
          variant_ids: variantIds,
        },
        {
          responseType: 'blob',
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error exporting DOCX:', error);
      throw error;
    }
  },

  /**
   * Finalize variants - lock them for editing
   */
  async finalizeVariants(examId: number): Promise<ApiResponse> {
    try {
      const response = await axiosInstance.post(
        `/exams/${examId}/finalize_variants/`
      );
      return response.data;
    } catch (error) {
      console.error('Error finalizing variants:', error);
      throw error;
    }
  },

  /**
   * Assign variants to students for this exam
   */
  async assignVariantsToStudents(
    examId: number,
    strategy: 'round_robin' | 'random' | 'seating_based' = 'round_robin'
  ): Promise<ApiResponse> {
    try {
      const response = await axiosInstance.post(
        `/exams/${examId}/assign_variants_to_students/`,
        { strategy }
      );
      return response.data;
    } catch (error) {
      console.error('Error assigning variants to students:', error);
      throw error;
    }
  },

  /**
   * Get student-variant assignments for this exam
   */
  async getStudentAssignments(examId: number): Promise<ApiResponse> {
    try {
      const response = await axiosInstance.get(
        `/exams/${examId}/student_assignments/`
      );
      return response.data;
    } catch (error) {
      console.error('Error getting student assignments:', error);
      throw error;
    }
  },

  /**
   * Toggle mandatory status of a question for an exam
   */
  async toggleMandatory(
    examId: number,
    questionId: string,
    isMandatory: boolean
  ): Promise<void> {
    await axiosInstance.post(`/exams/${examId}/toggle_mandatory/`, {
      question_id: questionId,
      is_mandatory: isMandatory,
    });
  },

  /**
   * Remove a question from a variant
   */
  async removeQuestionFromVariant(
    variantId: number,
    questionId: number
  ): Promise<{ message: string }> {
    try {
      const response = await axiosInstance.post(
        `/exams/variants/${variantId}/remove_question/`,
        { question_id: questionId }
      );
      return response.data;
    } catch (error) {
      console.error('Error removing question from variant:', error);
      throw error;
    }
  },

  updateVariantQuestion: async (
    variantId: number,
    questionId: number,
    updates: {
      text: string;
      choices: Record<string, string>;
      correct_answer: string[];
      points: number;
    }
  ) => {
    const response = await axiosInstance.patch(
      `/exam-variants/${variantId}/questions/${questionId}/`,
      updates
    );
    return response.data;
  },

  /**
   * Export all variants as DOCX (zip), PDF (zip), or Answer Keys (zip)
   */
  async exportVariants(
    examId: number,
    format: 'docx' | 'pdf' | 'answer_key',
    variantIds?: number[]
  ): Promise<Blob> {
    const response = await axiosInstance.post(
      `/exams/${examId}/export_variants/`,
      {
        format,
        variant_ids: variantIds,
      },
      { responseType: 'blob' }
    );
    return response.data;
  },

  /**
   * Reorder questions in an exam (used for variant editing too)
   */
  async reorderExamQuestions(
    examId: number,
    questionIds: number[]
  ): Promise<ApiResponse> {
    // Build { question_id: order } mapping
    const question_orders: Record<number, number> = {};
    questionIds.forEach((id, idx) => {
      question_orders[id] = idx;
    });
    const response = await axiosInstance.post(
      `/exams/${examId}/reorder_questions/`,
      { question_orders }
    );
    return response.data;
  },

  /**
   * Reorder questions in a variant
   */
  async reorderVariantQuestions(
    variantId: number,
    questionIds: number[]
  ): Promise<ApiResponse> {
    const question_orders: Record<number, number> = {};
    questionIds.forEach((id, idx) => {
      question_orders[id] = idx;
    });
    const response = await axiosInstance.post(
      `/exams/variants/${variantId}/update_order/`,
      { question_orders }
    );
    return response.data;
  },

  async validateResultsImport(
    examId: number,
    formData: FormData
  ): Promise<any> {
    const url = `/results/instructor/exams/${examId}/omr/validate/`;

    const { data } = await axiosInstance.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return data;
  },

  async importResults(
    examId: number,
    formData: FormData
  ): Promise<ImportResult> {
    const url = `/results/instructor/exams/${examId}/omr/import/`;

    const { data } = await axiosInstance.post<ImportResult>(url, formData, {
      headers: {
        // force multipart/form-data so DRF sees the right Content-Type
        'Content-Type': 'multipart/form-data',
      },
    });

    return data;
  },

  // NEW (matches your DRF route):
  // examAPI.ts  – use GET instead of POST
  async exportResultsFile(
    examId: number,
    format: 'csv' | 'pdf' | 'docx'
  ): Promise<Blob> {
    // Use query parameters instead of path segments
    const url = `/results/export/${examId}/`;

    const { data } = await axiosInstance.get(url, {
      params: { format },
      responseType: 'blob',
    });

    return data;
  },

  async exportResultsCSV(examId: number): Promise<Blob> {
    const url = `/results/export/${examId}/csv/`;
    const { data } = await axiosInstance.get(url, { responseType: 'blob' });
    return data;
  },

  // Export results as PDF
  async exportResultsPDF(examId: number): Promise<Blob> {
    const url = `/results/export/${examId}/pdf/`;
    const { data } = await axiosInstance.get(url, { responseType: 'blob' });
    return data;
  },

  // Export results as DOCX
  async exportResultsDOCX(examId: number): Promise<Blob> {
    const url = `/results/export/${examId}/docx/`;
    const { data } = await axiosInstance.get(url, { responseType: 'blob' });
    return data;
  },

  /**
   * Export a single variant as DOCX or PDF
   */
  async exportVariantFile(
    examId: number,
    variantId: number,
    format: 'docx' | 'pdf' | 'answer_key'
  ): Promise<Blob> {
    const response = await axiosInstance.post(
      `/exams/${examId}/export_variant/`,
      {
        format,
        variant_id: variantId,
      },
      { responseType: 'blob' }
    );
    return response.data;
  },

  // Replace your existing exportAnswerKey method with this enhanced version:

  /**
   * Export answer key in various formats (CSV, PDF, DOCX)
   */
  async exportAnswerKey(
    examId: number,
    variantIds?: number[],
    format: 'csv' | 'pdf' | 'docx' = 'csv'
  ): Promise<Blob> {
    try {
      const response = await axiosInstance.post(
        `/exams/${examId}/export_answer_key/`,
        {
          variant_ids: variantIds,
          format: format,
        },
        {
          responseType: 'blob',
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error exporting answer key as ${format}:`, error);
      throw error;
    }
  },

  // Add this new method for exporting variants as CSV:

  /**
   * Export exam variant as CSV
   */
  async exportVariantCSV(examId: number, variantId: number): Promise<Blob> {
    try {
      const response = await axiosInstance.post(
        `/exams/${examId}/export_variant/`,
        {
          format: 'csv',
          variant_id: variantId,
        },
        { responseType: 'blob' }
      );
      return response.data;
    } catch (error) {
      console.error('Error exporting variant as CSV:', error);
      throw error;
    }
  },

  // These are convenience methods that use the enhanced exportAnswerKey:

  /**
   * Export answer key as PDF
   */
  async exportAnswerKeyPDF(examId: number, variantId: number): Promise<Blob> {
    return examAPI.exportAnswerKey(examId, [variantId], 'pdf');
  },

  /**
   * Export answer key as DOCX
   */
  async exportAnswerKeyDOCX(examId: number, variantId: number): Promise<Blob> {
    return examAPI.exportAnswerKey(examId, [variantId], 'docx');
  },

  // Add to examAPI object:
  async exportAnswerKeysBatch(
    examId: number,
    variantIds: number[],
    format: 'csv' | 'pdf' | 'docx'
  ): Promise<Blob> {
    try {
      const response = await axiosInstance.post(
        `/exams/${examId}/export_answer_keys_batch/`,
        {
          variant_ids: variantIds,
          format: format,
        },
        { responseType: 'blob' }
      );
      return response.data;
    } catch (error) {
      console.error('Error exporting answer keys batch:', error);
      throw error;
    }
  },

  async exportExamsBatch(
    examId: number,
    variantIds: number[],
    format: 'csv' | 'pdf' | 'docx'
  ): Promise<Blob> {
    try {
      const response = await axiosInstance.post(
        `/exams/${examId}/export_exams_batch/`,
        {
          variant_ids: variantIds,
          format: format,
        },
        { responseType: 'blob' }
      );
      return response.data;
    } catch (error: any) {
      // If it's a blob error response, read it
      if (error.response && error.response.data instanceof Blob) {
        const text = await error.response.data.text();
        console.error('Server error response:', text);
        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.error || 'Export failed');
        } catch {
          throw new Error(text || 'Export failed');
        }
      }
      console.error('Error exporting exams batch:', error);
      throw error;
    }
  },

  async getVariantSets(examId: number): Promise<{
    exam_id: number;
    variant_sets: Array<{
      id: string;
      name: string;
      variants: Variant[];
      is_locked: boolean;
      created_at: string;
      is_active: boolean;
    }>;
  }> {
    try {
      const response = await axiosInstance.get(
        `/exams/variants/variant_sets/?exam_id=${examId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error getting variant sets:', error);
      throw error;
    }
  },

  async lockVariant(
    variantId: number
  ): Promise<{ message: string; variant_id: number; is_locked: boolean }> {
    try {
      const response = await axiosInstance.post(
        `/exams/variants/${variantId}/lock_variant/`
      );
      return response.data;
    } catch (error) {
      console.error('Error locking variant:', error);
      throw error;
    }
  },

  async unlockVariant(
    variantId: number
  ): Promise<{ message: string; variant_id: number; is_locked: boolean }> {
    try {
      const response = await axiosInstance.post(
        `/exams/variants/${variantId}/unlock_variant/`
      );
      return response.data;
    } catch (error) {
      console.error('Error unlocking variant:', error);
      throw error;
    }
  },

  async deleteVariant(variantId: number): Promise<{ message: string }> {
    try {
      const response = await axiosInstance.post(
        `/exams/variants/${variantId}/delete_variant/`
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting variant:', error);
      throw error;
    }
  },

  async getVariantDetail(variantId: number): Promise<Variant> {
    try {
      const response = await axiosInstance.get(`/exams/variants/${variantId}/`);
      return response.data;
    } catch (error) {
      console.error('Error getting variant detail:', error);
      throw error;
    }
  },
};
