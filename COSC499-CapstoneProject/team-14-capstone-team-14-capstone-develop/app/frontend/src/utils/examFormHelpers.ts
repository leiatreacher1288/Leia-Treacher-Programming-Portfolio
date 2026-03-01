// utils/examFormHelpers.ts
import type { ExamFormat } from '../types/globalSettings';

export interface ExamFormData {
  name: string;
  description: string;
  is_default: boolean;
  is_active: boolean;
  sections: Array<{ name: string; question_count: number; points: number }>;
  total_minutes: number;
  warning_minutes: number;
  easy_questions: number;
  medium_questions: number;
  hard_questions: number;
  randomize_questions: boolean;
  randomize_choices: boolean;
  show_progress: boolean;
  max_attempts: number;
  questions_per_page: number;
  question_display_mode: 'all_at_once' | 'one_by_one';
  allow_navigation: boolean;
  randomize_options: boolean;
  show_results_immediately: boolean;
  allow_review_after_submission: boolean;
  auto_submit_on_time_limit: boolean;
  require_webcam: boolean;
  require_microphone: boolean;
  lockdown_browser_required: boolean;
}

export const getDefaultFormData = (): ExamFormData => ({
  name: '',
  description: '',
  is_default: false,
  is_active: true,
  sections: [{ name: 'Main Section', question_count: 10, points: 100 }],
  total_minutes: 60,
  warning_minutes: 5,
  easy_questions: 3,
  medium_questions: 5,
  hard_questions: 2,
  randomize_questions: false,
  randomize_choices: false,
  show_progress: true,
  max_attempts: 3,
  questions_per_page: 1,
  question_display_mode: 'one_by_one' as 'all_at_once' | 'one_by_one',
  allow_navigation: true,
  randomize_options: false,
  show_results_immediately: false,
  allow_review_after_submission: true,
  auto_submit_on_time_limit: true,
  require_webcam: false,
  require_microphone: false,
  lockdown_browser_required: false,
});

export const formatToFormData = (format: ExamFormat): ExamFormData => ({
  name: format.global_setting.name,
  description: format.global_setting.description,
  is_default: format.global_setting.is_default,
  is_active: format.global_setting.is_active,
  sections:
    format.sections.length > 0
      ? format.sections
      : [{ name: 'Main Section', question_count: 10, points: 100 }],
  total_minutes: format.time_limits.total_minutes,
  warning_minutes: format.time_limits.warning_minutes,
  easy_questions: format.question_distribution.easy,
  medium_questions: format.question_distribution.medium,
  hard_questions: format.question_distribution.hard,
  randomize_questions: format.exam_structure.randomize_questions,
  randomize_choices: format.exam_structure.randomize_choices,
  show_progress: format.exam_structure.show_progress,
  // Default values for missing properties
  max_attempts: 3,
  questions_per_page: 1,
  question_display_mode: 'one_by_one',
  allow_navigation: true,
  randomize_options: false,
  show_results_immediately: false,
  allow_review_after_submission: true,
  auto_submit_on_time_limit: true,
  require_webcam: false,
  require_microphone: false,
  lockdown_browser_required: false,
});

export const formDataToApiFormat = (formData: ExamFormData) => ({
  global_setting: {
    name: formData.name,
    description: formData.description,
    is_default: formData.is_default,
    is_active: formData.is_active,
  },
  sections: formData.sections,
  time_limits: {
    total_minutes: formData.total_minutes,
    warning_minutes: formData.warning_minutes,
  },
  question_distribution: {
    easy: formData.easy_questions,
    medium: formData.medium_questions,
    hard: formData.hard_questions,
  },
  exam_structure: {
    randomize_questions: formData.randomize_questions,
    randomize_choices: formData.randomize_choices,
    show_progress: formData.show_progress,
  },
});

export const validateExamForm = (formData: ExamFormData): string[] => {
  const errors: string[] = [];

  if (!formData.name.trim()) {
    errors.push('Format name is required');
  }

  if (formData.total_minutes < 1) {
    errors.push('Time limit must be at least 1 minute');
  }

  if (formData.sections.length === 0) {
    errors.push('At least one section is required');
  }

  if (formData.warning_minutes < 0) {
    errors.push('Warning minutes cannot be negative');
  }

  if (formData.warning_minutes >= formData.total_minutes) {
    errors.push('Warning minutes must be less than total time limit');
  }

  if (formData.max_attempts < 1) {
    errors.push('Max attempts must be at least 1');
  }

  if (formData.questions_per_page < 1) {
    errors.push('Questions per page must be at least 1');
  }

  const totalQuestions =
    formData.easy_questions +
    formData.medium_questions +
    formData.hard_questions;
  if (totalQuestions < 1) {
    errors.push('At least one question is required');
  }

  // Validate sections
  formData.sections.forEach((section, index) => {
    if (!section.name.trim()) {
      errors.push(`Section ${index + 1} name is required`);
    }
    if (section.question_count < 1) {
      errors.push(`Section ${index + 1} must have at least 1 question`);
    }
    if (section.points < 0) {
      errors.push(`Section ${index + 1} points cannot be negative`);
    }
  });

  return errors;
};

export const calculateTotalQuestions = (formData: ExamFormData): number => {
  return (
    formData.easy_questions +
    formData.medium_questions +
    formData.hard_questions
  );
};

export const calculateTotalPoints = (formData: ExamFormData): number => {
  return formData.sections.reduce(
    (total, section) => total + section.points,
    0
  );
};

export const getFeatureTags = (
  format: ExamFormat
): Array<{ label: string; color: string }> => {
  const tags: Array<{ label: string; color: string }> = [];

  if (format.exam_structure.randomize_questions) {
    tags.push({ label: 'Random Questions', color: 'purple' });
  }

  if (format.exam_structure.randomize_choices) {
    tags.push({ label: 'Random Choices', color: 'purple' });
  }

  if (format.exam_structure.show_progress) {
    tags.push({ label: 'Show Progress', color: 'green' });
  }

  if (format.time_limits.warning_minutes > 0) {
    tags.push({
      label: `${format.time_limits.warning_minutes}min Warning`,
      color: 'orange',
    });
  }

  return tags;
};
