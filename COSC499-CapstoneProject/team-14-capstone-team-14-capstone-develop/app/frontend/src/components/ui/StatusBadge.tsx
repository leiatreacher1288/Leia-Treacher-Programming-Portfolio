import { CheckCircle2, AlertTriangle, Edit3 } from 'lucide-react';
import clsx from 'clsx';

interface StatusBadgeProps {
  status: 'valid' | 'issues' | 'edited';
  className?: string;
  children?: React.ReactNode;
}

export const StatusBadge = ({
  status,
  className = '',
  children,
}: StatusBadgeProps) => {
  let color = '';
  let icon = null;
  let label = '';
  switch (status) {
    case 'valid':
      color = 'bg-accent-emerald/10 text-accent-emerald';
      icon = <CheckCircle2 className="w-4 h-4 mr-1" />;
      label = 'Valid';
      break;
    case 'issues':
      color = 'bg-danger-btn/10 text-danger-btn';
      icon = <AlertTriangle className="w-4 h-4 mr-1" />;
      label = 'Issues Found';
      break;
    case 'edited':
      color = 'bg-accent-amber/10 text-accent-amber';
      icon = <Edit3 className="w-4 h-4 mr-1" />;
      label = 'Edited Since Export';
      break;
    default:
      color = 'bg-gray-200 text-gray-600';
      label = '';
  }
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold',
        color,
        className
      )}
    >
      {icon}
      {children || label}
    </span>
  );
};
