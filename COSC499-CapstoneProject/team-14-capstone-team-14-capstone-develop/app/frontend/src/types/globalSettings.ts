// Global Settings Types for Admin Interface (UR 1.3)

export interface GlobalSetting {
  id?: number;
  key: string;
  setting_type: 'marking-scheme' | 'exam-format' | 'system-config';
  name: string;
  description: string;
  value: Record<string, any>;
  is_active: boolean;
  is_default: boolean;
  created_by?: number;
  updated_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface MarkingScheme {
  id?: number;
  global_setting: {
    id?: number;
    name: string;
    description: string;
    is_default: boolean;
    is_active: boolean;
  };
  grade_boundaries: Record<string, number>;
  negative_marking: {
    enabled: boolean;
    penalty_percentage: number;
  };
  pass_threshold: number;
  weight_distribution: Record<string, number>;
}

export interface ExamFormat {
  id?: number;
  global_setting: {
    id?: number;
    name: string;
    description: string;
    is_default: boolean;
    is_active: boolean;
  };
  sections: Array<{
    name: string;
    question_count: number;
    points: number;
  }>;
  time_limits: {
    total_minutes: number;
    warning_minutes: number;
  };
  question_distribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  exam_structure: {
    randomize_questions: boolean;
    randomize_choices: boolean;
    show_progress: boolean;
  };
}

export interface CourseOverview {
  id: number;
  code: string;
  name: string;
  description: string;
  term: string;
  creator_name: string;
  creator_email: string;
  creator_id: number;
  created_at: string;
  student_count: number;
  exam_count: number;
}

export interface ExamOverview {
  id: number;
  title: string;
  course_code: string;
  course_name: string;
  creator_name: string;
  status: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  total_questions: number;
  total_marks: number;
}

export interface GlobalSettingsApiResponse {
  success: boolean;
  settings?: GlobalSetting[];
  marking_schemes?: MarkingScheme[];
  exam_formats?: ExamFormat[];
  courses?: CourseOverview[];
  exams?: ExamOverview[];
  statistics?: {
    total_courses?: number;
    active_courses?: number;
    total_exams?: number;
    active_exams?: number;
    upcoming_exams?: number;
    filtered_count?: number;
  };
  count?: number;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface GlobalSettingsFormData {
  markingScheme: Partial<MarkingScheme>;
  examFormat: Partial<ExamFormat>;
  globalSetting: Partial<GlobalSetting>;
}

export type GlobalSettingsTab =
  | 'marking-schemes'
  | 'exam-formats'
  | 'courses-overview'
  | 'exams-overview';
