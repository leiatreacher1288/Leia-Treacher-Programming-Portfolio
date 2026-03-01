import React from 'react';
import clsx from 'clsx';

export type AlertBarColor = 'info' | 'warning' | 'danger' | 'success';

const colorClassMap: Record<AlertBarColor, string> = {
  info: 'bg-info-btn/10 text-info-btn border border-info-btn',
  warning: 'bg-warning-btn/10 text-warning-btn border border-warning-btn',
  danger: 'bg-danger-btn/10 text-danger-btn border border-danger-btn',
  success: 'bg-success-btn/10 text-success-btn border border-success-btn',
};

export const AlertBar = ({
  children,
  color = 'info',
  icon,
  className = '',
}: {
  children: React.ReactNode;
  color?: AlertBarColor;
  icon?: React.ReactNode;
  className?: string;
}) => (
  <div
    className={clsx(
      'mb-4 p-3 rounded-lg flex items-center gap-3',
      colorClassMap[color],
      className
    )}
  >
    {icon && <span className="text-lg">{icon}</span>}
    <div className="flex-1">{children}</div>
  </div>
);
