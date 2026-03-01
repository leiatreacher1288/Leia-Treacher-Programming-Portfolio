// src/components/QuestionBank/QuestionsList.tsx
import React from 'react';
import { QuestionBankCard } from './QuestionBankCard';
import { convertApiQuestionToFrontend, type Question } from './types';
import type { Question as ApiQuestion } from '../../api/questionAPI';

interface QuestionsListProps {
  questions: ApiQuestion[];
  filteredQuestions: ApiQuestion[];
  selectedQuestions: Set<number>;
  onSelect: (id: number) => void;
  onEdit: (q: Question) => void;
  onDelete: (id: string) => void;
}

export const QuestionsList: React.FC<QuestionsListProps> = ({
  filteredQuestions,
  selectedQuestions,
  onSelect,
  onEdit,
  onDelete,
}) => (
  <div className="space-y-4 w-full">
    {filteredQuestions.length === 0 ? (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No questions found</p>
        <p className="text-gray-400 mt-2">
          Try adjusting your search or filters
        </p>
      </div>
    ) : (
      filteredQuestions.map((q, i) => {
        const fq = convertApiQuestionToFrontend(q);
        return (
          <QuestionBankCard
            key={q.id}
            question={fq}
            questionNumber={i + 1}
            isSelected={selectedQuestions.has(q.id)}
            onSelect={() => onSelect(q.id)}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        );
      })
    )}
  </div>
);
