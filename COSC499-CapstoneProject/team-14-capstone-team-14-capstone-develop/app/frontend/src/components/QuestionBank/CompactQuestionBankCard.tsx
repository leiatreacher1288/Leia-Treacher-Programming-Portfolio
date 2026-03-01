import React from 'react';
import type { Question } from './types';

interface CompactQuestionBankCardProps {
  question: Question;
  isMandatory?: boolean;
  onToggleMandatory?: (questionId: string, newValue: boolean) => void;
}

export const CompactQuestionBankCard: React.FC<
  CompactQuestionBankCardProps
> = ({ question, isMandatory = false, onToggleMandatory }) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Hard':
        return 'bg-red-100 text-red-800';
      case 'Unknown':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isCorrect = (key: string) =>
    Array.isArray(question.correct_answer)
      ? question.correct_answer.includes(key)
      : question.correct_answer === key;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col gap-2 relative shadow-card hover:shadow-lg transition-all duration-150">
      {/* Top row: Mandatory toggle and difficulty badge */}
      <div className="flex items-center justify-between mb-1">
        {typeof isMandatory === 'boolean' && onToggleMandatory && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMandatory(question.id, !isMandatory);
            }}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border-none outline-none focus:ring-2 focus:ring-accent-indigo/50 transition-all duration-150 ${isMandatory ? 'bg-accent-indigo/90 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-accent-indigo/10 hover:text-accent-indigo'}`}
            style={{ minWidth: 0 }}
            aria-pressed={isMandatory}
          >
            {isMandatory ? (
              <span className="inline-block w-4 h-4 mr-1 text-white">✓</span>
            ) : (
              <span className="inline-block w-4 h-4 mr-1" />
            )}
            Mandatory
          </button>
        )}
        {question.difficulty !== 'Unknown' && (
          <span
            className={`ml-auto px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}
          >
            {question.difficulty}
          </span>
        )}
      </div>
      <div className="font-medium text-heading text-sm mb-1">
        {question.prompt}
      </div>
      <div className="grid grid-cols-2 gap-2 mt-1">
        {Object.entries(question.choices || {}).map(([key, value]) => (
          <div key={key} className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-gray-500 min-w-[20px]">
              {key}.
            </span>
            <span
              className={
                isCorrect(key)
                  ? 'bg-success-btn/10 text-success-btn font-semibold px-2 py-0.5 rounded-full'
                  : 'text-gray-700'
              }
            >
              {value}
              {isCorrect(key) && <span className="ml-1">✓</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
