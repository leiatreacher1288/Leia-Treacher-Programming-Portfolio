import React from 'react';
import { ToggleSwitch } from '../../../ui/ToggleSwitch';
import type { ExamFormData } from '../../../../utils/examFormHelpers';

interface RandomizationFormProps {
  formData: ExamFormData;
  onUpdate: (updates: Partial<ExamFormData>) => void;
}

export const RandomizationForm: React.FC<RandomizationFormProps> = ({
  formData,
  onUpdate,
}) => {
  return (
    <div className="space-y-4">
      <h4 className="text-lg font-medium">Randomization</h4>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <ToggleSwitch
            enabled={formData.randomize_questions}
            onToggle={() =>
              onUpdate({ randomize_questions: !formData.randomize_questions })
            }
          />
          <label className="text-sm font-medium text-gray-700">
            Randomize question order
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <ToggleSwitch
            enabled={formData.randomize_options}
            onToggle={() =>
              onUpdate({ randomize_options: !formData.randomize_options })
            }
          />
          <label className="text-sm font-medium text-gray-700">
            Randomize answer options
          </label>
        </div>
      </div>
    </div>
  );
};
