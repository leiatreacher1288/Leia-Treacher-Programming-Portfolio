import { useState, useCallback, useEffect } from 'react';
import { examAPI, type Variant } from '../api/examAPI';
import toast from 'react-hot-toast';

export interface UseVariantsProps {
  examId: number;
  onVariantsChange?: () => void;
}

export interface UseVariantsReturn {
  variants: Variant[];
  isLoading: boolean;
  isGenerating: boolean;
  isExporting: boolean;
  generateVariants: () => Promise<void>;
  exportVariants: (variantIds?: number[]) => Promise<void>;
  exportAnswerKey: (variantIds?: number[]) => Promise<void>;
  updateVariantOrder: (
    variantId: number,
    questionOrders: Record<string, number>
  ) => Promise<void>;
}

export const useVariants = ({
  examId,
  onVariantsChange,
}: UseVariantsProps): UseVariantsReturn => {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load existing variants from the backend
  const loadVariants = useCallback(async () => {
    if (!examId) return;

    setIsLoading(true);
    try {
      const examDetail = await examAPI.getExamDetail(examId);
      setVariants(examDetail.variants || []);
    } catch (error) {
      console.error('Failed to load variants:', error);
      // Don't show error toast for loading - variants might not exist yet
    } finally {
      setIsLoading(false);
    }
  }, [examId]);

  // Load variants on mount or when examId changes
  useEffect(() => {
    loadVariants();
  }, [loadVariants]);

  // Generate variants
  const generateVariants = useCallback(async () => {
    if (!examId) return;

    setIsGenerating(true);
    try {
      const response = await examAPI.generateVariants(examId);
      // Show warning if backend returns it
      if (response && response.warning) {
        toast.error(response.warning, { duration: 8000 });
      }
      // After generating, reload variants to get the updated list
      await loadVariants();
      onVariantsChange?.();
      toast.success('Variants generated successfully!');
    } catch (error) {
      console.error('Failed to generate variants:', error);

      // Handle specific error messages from the backend
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as {
          response?: { data?: { error?: string } };
        };
        if (axiosError.response?.data?.error) {
          const errorMessage = axiosError.response.data.error;
          if (errorMessage.includes('Not enough questions')) {
            toast.error(
              'Not enough questions in this exam. Please add more questions or reduce the number of questions per variant.',
              { duration: 6000 }
            );
          } else if (errorMessage.includes('Difficulty distribution')) {
            toast.error(
              'Difficulty distribution must add up to 100%. Please check your difficulty settings.',
              { duration: 6000 }
            );
          } else {
            toast.error(`Failed to generate variants: ${errorMessage}`, {
              duration: 6000,
            });
          }
        } else {
          toast.error(
            'Failed to generate variants. Please check your exam configuration.',
            { duration: 6000 }
          );
        }
      } else {
        toast.error(
          'Failed to generate variants. Please check your exam configuration.',
          { duration: 6000 }
        );
      }
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [examId, onVariantsChange, loadVariants]);

  // Export variants to DOCX
  const exportVariants = useCallback(
    async (variantIds?: number[]) => {
      if (!examId) return;
      setIsExporting(true);
      try {
        // 1) fire the request
        const blob = await examAPI.exportDocx(examId, variantIds);

        // 2) fetch exam metadata for naming
        const examDetail = await examAPI.getExamDetail(examId);
        const year = new Date().getFullYear();
        const type = examDetail.exam_type || 'exam';
        const code = examDetail.course_code || 'COURSE';

        // 3) decide single vs. multi
        const isSingle = Array.isArray(variantIds) && variantIds.length === 1;
        const ext = isSingle ? 'docx' : 'zip';
        const suffix = isSingle ? `_Variant_${variantIds![0]}` : '_Variants';
        const filename = `${type}_${year}_${code}${suffix}.${ext}`;

        // 4) trigger the download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success(
          isSingle
            ? 'Variant exported successfully!'
            : 'Variants exported successfully!'
        );
      } catch (error) {
        console.error('Export failed:', error);
        toast.error('Failed to export variants. Please try again.');
        throw error;
      } finally {
        setIsExporting(false);
      }
    },
    [examId]
  );
  // Export answer key
  const exportAnswerKey = useCallback(
    async (variantIds?: number[]) => {
      if (!examId) return;

      setIsExporting(true);
      try {
        const blob = await examAPI.exportAnswerKey(examId, variantIds);

        // Get exam details for filename
        const examDetail = await examAPI.getExamDetail(examId);
        const currentYear = new Date().getFullYear();
        const examType = examDetail.exam_type || 'exam';
        const courseCode = examDetail.course_code || 'COURSE';

        // Create filename: e.g., "Midterm_2024_COSC304_AnswerKey.csv"
        const filename = `${examType}_${currentYear}_${courseCode}_AnswerKey.csv`;

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success('Answer key exported successfully!');
      } catch (error) {
        console.error('Failed to export answer key:', error);
        toast.error('Failed to export answer key. Please try again.');
        throw error;
      } finally {
        setIsExporting(false);
      }
    },
    [examId]
  );

  // Update variant question order
  const updateVariantOrder = useCallback(
    async (variantId: number, questionOrders: Record<string, number>) => {
      try {
        // Convert questionOrders mapping to an array of IDs sorted by order
        const orderedIds = Object.entries(questionOrders)
          .sort((a, b) => a[1] - b[1])
          .map(([id]) => Number(id));
        await examAPI.reorderExamQuestions(examId, orderedIds);
        toast.success('Question order updated successfully!');
      } catch (error) {
        console.error('Failed to update variant order:', error);
        toast.error('Failed to update question order. Please try again.');
        throw error;
      }
    },
    [examId]
  );

  return {
    variants,
    isLoading,
    isGenerating,
    isExporting,
    generateVariants,
    exportVariants,
    exportAnswerKey,
    updateVariantOrder,
  };
};
