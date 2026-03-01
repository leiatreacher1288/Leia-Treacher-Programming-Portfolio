export interface Question {
  id: number;
  text: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  subject: string;
  type: string;
}

export const mockQuestions: Question[] = [
  {
    id: 1,
    text: "A comprehensive explanation of Einstein's theory of special and general relativity.",
    difficulty: 'Hard',
    subject: 'Physics',
    type: 'Essay',
  },
  {
    id: 2,
    text: 'Detailed description of the biochemical process by which green plants use sunlight, water, and carbon dioxide.',
    difficulty: 'Medium',
    subject: 'Biology',
    type: 'Short Answer',
  },
  {
    id: 3,
    text: 'A detailed question about the capital city of France, including historical context and significance.',
    difficulty: 'Easy',
    subject: 'Geography',
    type: 'MCQ',
  },
  //.....
];
