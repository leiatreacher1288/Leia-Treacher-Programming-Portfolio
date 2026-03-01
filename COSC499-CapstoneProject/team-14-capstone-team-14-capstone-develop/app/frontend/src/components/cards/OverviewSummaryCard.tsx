import type { ReactNode } from 'react';
import clsx from 'clsx';

interface Props {
  children: ReactNode;
  className?: string;
  accent?: 'green' | 'blue' | 'purple' | 'red';
}

const accentMap = {
  green: 'border-l-4 border-accent-emerald',
  blue: 'border-l-4 border-primary-btn',
  purple: 'border-l-4 border-accent-indigo',
  red: 'border-l-4 border-danger-btn',
};

export const OverviewSummaryCard = ({
  children,
  className = '',
  accent,
}: Props) => {
  return (
    <div
      className={clsx(
        'bg-card shadow-card border border-border-light rounded-2xl px-8 py-6',
        accent ? accentMap[accent] : '',
        className
      )}
    >
      {children}
    </div>
  );
};
