import type { ReactNode } from 'react';
import clsx from 'clsx';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  delta?: number;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export const StatsCard = ({
  title,
  value,
  icon,
  delta,
  trend = 'neutral',
  className,
}: StatsCardProps) => {
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <div
      className={clsx(
        'bg-card p-6 rounded-lg shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-card-info text-sm font-medium uppercase tracking-wide">
            {title}
          </p>
          <p className="text-heading text-3xl font-bold mt-2">
            {formatValue(value)}
          </p>

          {delta !== undefined && (
            <div
              className={clsx(
                'flex items-center text-sm mt-3 font-medium',
                trend === 'up' && 'text-green-600',
                trend === 'down' && 'text-red-600',
                trend === 'neutral' && 'text-gray-600'
              )}
            >
              <span className="mr-1 text-base">
                {trend === 'up' && '↗'}
                {trend === 'down' && '↘'}
                {trend === 'neutral' && '→'}
              </span>
              <span>
                {delta >= 0 ? `+${delta}%` : `${delta}%`} vs last period
              </span>
            </div>
          )}
        </div>

        {icon && (
          <div className="bg-accent-emerald p-3 rounded-full text-white ml-4 flex-shrink-0">
            <div className="text-xl">{icon}</div>
          </div>
        )}
      </div>
    </div>
  );
};
