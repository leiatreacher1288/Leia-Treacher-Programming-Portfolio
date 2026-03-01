import React from 'react';
import { StandardButton } from '../../ui/StandardButton';
import { FiEdit, FiTrash2, FiClock, FiHash } from 'react-icons/fi';
import { getFeatureTags } from '../../../utils/examFormHelpers';
import type { ExamFormat } from '../../../types/globalSettings';

interface ExamFormatListProps {
  formats: ExamFormat[];
  loading: boolean;
  onEdit: (format: ExamFormat) => void;
  onDelete: (format: ExamFormat) => void;
}

export const ExamFormatList: React.FC<ExamFormatListProps> = ({
  formats,
  loading,
  onEdit,
  onDelete,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-card-info">Loading exam formats...</div>
      </div>
    );
  }

  if (formats.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg border text-center">
        <div className="text-card-info">
          No exam formats configured yet. Create your first format to get
          started.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {formats.map((format) => (
        <ExamFormatCard
          key={format.id}
          format={format}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

interface ExamFormatCardProps {
  format: ExamFormat;
  onEdit: (format: ExamFormat) => void;
  onDelete: (format: ExamFormat) => void;
}

const ExamFormatCard: React.FC<ExamFormatCardProps> = ({
  format,
  onEdit,
  onDelete,
}) => {
  const featureTags = getFeatureTags(format);
  const totalQuestions =
    format.question_distribution.easy +
    format.question_distribution.medium +
    format.question_distribution.hard;
  const totalPoints = format.sections.reduce(
    (total, section) => total + section.points,
    0
  );

  return (
    <div className="bg-white p-6 rounded-lg border hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-heading">
              {format.global_setting.name}
            </h3>
            <div className="flex gap-2">
              {format.global_setting.is_default && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                  Default
                </span>
              )}
              {!format.global_setting.is_active && (
                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                  Inactive
                </span>
              )}
            </div>
          </div>

          {format.global_setting.description && (
            <p className="text-card-info text-sm mb-3">
              {format.global_setting.description}
            </p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <FiClock className="w-4 h-4 text-blue-500" />
              <div>
                <div className="font-medium text-heading">Time Limit</div>
                <div className="text-card-info">
                  {format.time_limits.total_minutes} minutes
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <FiHash className="w-4 h-4 text-green-500" />
              <div>
                <div className="font-medium text-heading">Sections</div>
                <div className="text-card-info">{format.sections.length}</div>
              </div>
            </div>

            <div>
              <div className="font-medium text-heading">Questions</div>
              <div className="text-card-info">{totalQuestions} total</div>
            </div>

            <div>
              <div className="font-medium text-heading">Points</div>
              <div className="text-card-info">{totalPoints} total</div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {featureTags.map((tag, index) => (
              <span
                key={index}
                className={`px-2 py-1 rounded text-xs ${
                  tag.color === 'purple'
                    ? 'bg-purple-100 text-purple-800'
                    : tag.color === 'green'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-orange-100 text-orange-800'
                }`}
              >
                {tag.label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StandardButton
            size="sm"
            variant="outline"
            onClick={() => onEdit(format)}
          >
            <FiEdit className="w-4 h-4" />
          </StandardButton>
          <StandardButton
            size="sm"
            variant="outline"
            onClick={() => onDelete(format)}
            className="text-red-600 hover:text-red-700"
          >
            <FiTrash2 className="w-4 h-4" />
          </StandardButton>
        </div>
      </div>
    </div>
  );
};
