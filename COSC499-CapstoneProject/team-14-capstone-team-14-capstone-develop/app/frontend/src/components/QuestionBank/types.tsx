// src/components/QuestionBank/types.tsx

export type Tab = 'options' | 'difficulty' | 'tags' | 'explanation';

// ─────────────────────────────────────────────────────────────────────────────
// Frontend Question interface, now with optional course metadata
// ─────────────────────────────────────────────────────────────────────────────
export interface Question {
  id: string;
  prompt: string;
  choices: Record<string, string>;
  correct_answer: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Unknown';
  tags: string[];
  explanation: string;
  course_id?: number;
  course_code?: string;
  course_name?: string;
  is_duplicate?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// The raw shape coming from your API
// ─────────────────────────────────────────────────────────────────────────────
interface ApiQuestion {
  id: number;
  text?: string;
  prompt?: string;
  options?: Record<string, string> | string[];
  choices?: Record<string, string>;
  correct_answers?: Array<string | number>;
  correct_answer?: Array<string | number>;
  difficulty?: number | null;
  created_at: string;
  updated_at: string;
  tags?: string[];
  explanation?: string;
  course_id?: number;
  course_code?: string;
  course_name?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// convertApiQuestionToFrontend — with proper narrowing of `options`
// ─────────────────────────────────────────────────────────────────────────────
export const convertApiQuestionToFrontend = (
  apiQuestion: ApiQuestion
): Question => {
  // 1) Narrow `options` union before indexing
  const rawOpts = apiQuestion.options;
  let convertedChoices: Record<string, string> = {};

  if (Array.isArray(rawOpts)) {
    // array case → A, B, C…
    rawOpts.forEach((opt, idx) => {
      convertedChoices[String.fromCharCode(65 + idx)] = opt;
    });
  } else if (rawOpts) {
    // here TS knows rawOpts is Record<string,string>
    const keys = Object.keys(rawOpts);
    if (keys.every((k) => !isNaN(Number(k)))) {
      // numeric keys → letter keys
      keys.forEach((k, idx) => {
        convertedChoices[String.fromCharCode(65 + idx)] = rawOpts[k];
      });
    } else {
      // already letter→text
      convertedChoices = rawOpts;
    }
  } else if (apiQuestion.choices) {
    convertedChoices = apiQuestion.choices;
  }

  // 2) Normalize correct answers
  const rawAns =
    apiQuestion.correct_answers ?? apiQuestion.correct_answer ?? [];
  const convertedCorrectAnswers: string[] = rawAns.map((ans) =>
    typeof ans === 'number' ? String.fromCharCode(65 + ans) : ans
  );

  // 3) Build the base Question
  const base: Question = {
    id: apiQuestion.id.toString(),
    prompt: apiQuestion.prompt ?? apiQuestion.text ?? '',
    choices: convertedChoices,
    correct_answer: convertedCorrectAnswers,
    difficulty: getDifficultyLabel(apiQuestion.difficulty ?? null) as
      | 'Easy'
      | 'Medium'
      | 'Hard'
      | 'Unknown',
    tags: apiQuestion.tags ?? [],
    explanation: apiQuestion.explanation ?? '',
    course_id: apiQuestion.course_id,
    course_code: apiQuestion.course_code,
    course_name: apiQuestion.course_name,
  };

  return base;
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper to map numeric difficulty → label
// ─────────────────────────────────────────────────────────────────────────────
const getDifficultyLabel = (d: number | null): string => {
  if (d == null) return 'Unknown';
  switch (d) {
    case 1:
      return 'Easy';
    case 2:
      return 'Medium';
    case 3:
      return 'Hard';
    default:
      return 'Unknown';
  }
};
