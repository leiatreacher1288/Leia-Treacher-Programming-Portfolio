import React, { useState } from 'react';
import { GlobalSettingsManager } from './GlobalSettingsManager';

export const AdminGlobalConfig: React.FC = () => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  return (
    <div className="p-6">
      <GlobalSettingsManager onUnsavedChanges={setHasUnsavedChanges} />

      {hasUnsavedChanges && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-md shadow-lg">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            <span className="text-sm font-medium">
              You have unsaved changes
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
