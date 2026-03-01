// src/components/variants/ExportHistoryTimeline.tsx
import React from 'react';
import { mockExportHistory } from '../../mock/mockExportHistory';
import { ExportSetCard } from './ExportSetCard';

// grab the element type of your mockExportHistory array
type ExportSet = (typeof mockExportHistory)[number];

interface ExportHistoryTimelineProps {
  exportSets: ExportSet[];
  className?: string;
}

export const ExportHistoryTimeline: React.FC<ExportHistoryTimelineProps> = ({
  exportSets,
  className = '',
}) => {
  return (
    <div className={`w-full ${className}`}>
      {exportSets.map((set, index) => (
        <ExportSetCard key={set.id} exportSet={set} index={index} />
      ))}
    </div>
  );
};
