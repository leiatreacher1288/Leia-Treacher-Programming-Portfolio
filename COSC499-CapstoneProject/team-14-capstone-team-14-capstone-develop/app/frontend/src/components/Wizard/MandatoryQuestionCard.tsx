import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import clsx from 'clsx';

interface Question {
  id: number;
  prompt: string;
  difficulty: number; // 1=Easy, 2=Medium, 3=Hard
  tags: string[];
  fromBank?: string;
  choices: { [key: string]: string };
  correct_answer: string[];
}

interface MandatoryQuestionCardProps {
  question: Question;
  isSelected: boolean;
  isDisabled?: boolean;
  sectionName?: string;
  onSelect: (questionId: number) => void;
}

export const MandatoryQuestionCard: React.FC<MandatoryQuestionCardProps> = ({
  question,
  isSelected,
  isDisabled = false,
  sectionName,
  onSelect,
}) => {
  console.log('MandatoryQuestionCard received question:', question);
  console.log('Question prompt:', question.prompt);
  console.log('Question choices:', question.choices);
  console.log('Question correct_answer:', question.correct_answer);

  // Convert backend difficulty number to string
  const getDifficultyString = (difficulty: number): string => {
    switch (difficulty) {
      case 1:
        return 'Easy';
      case 2:
        return 'Medium';
      case 3:
        return 'Hard';
      default:
        return 'Unknown';
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: // Easy
        return 'bg-green-100 text-green-700';
      case 2: // Medium
        return 'bg-yellow-100 text-yellow-700';
      case 3: // Hard
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTagColor = (tag: string, index: number) => {
    const colors = [
      'bg-blue-100 text-blue-700',
      'bg-purple-100 text-purple-700',
      'bg-pink-100 text-pink-700',
      'bg-indigo-100 text-indigo-700',
      'bg-teal-100 text-teal-700',
      'bg-orange-100 text-orange-700',
    ];
    return colors[index % colors.length];
  };

  return (
    <div
      className={clsx(
        'bg-white border rounded-lg p-4 transition-all duration-200',
        isDisabled
          ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
          : isSelected
            ? 'border-primary-btn bg-primary-btn/5 shadow-md cursor-pointer hover:shadow-md'
            : 'border-gray-200 hover:border-gray-300 cursor-pointer hover:shadow-md'
      )}
      onClick={() => !isDisabled && onSelect(question.id)}
      title={
        isDisabled
          ? `This question cannot be added because ${sectionName}'s mandatory limit has been reached.`
          : undefined
      }
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {isSelected ? (
            <CheckCircle2 className="text-primary-btn" size={16} />
          ) : (
            <Circle className="text-gray-400" size={16} />
          )}
          <span className="text-sm font-medium text-heading">
            Question {question.id}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {sectionName && (
            <span
              className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 truncate max-w-[120px]"
              title={sectionName}
            >
              {sectionName}
            </span>
          )}
          <span
            className={clsx(
              'px-2 py-1 rounded-full text-xs font-medium',
              getDifficultyColor(question.difficulty)
            )}
          >
            {getDifficultyString(question.difficulty)}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-heading leading-relaxed">
          {question.prompt}
        </p>
      </div>

      <div className="space-y-2 mb-4">
        {Object.entries(question.choices).map(([key, value]) => (
          <div key={key} className="flex items-center gap-2 text-sm">
            <span className="font-medium text-muted min-w-[20px]">{key}.</span>
            <span className="text-muted flex-1">{value}</span>
            {question.correct_answer.includes(key) && (
              <span className="text-green-600 font-medium text-xs">✓</span>
            )}
          </div>
        ))}
      </div>

      {question.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {question.tags.map((tag, index) => (
            <span
              key={index}
              className={clsx(
                'px-2 py-1 text-xs rounded-full font-medium',
                getTagColor(tag, index)
              )}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
