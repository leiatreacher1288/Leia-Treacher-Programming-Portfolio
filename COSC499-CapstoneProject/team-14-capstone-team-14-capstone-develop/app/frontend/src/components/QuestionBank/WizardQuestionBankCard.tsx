import React from 'react';
import { BarChart2 } from 'lucide-react';
import clsx from 'clsx';
import { QuestionBankHeader } from './QuestionBankHeader';

export interface WizardQuestionBankCardProps {
  bank: {
    id: string | number;
    title: string;
    description: string;
    question_count?: number;
    difficulty_breakdown?: {
      easy: number;
      medium: number;
      hard: number;
      unknown: number;
    };
    tag_counts?: Record<string, number>;
  };
  isInAnySection?: boolean;
  sectionNames?: string[];
  isDragging?: boolean;
  onDragStart?: (bankId: string | number) => void;
  onDragEnd?: () => void;
  onAddToSection?: (bankId: string | number) => void;
  draggable?: boolean;
  showAddButton?: boolean;
  className?: string;
}

export const WizardQuestionBankCard: React.FC<WizardQuestionBankCardProps> = ({
  bank,
  isInAnySection = false,
  sectionNames = [],
  isDragging = false,
  onDragStart,
  onDragEnd,
  onAddToSection,
  draggable = false,
  showAddButton = true,
  className = '',
}) => {
  return (
    <div
      className={clsx(
        'bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-lg transition-all duration-300',
        isDragging && 'ring-2 ring-primary-btn scale-105 shadow-lg',
        isInAnySection && 'ring-1 ring-amber-300',
        draggable && 'cursor-grab active:cursor-grabbing',
        className
      )}
      draggable={draggable}
      onDragStart={() => onDragStart?.(bank.id)}
      onDragEnd={onDragEnd}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart2 className="text-blue-600" size={16} />
          <span className="font-semibold text-heading">{bank.title}</span>
        </div>
        {isInAnySection && (
          <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
            In {sectionNames.join(', ')}
          </span>
        )}
      </div>

      <QuestionBankHeader
        title=""
        description={bank.description}
        question_count={bank.question_count}
        difficulty_breakdown={bank.difficulty_breakdown}
        tag_counts={bank.tag_counts}
        className="mb-3"
      />

      {showAddButton && onAddToSection && (
        <button
          className="w-full mt-2 px-3 py-2 text-sm text-primary-btn hover:bg-blue-50 rounded-lg transition-colors"
          onClick={() => onAddToSection(bank.id)}
        >
          + Add to Section
        </button>
      )}
    </div>
  );
};
