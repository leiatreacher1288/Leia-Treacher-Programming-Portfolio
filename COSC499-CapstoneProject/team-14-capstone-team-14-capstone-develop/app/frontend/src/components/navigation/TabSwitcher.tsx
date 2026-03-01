import React from 'react';
import clsx from 'clsx';
import type { ReactNode } from 'react';

interface TabItem {
  label: string;
  value: string;
  icon?: ReactNode;
}

interface TabSwitcherProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (value: string) => void;
  className?: string;
}

export const TabSwitcher = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}: TabSwitcherProps) => {
  return (
    <div
      className={clsx(
        'flex items-center gap-2 px-6 py-3 bg-white border-b border-border',
        className
      )}
      role="tablist"
      aria-label="Course navigation tabs"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;
        return (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.value}`}
            className={clsx(
              'px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-btn/20',
              isActive
                ? 'bg-primary-btn/10 text-primary-btn font-semibold shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
            )}
            data-testid={`tab-${tab.label}`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
