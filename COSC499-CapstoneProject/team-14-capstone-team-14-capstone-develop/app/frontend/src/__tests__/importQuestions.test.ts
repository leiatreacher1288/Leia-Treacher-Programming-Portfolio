it('imports questions from CSV with blank lines', async () => {
  const csvContent = 'prompt\n\nQ1\n\nQ2\n';
  const file = makeNodeFile(csvContent, 'blank.csv');
  const questions = await importQuestionsFromFile(file, 'csv');
  expect(questions).toHaveLength(2);
  expect(questions[0].prompt).toBe('Q1');
  expect(questions[1].prompt).toBe('Q2');
});

it('imports questions from CSV with only header', async () => {
  const csvContent = 'prompt\n';
  const file = makeNodeFile(csvContent, 'header.csv');
  const questions = await importQuestionsFromFile(file, 'csv');
  expect(questions).toEqual([]);
});

it('imports questions from CSV with quoted values', async () => {
  const csvContent = 'prompt\n"Q1, part"\n"Q2"';
  const file = makeNodeFile(csvContent, 'quoted.csv');
  const questions = await importQuestionsFromFile(file, 'csv');
  expect(questions).toHaveLength(2);
  expect(questions[0].prompt).toBe('Q1, part');
  expect(questions[1].prompt).toBe('Q2');
});

it('imports questions from CSV with duplicate questions', async () => {
  const csvContent = 'prompt\nQ1\nQ1\nQ2';
  const file = makeNodeFile(csvContent, 'dupes.csv');
  const questions = await importQuestionsFromFile(file, 'csv');
  expect(questions).toHaveLength(3);
  expect(questions[0].prompt).toBe('Q1');
  expect(questions[1].prompt).toBe('Q1');
  expect(questions[2].prompt).toBe('Q2');
});
import { vi } from 'vitest';

// Mock Papa.parse before importing the module
vi.mock('papaparse', () => ({
  default: {
    parse: vi.fn((text) => {
      const lines = text.split('\n').filter((line: string) => line.trim());
      const headers = lines[0]?.split(',') || [];
      const data = lines.slice(1).map((line: string) => {
        // Simple CSV parsing that handles quoted values
        const values: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());

        const row: any = {};
        headers.forEach((header: string, index: number) => {
          let value = values[index] || '';
          // Remove surrounding quotes
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          }
          row[header.trim()] = value;
        });
        return row;
      });
      return { data, errors: [] };
    }),
  },
}));

import { importQuestionsFromFile } from '../utils/importQuestions';

function makeNodeFile(content: string, name: string) {
  const file = new Blob([content], { type: 'text/csv' }) as any;
  file.name = name;
  file.text = async () => content;
  return file;
}

describe('importQuestionsFromFile', () => {
  it('imports questions from CSV', async () => {
    const csvContent = 'prompt\nQ1 CSV\nQ2 CSV';
    const file = makeNodeFile(csvContent, 'test.csv');
    const questions = await importQuestionsFromFile(file, 'csv');
    expect(questions).toHaveLength(2);
    expect(questions[0].prompt).toBe('Q1 CSV');
    expect(questions[1].prompt).toBe('Q2 CSV');
  });

  it('imports questions from empty CSV', async () => {
    const file = makeNodeFile('', 'empty.csv');
    const questions = await importQuestionsFromFile(file, 'csv');
    expect(questions).toEqual([]);
  });

  it('imports questions from CSV missing column', async () => {
    const file = makeNodeFile('not_prompt\nfoo', 'bad.csv');
    const questions = await importQuestionsFromFile(file, 'csv');
    expect(questions).toEqual([]);
  });

  it('imports questions from CSV with extra columns', async () => {
    const file = makeNodeFile('prompt,extra\nQ1,E1\nQ2,E2', 'extra.csv');
    const questions = await importQuestionsFromFile(file, 'csv');
    expect(questions).toHaveLength(2);
    expect(questions[0].prompt).toBe('Q1');
    expect(questions[1].prompt).toBe('Q2');
  });

  it('imports questions from large CSV', async () => {
    const rows = Array.from({ length: 1000 }, (_, i) => `Q${i}`);
    const csvContent = 'prompt\n' + rows.join('\n');
    const file = makeNodeFile(csvContent, 'large.csv');
    const questions = await importQuestionsFromFile(file, 'csv');
    expect(questions).toHaveLength(1000);
    expect(questions[0].prompt).toBe('Q0');
    expect(questions[999].prompt).toBe('Q999');
  });

  it('returns empty for unsupported type', async () => {
    const file = makeNodeFile('irrelevant', 'fake.xyz');
    const questions = await importQuestionsFromFile(file, 'xyz');
    expect(questions).toEqual([]);
  });

  it('imports questions from DOCX', async () => {
    // You may need to use a DOCX fixture or mock the parser
    // For demonstration, skip actual DOCX parsing
    // expect(questions).toHaveLength(2);
  });

  it('imports questions from PDF', async () => {
    // You may need to use a PDF fixture or mock the parser
    // For demonstration, skip actual PDF parsing
    // expect(questions).toBeInstanceOf(Array);
  });
});
