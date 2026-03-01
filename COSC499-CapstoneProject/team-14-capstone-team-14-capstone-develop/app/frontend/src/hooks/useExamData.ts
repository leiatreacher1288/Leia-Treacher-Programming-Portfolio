import { useState, useEffect, useCallback } from 'react';
import { examAPI } from '../api/examAPI';
import { courseAPI } from '../api/courseAPI';
import type { ExamDetail as ExamDetailType } from '../api/examAPI';
import type { Course } from '../api/courseAPI';

export const useExamData = (examId: number | null) => {
  const [exam, setExam] = useState<ExamDetailType | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadExamData = useCallback(
    async (id: number, retries = 3): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const examData = await examAPI.getExamDetail(id);
        const courseData = await courseAPI.getCourseDetail(examData.course);
        setExam(examData);
        setCourse(courseData);
        console.log('[useExamData] setExam called with:', examData);
      } catch (err) {
        if (retries > 0) {
          setTimeout(() => loadExamData(id, retries - 1), 300);
          return;
        }
        console.error('Failed to load exam:', err);
        setError('Failed to load exam. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [setExam, setCourse, setIsLoading, setError]
  );

  useEffect(() => {
    if (examId != null) {
      loadExamData(examId);
    }
  }, [examId, loadExamData]);

  return { exam, course, isLoading, error, loadExamData };
};
