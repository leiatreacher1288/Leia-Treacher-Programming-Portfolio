import React from 'react';

interface QuestionBankHeaderProps {
  title: string;
  description?: string;
  question_count?: number;
  difficulty_breakdown?: {
    easy: number;
    medium: number;
    hard: number;
    unknown: number;
  };
  tag_counts?: Record<string, number>;
  className?: string;
}

export const QuestionBankHeader: React.FC<QuestionBankHeaderProps> = ({
  title,
  description,
  question_count,
  difficulty_breakdown,
  tag_counts,
  className = '',
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Title and Description */}
      <div>
        <h3 className="font-semibold text-heading mb-1">{title}</h3>
        {description && (
          <div className="text-sm text-muted mb-2">
            {description || 'No description yet'}
          </div>
        )}
      </div>

      {/* Question Count */}
      {question_count !== undefined && (
        <div className="text-xs text-gray-500">
          {question_count === 0 ? (
            <span className="text-gray-400">No questions yet</span>
          ) : (
            `${question_count} question${question_count !== 1 ? 's' : ''}`
          )}
        </div>
      )}

      {/* Difficulty Distribution */}
      {(() => {
        const breakdown = difficulty_breakdown;
        if (!breakdown) return null;

        const { easy, medium, hard, unknown } = breakdown;
        const total = easy + medium + hard + unknown;

        if (total === 0) {
          return null; // Don't show duplicate "No questions yet"
        }

        // If all questions have unknown difficulty (no questions have difficulty tags)
        if (unknown === 100) {
          return (
            <div className="flex gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-xs font-medium whitespace-nowrap">
                Unknown 100%
              </span>
            </div>
          );
        }

        // If all questions have the same difficulty
        if (easy === 100) {
          return (
            <div className="flex gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-medium whitespace-nowrap">
                Easy 100%
              </span>
            </div>
          );
        }
        if (medium === 100) {
          return (
            <div className="flex gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium whitespace-nowrap">
                Medium 100%
              </span>
            </div>
          );
        }
        if (hard === 100) {
          return (
            <div className="flex gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-medium whitespace-nowrap">
                Hard 100%
              </span>
            </div>
          );
        }

        // Mixed difficulties - show only tagged difficulties (ignore unknown)
        const difficultyPills = [];
        if (easy > 0) {
          difficultyPills.push(
            <span
              key="easy"
              className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-medium whitespace-nowrap"
            >
              Easy {easy}%
            </span>
          );
        }
        if (medium > 0) {
          difficultyPills.push(
            <span
              key="medium"
              className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium whitespace-nowrap"
            >
              Medium {medium}%
            </span>
          );
        }
        if (hard > 0) {
          difficultyPills.push(
            <span
              key="hard"
              className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-medium whitespace-nowrap"
            >
              Hard {hard}%
            </span>
          );
        }

        return <div className="flex gap-2">{difficultyPills}</div>;
      })()}

      {/* Tags */}
      {(() => {
        const tagCounts = tag_counts;
        if (!tagCounts || Object.keys(tagCounts).length === 0) {
          return (
            <div className="flex flex-wrap gap-1">
              <span className="px-2.5 py-0.5 rounded bg-gray-100 text-gray-500 text-xs font-medium">
                No tags yet
              </span>
            </div>
          );
        }

        // Deduplicate tags case-insensitively and show top 3
        const uniqueTags = Object.entries(tagCounts).slice(0, 3);
        const remainingCount = Object.keys(tagCounts).length - 3;
        const hiddenTags = Object.keys(tagCounts).slice(3);

        return (
          <div className="flex flex-wrap gap-1">
            {uniqueTags.map(([tag, count]) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-medium"
              >
                {tag} ({count})
              </span>
            ))}
            {remainingCount > 0 && (
              <span
                className="px-2.5 py-0.5 rounded bg-gray-100 text-gray-500 text-xs font-medium cursor-help"
                title={hiddenTags.join(', ')}
              >
                +{remainingCount} more
              </span>
            )}
          </div>
        );
      })()}
    </div>
  );
};
