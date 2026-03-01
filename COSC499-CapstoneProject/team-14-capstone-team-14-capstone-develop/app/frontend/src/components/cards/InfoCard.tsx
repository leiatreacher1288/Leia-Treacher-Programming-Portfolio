// src/components/cards/InfoCard.tsx
import type { ReactNode } from 'react';
import clsx from 'clsx';
import type { LucideProps } from 'lucide-react';

interface InfoCardProps {
  title: string;
  value: ReactNode;
  /** A small descriptive label under the value */
  description?: ReactNode;
  variant?: 'gray' | 'purple' | 'blue';
  /** Pass in a Lucide icon component, e.g. BarChart2 */
  icon?: React.ComponentType<LucideProps>;
  className?: string;
}

const bgMap = {
  gray: 'bg-secondary-btn text-heading',
  purple: 'bg-primary-btn text-white',
  blue: 'bg-secondary-blue text-heading',
};

export const InfoCard = ({
  title,
  value,
  description,
  variant = 'gray',
  icon: Icon,
  className = '',
}: InfoCardProps) => {
  return (
    <div
      className={clsx(
        'aspect-[4/3] min-w-[100px] min-h-[90px] flex flex-col items-center justify-center rounded-2xl shadow-card border border-border-light transition-all',
        'py-4 px-2', // Add more vertical and horizontal padding
        'text-center', // Center all text
        bgMap[variant],
        className
      )}
    >
      {Icon && (
        <Icon
          className={clsx(
            'mb-1 h-6 w-6', // Slightly larger icon
            variant === 'purple' ? 'text-white/80' : 'text-card-info'
          )}
        />
      )}
      <p
        className={clsx(
          'text-xs font-medium uppercase mb-1 tracking-wide',
          variant === 'purple' ? 'text-white/80' : 'text-card-info'
        )}
      >
        {title}
      </p>
      <div className="text-2xl font-extrabold mb-1 leading-tight">{value}</div>
      {description && (
        <div
          className={clsx(
            'text-xs mt-1',
            variant === 'purple' ? 'text-white/70' : 'text-card-info'
          )}
        >
          {description}
        </div>
      )}
    </div>
  );
};
