import React from 'react';
import { Navigation } from '../Navigation';

interface InstructorLayoutProps {
  children: React.ReactNode;
  noSidebarPadding?: boolean;
}

export const InstructorLayout = ({
  children,
  noSidebarPadding = false,
}: InstructorLayoutProps) => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Fixed sidebar */}
      <Navigation />

      {/* Main content area - removed width constraints */}
      <div className={`flex-1${noSidebarPadding ? '' : ' pl-64'}`}>
        <div className="h-full w-full overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
