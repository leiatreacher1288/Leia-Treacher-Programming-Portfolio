import type { ExportHistory } from '../api/examAPI';

// Mock data explicitly matching the ExamAPI types:
export const mockExportHistory: ExportHistory[] = [
  {
    id: 1,
    exported_at: '2025-06-27T15:42:00Z',
    exported_by: 'Dr. Smith',
    export_format: 'docx',
    variants_exported: [
      {
        id: 101,
        version_label: 'A',
        created_at: '2025-06-27T10:00:00Z',
        exported_at: '2025-06-27T15:42:00Z',
        docx_exported: true,
        pdf_exported: false,
        is_locked: false,
        questions: [
          {
            id: 1,
            question: {
              id: 1,
              prompt: 'What is the derivative of x^2? Explain your reasoning.',
              choices: { A: '2x', B: 'x', C: 'x^2', D: 'None' },
              correct_answer: ['A'],
              difficulty: 'Easy',
              tags: ['Calculus', 'Derivatives'],
              question_type: 'MCQ',
              points: 2,
              explanation: '',
            },
            order: 0,
          },
          {
            id: 2,
            question: {
              id: 2,
              prompt: 'Define the concept of a limit in calculus.',
              choices: {},
              correct_answer: [],
              difficulty: 'Medium',
              tags: ['Calculus', 'Limits'],
              question_type: 'Short Answer',
              points: 3,
              explanation: '',
            },
            order: 1,
          },
        ],
      },
      {
        id: 102,
        version_label: 'B',
        created_at: '2025-06-27T11:00:00Z',
        exported_at: '2025-06-27T15:45:00Z',
        docx_exported: true,
        pdf_exported: true,
        is_locked: true,
        questions: [], // add questions if needed
      },
      {
        id: 103,
        version_label: 'C',
        created_at: '2025-06-27T12:00:00Z',
        exported_at: '2025-06-27T15:48:00Z',
        docx_exported: false,
        pdf_exported: true,
        is_locked: false,
        questions: [], // add questions if needed
      },
    ],
  },
  // ... more ExportHistory items if needed
];
