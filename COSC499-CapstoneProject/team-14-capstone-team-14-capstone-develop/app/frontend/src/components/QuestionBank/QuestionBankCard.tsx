// src/components/QuestionBank/QuestionBankCard.tsx
import React from 'react';
import { FiEdit, FiTrash, FiLock } from 'react-icons/fi';
import type { Question } from './types';

interface QuestionBankCardProps {
  question: Question;
  isSelected?: boolean;
  isMandatory?: boolean;
  onSelect?: (questionId: number) => void;
  onEdit?: (question: Question) => void;
  onDelete?: (questionId: string) => void;
  onToggleMandatory?: (questionId: string, isMandatory: boolean) => void;
  questionNumber?: number;
  context?: 'question-bank' | 'exam';
}

export const QuestionBankCard: React.FC<QuestionBankCardProps> = ({
  question,
  questionNumber,
  isSelected = false,
  isMandatory = false,
  onSelect,
  onEdit,
  onDelete,
  onToggleMandatory,
  context = 'question-bank',
}) => {
  const getDifficultyColor = (difficulty: number | string | null) => {
    const difficultyValue =
      typeof difficulty === 'number'
        ? difficulty
        : difficulty === 'Easy'
          ? 1
          : difficulty === 'Medium'
            ? 2
            : difficulty === 'Hard'
              ? 3
              : null;

    switch (difficultyValue) {
      case 1:
        return 'bg-green-100 text-green-800 border-green-200';
      case 2:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 3:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getDifficultyLabel = (difficulty: number | string | null) => {
    if (typeof difficulty === 'number') {
      switch (difficulty) {
        case 1:
          return 'Easy';
        case 2:
          return 'Medium';
        case 3:
          return 'Hard';
        default:
          return 'Not set';
      }
    }
    return difficulty || 'Not set';
  };

  const isCorrect = (key: string) =>
    Array.isArray(question.correct_answer)
      ? question.correct_answer.includes(key)
      : question.correct_answer === key;

  const handleCardClick = () => {
    console.log(`Card clicked: ${question.id}, onSelect exists: ${!!onSelect}`);
    if (onSelect) {
      onSelect(Number(question.id));
    }
  };

  const showCourseHeader =
    question.course_id != null && question.course_code && question.course_name;

  const courseHeader = showCourseHeader ? (
    <h3 className="text-md font-semibold text-gray-900">
      {question.course_code} – {question.course_name}
    </h3>
  ) : null;

  return (
    <div
      className={`bg-white rounded-lg border p-6 shadow-sm transition-all duration-300 ${
        isSelected
          ? 'ring-2 ring-purple-400 ring-offset-1 shadow-lg transform scale-[1.01] border-purple-200 bg-purple-50'
          : 'border-gray-200 hover:shadow-md'
      }`}
      onClick={handleCardClick}
      tabIndex={0}
      role="button"
      aria-pressed={isSelected}
    >
      {/* Hidden checkbox for testing compatibility */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onSelect?.(Number(question.id))}
        className="sr-only"
        aria-label={`Select question: ${question.prompt}`}
      />

      <div className="w-full p-6">
        <div className="flex flex-col w-full gap-4">
          {courseHeader}

          <div className="flex justify-between items-start w-full">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                {typeof questionNumber === 'number' ? questionNumber : '#'}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {question.prompt}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {question.difficulty && question.difficulty !== 'Unknown' && (
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(
                    question.difficulty
                  )}`}
                >
                  {getDifficultyLabel(question.difficulty)}
                </span>
              )}

              {/* Edit and Delete icons - shown in both question-bank and exam contexts */}
              {(context === 'question-bank' || context === 'exam') && (
                <div className="flex items-center gap-2">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(question); // pass full object
                      }}
                      aria-label="Edit question"
                      className="p-1 rounded text-accent-indigo bg-transparent hover:bg-accent-indigo/10 transition-all"
                    >
                      <FiEdit size={18} />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={(e) => {
                        console.log(
                          `Delete button clicked for question ${question.id}`
                        );
                        e.stopPropagation();
                        onDelete(question.id);
                      }}
                      aria-label="Delete question"
                      className="p-1 rounded text-accent-indigo bg-transparent hover:bg-accent-indigo/10 transition-all"
                    >
                      <FiTrash size={18} />
                    </button>
                  )}
                </div>
              )}

              {context === 'exam' && (
                <div className="flex items-center gap-2">
                  {onToggleMandatory && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleMandatory(question.id, !isMandatory);
                      }}
                      aria-label={
                        isMandatory ? 'Remove mandatory' : 'Make mandatory'
                      }
                      className={`p-1 rounded text-accent-indigo bg-transparent hover:bg-accent-indigo/10 transition-all ${isMandatory ? 'ring-2 ring-accent-indigo' : ''}`}
                    >
                      <FiLock size={18} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="w-full space-y-4">
            <div className="grid grid-cols-2 gap-2 mt-1">
              {Object.entries(question.choices || {}).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-gray-500 min-w-[20px]">
                    {key}.
                  </span>
                  <span
                    className={
                      isCorrect(key)
                        ? 'text-green-600 font-semibold'
                        : 'text-gray-700'
                    }
                  >
                    {value}
                    {isCorrect(key) && (
                      <span className="text-green-600 ml-2">
                        (correct answer)
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            {Array.isArray(question.correct_answer) &&
              question.correct_answer.length === 0 && (
                <div className="text-xs text-red-500 mt-2">
                  No correct answer set
                </div>
              )}

            {question.tags && question.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {question.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs border border-purple-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {question.explanation && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Explanation:
                </p>
                <p className="text-sm text-blue-800">{question.explanation}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
