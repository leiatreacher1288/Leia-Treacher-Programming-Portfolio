import { StandardButton } from './../ui/StandardButton';

interface Props {
  title: string;
  value: string;
  subtitle?: string;
  subDetail?: string;
  icon: React.ReactNode;
  barPercent?: number;
  barColor?: string;
  barBg?: string;
  circlePercent?: number;
  circleColor?: string;
  subtitleColor?: string;
  'data-testid'?: string;
}

export const DataInsightCard = ({
  title,
  value,
  subtitle,
  subDetail,
  icon,
  barPercent,
  barColor = 'bg-accent-emerald',
  barBg = 'bg-gray-200',
  circlePercent,
  circleColor = 'stroke-accent-indigo',
  subtitleColor = 'text-accent-emerald',
  'data-testid': dataTestId,
}: Props) => {
  return (
    <div
      className="rounded-lg border border-input-border bg-white px-4 py-3 shadow-sm flex flex-col justify-between h-56"
      data-testid={dataTestId}
    >
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-card-subtitle font-medium leading-tight">
          {title}
        </p>
        <div className="rounded-full bg-gray-100 p-1.5 shadow-sm">{icon}</div>
      </div>

      <div className="flex justify-between items-center gap-2 mb-4">
        <div>
          <h3 className="text-2xl font-bold text-heading leading-snug">
            {value}
          </h3>
          {subtitle && (
            <p className={`text-sm font-medium mt-1 ${subtitleColor}`}>
              {subtitle}
            </p>
          )}
          {subDetail && (
            <p className="text-sm text-card-subtitle mt-1">{subDetail}</p>
          )}
        </div>

        {circlePercent != null && (
          <div className="flex items-center justify-center">
            <svg viewBox="0 0 36 36" className="w-16 h-16">
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                strokeWidth="4"
                className="stroke-gray-200"
              />
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                strokeWidth="4"
                strokeLinecap="round"
                className={circleColor}
                strokeDasharray="100"
                strokeDashoffset={100 - circlePercent}
              />
            </svg>
          </div>
        )}
      </div>

      {barPercent != null && (
        <div className="mb-4">
          <div className={`h-2 rounded-full ${barBg}`}>
            <div
              className={`h-full rounded-full ${barColor}`}
              style={{ width: `${barPercent}%` }}
            />
          </div>
        </div>
      )}

      <div>
        <StandardButton
          className="w-full justify-center"
          onClick={() => alert('View insight')}
        >
          View Insight
        </StandardButton>
      </div>
    </div>
  );
};
