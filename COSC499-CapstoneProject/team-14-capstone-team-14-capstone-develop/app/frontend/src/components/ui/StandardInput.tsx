import React from 'react';

export interface StandardInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const StandardInput: React.FC<StandardInputProps> = ({
  className = '',
  ...props
}) => (
  <input
    {...props}
    className={`w-full border border-input-border rounded-md px-2 py-1 text-sm text-heading bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-btn ${className}`}
  />
);
