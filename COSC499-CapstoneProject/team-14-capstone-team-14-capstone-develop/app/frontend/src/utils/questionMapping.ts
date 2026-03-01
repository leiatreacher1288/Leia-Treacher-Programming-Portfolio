import { mapApiQuestionToFrontend } from './questionMapper';
import type { ExamQuestion } from '../api/examAPI';

// Standardized: Only prompt, choices, correct_answer are passed to the mapping function.
export const mapExamQuestionToFrontend = (examQuestion: ExamQuestion) => {
  const q = examQuestion.question as any; // type assertion to allow explanation
  return mapApiQuestionToFrontend({
    id: q.id,
    prompt: q.prompt,
    choices: q.choices,
    correct_answer: q.correct_answer,
    difficulty: q.difficulty,
    tags: q.tags,
    ...(q.explanation ? { explanation: q.explanation } : {}),
  });
};
