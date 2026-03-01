import React, { useState } from 'react';
import { StandardButton } from '../../ui/StandardButton';
import { FiRefreshCw } from 'react-icons/fi';
import { MarkingSchemesTab } from './MarkingSchemesTab';
import { CoursesOverviewTab } from './CoursesOverviewTab';

interface GlobalSettingsManagerProps {
  onUnsavedChanges: (hasChanges: boolean) => void;
}

export const GlobalSettingsManager: React.FC<GlobalSettingsManagerProps> = ({
  onUnsavedChanges,
}) => {
  const [activeTab, setActiveTab] = useState<string>('courses');
  const [refreshKey, setRefreshKey] = useState(0);

  const tabs = [
    {
      id: 'courses',
      label: 'Courses Overview',
      component: <CoursesOverviewTab key={`courses-${refreshKey}`} />,
    },
    {
      id: 'marking-schemes',
      label: 'Marking Schemes',
      component: (
        <MarkingSchemesTab
          onUnsavedChanges={onUnsavedChanges}
          key={`marking-${refreshKey}`}
        />
      ),
    },
  ];

  const handleRefresh = () => {
    try {
      setRefreshKey((prev) => prev + 1);
      // Dispatch refresh event for components to listen to
      window.dispatchEvent(new CustomEvent('refresh-global-settings'));
      onUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to refresh global settings:', error);
    }
  };

  const activeTabData = tabs.find((tab) => tab.id === activeTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-heading">Global Settings</h1>
          <p className="text-card-info text-sm mt-1">
            Configure system-wide settings for marking schemes, exam formats,
            and more
          </p>
        </div>
        <StandardButton
          onClick={handleRefresh}
          variant="outline"
          className="flex items-center gap-2"
        >
          <FiRefreshCw className="w-4 h-4" />
          Refresh
        </StandardButton>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border">
        <div className="border-b">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">{activeTabData?.component}</div>
      </div>
    </div>
  );
};
