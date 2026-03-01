import type { ButtonColor } from './StandardButton';
import clsx from 'clsx';
import type { ReactNode } from 'react';

interface InfoBarProps {
  label: string;
  value: string | number;
  description?: string;
  color?: ButtonColor;
  icon?: ReactNode;
  className?: string;
}

const colorClassMap: Record<ButtonColor, string> = {
  'primary-btn': 'bg-primary-btn/10 text-primary-btn border border-primary-btn',
  'secondary-btn': 'bg-secondary-btn text-heading border border-secondary-btn',
  'secondary-blue':
    'bg-secondary-blue text-primary-btn border border-secondary-blue',
  'danger-btn': 'bg-danger-btn/10 text-danger-btn border border-danger-btn',
  'success-btn': 'bg-success-btn/10 text-success-btn border border-success-btn',
  'accent-indigo':
    'bg-accent-indigo/10 text-accent-indigo border border-accent-indigo',
  'info-btn': 'bg-info-btn/10 text-info-btn border border-info-btn',
  'special-btn': 'bg-[#A78BFA]/10 text-[#A78BFA] border border-[#A78BFA]',
  'success-outline': 'bg-green-50 text-success-btn border border-success-btn',
  'danger-outline': 'bg-red-50 text-danger-btn border border-danger-btn',
  'info-outline': 'bg-blue-50 text-info-btn border border-info-btn',
};

export const InfoBar = ({
  label,
  value,
  description = '',
  color = 'info-outline',
  icon,
  className = '',
}: InfoBarProps) => (
  <div className={clsx('mb-4 p-3 rounded-lg', colorClassMap[color], className)}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon && <span className="text-lg">{icon}</span>}
        <span className="text-sm font-medium">{label}</span>
        <span className="text-lg font-bold">{value}</span>
      </div>
      {description && <span className="text-xs opacity-80">{description}</span>}
    </div>
  </div>
);
