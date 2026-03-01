export type Tab = 'questions' | 'config' | 'variants' | 'analytics' | 'results';

export interface VariantQuestion {
  id: number;
  question: {
    id: number;
    prompt: string;
    question_type: string;
    difficulty: string;
    points: number;
    choices: Record<string, string>;
    correct_answer: string[];
    tags: string[];
    explanation?: string;
    course_id?: number;
    course_code?: string;
    course_name?: string;
  };
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

export interface EditingVariant {
  id: number;
  version_label: string;
  questions: VariantQuestion[];
  is_locked?: boolean;
}
