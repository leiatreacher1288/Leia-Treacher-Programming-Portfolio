import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Target,
  Library,
  AlignLeft,
  Sparkles,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Save,
} from 'lucide-react';
import { StandardButton } from '../ui/StandardButton';
import { examAPI } from '../../api/examAPI';
import { questionAPI } from '../../api/questionAPI';
import type { WizardData, QuestionBank, ExamSection } from '../../api/examAPI';
import type { Course } from '../../types/course';
import clsx from 'clsx';
import toast, { Toaster } from 'react-hot-toast';
import ConfirmModal from '../ui/ConfirmModal';
import {
  Step1ExamInfo,
  Step2SourcesSections,
  Step3VariantStrategy,
  Step4MandatoryQuestions,
  Step5LayoutInstructions,
  Step6ReviewGenerate,
} from './steps';
import { courseAPI } from '../../api/courseAPI';

const STEPS = [
  {
    label: 'Exam Information',
    icon: <BookOpen className="text-white" size={14} />,
  },
  {
    label: 'Sources & Sections',
    icon: <Library className="text-white" size={14} />,
  },
  {
    label: 'Variant Strategy',
    icon: <Target className="text-white" size={14} />,
  },
  {
    label: 'Mandatory Questions',
    icon: <AlertTriangle className="text-white" size={14} />,
  },
  {
    label: 'Layout & Instructions',
    icon: <AlignLeft className="text-white" size={14} />,
  },
  {
    label: 'Review & Generate',
    icon: <Sparkles className="text-white" size={14} />,
  },
];

interface ConnectedExamWizardPageProps {
  examId: number;
  onClose: () => void;
  courseId?: number;
}

export const ConnectedExamWizardPage: React.FC<
  ConnectedExamWizardPageProps
