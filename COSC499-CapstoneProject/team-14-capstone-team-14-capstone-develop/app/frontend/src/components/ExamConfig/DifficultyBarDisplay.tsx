import clsx from 'clsx';

interface Props {
  percentages: Record<'Easy' | 'Medium' | 'Hard' | 'Unknown', number>;
  showLabels?: boolean;
  className?: string;
}

const COLORS = {
  Easy: 'bg-accent-emerald',
  Medium: 'bg-accent-amber',
  Hard: 'bg-accent-indigo',
  Unknown: 'bg-gray-400',
};

function allLabelsVisible(
  percentages: Record<'Easy' | 'Medium' | 'Hard' | 'Unknown', number>
) {
  return ['Easy', 'Medium', 'Hard', 'Unknown'].every(
    (level) => percentages[level as keyof typeof percentages] >= 18
  );
}

export const DifficultyBarDisplay = ({
  percentages,
  showLabels = true,
  className = '',
}: Props) => {
  const showLegend = !allLabelsVisible(percentages);
  const levels = (['Easy', 'Medium', 'Hard', 'Unknown'] as const).filter(
    (level) => percentages[level] > 0
  );

  return (
    <div className={clsx('w-full', className)}>
      <div className="pt-2" />
      <div className="flex rounded-full overflow-hidden h-[32px] bg-gray-100">
        {levels.map((level) => {
          const percent = percentages[level];
          return percent > 0 ? (
            <div
              key={level}
              className={clsx(
                COLORS[level],
                'flex items-center justify-center transition-all'
              )}
              style={{ width: `${percent}%`, minWidth: '4px' }}
            >
              {showLabels && percent >= 18 && (
                <span className="text-xs font-semibold text-white drop-shadow-sm">
                  {level}: {percent}%
                </span>
              )}
            </div>
          ) : null;
        })}
      </div>
      {showLegend && (
        <div className="flex gap-4 mt-2 justify-center">
          {levels.map((level) => (
            <div key={level} className="flex items-center gap-1">
              <span
                className={clsx(
                  'inline-block w-3 h-3 rounded-full',
                  COLORS[level]
                )}
              />
              <span className="text-xs text-card-info font-medium">
                {level}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
