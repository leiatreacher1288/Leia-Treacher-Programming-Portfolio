// src/components/variants/QuestionPreviewRow.tsx
import { Pin, Edit3 } from 'lucide-react';
import { StandardButton } from '../ui/StandardButton';
import clsx from 'clsx';

/**
 * A stripped-down preview of a question used in the export history table
 */
export interface QuestionPreview {
  id: number;
  number: number;
  text: string;
  tags: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  mandatory: boolean;
}

interface QuestionPreviewRowProps {
  question: QuestionPreview;
  index: number;
}

export const QuestionPreviewRow = ({
  question,
  index,
}: QuestionPreviewRowProps) => {
  // show only first 20 words
  const words = question.text.split(' ').slice(0, 20).join(' ');

  return (
    <div
      className={clsx(
        'flex items-center px-4 py-2 text-sm',
        index % 2 === 1 ? 'bg-gray-50' : 'bg-white'
      )}
    >
      {/* question number */}
      <div className="w-10 flex-shrink-0 text-card-info font-semibold">
        Q{question.number}
      </div>

      {/* truncated text */}
      <div className="flex-1 text-heading">
        {words}
        {question.text.split(' ').length > 20 && '...'}
      </div>

      {/* tags, pin icon, and edit button */}
      <div className="flex gap-2 ml-4">
        {question.tags.map((tag: string) => (
          <span
            key={tag}
            className="bg-gray-100 text-xs text-card-info px-2 py-0.5 rounded"
          >
            {tag}
          </span>
        ))}

        {question.mandatory && (
          <Pin className="text-accent-indigo w-4 h-4 ml-2" />
        )}

        <StandardButton
          icon={<Edit3 size={14} />}
          color="secondary-blue"
          className="px-2 py-1 text-xs"
          onClick={() => alert(`Edit question ${question.number}`)}
        >
          Edit
        </StandardButton>
      </div>
    </div>
  );
};
