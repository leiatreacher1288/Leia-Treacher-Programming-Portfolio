import React, { useState } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';
import { CustomCloseButton } from './CustomCloseButton';

interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, overwrite: boolean) => void;
  existingTemplates: Array<{ id: number; name: string }>;
  isLoading?: boolean;
}

export const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingTemplates,
  isLoading = false,
}) => {
  const [templateName, setTemplateName] = useState('');
  const [showOverwrite, setShowOverwrite] = useState(false);
  const [overwrite, setOverwrite] = useState(false);

  // Check if template name already exists
  const existingTemplate = existingTemplates.find(
    (t) => t.name.toLowerCase() === templateName.toLowerCase()
  );

  const handleSave = () => {
    if (!templateName.trim()) return;

    if (existingTemplate && !overwrite) {
      setShowOverwrite(true);
      return;
    }

    onSave(templateName.trim(), overwrite);
    handleClose();
  };

  const handleClose = () => {
    setTemplateName('');
    setShowOverwrite(false);
    setOverwrite(false);
    onClose();
  };

  const handleNameChange = (value: string) => {
    setTemplateName(value);
    setShowOverwrite(false);
    setOverwrite(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Save className="text-blue-600" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Save Layout Template
            </h2>
          </div>
          <CustomCloseButton onClick={handleClose} />
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Name
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., CS Midterm Layout (Fall 2024)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                autoFocus
              />
              {existingTemplate && !showOverwrite && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  Template "{existingTemplate.name}" already exists
                </p>
              )}
            </div>

            {showOverwrite && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-amber-600 mt-0.5" size={16} />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-amber-800 mb-2">
                      Template Already Exists
                    </h4>
                    <p className="text-xs text-amber-700 mb-3">
                      A template named "{existingTemplate?.name}" already
                      exists. Do you want to overwrite it?
                    </p>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={overwrite}
                        onChange={(e) => setOverwrite(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-amber-700">
                        Yes, overwrite the existing template
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500">
              <p>
                This will save your current layout settings as a reusable
                template.
              </p>
              <p className="mt-1">
                Includes: instructions, footer, academic integrity, and section
                structure.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!templateName.trim() || isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Template
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
