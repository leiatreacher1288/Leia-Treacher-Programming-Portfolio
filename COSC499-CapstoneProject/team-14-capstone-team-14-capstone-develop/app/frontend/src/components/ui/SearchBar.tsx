// src/components/ui/SearchBar.tsx
import React from 'react';
import { Search } from 'lucide-react';

type SearchBarProps = React.InputHTMLAttributes<HTMLInputElement>;

export function SearchBar(props: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-2.5 text-search-icon" size={16} />
      <input
        type="text"
        className="w-full pl-10 pr-4 py-2 border border-input-border rounded-md text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-btn"
        {...props}
      />
    </div>
  );
}
