// src/api/analyticsAPI.ts
import axiosInstance from './axiosInstance';
import { courseAPI } from './courseAPI';

export interface CourseStatistics {
  courseCode: string;
  courseName: string;
  totalSections: number;
  averageAllYears: number;
  averageLast5Years: number;
  maxSectionAverage: number;
  minSectionAverage: number;
  historicalData: Array<{
    year: number;
    term: string;
    semester: 'Winter' | 'Summer';
    average: number;
    studentCount: number;
    professor: string;
    ta: string;
  }>;
}

export interface MostMissedQuestion {
  examId?: number; // Make optional since the API might not return this
  examTitle?: string; // Make optional since the API might not return this
  courseCode: string;
  courseName: string;
  questionId: string | number;
  questionNumber: string | number;
  questionText: string;
  missedCount: number;
  totalAttempts: number;
  missRate: number;
}

export interface CourseSearchResult {
  id: number;
  code: string;
  title: string;
  term: string;
  description?: string;
}

export interface InstructorOverview {
  overview: {
    total_courses: number;
    total_students: number;
    total_exams: number;
    average_grade: number;
  };
  top_performing_courses: Array<{
    id: number;
    code: string;
    name: string;
    avg_score: number;
    student_count: number;
    exam_count: number;
  }>;
  recent_activity: Array<{
    type: 'exam' | 'course' | 'student';
    action: string;
    course: string;
    date: string;
    relative_date: string;
  }>;
  grade_trends: Array<{
    month: string;
    average: number;
  }>;
}

export interface QuestionStatistics {
  questionNumber: number;
  difficulty: number;
  discrimination: number;
  pointBiserial: number;
  missedCount: number;
  correctPercent: number;
  averageTime: number;
  examId: number; // Add this!
  examTitle?: string; // Optionally add this too
}

export interface GradeDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface PerformanceMetrics {
  mean: number;
  median: number;
  standardDeviation: number;
  skewness: number;
  reliability: number;
  totalResults: number;
}

export interface SimilarityFlag {
  id: number;
  type: 'high' | 'medium' | 'low';
  course: string;
  exam: string;
  studentPair: {
    student1: { name: string; id: string };
    student2: { name: string; id: string };
  };
  similarityScore: number;
  flaggedQuestions: number[];
  dateDetected: string;
  status: 'pending' | 'reviewed' | 'dismissed' | 'confirmed';
  reviewer?: string;
  notes?: string;
}

export interface YearOverYearTrend {
  year: number;
  term: string;
  average: number;
  count: number;
}

export interface VariantSetAnalytics {
  integrity_score: {
    score: number;
    grade: string;
    color: string;
    components: {
      diversity_score: number;
      balance_score: number;
      pattern_score: number;
    };
    penalties: {
      variant_count_penalty: boolean;
      reuse_penalty: boolean;
    };
  };
  question_diversity: {
    total_questions: number;
    unique_questions: number;
    diversity_ratio: number;
    diversity_percentage: number;
    reuse_rate: number;
  };
  difficulty_distribution: {
    counts: Record<string, number>;
    percentages: Record<string, number>;
    balance_score: number;
    total_questions: number;
  };
  answer_pattern_analysis: {
    hamming_distance: number;
    hamming_percentage: number;
    pattern_diversity: number;
    risk_score: number;
    unique_patterns: number;
    total_variants: number;
  };
  question_reuse_rate: number;
  mandatory_overlap: number;
  hamming_distances: number[];
  variant_count: number;
  total_questions: number;
  unique_questions: number;
  metadata: {
    exam_id: number;
    exam_title: string;
    variant_ids: number[];
    variant_labels: string[];
    calculated_at: string;
  };
}

