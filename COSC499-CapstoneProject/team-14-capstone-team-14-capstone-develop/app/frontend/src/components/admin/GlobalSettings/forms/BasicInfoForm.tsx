import React from 'react';
import { StandardInput } from '../../../ui/StandardInput';
import { ToggleSwitch } from '../../../ui/ToggleSwitch';
import type { ExamFormData } from '../../../../utils/examFormHelpers';

interface BasicInfoFormProps {
  formData: ExamFormData;
  onUpdate: (updates: Partial<ExamFormData>) => void;
}

export const BasicInfoForm: React.FC<BasicInfoFormProps> = ({
  formData,
  onUpdate,
}) => {
  return (
    <div className="space-y-4">
      <h4 className="text-lg font-medium">Basic Information</h4>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Format Name *
          </label>
          <StandardInput
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              onUpdate({ name: e.target.value });
            }}
            placeholder="e.g., Standard Online Exam"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Time Limit (minutes) *
          </label>
          <StandardInput
            type="number"
            min="1"
            value={formData.total_minutes.toString()}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              onUpdate({ total_minutes: parseInt(e.target.value) || 1 });
            }}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
            onUpdate({ description: e.target.value });
          }}
          placeholder="Describe this exam format..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Attempts
          </label>
          <StandardInput
            type="number"
            min="1"
            value={formData.max_attempts.toString()}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              onUpdate({ max_attempts: parseInt(e.target.value) || 1 });
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Warning Time (minutes)
          </label>
          <StandardInput
            type="number"
            min="0"
            value={formData.warning_minutes.toString()}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              onUpdate({ warning_minutes: parseInt(e.target.value) || 0 });
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center space-x-2">
          <ToggleSwitch
            enabled={formData.is_default}
            onToggle={() => onUpdate({ is_default: !formData.is_default })}
          />
          <label className="text-sm font-medium text-gray-700">
            Set as default format
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <ToggleSwitch
            enabled={formData.is_active}
            onToggle={() => onUpdate({ is_active: !formData.is_active })}
          />
          <label className="text-sm font-medium text-gray-700">Active</label>
        </div>
      </div>
    </div>
  );
};
