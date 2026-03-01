import React from 'react';

interface StandardDropdownProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

export const StandardDropdown: React.FC<StandardDropdownProps> = ({
  options,
  value,
  onChange,
}) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className="max-w-xs pr-4 py-2 pl-3 border border-input-border rounded-md text-sm text-gray-700 bg-white dark:bg-white dark:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-btn"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
};
