export interface Student {
  id: string;
  name: string;
  semester: string;
  score: number;
}

export const mockStudents: Student[] = [
  {
    id: '2023001',
    name: 'Alice Johnson',
    semester: 'Summer 2023',
    score: 91,
  },
  {
    id: '2023002',
    name: 'Bob Smith',
    semester: 'Winter 2024',
    score: 85,
  },
  {
    id: '2023003',
    name: 'Charlie Nguyen',
    semester: 'Summer 2024',
    score: 78,
  },
  {
    id: '2023004',
    name: 'Diana Patel',
    semester: 'Winter 2023',
    score: 88,
  },
  {
    id: '2023005',
    name: 'Ethan Chen',
    semester: 'Winter 2024',
    score: 94,
  },
];
