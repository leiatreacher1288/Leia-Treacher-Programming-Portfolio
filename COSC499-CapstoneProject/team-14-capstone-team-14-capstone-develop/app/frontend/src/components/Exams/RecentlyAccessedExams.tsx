// src/components/Exams/RecentlyAccessedExams.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import toast from 'react-hot-toast';

import { examAPI } from '../../api/examAPI';
import { courseAPI, type Course } from '../../api/courseAPI';

import { StandardButton } from '../ui/StandardButton';
import { ExamCard } from '../cards/ExamCard';
import { EditExamModal } from '../cards/EditRecentExamCard';

import type { Exam } from '../../api/examAPI';

interface RecentlyAccessedExam {
  id: number;
  title: string;
  course_code: string;
  course_term: string;
  course?: number | { id: number };
  last_accessed?: string;
  updated_at: string;
  created_at: string;
  time_limit?: number;
  description?: string;
  weight: number;
  required_to_pass: boolean;
  is_published: boolean;
  variants: any[];
  questions: any[];
  exam_type: string;
  subject?: string;
  image?: string;
}

type EditData = {
  title: string;
  exam_type: string;
  time_limit: number;
  course: number;
  description?: string;
  weight: number;
  required_to_pass: boolean;
};

export const RecentlyAccessedExams = () => {
  const [exams, setExams] = useState<RecentlyAccessedExam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [examToEdit, setExamToEdit] = useState<RecentlyAccessedExam | null>(
    null
  );

  const navigate = useNavigate();

  // ─── Edit submit handler ────────────────────────────────────
  const handleModalSubmit = async (id: number, data: EditData) => {
    try {
      const raw = await examAPI.updateExam(id, data);
      const updated = { ...raw, weight: Number(raw.weight ?? 0) };
      setExams((prev) =>
        prev.map((ex) => (ex.id === updated.id ? { ...ex, ...updated } : ex))
      );
      toast.success('Exam updated');
    } catch {
      toast.error('Failed to update exam');
    } finally {
      setExamToEdit(null);
    }
  };

  // ─── Load data ──────────────────────────────────────────────
  const loadExams = async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await examAPI.getExams();
      const all = raw.map((e: any) => ({
        id: e.id,
        title: e.title,
        course_code: e.course_code,
        course_term: e.course_term,
        course: e.course ?? e.course_id,
        last_accessed: e.last_accessed,
        updated_at: e.updated_at,
        created_at: e.created_at,
        time_limit: e.time_limit,
        description: e.description,
        weight: Number(e.weight ?? 0),
        required_to_pass: e.required_to_pass ?? false,
        is_published: e.is_published ?? false,
        variants: e.variants ?? [],
        questions: e.questions ?? [],
        exam_type: e.exam_type ?? '',
        subject: e.subject,
        image: e.image,
      }));
      const recent = all
        .sort(
          (a, b) =>
            new Date(b.last_accessed || b.updated_at).getTime() -
            new Date(a.last_accessed || a.updated_at).getTime()
        )
        .slice(0, 3);
      setExams(recent);
    } catch {
      setError('Failed to load recently accessed exams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
    courseAPI.getCourses().then(setCourses).catch(console.error);
  }, []);

  // ─── Card action handlers ───────────────────────────────────
  const onView = (e: RecentlyAccessedExam) => navigate(`/exam/${e.id}/`);
  const onAnalyze = (e: RecentlyAccessedExam) =>
    navigate(`/exams/${e.id}?tab=analytics`);
  const onExport = () => toast.success('Export coming soon');

  // ─── UI branches ─────────────────────────────────────────────
  if (isLoading) {
    return (
      <SectionShell title="Recently Accessed Exams">
        <SkeletonCards />
      </SectionShell>
    );
  }
  if (error) {
    return (
      <SectionShell title="Recently Accessed Exams">
        <div className="bg-red-50 border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <StandardButton
            color="primary-btn"
            className="mt-2"
            onClick={loadExams}
          >
            Try Again
          </StandardButton>
        </div>
      </SectionShell>
    );
  }
  if (exams.length === 0) {
    return (
      <SectionShell title="Recently Accessed Exams">
        <div className="bg-gray-50 border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">
            No exams yet – create one to get started!
          </p>
          <StandardButton
            color="primary-btn"
            onClick={() => navigate('/courses')}
          >
            Go to Courses
          </StandardButton>
        </div>
      </SectionShell>
    );
  }

  // ─── Happy path ──────────────────────────────────────────────
  return (
    <SectionShell title="Recently Accessed Exams">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.map((exam) => (
          <ExamCard
            key={exam.id}
            exam={exam as unknown as Exam}
            courses={courses}
            onView={() => onView(exam)}
            onDelete={async (e) => {
              // this is called when the card's "Yes" is clicked
              await examAPI.deleteExam(e.id);
              toast.success('Exam deleted');
              loadExams();
            }}
            onSubmitEdit={handleModalSubmit}
            isEditingLoading={false}
            editError={null}
          />
        ))}
      </div>

      {examToEdit && (
        <EditExamModal
          isOpen
          exam={examToEdit as unknown as Exam}
          courses={courses}
          onClose={() => setExamToEdit(null)}
          onSubmit={handleModalSubmit}
        />
      )}
    </SectionShell>
  );
};

/* ---------------------- helpers ---------------------- */
const SectionShell = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="mb-8">
    <div className="flex items-center gap-2 mb-4">
      <Clock className="w-6 h-6 text-primary-btn" />
      <h2 className="text-xl font-bold text-heading">{title}</h2>
    </div>
    {children}
  </div>
);

const SkeletonCards = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="bg-white rounded-xl shadow-md border border-border-light overflow-hidden animate-pulse"
      >
        <div className="h-48 bg-gray-200"></div>
        <div className="p-4 space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          <div className="flex gap-2 pt-3">
            <div className="h-8 bg-gray-200 rounded flex-1"></div>
            <div className="h-8 bg-gray-200 rounded w-8"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

interface ConfirmProps {
  examTitle: string;
  onCancel: () => void;
  onConfirm: () => void;
}

const ConfirmDeleteModal = ({
  examTitle,
  onCancel,
  onConfirm,
}: ConfirmProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
    <div className="relative bg-white rounded-lg p-6 max-w-sm w-full">
      <p className="text-gray-900 mb-4">
        Delete <strong>{examTitle}</strong>?
      </p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          No
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Yes
        </button>
      </div>
    </div>
  </div>
);
