// src/api/questionAPI.ts
import axiosInstance from './axiosInstance';

export interface Question {
  id: number;
  bank: number;
  prompt: string;
  choices: Record<string, string>;
  correct_answer: string[];
  points: number;
  difficulty: 1 | 2 | 3; // 1=Easy, 2=Medium, 3=Hard
  tags: string[];
  explanation: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  course_name?: string;
  course_id?: number;
  course_code?: string;
}

export interface QuestionBank {
  id: number;
  course: number;
  title: string;
  description: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  question_count: number;
  difficulty_breakdown: {
    easy: number;
    medium: number;
    hard: number;
    unknown: number;
  };
  tag_counts: Record<string, number>;
}

export interface QuestionFilters {
  course?: number;
  difficulty?: 1 | 2 | 3;
  tags?: string[];
  search?: string;
  question_type?: string;
}

export interface ImportResult {
  filename: string;
  status: 'success' | 'failed' | 'partial';
  saved: number;
  failed: number;
  duplicates: number;
  errors: Array<{ row: number; errors: any; prompt: string }>;
  duplicate_details: Array<{
    row: number;
    prompt: string;
    existing_in_courses: string[];
    question_id: number;
  }>;
  saved_question_ids?: number[];
  notes: string[];
}

export interface BulkImportResult {
  course_name: string;
  course_code: string;
  exam_name: string;
  exam_id: number;
  results: ImportResult[];
  total_saved: number;
  total_failed: number;
  total_duplicates: number;
}

export const previewImportQuestions = async (
  courseId: number,
  questions: any[]
) => {
  const res = await axiosInstance.post(`/courses/${courseId}/preview-import/`, {
    questions,
  });
  return res.data;
};

export const importQuestions = async (courseId: number, questions: any[]) => {
  const res = await axiosInstance.post(
    `/courses/${courseId}/import-questions/`,
    { questions }
  );
  return res.data;
};

// Transform backend difficulty to frontend format
export const getDifficultyLabel = (difficulty: number): string => {
  switch (difficulty) {
    case 1:
      return 'Easy';
    case 2:
      return 'Medium';
    case 3:
      return 'Hard';
    default:
      return 'Medium';
  }
};

// Transform frontend difficulty to backend format
export function getDifficultyValue(
  difficulty: string | number
): string | number {
  if (typeof difficulty === 'string') {
    return difficulty.toLowerCase();
  }
  return difficulty;
}

