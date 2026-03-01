import React from 'react';

interface DifficultyOption {
  value: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  activeColor: string;
  activeBgColor: string;
  activeBorderColor: string;
}

const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  {
    value: '1',
    label: 'Easy',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    activeColor: 'text-green-700',
    activeBgColor: 'bg-green-200',
    activeBorderColor: 'border-green-500',
  },
  {
    value: '2',
    label: 'Medium',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    activeColor: 'text-yellow-700',
    activeBgColor: 'bg-yellow-200',
    activeBorderColor: 'border-yellow-500',
  },
  {
    value: '3',
    label: 'Hard',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    activeColor: 'text-red-700',
    activeBgColor: 'bg-red-200',
    activeBorderColor: 'border-red-500',
  },
];

interface DifficultySelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  value,
  onChange,
  className = '',
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        Difficulty
      </label>
      <div className="flex gap-2">
        {DIFFICULTY_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(value === option.value ? '' : option.value)}
            className={`
              flex-1 px-4 py-2 rounded-lg border-2 transition-all duration-200 text-sm font-medium
              ${
                value === option.value
                  ? `${option.activeBgColor} ${option.activeBorderColor} ${option.activeColor} border-opacity-100 shadow-md ring-2 ring-opacity-50 ring-current`
                  : `${option.bgColor} ${option.borderColor} ${option.color} hover:${option.activeBgColor} hover:${option.activeBorderColor} hover:${option.activeColor} hover:shadow-sm`
              }
            `}
          >
            {option.label}
          </button>
        ))}
      </div>
      {value && (
        <p className="text-xs text-gray-500">
          Click the selected difficulty again to clear it
        </p>
      )}
    </div>
  );
};
