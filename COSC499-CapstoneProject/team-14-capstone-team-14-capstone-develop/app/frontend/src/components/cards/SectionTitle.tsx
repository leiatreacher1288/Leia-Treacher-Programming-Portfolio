import type { ReactNode } from 'react';

interface Props {
  icon: ReactNode;
  title: string;
  subtitle?: string;
}

export const SectionTitle = ({ icon, title, subtitle }: Props) => {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 text-heading text-xl font-semibold">
        <span className="text-primary-btn">{icon}</span>
        {title}
      </div>
      {subtitle && (
        <p className="text-sm text-card-subtitle mt-1 ml-9">{subtitle}</p>
      )}
    </div>
  );
};
