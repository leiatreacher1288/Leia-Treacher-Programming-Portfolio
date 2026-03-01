// Utility to map API question data to frontend format
// STANDARDIZED FIELDS: prompt (question text), choices (options), correct_answer (array of correct answers)
// Only these fields are accepted. Legacy aliases are not supported.
interface ApiQuestion {
  id?: string | number;
  prompt?: string;
  choices?: Record<string, string>;
  correct_answer?: (string | number)[];
  difficulty?: number | string;
  tags?: string[];
  explanation?: string;
  title?: string;
  createdBy?: string;
  createdDate?: string;
  lastModified?: string;
  usedIn?: string[];
}

export function mapApiQuestionToFrontend(apiQuestion: ApiQuestion) {
  // Map options to {A:..., B:...}
  let options: Record<string, string> = {};
  if (apiQuestion.choices) {
    options = apiQuestion.choices;
  }

  // Map correct answers to letter keys
  let correctAnswer: string[] = [];
  let arr = apiQuestion.correct_answer || [];
  if (!Array.isArray(arr)) arr = [arr];
  // FIX: filter(Boolean) drops 0, so use filter(ans => ans !== undefined && ans !== null)
  correctAnswer = (arr as (string | number)[])
    .filter((ans) => ans !== undefined && ans !== null)
    .map((ans) =>
      typeof ans === 'number' ? String.fromCharCode(65 + ans) : ans
    );

  // Difficulty
  let difficulty: 'Easy' | 'Medium' | 'Hard' | 'Unknown' = 'Unknown';
  if (typeof apiQuestion.difficulty === 'number') {
    if (apiQuestion.difficulty === 1) difficulty = 'Easy';
    else if (apiQuestion.difficulty === 2) difficulty = 'Medium';
    else if (apiQuestion.difficulty === 3) difficulty = 'Hard';
  } else if (typeof apiQuestion.difficulty === 'string') {
    if (
      ['Easy', 'Medium', 'Hard', 'Unknown'].includes(apiQuestion.difficulty)
    ) {
      difficulty = apiQuestion.difficulty as
        | 'Easy'
        | 'Medium'
        | 'Hard'
        | 'Unknown';
    } else {
      difficulty = 'Unknown';
    }
  }

  return {
    id: apiQuestion.id?.toString() || '',
    prompt: apiQuestion.prompt || '',
    choices: options,
    correct_answer: Array.isArray(correctAnswer) ? correctAnswer : [],
    difficulty,
    tags: apiQuestion.tags || [],
    explanation: apiQuestion.explanation || '',
    course_id: (apiQuestion as any).course_id,
    course_code: (apiQuestion as any).course_code,
    course_name: (apiQuestion as any).course_name,
  };
}
