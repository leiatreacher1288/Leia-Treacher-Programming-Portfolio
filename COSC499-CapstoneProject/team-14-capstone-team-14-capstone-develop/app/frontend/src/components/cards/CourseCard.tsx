// src/components/CourseConfig/CourseCard.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  CalendarDays,
  BookText,
  Star,
  Users,
  MoreHorizontal,
  Eye,
  Sun,
  Snowflake,
  FileText,
} from 'lucide-react';
import type { Course } from '../../types/course';
import { StandardButton } from '../ui/StandardButton';
import { Download } from 'lucide-react';

interface Props {
  course: Course;
  onEditRequest: (course: Course) => void;
  onDeleteRequest: (course: Course) => void;
  onExportRequest: (course: Course) => void;
}

// Generate a pastel gradient based on course ID for consistent colors
const getPastelGradient = (id: number) => {
  const gradients = [
    'from-pink-200 via-purple-200 to-indigo-200',
    'from-blue-200 via-cyan-200 to-teal-200',
    'from-green-200 via-emerald-200 to-teal-200',
    'from-yellow-200 via-orange-200 to-red-200',
    'from-purple-200 via-pink-200 to-rose-200',
    'from-indigo-200 via-blue-200 to-cyan-200',
    'from-teal-200 via-green-200 to-emerald-200',
    'from-orange-200 via-yellow-200 to-amber-200',
    'from-rose-200 via-pink-200 to-purple-200',
    'from-cyan-200 via-blue-200 to-indigo-200',
  ];
  return gradients[id % gradients.length];
};

function getTermStyle(term: string) {
  const [season] = term.split(' ');
  if (season === 'S1' || season === 'S2') {
    return {
      badge: 'bg-orange-100 text-orange-700',
      icon: <Sun size={14} className="inline-block mr-1 text-orange-400" />,
      accent: 'bg-orange-400',
      border: 'border-orange-200',
      shadow: 'shadow-orange-100',
    };
  } else if (season === 'W1' || season === 'W2') {
    return {
      badge: 'bg-blue-100 text-blue-700',
      icon: <Snowflake size={14} className="inline-block mr-1 text-blue-400" />,
      accent: 'bg-blue-400',
      border: 'border-blue-200',
      shadow: 'shadow-blue-100',
    };
  }
  return {
    badge: 'bg-gray-100 text-gray-700',
    icon: null,
    accent: 'bg-gray-300',
    border: 'border-gray-200',
    shadow: 'shadow-gray-100',
  };
}

function formatTermYear(term: string): { label: string; year: string } {
  const [season, year] = term.split(' ');
  let seasonStr = '';
  if (season === 'W1') seasonStr = 'Winter Term 1';
  else if (season === 'W2') seasonStr = 'Winter Term 2';
  else if (season === 'S1') seasonStr = 'Summer Term 1';
  else if (season === 'S2') seasonStr = 'Summer Term 2';
  else seasonStr = season;
  return {
    label: year ? `${year} – ${seasonStr}` : term,
    year: year || '',
  };
}

export const CourseCard: React.FC<Props> = ({
  course,
  onEditRequest,
  onDeleteRequest,
  onExportRequest,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // close on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const termStyle = getTermStyle(course.term);
  const { label: termLabel, year } = formatTermYear(course.term);
  const editedAt = new Date(course.lastEdited);

  const formattedEdited = editedAt.toLocaleString(undefined, {
    dateStyle: 'medium', // "Jul 14, 2025"
    timeStyle: 'short', // "9:53 PM"
  });

  return (
    <div
      className={`
        relative
        bg-white
        rounded-lg
        overflow-visible           /* <-- allow the menu to overflow */
        border ${termStyle.border} ${termStyle.shadow}
        flex flex-col
        min-h-[480px]
      `}
      style={{ boxShadow: '0 2px 12px 0 rgba(0,0,0,0.04)' }}
    >
      {/* Accent bar */}
      <div
        className={`
          absolute left-0 top-0 h-full w-1.5
          ${termStyle.accent}
          rounded-l-lg
        `}
      />

      {/* Year watermark */}
      {year && (
        <div className="absolute right-4 top-8 text-6xl font-extrabold text-gray-100 opacity-30 pointer-events-none select-none z-0">
          {year}
        </div>
      )}

      {/* Banner */}
      <div className="relative h-40 bg-gray-100 z-10">
        <div
          className={`w-full h-full bg-gradient-to-r ${getPastelGradient(course.id)}`}
        />
      </div>

      {/* Title + Menu */}
      <div className="px-6 pt-4 pb-2 flex items-start justify-between z-20">
        <div className="w-full">
          <h3 className="font-bold text-gray-900 text-xl leading-tight">
            {course.code}
          </h3>
          <div className="flex items-center mt-1 mb-1 gap-2">
            <span
              className={`
                px-3 py-0.5 rounded-full font-semibold text-xs flex items-center
                ${termStyle.badge}
              `}
            >
              {termStyle.icon}
              {termLabel}
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-1 mb-1 line-clamp-2">
            {course.title}
          </p>
        </div>

        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="p-1 rounded-full bg-white hover:bg-gray-100 transition"
          >
            <MoreHorizontal size={20} className="text-gray-600" />
          </button>
          {menuOpen && (
            <ul className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg z-50">
              <li
                onClick={() => {
                  setMenuOpen(false);
                  onExportRequest(course);
                }}
                className="px-4 py-2 text-gray-800 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
              >
                Generate Archive
              </li>
              <li
                onClick={() => {
                  setMenuOpen(false);
                  onEditRequest(course);
                }}
                className="px-4 py-2 text-gray-800 hover:bg-gray-100 cursor-pointer"
              >
                Edit
              </li>
              <li
                onClick={() => {
                  setMenuOpen(false);
                  onDeleteRequest(course);
                }}
                className="px-4 py-2 text-red-600 hover:bg-gray-100 cursor-pointer"
              >
                Delete
              </li>
            </ul>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 space-y-2 text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Exams: {course.exams ?? 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users size={14} className="text-gray-400" />
          <span>Students: {course.students ?? 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays size={14} className="text-gray-400" />
          <span>Last Edited: {formattedEdited}</span>
        </div>
        <div className="flex items-center gap-2">
          <Star size={14} className="text-amber-500" />
          <span>
            Class Average:{' '}
            {course.students! > 0 ? `${course.avgScore}%` : 'N/A'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 mb-4 flex gap-2">
        <StandardButton
          to={`/courses/${course.id}?tab=questionbanks`}
          color="secondary-btn"
          className="flex-1 flex items-center justify-center"
          icon={<BookText size={16} />}
        >
          Question Banks
        </StandardButton>
        <StandardButton
          to={`/courses/${course.id}?tab=exams`}
          color="secondary-btn"
          className="flex-1 flex items-center justify-center"
          icon={<FileText size={16} />}
        >
          Exams
        </StandardButton>
      </div>

      {/* View Course */}
      <div className="px-6 pb-6">
        <StandardButton
          to={`/courses/${course.id}`}
          color="primary-btn"
          className="w-full flex items-center justify-center gap-2 rounded-lg"
          icon={<Eye size={16} />}
        >
          View Course
        </StandardButton>
      </div>
    </div>
  );
};
