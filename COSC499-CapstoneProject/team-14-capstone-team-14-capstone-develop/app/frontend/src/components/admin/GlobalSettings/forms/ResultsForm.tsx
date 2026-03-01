import React from 'react';
import { ToggleSwitch } from '../../../ui/ToggleSwitch';
import type { ExamFormData } from '../../../../utils/examFormHelpers';

interface ResultsFormProps {
  formData: ExamFormData;
  onUpdate: (updates: Partial<ExamFormData>) => void;
}

export const ResultsForm: React.FC<ResultsFormProps> = ({
  formData,
  onUpdate,
}) => {
  return (
    <div className="space-y-4">
      <h4 className="text-lg font-medium">Results & Submission</h4>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <ToggleSwitch
            enabled={formData.show_results_immediately}
            onToggle={() =>
              onUpdate({
                show_results_immediately: !formData.show_results_immediately,
              })
            }
          />
          <label className="text-sm font-medium text-gray-700">
            Show results immediately after submission
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <ToggleSwitch
            enabled={formData.allow_review_after_submission}
            onToggle={() =>
              onUpdate({
                allow_review_after_submission:
                  !formData.allow_review_after_submission,
              })
            }
          />
          <label className="text-sm font-medium text-gray-700">
            Allow review after submission
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <ToggleSwitch
            enabled={formData.auto_submit_on_time_limit}
            onToggle={() =>
              onUpdate({
                auto_submit_on_time_limit: !formData.auto_submit_on_time_limit,
              })
            }
          />
          <label className="text-sm font-medium text-gray-700">
            Auto-submit when time limit is reached
          </label>
        </div>
      </div>
    </div>
  );
};
