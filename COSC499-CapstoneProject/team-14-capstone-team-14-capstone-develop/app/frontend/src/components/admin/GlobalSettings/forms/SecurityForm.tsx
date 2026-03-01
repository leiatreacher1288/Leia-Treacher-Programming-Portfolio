import React from 'react';
import { ToggleSwitch } from '../../../ui/ToggleSwitch';
import type { ExamFormData } from '../../../../utils/examFormHelpers';

interface SecurityFormProps {
  formData: ExamFormData;
  onUpdate: (updates: Partial<ExamFormData>) => void;
}

export const SecurityForm: React.FC<SecurityFormProps> = ({
  formData,
  onUpdate,
}) => {
  return (
    <div className="space-y-4">
      <h4 className="text-lg font-medium">Security Settings</h4>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <ToggleSwitch
            enabled={formData.require_webcam}
            onToggle={() =>
              onUpdate({ require_webcam: !formData.require_webcam })
            }
          />
          <label className="text-sm font-medium text-gray-700">
            Require webcam access
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <ToggleSwitch
            enabled={formData.require_microphone}
            onToggle={() =>
              onUpdate({ require_microphone: !formData.require_microphone })
            }
          />
          <label className="text-sm font-medium text-gray-700">
            Require microphone access
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <ToggleSwitch
            enabled={formData.lockdown_browser_required}
            onToggle={() =>
              onUpdate({
                lockdown_browser_required: !formData.lockdown_browser_required,
              })
            }
          />
          <label className="text-sm font-medium text-gray-700">
            Require lockdown browser
          </label>
        </div>
      </div>
    </div>
  );
};
