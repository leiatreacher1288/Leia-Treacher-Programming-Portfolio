import { useState, useEffect, useCallback } from 'react';
import { examAPI } from '../api/examAPI';
import toast from 'react-hot-toast';

export interface ExamSettings {
  num_variants: number;
  questions_per_variant: number;
  randomize_questions: boolean;
  randomize_choices: boolean;
  allow_reuse: boolean;
  easy_percentage: number;
  medium_percentage: number;
  hard_percentage: number;
  question_budget: number;
}

export interface UseExamSettingsProps {
  examId: number;
  initialSettings?: Partial<ExamSettings>;
}

export interface UseExamSettingsReturn {
  settings: ExamSettings;
  isLoading: boolean;
  isSaving: boolean;
  hasChanges: boolean;
  uniquenessMode: 'unique' | 'reuse';
  updateSetting: <K extends keyof ExamSettings>(
    key: K,
    value: ExamSettings[K]
  ) => void;
  updateUniquenessMode: (mode: 'unique' | 'reuse') => void;
  saveSettings: () => Promise<void>;
  resetSettings: () => void;
  validateSettings: () => string[];
}

const DEFAULT_SETTINGS: ExamSettings = {
  num_variants: 3,
  questions_per_variant: 20,
  randomize_questions: false,
  randomize_choices: false,
  allow_reuse: false,
  easy_percentage: 30,
  medium_percentage: 50,
  hard_percentage: 20,
  question_budget: 200,
};

export const useExamSettings = ({
  examId,
  initialSettings,
}: UseExamSettingsProps): UseExamSettingsReturn => {
  const [settings, setSettings] = useState<ExamSettings>({
    ...DEFAULT_SETTINGS,
    ...initialSettings,
  });
  const [originalSettings, setOriginalSettings] = useState<ExamSettings>({
    ...DEFAULT_SETTINGS,
    ...initialSettings,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings from API
  const loadSettings = useCallback(async () => {
    if (!examId) return;

    setIsLoading(true);
    try {
      const exam = await examAPI.getExamDetail(examId);
      const newSettings: ExamSettings = {
        num_variants: exam.num_variants,
        questions_per_variant: exam.questions_per_variant,
        randomize_questions: exam.randomize_questions,
        randomize_choices: exam.randomize_choices,
        allow_reuse: exam.allow_reuse,
        easy_percentage: exam.easy_percentage,
        medium_percentage: exam.medium_percentage,
        hard_percentage: exam.hard_percentage,
        question_budget: exam.question_budget,
      };

      setSettings(newSettings);
      setOriginalSettings(newSettings);
    } catch (error) {
      console.error('Failed to load exam settings:', error);
      toast.error('Failed to load exam settings');
    } finally {
      setIsLoading(false);
    }
  }, [examId]);

  // Load settings on mount or when examId changes
  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  // Update a single setting
  const updateSetting = useCallback(
    <K extends keyof ExamSettings>(key: K, value: ExamSettings[K]) => {
      setSettings((prev) => {
        const newSettings = { ...prev, [key]: value };
        return newSettings;
      });
    },
    []
  );

  // Update uniqueness mode (which affects allow_reuse)
  const updateUniquenessMode = useCallback((mode: 'unique' | 'reuse') => {
    setSettings((prev) => {
      const newSettings = { ...prev, allow_reuse: mode === 'reuse' };
      return newSettings;
    });
  }, []);

  // Save settings to API
  const saveSettings = useCallback(async () => {
    if (!examId) return;

    setIsSaving(true);
    try {
      await examAPI.updateExam(examId, settings);
      setOriginalSettings(settings);
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings. Please try again.');
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [examId, settings]);

  // Reset settings to original values
  const resetSettings = useCallback(() => {
    setSettings(originalSettings);
  }, [originalSettings]);

  // Validate settings
  const validateSettings = useCallback((): string[] => {
    const errors: string[] = [];

    // Validate variant count
    if (settings.num_variants < 1 || settings.num_variants > 5) {
      errors.push('Number of variants must be between 1 and 5');
    }

    // Validate questions per variant
    if (settings.questions_per_variant < 1) {
      errors.push('Questions per variant must be at least 1');
    }

    // Validate difficulty distribution
    const total =
      settings.easy_percentage +
      settings.medium_percentage +
      settings.hard_percentage;
    if (total !== 100 && total !== 0) {
      errors.push(
        'Difficulty distribution must add up to 100% or be all zero for random mode'
      );
    }

    // Validate question budget
    if (settings.question_budget < 1) {
      errors.push('Question budget must be at least 1');
    }

    return errors;
  }, [settings]);

  // Check if there are unsaved changes
  const hasChanges =
    JSON.stringify(settings) !== JSON.stringify(originalSettings);

  // Get uniqueness mode from allow_reuse
  const uniquenessMode: 'unique' | 'reuse' = settings.allow_reuse
    ? 'reuse'
    : 'unique';

  return {
    settings,
    isLoading,
    isSaving,
    hasChanges,
    uniquenessMode,
    updateSetting,
    updateUniquenessMode,
    saveSettings,
    resetSettings,
    validateSettings,
  };
};