> = ({ examId, onClose, courseId }) => {
  // Wizard state
  const [wizardData, setWizardData] = useState<WizardData | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Course selection state (for global exam creation)
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | undefined>(
    courseId
  );

  // Step 1 validation state
  const [isStep1Valid, setIsStep1Valid] = useState(false);

  // Load wizard data when examId changes
  useEffect(() => {
    console.log(
      '🔍 Wizard: useEffect triggered with examId:',
      examId,
      'courseId:',
      courseId
    );

    const loadWizardData = async () => {
      if (examId === 0) {
        // Create new exam wizard data
        let courseCode = '';
        let courseTerm = '';

        // If courseId is provided, fetch course information
        if (courseId) {
          try {
            console.log(
              '🔍 Wizard: Fetching course data for courseId:',
              courseId
            );
            const courseData = await courseAPI.getCourseDetail(courseId);
            console.log('📋 Wizard: Course data received:', courseData);
            courseCode = courseData.code || '';
            courseTerm = courseData.term || '';
            console.log(
              '🏷️ Wizard: Using course code:',
              courseCode,
              'term:',
              courseTerm
            );
          } catch (err) {
            console.error('❌ Wizard: Failed to load course data:', err);
          }
        }

        const newWizardData: WizardData = {
          exam: {
            id: 0,
            title: '',
            description: '',
            exam_type: 'midterm',
            course: courseId || 0, // Use courseId if provided
            course_code: courseCode,
            course_term: courseTerm,
            time_limit: 60,
            num_variants: 3,
            questions_per_variant: 10,
            randomize_questions: true,
            randomize_choices: true,
            show_answers_after: false,
            easy_percentage: 33,
            medium_percentage: 33,
            hard_percentage: 34,
            unknown_percentage: 0,
            question_budget: 100,
            available_from: undefined,
            available_until: undefined,
            weight: 20,
            required_to_pass: false,
            allow_reuse: false,
            exam_instructions: '',
            footer_text: '',
            academic_integrity_statement: '',
            include_academic_integrity: true,
          },
          question_banks: [],
          sections: [],
          mandatory_questions: [],
        };
        setWizardData(newWizardData);
        setIsLoading(false);
      } else {
        // Load existing exam wizard data
        try {
          console.log(
            '🔍 Wizard: Loading existing exam data for examId:',
            examId
          );
          const data = await examAPI.getWizardData(examId);
          console.log('🔍 Wizard: Received wizard data:', data);
          setWizardData(data);
        } catch (err) {
          console.error('Failed to load wizard data:', err);
          setError('Failed to load exam data. Please try again.');
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadWizardData();
  }, [examId, courseId]);

  // Load courses for global exam creation
  useEffect(() => {
    if (!courseId) {
      // Only load courses if no specific course is pre-selected
      const loadCourses = async () => {
        try {
          const coursesData = await courseAPI.getCourses();
          setCourses(coursesData);
        } catch (err) {
          console.error('Failed to load courses:', err);
        }
      };
      loadCourses();
    }
  }, [courseId]);

  // Load question banks when course is available
  useEffect(() => {
    const loadQuestionBanks = async () => {
      const courseToUse =
        selectedCourseId || courseId || wizardData?.exam?.course;

      if (courseToUse && courseToUse > 0) {
        try {
          console.log(
            '🔍 Wizard: Loading question banks for course:',
            courseToUse
          );
          const banks = await questionAPI.getQuestionBanksByCourse(courseToUse);
          console.log('📚 Wizard: Loaded question banks:', banks.length);

          // Transform questionAPI QuestionBank to examAPI QuestionBank format
          const transformedBanks = banks.map((bank) => ({
            id: bank.id,
            title: bank.title,
            description: bank.description,
            easy: bank.difficulty_breakdown.easy,
            medium: bank.difficulty_breakdown.medium,
            hard: bank.difficulty_breakdown.hard,
            tags: Object.keys(bank.tag_counts || {}),
            question_count: bank.question_count,
          }));

          setAllQuestionBanks(transformedBanks);
          setAvailableBanks(transformedBanks);
        } catch (err) {
          console.error('Failed to load question banks:', err);
        }
      }
    };

    loadQuestionBanks();
  }, [selectedCourseId, courseId, wizardData?.exam?.course]);

  // Populate state from loaded wizard data
  useEffect(() => {
    if (wizardData) {
      // Step 1: Exam Info
      setExamName(wizardData.exam.title || '');
      setExamDesc(wizardData.exam.description || '');
      setExamType(wizardData.exam.exam_type || 'midterm');
      setExamTimeLimit(wizardData.exam.time_limit || '');
      setExamWeight(wizardData.exam.weight || '');
      setRequiredToPass(wizardData.exam.required_to_pass || false);
      setExamDate(
        wizardData.exam.available_from
          ? String(wizardData.exam.available_from)
          : ''
      );

      // Step 2: Sections
      if (wizardData.sections && wizardData.sections.length > 0) {
        console.log(
          '🔍 Wizard: Original sections from backend:',
          wizardData.sections.map((s) => ({
            id: s.id,
            title: s.title,
            instructions: s.instructions,
          }))
        );
        setSections(wizardData.sections);
        // Populate section instructions
        const instructions: { [key: number]: string } = {};
        const questionCounts: number[] = [];
        console.log(
          '🔍 Loading section instructions from wizardData:',
          wizardData.sections
        );
        wizardData.sections.forEach((section, index) => {
          console.log(
            `📝 Section ${section.id}: instructions = "${section.instructions}"`
          );
          console.log(
            `🔢 Section ${section.id}: configured_question_count = ${section.configured_question_count}`
          );
          instructions[section.id] = section.instructions || '';
          questionCounts[index] = section.configured_question_count || 5;
        });
        console.log('📋 Final section instructions object:', instructions);
        console.log('🔢 Final question counts array:', questionCounts);
        setSectionInstructions(instructions);
        setSectionQuestionCounts(questionCounts);
      }

      // Step 3: Variant Strategy
      setReuseMode(wizardData.exam.allow_reuse || false);
      setNumVariants(wizardData.exam.num_variants || 3);
      setQuestionsPerVariant(wizardData.exam.questions_per_variant || 15);
      setDifficulty({
        easy: wizardData.exam.easy_percentage || 40,
        medium: wizardData.exam.medium_percentage || 40,
        hard: wizardData.exam.hard_percentage || 20,
        unknown: wizardData.exam.unknown_percentage || 0,
        selectedMode: null,
        enabled: true,
      });

      // Step 5: Layout & Instructions
      setExamInstructions(wizardData.exam.exam_instructions || '');
      setFooter(wizardData.exam.footer_text || '');
      setAcademicIntegrity(wizardData.exam.include_academic_integrity || true);
      setCustomIntegrityStatement(
        wizardData.exam.academic_integrity_statement || ''
      );

      // Load marking scheme if available
      if (wizardData.exam.marking_scheme) {
        setMarkingScheme(wizardData.exam.marking_scheme);
      }
    }
  }, [wizardData]);

  // Ensure section question counts are loaded when navigating to Step 2
  useEffect(() => {
    if (
      currentStep === 1 &&
      wizardData &&
      wizardData.sections &&
      wizardData.sections.length > 0
    ) {
      console.log(
        '🔍 Step 2: Reloading section question counts from wizardData'
      );
      const questionCounts: number[] = [];
      wizardData.sections.forEach((section, index) => {
        console.log(
          `🔢 Step 2: Section ${section.id}: configured_question_count = ${section.configured_question_count}`
        );
        questionCounts[index] = section.configured_question_count || 5;
      });
      console.log('🔢 Step 2: Final question counts array:', questionCounts);
      setSectionQuestionCounts(questionCounts);
    }
  }, [currentStep, wizardData]);

  // Step 1: Exam Info
  const [examName, setExamName] = useState('');
  const [examDesc, setExamDesc] = useState('');
  const [examType, setExamType] = useState('midterm');
  const [examTimeLimit, setExamTimeLimit] = useState<number | ''>('');
  const [examWeight, setExamWeight] = useState<number | ''>('');
  const [examDate, setExamDate] = useState('');
  const [requiredToPass, setRequiredToPass] = useState(false);

  // Step 2: Section Builder
  const [allQuestionBanks, setAllQuestionBanks] = useState<QuestionBank[]>([]);
  const [availableBanks, setAvailableBanks] = useState<QuestionBank[]>([]);
  const [sections, setSections] = useState<ExamSection[]>([
    {
      id: 1,
      title: 'Section A',
      instructions: '',
      order: 0,
      question_banks: [],
      question_count: 0,
    },
  ]);
  const [draggedBankId, setDraggedBankId] = useState<string | null>(null);
  const [highlightedBank, setHighlightedBank] = useState<number | null>(null);
  const [sectionInstructions, setSectionInstructions] = useState<{
    [key: number]: string;
  }>({});
  const [sectionQuestionCounts, setSectionQuestionCounts] = useState<number[]>([
    5,
  ]); // Default 5 questions per section
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set()
  );

  // Step 3: Variant Strategy
  const [reuseMode, setReuseMode] = useState(false);
  const [numVariants, setNumVariants] = useState(3);
  const [questionsPerVariant, setQuestionsPerVariant] = useState(15);
  const [difficulty, setDifficulty] = useState({
    easy: 40,
    medium: 40,
    hard: 20,
    unknown: 0,
    selectedMode: null as 'auto' | 'even' | null,
    enabled: true,
  });

  // Calculate total available questions from sections (using configured limits)
  const totalAvailableQuestions = React.useMemo(() => {
    let total = 0;

    sections.forEach((section, index) => {
      // Use the configured question count for each section
      const sectionLimit = sectionQuestionCounts[index] || 5;
      total += sectionLimit;
    });
    return total;
  }, [sections, sectionQuestionCounts]);

  // Calculate total questions per variant based on section configuration
  const totalQuestionsPerVariant = React.useMemo(() => {
    return sectionQuestionCounts.reduce((sum, count) => sum + count, 0);
  }, [sectionQuestionCounts]);

  // Auto-populate questionsPerVariant with max available questions
  useEffect(() => {
    if (totalAvailableQuestions > 0 && sections.length > 0) {
      // Calculate max questions per variant based on mode
      const maxQuestionsPerVariant = reuseMode
        ? totalAvailableQuestions // In reuse mode, we can use all questions
        : Math.floor(totalAvailableQuestions / numVariants); // In unique mode, divide by variants

      // Only update if the calculated value is different and reasonable
      if (
        maxQuestionsPerVariant > 0 &&
        maxQuestionsPerVariant !== questionsPerVariant
      ) {
        setQuestionsPerVariant(maxQuestionsPerVariant);
        console.log(
          `Auto-populated questionsPerVariant: ${maxQuestionsPerVariant} (total: ${totalAvailableQuestions}, variants: ${numVariants}, reuse: ${reuseMode})`
        );
      }
    }
  }, [totalAvailableQuestions, numVariants, reuseMode, sections.length]);

  // Difficulty distribution state for Step 3
  const [selectedMode, setSelectedMode] = useState<'auto' | 'even' | null>(
    null
  );
  const [savedDistribution, setSavedDistribution] = useState({
    Easy: 40,
    Medium: 40,
    Hard: 20,
    Unknown: 0,
  });
  const [difficultyEnabled, setDifficultyEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>(
    'idle'
  );

  // Step 4: Mandatory Questions
  const [selectedMandatoryQuestions, setSelectedMandatoryQuestions] = useState<
    Set<number>
  >(new Set());

  // Calculate if we have enough questions for the current configuration
  const calculateRequiredQuestions = () => {
    if (reuseMode) {
      // For reuse mode: just questions_per_variant
      return questionsPerVariant;
    } else {
      // For unique mode: (variants * questions_per_variant)
      const totalQuestionsNeeded = numVariants * questionsPerVariant;
      return totalQuestionsNeeded;
    }
  };

  const requiredQuestions = calculateRequiredQuestions();
  const hasInsufficientQuestions = totalAvailableQuestions < requiredQuestions;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('Any');
  const [selectedBank, setSelectedBank] = useState<string>('All QBs');
  const [sectionQuestions, setSectionQuestions] = useState<any[]>([]);

  // Step 5: Layout & Instructions
  const [examInstructions, setExamInstructions] = useState('');
  const [footer, setFooter] = useState('');
  const [academicIntegrity, setAcademicIntegrity] = useState(true);
  const [customIntegrityStatement, setCustomIntegrityStatement] = useState(
    'I confirm that I will not give or receive unauthorized aid on this examination.'
  );

  // Marking scheme state
  const [markingScheme, setMarkingScheme] = useState({
    multiCorrectPolicy: 'partial_credit' as
      | 'all_or_nothing'
      | 'partial_credit'
      | 'partial_with_penalty',
    negativeMarking: {
      enabled: false,
      penalty: 0.25,
      applyTo: 'all_questions' as
        | 'all_questions'
        | 'single_choice_only'
        | 'multi_choice_only',
    },
    sectionWeighting: {} as { [sectionId: number]: number },
  });

  // Track changes for save status
  useEffect(() => {
    if (wizardData) {
      const hasChanges =
        examName !== wizardData.exam.title ||
        examDesc !== (wizardData.exam.description || '') ||
        examType !== wizardData.exam.exam_type ||
        examTimeLimit !== wizardData.exam.time_limit ||
        examWeight !== wizardData.exam.weight ||
        requiredToPass !== wizardData.exam.required_to_pass ||
        examDate !==
          (wizardData.exam.available_from
            ? String(wizardData.exam.available_from)
            : '') ||
        reuseMode !== wizardData.exam.allow_reuse ||
        numVariants !== wizardData.exam.num_variants ||
        questionsPerVariant !== wizardData.exam.questions_per_variant ||
        examInstructions !== (wizardData.exam.exam_instructions || '') ||
        footer !== (wizardData.exam.footer_text || '') ||
        academicIntegrity !== wizardData.exam.include_academic_integrity ||
        customIntegrityStatement !==
          (wizardData.exam.academic_integrity_statement || '') ||
        JSON.stringify(markingScheme) !==
          JSON.stringify(wizardData.exam.marking_scheme || {});

      // setHasUnsavedChanges(hasChanges); // This line was removed as per the edit hint
    }
  }, [
    examName,
    examDesc,
    examType,
    examTimeLimit,
    examWeight,
    requiredToPass,
    examDate,
    reuseMode,
    numVariants,
    questionsPerVariant,
    examInstructions,
    footer,
    academicIntegrity,
    customIntegrityStatement,
    markingScheme,
    wizardData,
  ]);

  // Handle back button with confirmation
  const handleBackToExamView = () => {
    if (wizardData) {
      // Check if wizardData is loaded
      const hasChanges =
        examName !== wizardData.exam.title ||
        examDesc !== (wizardData.exam.description || '') ||
        examType !== wizardData.exam.exam_type ||
        examTimeLimit !== wizardData.exam.time_limit ||
        examWeight !== wizardData.exam.weight ||
        requiredToPass !== wizardData.exam.required_to_pass ||
        examDate !==
          (wizardData.exam.available_from
            ? String(wizardData.exam.available_from)
            : '') ||
        reuseMode !== wizardData.exam.allow_reuse ||
        numVariants !== wizardData.exam.num_variants ||
        questionsPerVariant !== wizardData.exam.questions_per_variant ||
        examInstructions !== (wizardData.exam.exam_instructions || '') ||
        footer !== (wizardData.exam.footer_text || '') ||
        academicIntegrity !== wizardData.exam.include_academic_integrity ||
        customIntegrityStatement !==
          (wizardData.exam.academic_integrity_statement || '') ||
        JSON.stringify(markingScheme) !==
          JSON.stringify(wizardData.exam.marking_scheme || {});

      if (hasChanges) {
        setShowConfirmModal(true);
      } else {
        onClose();
      }
    } else {
      onClose(); // If wizardData is not loaded, just close
    }
  };

  const handleConfirmLeave = () => {
    setShowConfirmModal(false);
    onClose();
  };

  // Fetch questions from selected question banks
  const fetchSectionQuestions = useCallback(async () => {
    if (sections.length === 0) return;

    try {
      // Get all unique question bank IDs from sections
      const bankIds = new Set<number>();
      sections.forEach((section) => {
        section.question_banks.forEach((bank: any) => {
          bankIds.add(bank.id);
        });
      });

      // Fetch questions from each bank
      const allQuestions: any[] = [];
      for (const bankId of bankIds) {
        try {
          const questions = await questionAPI.getQuestionsByBank(bankId);
          allQuestions.push(...questions);
        } catch (error) {
          console.error(`Failed to fetch questions for bank ${bankId}:`, error);
        }
      }

      setSectionQuestions(allQuestions);
    } catch (error) {
      console.error('Failed to fetch section questions:', error);
    }
  }, [sections]);

  // Initialize data when wizardData is loaded
  useEffect(() => {
    if (wizardData) {
      setExamName(wizardData.exam.title);
      setExamDesc(wizardData.exam.description || '');
      setExamType(wizardData.exam.exam_type);
      setExamTimeLimit(wizardData.exam.time_limit || '');
      setExamWeight(wizardData.exam.weight);
      setRequiredToPass(wizardData.exam.required_to_pass);
      setExamDate(wizardData.exam.available_from || '');
      setAllQuestionBanks(wizardData.question_banks);
      setAvailableBanks(wizardData.question_banks);
      // Only set sections if they exist, otherwise keep the default Section A
      if (wizardData.sections && wizardData.sections.length > 0) {
        setSections(wizardData.sections);
        // Load configured question counts from sections
        setSectionQuestionCounts(
          wizardData.sections.map((section) => section.question_count || 5)
        );
      }
      setReuseMode(wizardData.exam.allow_reuse);
      setNumVariants(wizardData.exam.num_variants);
      setQuestionsPerVariant(wizardData.exam.questions_per_variant);
      setDifficulty({
        easy: wizardData.exam.easy_percentage || 40,
        medium: wizardData.exam.medium_percentage || 40,
        hard: wizardData.exam.hard_percentage || 20,
        unknown: wizardData.exam.unknown_percentage || 0,
        selectedMode: null,
        enabled: true,
      });
      // Update savedDistribution to match the backend values
      setSavedDistribution({
        Easy: wizardData.exam.easy_percentage || 40,
        Medium: wizardData.exam.medium_percentage || 40,
        Hard: wizardData.exam.hard_percentage || 20,
        Unknown: wizardData.exam.unknown_percentage || 0,
      });
      setExamInstructions(wizardData.exam.exam_instructions);
      setFooter(wizardData.exam.footer_text);
      setAcademicIntegrity(wizardData.exam.include_academic_integrity);
      setCustomIntegrityStatement(wizardData.exam.academic_integrity_statement);

      // Load marking scheme if available
      if (wizardData.exam.marking_scheme) {
        setMarkingScheme(wizardData.exam.marking_scheme);
      }

      setSelectedMandatoryQuestions(
        new Set(wizardData.mandatory_questions.map((q) => q.id))
      );
    }
  }, [wizardData]);

  // Fetch questions when sections change
  useEffect(() => {
    fetchSectionQuestions();
  }, [fetchSectionQuestions]);

  // Save wizard data and generate variants
  const saveWizardDataAndGenerate = async () => {
    if (!wizardData) return;

    try {
      setIsGenerating(true);
      console.log('Starting variant generation for exam:', examId);

      // Add question counts to sections and convert question banks back to IDs for backend
      const sectionsWithQuestionCounts = sections.map((section, idx) => ({
        ...section,
        question_banks: section.question_banks.map((bank: any) => bank.id),
        configured_question_count: sectionQuestionCounts[idx] || 5,
        instructions: sectionInstructions[section.id] || '',
      }));

      let actualExamId = examId;

      // If examId is 0, create the exam first
      if (examId === 0) {
        console.log('Creating new exam...');
        const courseToUse =
          selectedCourseId || courseId || wizardData.exam.course;

        if (!courseToUse || courseToUse === 0) {
          throw new Error('No course selected for exam creation');
        }

        const newExam = await examAPI.createExam({
          title: examName || 'Untitled Exam',
          exam_type: examType,
          time_limit: examTimeLimit === '' ? 60 : Number(examTimeLimit),
          course: courseToUse,
          description: examDesc,
        });

        actualExamId = newExam.id;
        console.log('Created exam with ID:', actualExamId);
      }

      console.log('Saving wizard data...');
      await examAPI.updateWizardData(actualExamId, {
        title: examName,
        description: examDesc,
        exam_type: examType,
        time_limit: examTimeLimit === '' ? 60 : Number(examTimeLimit),
        weight: examWeight as number,
        required_to_pass: requiredToPass,
        available_from: examDate || undefined,
        num_variants: numVariants,
        questions_per_variant: totalQuestionsPerVariant,
        allow_reuse: reuseMode,
        easy_percentage: difficulty.easy,
        medium_percentage: difficulty.medium,
        hard_percentage: difficulty.hard,
        unknown_percentage:
          100 - (difficulty.easy + difficulty.medium + difficulty.hard),
        exam_instructions: examInstructions,
        footer_text: footer,
        academic_integrity_statement: customIntegrityStatement,
        include_academic_integrity: academicIntegrity,
        marking_scheme: markingScheme,
        sections: sectionsWithQuestionCounts,
        mandatory_question_ids: Array.from(selectedMandatoryQuestions),
      });

      console.log('Wizard data saved, now generating variants...');
      // Generate variants
      const variantResponse = await examAPI.generateVariants(actualExamId);
      console.log('Variant generation response:', variantResponse);

      toast.success(
        `Exam configured and ${variantResponse.variants_created || 0} variants generated successfully!`
      );

      // Short delay to show the toast before redirecting
      setTimeout(() => {
        window.location.href = `/exam/${actualExamId}?prioritizeRecentSet=true`;
      }, 800);
    } catch (err) {
      console.error('Error in saveWizardDataAndGenerate:', err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to save exam settings and generate variants';
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save wizard data
  const saveWizardData = async () => {
    if (!wizardData) return;

    try {
      // Add question counts to sections and convert question banks back to IDs for backend
      const sectionsWithQuestionCounts = sections.map((section, idx) => ({
        ...section,
        question_banks: section.question_banks.map((bank: any) => bank.id),
        configured_question_count: sectionQuestionCounts[idx] || 5,
        instructions: sectionInstructions[section.id] || '',
      }));

      let actualExamId = examId;

      // If examId is 0, create the exam first
      if (examId === 0) {
        console.log('Creating new exam for save...');
        const courseToUse =
          selectedCourseId || courseId || wizardData.exam.course;

        if (!courseToUse || courseToUse === 0) {
          throw new Error('No course selected for exam creation');
        }

        const newExam = await examAPI.createExam({
          title: examName || 'Untitled Exam',
          exam_type: examType,
          time_limit: examTimeLimit === '' ? 60 : Number(examTimeLimit),
          course: courseToUse,
          description: examDesc,
        });

        actualExamId = newExam.id;
        console.log('Created exam with ID:', actualExamId);
      }

      await examAPI.updateWizardData(actualExamId, {
        title: examName,
        description: examDesc,
        exam_type: examType,
        time_limit: examTimeLimit === '' ? 60 : Number(examTimeLimit),
        weight: examWeight as number,
        required_to_pass: requiredToPass,
        available_from: examDate || undefined,
        num_variants: numVariants,
        questions_per_variant: totalQuestionsPerVariant,
        allow_reuse: reuseMode,
        easy_percentage: difficulty.easy,
        medium_percentage: difficulty.medium,
        hard_percentage: difficulty.hard,
        unknown_percentage:
          100 - (difficulty.easy + difficulty.medium + difficulty.hard),
        exam_instructions: examInstructions,
        footer_text: footer,
        academic_integrity_statement: customIntegrityStatement,
        include_academic_integrity: academicIntegrity,
        marking_scheme: markingScheme,
        sections: sectionsWithQuestionCounts,
        mandatory_question_ids: Array.from(selectedMandatoryQuestions),
      });

      // Debug logging
      console.log('🔍 Saving marking scheme:', markingScheme);
      console.log('🔍 Section weighting:', markingScheme.sectionWeighting);

      toast.success('Exam settings saved successfully!');
      // setHasUnsavedChanges(false); // This line was removed as per the edit hint
    } catch (err) {
      console.error('Error saving wizard data:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to save exam settings';
      toast.error(errorMessage);
    }
  };

  // Drag-and-drop logic for Step 2
  const handleBankDragStart = (bankId: number) =>
    setDraggedBankId(bankId.toString());
  const handleBankDragEnd = () => setDraggedBankId(null);
  const handleDropOnSection = (sectionIdx: number) => {
    if (!draggedBankId) return;

    // Add to section if not already present
    setSections((prev) => {
      const updated = [...prev];
      const bankId = parseInt(draggedBankId);
      const bankExists = updated[sectionIdx].question_banks.some(
        (bank: any) => bank.id === bankId
      );
      if (!bankExists) {
        const bank = allQuestionBanks.find((b) => b.id === bankId);
        if (bank) {
          updated[sectionIdx].question_banks.push(bank);
        }
      }
      return updated;
    });

    // Auto-update question count only if no existing saved data
    const currentCount = sectionQuestionCounts[sectionIdx] || 5;
    const bank = allQuestionBanks.find((b) => b.id === parseInt(draggedBankId));
    if (bank && currentCount === 5) {
      // Only update if using default value
      updateSectionQuestionCount(sectionIdx, bank.question_count || 5);
    }

    // Remove from availableBanks only if used in ALL sections
    setAvailableBanks((prev) => {
      const totalSections = sections.length;
      const sectionsWithBank = sections.filter((s) =>
        s.question_banks.some(
          (bank: any) => bank.id === parseInt(draggedBankId)
        )
      ).length;

      // Only remove if bank is used in ALL sections
      if (totalSections > 0 && sectionsWithBank === totalSections) {
        return prev.filter((b) => b.id !== parseInt(draggedBankId));
      }
      return prev;
    });

    setDraggedBankId(null);
  };

  const handleAddBankToSection = (bankId: number, sectionIdx: number) => {
    // Add to section if not already present
    setSections((prev) => {
      const updated = [...prev];
      const bankExists = updated[sectionIdx].question_banks.some(
        (bank: any) => bank.id === bankId
      );
      if (!bankExists) {
        const bank = allQuestionBanks.find((b) => b.id === bankId);
        if (bank) {
          updated[sectionIdx].question_banks.push(bank);
        }
      }
      return updated;
    });

    // Auto-update question count only if no existing saved data
    const currentCount = sectionQuestionCounts[sectionIdx] || 5;
    const bank = allQuestionBanks.find((b) => b.id === bankId);
    if (bank && currentCount === 5) {
      // Only update if using default value
      updateSectionQuestionCount(sectionIdx, bank.question_count || 5);
    }

    // Remove from availableBanks only if used in ALL sections
    setAvailableBanks((prev) => {
      const totalSections = sections.length;
      const sectionsWithBank = sections.filter((s) =>
        s.question_banks.some((bank: any) => bank.id === bankId)
      ).length;

      // Only remove if bank is used in ALL sections
      if (totalSections > 0 && sectionsWithBank === totalSections) {
        return prev.filter((b) => b.id !== bankId);
      }
      return prev;
    });
  };

  const handleRemoveBankFromSection = (sectionIdx: number, bankId: number) => {
    setSections((prev) => {
      const updated = [...prev];
      updated[sectionIdx].question_banks = updated[
        sectionIdx
      ].question_banks.filter((bank: any) => bank.id !== bankId);
      return updated;
    });

    // Check if the bank is still in any section after removal
    setAvailableBanks((prev) => {
      const isStillInAnySection = sections.some((s) =>
        s.question_banks.some((bank: any) => bank.id === bankId)
      );
      if (!isStillInAnySection) {
        const bank = allQuestionBanks.find((b) => b.id === bankId);
        if (bank && !prev.find((b) => b.id === bankId)) {
          return [...prev, bank];
        }
      }
      return prev;
    });
  };

  const updateSectionQuestionCount = (sectionIdx: number, count: number) => {
    setSectionQuestionCounts((prev) => {
      const updated = [...prev];
      updated[sectionIdx] = count;
      return updated;
    });
  };

  const calculateMaxQuestionsForSection = (sectionIdx: number) => {
    const section = sections[sectionIdx];
    if (!section || !section.question_banks) return 1;

    // Calculate total questions available from all banks in this section
    const totalQuestions = section.question_banks.reduce((total, bank: any) => {
      return total + (bank?.question_count || 0);
    }, 0);

    return Math.max(1, totalQuestions);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-neutral-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-btn mx-auto mb-4"></div>
            <p className="text-muted">Loading exam data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen bg-neutral-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-heading mb-2">
              Error Loading Exam
            </h2>
            <p className="text-muted mb-4">{error}</p>
            <StandardButton color="primary-btn" onClick={onClose}>
              Go Back
            </StandardButton>
          </div>
        </div>
      </div>
    );
  }

  if (!wizardData) {
    return (
      <div className="flex flex-col h-screen bg-neutral-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted">No exam data available</p>
          </div>
        </div>
      </div>
    );
  }

  // Step content rendering
  const renderStep = () => {
    // Step 1: Exam Info
    if (currentStep === 0) {
      return (
        <Step1ExamInfo
          examName={examName}
          setExamName={setExamName}
          examDesc={examDesc}
          setExamDesc={setExamDesc}
          examType={examType}
          setExamType={setExamType}
          examTimeLimit={examTimeLimit}
          setExamTimeLimit={setExamTimeLimit}
          examWeight={examWeight}
          setExamWeight={setExamWeight}
          examDate={examDate}
          setExamDate={setExamDate}
          requiredToPass={requiredToPass}
          setRequiredToPass={setRequiredToPass}
          wizardData={wizardData}
          courses={courses}
          selectedCourseId={selectedCourseId}
          onCourseChange={setSelectedCourseId}
          onValidationChange={setIsStep1Valid}
          onRedirectToCourse={(courseId) => {
            // Navigate to course detail with question banks tab
            window.location.href = `/courses/${courseId}?fromExamCreation=true#question-banks`;
          }}
        />
      );
    }

    // Step 2: Question Sources & Section Builder
    if (currentStep === 1) {
      return (
        <Step2SourcesSections
          availableBanks={availableBanks}
          sections={sections}
          draggedBankId={draggedBankId}
          highlightedBank={highlightedBank}
          collapsedSections={collapsedSections}
          sectionQuestionCounts={sectionQuestionCounts}
          handleBankDragStart={handleBankDragStart}
          handleBankDragEnd={handleBankDragEnd}
          handleDropOnSection={handleDropOnSection}
          handleAddBankToSection={handleAddBankToSection}
          handleRemoveBankFromSection={handleRemoveBankFromSection}
          setHighlightedBank={setHighlightedBank}
          setSections={setSections}
          setCollapsedSections={setCollapsedSections}
          updateSectionQuestionCount={updateSectionQuestionCount}
          calculateMaxQuestionsForSection={calculateMaxQuestionsForSection}
          selectedCourseId={selectedCourseId}
          onRedirectToCourse={(courseId) => {
            // Navigate to course detail with exam creation flag
            window.location.href = `/courses/${courseId}?fromExamCreation=true#question-banks`;
          }}
        />
      );
    }

    // Step 3: Variant Strategy
    if (currentStep === 2) {
      return (
        <Step3VariantStrategy
          reuseMode={reuseMode}
          setReuseMode={setReuseMode}
          numVariants={numVariants}
          setNumVariants={setNumVariants}
          questionsPerVariant={questionsPerVariant}
          selectedMode={selectedMode}
          setSelectedMode={setSelectedMode}
          savedDistribution={savedDistribution}
          setEnabled={setDifficultyEnabled}
          onSave={(mode, distribution) => {
            setIsSaving(true);
            setSaveStatus('saving');
            // Update main difficulty state so saveWizardData uses the correct values
            setDifficulty((d) => ({
              ...d,
              easy: distribution.Easy,
              medium: distribution.Medium,
              hard: distribution.Hard,
              unknown: distribution.Unknown,
              selectedMode: mode,
            }));
            setTimeout(() => {
              setSavedDistribution(distribution);
              setIsSaving(false);
              setSaveStatus('saved');
              toast.success('Difficulty distribution saved!');
            }, 1000);
          }}
          isSaving={isSaving}
          saveStatus={saveStatus}
          questions={sectionQuestions}
          allowReuse={reuseMode}
          enabled={difficultyEnabled}
          sections={sections}
          sectionQuestionCounts={sectionQuestionCounts}
          hasInsufficientQuestions={hasInsufficientQuestions}
          totalAvailableQuestions={totalAvailableQuestions}
          requiredQuestions={requiredQuestions}
        />
      );
    }

    // Step 4: Mandatory Questions
    if (currentStep === 3) {
      return (
        <Step4MandatoryQuestions
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedDifficulty={selectedDifficulty}
          setSelectedDifficulty={setSelectedDifficulty}
          selectedBank={selectedBank}
          setSelectedBank={setSelectedBank}
          selectedMandatoryQuestions={selectedMandatoryQuestions}
          setSelectedMandatoryQuestions={setSelectedMandatoryQuestions}
          allQuestionBanks={allQuestionBanks}
          sections={sections}
          numVariants={numVariants}
          questionsPerVariant={questionsPerVariant}
          reuseMode={reuseMode}
          sectionQuestionCounts={sectionQuestionCounts}
        />
      );
    }

    // Step 5: Layout & Instructions
    if (currentStep === 4) {
      console.log('🔍 Step5: Passing sections to Step5:', sections);
      console.log(
        '🔍 Step5: Passing sectionInstructions to Step5:',
        sectionInstructions
      );
      return (
        <Step5LayoutInstructions
          examInstructions={examInstructions}
          setExamInstructions={setExamInstructions}
          footer={footer}
          setFooter={setFooter}
          academicIntegrity={academicIntegrity}
          setAcademicIntegrity={setAcademicIntegrity}
          customIntegrityStatement={customIntegrityStatement}
          setCustomIntegrityStatement={setCustomIntegrityStatement}
          sections={sections}
          setSections={setSections}
          sectionInstructions={sectionInstructions}
          setSectionInstructions={setSectionInstructions}
          sectionQuestionCounts={sectionQuestionCounts}
          markingScheme={markingScheme}
          setMarkingScheme={setMarkingScheme}
        />
      );
    }

    // Step 6: Review & Generate
    if (currentStep === 5) {
      // Calculate total available questions for pool coverage
      const totalAvailableQuestions = sections.reduce((total, section) => {
        return (
          total +
          section.question_banks.reduce((sectionTotal, bank: any) => {
            return sectionTotal + (bank?.question_count || 0);
          }, 0)
        );
      }, 0);

      return (
        <Step6ReviewGenerate
          examName={examName}
          numVariants={numVariants}
          questionsPerVariant={questionsPerVariant}
          selectedMandatoryQuestions={selectedMandatoryQuestions}
          sections={sections}
          reuseMode={reuseMode}
          totalAvailableQuestions={totalAvailableQuestions}
          markingScheme={markingScheme}
        />
      );
    }

    // Fallback for any other steps
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-xl font-semibold text-heading mb-2">
            Step {currentStep + 1}
          </h1>
          <p className="text-sm text-muted">This step is under development.</p>
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div className="flex flex-col h-screen bg-neutral-50">
      <Toaster position="top-right" />

      {/* Compact Stepper Header with Back Button and Save Status */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            {/* Save Status Badge */}
            <div className="flex items-center gap-2">
              <div
                className={clsx(
                  'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                  wizardData
                    ? // Check if wizardData is loaded
                      wizardData.exam.title !== examName ||
                      wizardData.exam.description !== examDesc ||
                      wizardData.exam.exam_type !== examType ||
                      wizardData.exam.time_limit !== examTimeLimit ||
                      wizardData.exam.weight !== examWeight ||
                      wizardData.exam.required_to_pass !== requiredToPass ||
                      wizardData.exam.available_from !== examDate ||
                      wizardData.exam.allow_reuse !== reuseMode ||
                      wizardData.exam.num_variants !== numVariants ||
                      wizardData.exam.questions_per_variant !==
                        questionsPerVariant ||
                      wizardData.exam.exam_instructions !== examInstructions ||
                      wizardData.exam.footer_text !== footer ||
                      wizardData.exam.include_academic_integrity !==
                        academicIntegrity ||
                      wizardData.exam.academic_integrity_statement !==
                        customIntegrityStatement ||
                      wizardData.sections.length !== sections.length ||
                      wizardData.sections.some(
                        (w, i) => w.id !== sections[i].id
                      ) ||
                      wizardData.sections.some(
                        (w, i) =>
                          w.instructions !== sectionInstructions[sections[i].id]
                      ) ||
                      wizardData.sections.some(
                        (w, i) => w.question_count !== sectionQuestionCounts[i]
                      ) ||
                      wizardData.sections.some(
                        (w, i) =>
                          w.question_banks.length !==
                          sections[i].question_banks.length
                      ) ||
                      wizardData.sections.some((w, i) =>
                        w.question_banks.some(
                          (wb, j) => wb.id !== sections[i].question_banks[j].id
                        )
                      ) ||
                      wizardData.mandatory_questions.length !==
                        selectedMandatoryQuestions.size ||
                      wizardData.mandatory_questions.some(
                        (w, i) =>
                          w.id !== Array.from(selectedMandatoryQuestions)[i]
                      )
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-green-100 text-green-700'
                    : 'bg-gray-200 text-gray-500' // Show default for loading/error
                )}
              >
                <Save className="w-3 h-3" />
                {wizardData // Check if wizardData is loaded
                  ? wizardData.exam.title !== examName ||
                    wizardData.exam.description !== examDesc ||
                    wizardData.exam.exam_type !== examType ||
                    wizardData.exam.time_limit !== examTimeLimit ||
                    wizardData.exam.weight !== examWeight ||
                    wizardData.exam.required_to_pass !== requiredToPass ||
                    wizardData.exam.available_from !== examDate ||
                    wizardData.exam.allow_reuse !== reuseMode ||
                    wizardData.exam.num_variants !== numVariants ||
                    wizardData.exam.questions_per_variant !==
                      questionsPerVariant ||
                    wizardData.exam.exam_instructions !== examInstructions ||
                    wizardData.exam.footer_text !== footer ||
                    wizardData.exam.include_academic_integrity !==
                      academicIntegrity ||
                    wizardData.exam.academic_integrity_statement !==
                      customIntegrityStatement ||
                    wizardData.sections.length !== sections.length ||
                    wizardData.sections.some(
                      (w, i) => w.id !== sections[i].id
                    ) ||
                    wizardData.sections.some(
                      (w, i) =>
                        w.instructions !== sectionInstructions[sections[i].id]
                    ) ||
                    wizardData.sections.some(
                      (w, i) => w.question_count !== sectionQuestionCounts[i]
                    ) ||
                    wizardData.sections.some(
                      (w, i) =>
                        w.question_banks.length !==
                        sections[i].question_banks.length
                    ) ||
                    wizardData.sections.some((w, i) =>
                      w.question_banks.some(
                        (wb, j) => wb.id !== sections[i].question_banks[j].id
                      )
                    ) ||
                    wizardData.mandatory_questions.length !==
                      selectedMandatoryQuestions.size ||
                    wizardData.mandatory_questions.some(
                      (w, i) =>
                        w.id !== Array.from(selectedMandatoryQuestions)[i]
                    )
                    ? 'Unsaved'
                    : 'Saved'
                  : 'Loading...'}
              </div>
            </div>

            {/* Back Button */}
            <button
              onClick={handleBackToExamView}
              className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4" />
              {currentStep === 1 ? 'Back to Exam View' : 'Back'}
            </button>
          </div>

          {/* Stepper */}
          <div className="grid grid-cols-6 items-center gap-1">
            {STEPS.map((s, idx) => (
              <div key={s.label} className="flex flex-col items-center">
                <div className="flex items-center w-full justify-center">
                  {/* Progress line - always show, even for first and last steps */}
                  <div
                    className={clsx(
                      'flex-1 h-0.5 mx-1',
                      idx <= currentStep ? 'bg-purple-500' : 'bg-gray-200'
                    )}
                  />

                  {/* Step indicator */}
                  <div
                    className={clsx(
                      'rounded-full flex items-center justify-center w-6 h-6 transition-all duration-300 cursor-pointer flex-shrink-0',
                      idx < currentStep
                        ? 'bg-green-500 text-white'
                        : idx === currentStep
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                    )}
                    onClick={() => {
                      // Prevent accessing Step 4 (Mandatory Questions) when in reuse mode
                      if (idx === 3 && reuseMode) {
                        toast.error(
                          'Mandatory Questions are not available in Reuse mode. Please switch to Unique mode to access this step.'
                        );
                        return;
                      }
                      setCurrentStep(idx);
                    }}
                  >
                    {idx < currentStep ? <CheckCircle2 size={12} /> : s.icon}
                  </div>

                  {/* Progress line - always show, even for first and last steps */}
                  <div
                    className={clsx(
                      'flex-1 h-0.5 mx-1',
                      idx < currentStep ? 'bg-purple-500' : 'bg-gray-200'
                    )}
                  />
                </div>
                <span
                  className={clsx(
                    'text-xs text-center max-w-[70px] leading-tight mt-1',
                    idx === currentStep
                      ? 'text-purple-600 font-medium'
                      : idx < currentStep
                        ? 'text-green-600'
                        : 'text-gray-500'
                  )}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step Content - Compact container */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="h-full">{renderStep()}</div>
        </div>
      </main>

      {/* Sticky Wizard Footer Navigation */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-5 z-10">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <span className="text-sm text-gray-500">
            Step {currentStep + 1} of {STEPS.length}
          </span>
          <div className="space-x-3">
            <StandardButton
              color="secondary-btn"
              size="lg"
              onClick={() => {
                if (currentStep > 0) {
                  let prevStep = currentStep - 1;
                  // Skip Step 4 (Mandatory Questions) when in reuse mode
                  if (currentStep === 4 && reuseMode && prevStep === 3) {
                    prevStep = 2; // Skip back to Step 3 (Variant Strategy)
                  }
                  setCurrentStep(prevStep);
                } else {
                  handleBackToExamView();
                }
              }}
              className="px-4 py-2"
              icon={<ArrowLeft size={16} />}
            >
              {currentStep === 0 ? 'Back to Exam View' : 'Back'}
            </StandardButton>
            <StandardButton
              color="primary-btn"
              size="lg"
              onClick={() => {
                // Check for insufficient questions on Step 3 (Variant Strategy)
                if (currentStep === 2 && hasInsufficientQuestions) {
                  const modeText = reuseMode
                    ? `reuse mode (${questionsPerVariant} questions per variant)`
                    : `unique mode (${numVariants * questionsPerVariant} total)`;
                  toast.error(
                    `Not enough questions: You need ${requiredQuestions} questions but only ${totalAvailableQuestions} are available for ${modeText}.`,
                    { duration: 5000 }
                  );
                  return;
                }

                if (currentStep === STEPS.length - 1) {
                  saveWizardDataAndGenerate();
                } else {
                  let nextStep = Math.min(STEPS.length - 1, currentStep + 1);
                  // Skip Step 4 (Mandatory Questions) when in reuse mode
                  if (currentStep === 2 && reuseMode && nextStep === 3) {
                    nextStep = 4; // Skip to Step 5 (Layout & Instructions)
                  }
                  setCurrentStep(nextStep);
                }
              }}
              className="px-4 py-2"
              disabled={
                (currentStep === 0 && !isStep1Valid) ||
                (currentStep === 1 &&
                  sections.every((s) => s.question_banks.length === 0)) ||
                (currentStep === 2 && hasInsufficientQuestions) ||
                isGenerating
              }
              title={
                currentStep === 2 && hasInsufficientQuestions
                  ? `Not enough questions: You need ${requiredQuestions} questions but only ${totalAvailableQuestions} are available. Add more question banks or reduce variants/questions per variant.`
                  : undefined
              }
              icon={
                currentStep === STEPS.length - 1 ? (
                  <Sparkles size={16} />
                ) : (
                  <ArrowRight size={16} />
                )
              }
            >
              {currentStep === STEPS.length - 1
                ? isGenerating
                  ? 'Generating...'
                  : 'Save & Generate'
                : 'Continue'}
            </StandardButton>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for unsaved changes */}
      <ConfirmModal
        open={showConfirmModal}
        title="Discard unsaved changes?"
        description="Changes you make here are only saved at the final step. Are you sure you want to exit without saving?"
        confirmText="Leave without Saving"
        cancelText="Cancel"
        onConfirm={handleConfirmLeave}
        onCancel={() => setShowConfirmModal(false)}
      />
    </div>
  );
};
