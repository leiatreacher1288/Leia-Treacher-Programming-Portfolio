// src/components/Analytics/CourseSearchCard.tsx
import React, { useState, useRef, useEffect } from 'react';
import { SearchBar } from '../ui/SearchBar';
import { Search, BookOpen, TrendingUp } from 'lucide-react';
import { analyticsAPI, type CourseSearchResult } from '../../api/analyticsAPI';

interface CourseSearchCardProps {
  onCourseSelect: (courseCode: string) => void;
}

export const CourseSearchCard: React.FC<CourseSearchCardProps> = ({
  onCourseSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CourseSearchResult[]>([]);
  const [allCourses, setAllCourses] = useState<CourseSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Load all courses on component mount for real-time filtering
  useEffect(() => {
    const loadAllCourses = async () => {
      try {
        const courses = await analyticsAPI.getAllCoursesForAnalytics();
        setAllCourses(courses);
      } catch (error) {
        console.error('Failed to load all courses:', error);
        setAllCourses([]);
      } finally {
        setIsInitialLoad(false);
      }
    };

    loadAllCourses();
  }, []);

  // Real-time filtering logic similar to Courses page
  useEffect(() => {
    if (isInitialLoad) return;

    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        setIsLoading(true);

        // Filter courses in real-time from loaded data
        const filtered = allCourses.filter((course) => {
          const searchLower = searchQuery.toLowerCase();
          return (
            course.code.toLowerCase().includes(searchLower) ||
            course.title.toLowerCase().includes(searchLower) ||
            (course.description &&
              course.description.toLowerCase().includes(searchLower))
          );
        });

        // Also try to fetch from API for fresh results
        analyticsAPI
          .searchCourses(searchQuery)
          .then((apiResults) => {
            // Combine and deduplicate results
            const combinedResults = [...filtered];
            apiResults.forEach((apiResult) => {
              if (
                !combinedResults.find(
                  (existing) => existing.id === apiResult.id
                )
              ) {
                combinedResults.push(apiResult);
              }
            });

            setSearchResults(combinedResults);
            setShowSuggestions(true);
            setSelectedIndex(-1);
          })
          .catch(() => {
            // Fallback to filtered local data if API fails
            setSearchResults(filtered);
            setShowSuggestions(true);
            setSelectedIndex(-1);
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        setSearchResults([]);
        setShowSuggestions(false);
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, allCourses, isInitialLoad]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!showSuggestions || searchResults.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex((prev) =>
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0) {
          handleCourseSelect(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleCourseSelect = (course: CourseSearchResult) => {
    setSearchQuery(`${course.code} - ${course.title}`);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onCourseSelect(course.code);
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;

    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (regex.test(part)) {
        return (
          <span key={index} className="bg-yellow-200 text-yellow-800">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <TrendingUp className="text-primary-btn" size={24} />
        <h2 className="text-xl font-semibold text-gray-900">
          Statistics by Course
        </h2>
      </div>

      <p className="text-gray-600 mb-6">
        Search for a course to view historical performance data across all years
        and terms.
      </p>

      <div className="relative" ref={searchRef}>
        <SearchBar
          placeholder="Search by course code (e.g., PHYS 111) or course name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full"
        />

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-btn border-t-transparent"></div>
          </div>
        )}

        {/* Search suggestions dropdown */}
        {showSuggestions && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1 max-h-64 overflow-y-auto">
            {searchResults.map((course, index) => (
              <div
                key={course.id}
                className={`px-4 py-3 cursor-pointer transition-colors ${
                  index === selectedIndex
                    ? 'bg-blue-50 border-l-4 border-primary-btn'
                    : 'hover:bg-gray-50'
                } ${
                  index !== searchResults.length - 1
                    ? 'border-b border-gray-100'
                    : ''
                }`}
                onClick={() => handleCourseSelect(course)}
              >
                <div className="flex items-start gap-3">
                  <BookOpen
                    className="text-gray-400 mt-0.5 flex-shrink-0"
                    size={16}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">
                      {highlightMatch(course.code, searchQuery)}
                    </div>
                    <div className="text-sm text-gray-600 truncate">
                      {highlightMatch(course.title, searchQuery)}
                    </div>
                    {course.description && (
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {course.description}
                      </div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">
                      Term: {course.term}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No results message */}
        {showSuggestions && searchResults.length === 0 && !isLoading && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1">
            <div className="px-4 py-6 text-center text-gray-500">
              <Search className="mx-auto mb-2 text-gray-400" size={24} />
              <p className="text-sm">
                No courses found matching &quot;{searchQuery}&quot;
              </p>
              <p className="text-xs mt-1">
                Try searching by course code (e.g., PHYS 111) or course name
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Search tips */}
      <div className="mt-4 text-xs text-gray-500">
        <p>
          <strong>Tip:</strong> Start typing a course code (e.g.,
          &quot;PHY&quot; for Physics courses) or course name to see
          suggestions.
        </p>
      </div>
    </div>
  );
};
