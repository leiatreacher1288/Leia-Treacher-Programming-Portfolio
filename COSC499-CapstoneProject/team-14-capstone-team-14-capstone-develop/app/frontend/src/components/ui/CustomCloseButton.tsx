import React from 'react';
import { FiX } from 'react-icons/fi';

interface CustomCloseButtonProps {
  onClick: () => void;
  className?: string;
  size?: number;
}

export const CustomCloseButton: React.FC<CustomCloseButtonProps> = ({
  onClick,
  className = '',
  size = 22,
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        p-2 rounded-lg transition-all duration-200
        bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800
        focus:outline-none focus:ring-2 focus:ring-gray-500/20
        ${className}
      `}
    >
      <FiX size={size} />
    </button>
  );
};