export const analyticsAPI = {
  // Get all available courses for analytics
  async getAllCoursesForAnalytics(): Promise<CourseSearchResult[]> {
    try {
      // Use the analytics-specific endpoint
      const response = await axiosInstance.get('/analytics/courses/');

      // Handle the response format from your Django backend
      if (
        response.data &&
        response.data.courses &&
        Array.isArray(response.data.courses)
      ) {
        return response.data.courses;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        console.warn(
          'Unexpected analytics API response format:',
          response.data
        );
        return [];
      }
    } catch (error) {
      console.error('Failed to fetch courses for analytics:', error);
      // Fall back to regular courses endpoint
      try {
        const courses = await courseAPI.getCourses();
        return courses.map(
          (course): CourseSearchResult => ({
            id: course.id,
            code: course.code,
            title: course.title,
            description: course.description,
            term: course.term,
          })
        );
      } catch (courseError) {
        console.error('Failed to fetch courses from fallback:', courseError);
        return [];
      }
    }
  },

  // Search courses with autocomplete
  async searchCourses(
    query: string,
    instructor_only: boolean = false
  ): Promise<CourseSearchResult[]> {
    try {
      const response = await axiosInstance.get('/courses/search/', {
        params: {
          q: query,
          instructor_only: instructor_only,
        },
      });
      return response.data.courses || response.data;
    } catch (error) {
      console.error('Error searching courses:', error);
      // Fall back to filtering all courses
      const allCourses = await this.getAllCoursesForAnalytics();
      return allCourses.filter(
        (course) =>
          course.code.toLowerCase().includes(query.toLowerCase()) ||
          course.title.toLowerCase().includes(query.toLowerCase())
      );
    }
  },

  // Get instructor overview data
  async getInstructorOverview(): Promise<InstructorOverview> {
    try {
      const response = await axiosInstance.get(
        '/analytics/instructor/overview/'
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching instructor overview:', error);
      throw error;
    }
  },

  async getQuestionAnalytics(): Promise<{
    questionStatistics: QuestionStatistics[];
    totalQuestions: number;
    examCount: number;
    mostMissedPerExam: MostMissedQuestion[]; // Add this line
    mostMissedPerCourse: MostMissedQuestion[]; // Add this line for the actual API response
  }> {
    try {
      const response = await axiosInstance.get('/analytics/questions/');
      return response.data;
    } catch (error) {
      console.error('Error fetching question analytics:', error);
      throw error;
    }
  },

  // Get grade distribution
  async getGradeDistribution(): Promise<{
    distribution: GradeDistribution[];
    totalResults: number;
  }> {
    try {
      const response = await axiosInstance.get(
        '/analytics/grade-distribution/'
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching grade distribution:', error);
      throw error;
    }
  },

  // Get performance metrics
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    try {
      const response = await axiosInstance.get(
        '/analytics/performance-metrics/'
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      throw error;
    }
  },

  async getSimilarityFlags(): Promise<{
    flags: SimilarityFlag[];
    totalFlags: number;
    activeFlags: number;
    highRiskFlags: number;
  }> {
    try {
      const response = await axiosInstance.get('/analytics/similarity-flags/');
      return response.data;
    } catch (error) {
      console.error('Error fetching similarity flags:', error);
      throw error;
    }
  },

  // Update similarity flag status
  async updateSimilarityFlag(
    flagId: number,
    status: string,
    notes?: string
  ): Promise<any> {
    try {
      const response = await axiosInstance.post(
        '/analytics/similarity-flags/',
        {
          flag_id: flagId,
          status: status,
          notes: notes || '',
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating similarity flag:', error);
      throw error;
    }
  },

  // Get year-over-year trends - updated to accept new timeframe options
  async getYearOverYearTrends(
    timeframe: 'all' | '1year' | '1month' | '1week' | string = '1year'
  ): Promise<{
    trends: YearOverYearTrend[];
    timeframe: string;
    totalDataPoints: number;
  }> {
    try {
      const response = await axiosInstance.get('/analytics/trends/', {
        params: { timeframe },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching year-over-year trends:', error);
      throw error;
    }
  },

  // Get comprehensive course statistics
  async getCourseStatistics(courseCode: string): Promise<CourseStatistics> {
    try {
      const response = await axiosInstance.get(
        `/analytics/course-statistics/${courseCode}/`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch course statistics:', error);
      throw error;
    }
  },

  // Get student report data
  async getStudentReport(courseId: number, studentId: number): Promise<any> {
    try {
      const response = await axiosInstance.get(
        `/analytics/student-report/${courseId}/${studentId}/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching student report:', error);
      throw error;
    }
  },

  // Compare courses
  async compareCourses(courseIds: number[]): Promise<any> {
    try {
      const response = await axiosInstance.post('/analytics/compare-courses/', {
        course_ids: courseIds,
      });
      return response.data;
    } catch (error) {
      console.error('Error comparing courses:', error);
      throw error;
    }
  },

  // Export analytics data
  async exportAnalytics(format: string, options: any): Promise<Blob> {
    try {
      const response = await axiosInstance.post(
        '/analytics/export/',
        { format, ...options },
        { responseType: 'blob' }
      );
      return response.data;
    } catch (error) {
      console.error('Error exporting analytics:', error);
      throw error;
    }
  },

  /**
   * Get comprehensive analytics for a specific variant set
   */
  async getVariantSetAnalytics(
    examId: number,
    variantIds: number[]
  ): Promise<VariantSetAnalytics> {
    try {
      const variantIdsString = variantIds.join(',');
      const response = await axiosInstance.get(
        `/analytics/variant-set/${examId}/${variantIdsString}/`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching variant set analytics:', error);
      throw new Error('Failed to fetch variant set analytics');
    }
  },
};
