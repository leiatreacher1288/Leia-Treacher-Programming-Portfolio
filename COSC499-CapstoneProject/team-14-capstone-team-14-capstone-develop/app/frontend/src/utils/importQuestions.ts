import Papa from 'papaparse';
import type { Question } from '../api/questionAPI';

export async function importQuestionsFromFile(
  file: File,
  type: string
): Promise<Question[]> {
  if (type === 'csv') {
    const text = await file.text();
    const result = Papa.parse(text, { header: true, skipEmptyLines: true });

    if (!result.data || !Array.isArray(result.data)) return [];

    return result.data
      .filter((row: any) => row.prompt || row.question_text) // Only include rows with a prompt
      .map((row: any) => ({
        id: 0, // Will be assigned by backend
        prompt: row.prompt || row.question_text || '',
        choices: {
          A: row.a || '',
          B: row.b || '',
          C: row.c || '',
          D: row.d || '',
          E: row.e || '',
        },
        correct_answer: Array.isArray(row.correct_answer)
          ? row.correct_answer
          : [row.correct_answer || ''],
        difficulty: row.difficulty || 'Easy',
        tags: Array.isArray(row.tags) ? row.tags : [row.tags || ''],
        explanation: row.explanation || '',
        question_type: 'multiple_choice',
        points: 1,
        bank: 0, // Will be assigned by backend
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 0, // Will be assigned by backend
      }));
  }

  return [];
}