export const questionAPI = {
  // Delete a question by ID
  async deleteQuestion(questionId: number): Promise<void> {
    await axiosInstance.delete(`/questions/question/${questionId}/`);
  },

  // Get all questions with optional filters
  async getQuestions(filters?: QuestionFilters): Promise<Question[]> {
    const params = new URLSearchParams();

    if (filters?.course) params.append('course', filters.course.toString());
    if (filters?.difficulty)
      params.append('difficulty', filters.difficulty.toString());
    if (filters?.tags?.length) params.append('tags', filters.tags.join(','));
    if (filters?.search) params.append('search', filters.search);
    if (filters?.question_type)
      params.append('question_type', filters.question_type);

    const response = await axiosInstance.get(`/questions/all/`, { params });
    return response.data;
  },

  // Get questions by question bank
  async getQuestionsByBank(bankId: number): Promise<Question[]> {
    const response = await axiosInstance.get(
      `/questions/questionlist/${bankId}/`
    );
    return response.data;
  },

  // Get a single question by ID
  async getQuestion(questionId: number): Promise<Question> {
    const response = await axiosInstance.get(
      `/questions/question/${questionId}/`
    );
    return response.data;
  },

  // Get question banks by course
  async getQuestionBanksByCourse(courseId: number): Promise<QuestionBank[]> {
    const response = await axiosInstance.get(
      `/questions/questionbanklist/${courseId}/`
    );
    return response.data;
  },

  // Create new question bank
  async createQuestionBank(bankData: {
    courseId?: number;
    title?: string;
    description?: string;
  }): Promise<QuestionBank> {
    const courseId = bankData.courseId;
    if (!courseId) {
      throw new Error('Course ID is required to create a question bank');
    }

    // If description is empty, fetch course information to create a better description
    let description = bankData.description;
    if (!description || description.trim() === '') {
      let courseCode = `Course ${courseId}`;
      let courseName = '';
      try {
        console.log('🔍 Fetching course details for courseId:', courseId);
        const courseResponse = await axiosInstance.get(`/courses/${courseId}/`);
        const courseData = courseResponse.data;
        console.log('📋 Course data received:', courseData);
        courseCode = courseData.code || `Course ${courseId}`;
        courseName = courseData.name || '';
        console.log(
          '🏷️ Using course code:',
          courseCode,
          'course name:',
          courseName
        );
        description = courseName ? `${courseCode} - ${courseName}` : courseCode;
      } catch (error) {
        console.log('❌ Could not fetch course information, using fallback');
        console.error('Course fetch error:', error);
        description = `Course ${courseId}`;
      }
    }

    const requestData = {
      course: courseId,
      title: bankData.title || `Question Bank for Course ${courseId}`,
      description: description,
    };

    console.log('🆕 Creating question bank with data:', requestData);

    const response = await axiosInstance.post(
      '/questions/questionbank/',
      requestData
    );
    return response.data;
  },

  // Ensure a question bank exists for a course, create one if needed
  async ensureQuestionBankExists(courseId: number): Promise<QuestionBank> {
    console.log('🔍 ensureQuestionBankExists called with courseId:', courseId);

    // Check if there are any existing question banks for this course
    const existingBanks = await this.getQuestionBanksByCourse(courseId);
    console.log('📚 Existing banks found:', existingBanks.length);

    if (existingBanks.length > 0) {
      console.log('✅ Using existing question bank:', existingBanks[0].title);
      return existingBanks[0];
    } else {
      console.log('❌ No existing question banks found, creating new one');
    }

    // Get course information to use course code in description
    let courseCode = `Course ${courseId}`;
    try {
      console.log('🔍 Fetching course details for courseId:', courseId);
      const courseResponse = await axiosInstance.get(`/courses/${courseId}/`);
      const courseData = courseResponse.data;
      console.log('📋 Course data received:', courseData);
      courseCode = courseData.code || `Course ${courseId}`;
      console.log('🏷️ Using course code:', courseCode);
    } catch (error) {
      console.log('❌ Could not fetch course information, using fallback');
      console.error('Course fetch error:', error);
    }

    // If no existing banks, create a new one
    const newBankData = {
      courseId: courseId,
      title: `Question Bank for ${courseCode}`,
      description: `Auto-created question bank for ${courseCode}`,
    };
    console.log('🆕 Creating new question bank with data:', newBankData);

    return await this.createQuestionBank(newBankData);
  },

  // Update question bank
  async updateQuestionBank(
    bankId: number,
    bankData: Partial<{
      title: string;
      description: string;
    }>
  ): Promise<QuestionBank> {
    const response = await axiosInstance.patch(
      `/questions/questionbank/${bankId}/`,
      bankData
    );
    return response.data;
  },

  // Delete question bank
  async deleteQuestionBank(bankId: number): Promise<void> {
    await axiosInstance.delete(`/questions/questionbank/${bankId}/`);
  },

  // Upload questions from file
  async uploadQuestionsFile(
    file: File,
    questionBankId: number,
    courseId: number,
    examId?: number
  ): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('question_bank_id', questionBankId.toString());
    formData.append('course', courseId.toString());
    if (examId) {
      formData.append('exam', examId.toString());
    }

    const response = await axiosInstance.post('/questions/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = response.data;
    const notes: string[] = [];

    if (data.duplicates > 0) {
      notes.push(
        `${data.duplicates} duplicate questions found and were skipped`
      );
    }

    if (data.failed > 0) {
      const errorSummary = data.errors
        .map((error: any) => {
          if (error.errors.choices && Array.isArray(error.errors.choices)) {
            return `Question "${error.prompt}" missing minimum 2 options`;
          }
          return `Question "${error.prompt}" has validation errors`;
        })
        .join(', ');
      notes.push(`Failed imports: ${errorSummary}`);
    }

    if (data.saved > 0) {
      notes.push(`${data.saved} questions successfully imported`);
    }

    return {
      filename: file.name,
      status:
        data.failed === 0 ? 'success' : data.saved > 0 ? 'partial' : 'failed',
      saved: data.saved,
      failed: data.failed,
      duplicates: data.duplicates,
      errors: data.errors,
      duplicate_details: data.duplicate_details,
      saved_question_ids: data.saved_question_ids,
      notes: notes,
    };
  },

  // Upload multiple files
  async uploadMultipleFiles(
    files: File[],
    questionBankId: number,
    courseId: number,
    examId?: number
  ): Promise<BulkImportResult> {
    const results: ImportResult[] = [];
    let totalSaved = 0;
    let totalFailed = 0;
    let totalDuplicates = 0;

    // Process files sequentially to handle duplicates properly
    for (const file of files) {
      try {
        const result = await this.uploadQuestionsFile(
          file,
          questionBankId,
          courseId,
          examId
        );
        results.push(result);
        totalSaved += result.saved;
        totalFailed += result.failed;
        totalDuplicates += result.duplicates;
      } catch (error: any) {
        results.push({
          filename: file.name,
          status: 'failed',
          saved: 0,
          failed: 0,
          duplicates: 0,
          errors: [],
          duplicate_details: [],
          notes: [`Upload failed: ${error.message || 'Unknown error'}`],
        });
        totalFailed++;
      }
    }

    // Get course and exam info for display
    let examName = 'Unknown Exam';
    let courseName = 'Unknown Course';
    let courseCode = 'Unknown';

    try {
      const courseResponse = await axiosInstance.get(`/courses/${courseId}/`);
      const courseData = courseResponse.data;
      courseName = courseData.name || 'Unknown Course';
      courseCode = courseData.code || 'Unknown';

      if (examId) {
        const examResponse = await axiosInstance.get(`/exams/${examId}/`);
        const examData = examResponse.data;
        examName = examData.title || 'Unknown Exam';
      }
    } catch (error) {
      console.error('Error fetching course/exam info:', error);
    }

    return {
      course_name: courseName,
      course_code: courseCode,
      exam_name: examName,
      exam_id: examId || 0,
      results: results,
      total_saved: totalSaved,
      total_failed: totalFailed,
      total_duplicates: totalDuplicates,
    };
  },

  // Validate file type
  validateFileType(file: File): boolean {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    const fileExtension = file.name.toLowerCase().split('.').pop();
    const allowedExtensions = ['csv', 'xls', 'xlsx'];

    return (
      allowedTypes.includes(file.type) ||
      Boolean(fileExtension && allowedExtensions.includes(fileExtension))
    );
  },

  // Get difficulty label
  getDifficultyLabel(difficulty: number): string {
    return getDifficultyLabel(difficulty);
  },

  // Get difficulty value
  getDifficultyValue(difficulty: string | number): string | number {
    return getDifficultyValue(difficulty);
  },

  // Create a new question
  async createQuestion(questionData: {
    bank: number;
    prompt: string;
    choices: Record<string, string>;
    correct_answer: string[];
    difficulty?: number;
    tags: string[];
    explanation: string;
  }): Promise<Question> {
    const response = await axiosInstance.post(
      '/questions/question/',
      questionData
    );
    return response.data;
  },

  // Update a question
  async updateQuestion(
    questionId: number,
    questionData: Partial<{
      prompt: string;
      choices: Record<string, string>;
      correct_answer: string[];
      difficulty: number;
      tags: string[];
      explanation: string;
    }>
  ): Promise<Question> {
    const response = await axiosInstance.patch(
      `/questions/question/${questionId}/`,
      questionData
    );
    return response.data;
  },
};
