import React from 'react';
import { StandardButton } from '../ui/StandardButton';
import type { ExamDetail, Variant } from '../../api/examAPI';

interface VariantsPanelProps {
  exam: ExamDetail;
  variants: Variant[];
  isGenerating: boolean;
  onGenerateVariants: () => Promise<void>;
  onViewAll: () => void;
}

export const VariantsPanel: React.FC<VariantsPanelProps> = ({
  exam,
  variants,
  isGenerating,
  onGenerateVariants,
  onViewAll,
}) => {
  const variantCount = variants.length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Exam Variants</h2>
        <div className="flex items-center gap-2">
          <StandardButton
            onClick={onGenerateVariants}
            disabled={isGenerating}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </StandardButton>
          {variantCount > 0 && (
            <StandardButton onClick={onViewAll} size="sm" variant="outline">
              View All
            </StandardButton>
          )}
        </div>
      </div>

      {/* Variants Grid */}
      {variantCount === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-4">No variants generated yet</div>
          <StandardButton
            onClick={onGenerateVariants}
            disabled={isGenerating}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Generate First Variant
          </StandardButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {variants.slice(0, 4).map((variant) => (
            <div
              key={variant.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900">
                  Variant {variant.version_label}
                </span>
                {variant.is_locked && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    Locked
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600 mb-3">
                {variant.questions?.length || 0} questions
              </div>
              <div className="flex items-center gap-2">
                <button className="text-xs text-blue-600 hover:text-blue-700">
                  Preview
                </button>
                <button className="text-xs text-green-600 hover:text-green-700">
                  Export
                </button>
                <button className="text-xs text-gray-600 hover:text-gray-700">
                  ⋮
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
