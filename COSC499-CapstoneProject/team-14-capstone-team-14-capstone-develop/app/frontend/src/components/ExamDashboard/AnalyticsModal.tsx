import React from 'react';
import { X } from 'lucide-react';
import { VariantSetAnalytics } from '../Analytics/VariantSetAnalytics';
import type { ExamDetail } from '../../api/examAPI';
import { StandardButton } from '../ui/StandardButton';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: ExamDetail;
  currentVariantSet?: any;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
  exam,
  currentVariantSet,
}) => {
  if (!isOpen) return null;

  // Extract variant IDs from the current variant set
  const variantIds = currentVariantSet?.variants?.map((v: any) => v.id) || [];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full h-full max-w-7xl max-h-[95vh] overflow-hidden shadow-2xl border border-gray-200 overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50/50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Variant Set Analytics
            </h2>
            <p className="text-gray-600">
              {exam.title} - Variants{' '}
              {currentVariantSet?.variants
                ?.map((v: any) => v.version_label)
                .join(', ') || ''}
            </p>
          </div>
          <StandardButton
            variant="default"
            aria-label="Close analytics modal"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-xl transition-colors"
          >
            <X size={24} />
          </StandardButton>
        </div>
        <div className="h-full overflow-auto p-8 bg-gray-50/30">
          {variantIds.length > 0 ? (
            <VariantSetAnalytics
              examId={exam.id}
              variantIds={variantIds}
              onClose={onClose}
              exam={exam}
              currentVariantSet={currentVariantSet}
            />
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-gray-600 mb-4">No variant set selected</p>
                <p className="text-sm text-gray-500">
                  Please select a variant set from the dropdown to view
                  analytics
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
