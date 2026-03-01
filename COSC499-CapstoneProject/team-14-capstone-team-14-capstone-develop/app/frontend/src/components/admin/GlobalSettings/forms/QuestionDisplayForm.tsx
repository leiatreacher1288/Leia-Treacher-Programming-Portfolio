import React from 'react';
import { ToggleSwitch } from '../../../ui/ToggleSwitch';
import type { ExamFormData } from '../../../../utils/examFormHelpers';

interface QuestionDisplayFormProps {
  formData: ExamFormData;
  onUpdate: (updates: Partial<ExamFormData>) => void;
}

export const QuestionDisplayForm: React.FC<QuestionDisplayFormProps> = ({
  formData,
  onUpdate,
}) => {
  return (
    <div className="space-y-4">
      <h4 className="text-lg font-medium">Question Display</h4>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Display Mode
        </label>
        <select
          value={formData.question_display_mode}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            onUpdate({
              question_display_mode: e.target.value as
                | 'all_at_once'
                | 'one_by_one',
            });
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all_at_once">All questions at once</option>
          <option value="one_by_one">One question at a time</option>
        </select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <ToggleSwitch
            enabled={formData.allow_navigation}
            onToggle={() =>
              onUpdate({ allow_navigation: !formData.allow_navigation })
            }
          />
          <label className="text-sm font-medium text-gray-700">
            Allow navigation between questions
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <ToggleSwitch
            enabled={formData.show_progress}
            onToggle={() =>
              onUpdate({ show_progress: !formData.show_progress })
            }
          />
          <label className="text-sm font-medium text-gray-700">
            Show progress indicator
          </label>
        </div>
      </div>
    </div>
  );
};
