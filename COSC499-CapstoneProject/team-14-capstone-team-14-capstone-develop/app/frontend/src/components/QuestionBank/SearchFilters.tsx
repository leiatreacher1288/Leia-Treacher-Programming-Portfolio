// src/components/QuestionBank/SearchFilters.tsx
import React from 'react';
import { FiFilter } from 'react-icons/fi';
import { StandardButton } from '../ui/StandardButton';
import { SearchBar } from '../ui/SearchBar';

interface SearchFiltersProps {
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  searchTerm,
  onSearchChange,
  showFilters,
  onToggleFilters,
}) => (
  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
    <div className="flex-1">
      <SearchBar
        placeholder="Search questions by keyword, ID, or tags..."
        value={searchTerm}
        onChange={onSearchChange}
      />
    </div>
    <div className="flex-shrink-0">
      <StandardButton
        color="info-outline"
        icon={<FiFilter size={16} />}
        onClick={onToggleFilters}
      >
        {showFilters ? 'Hide Filters' : 'Filters'}
      </StandardButton>
    </div>
  </div>
);
