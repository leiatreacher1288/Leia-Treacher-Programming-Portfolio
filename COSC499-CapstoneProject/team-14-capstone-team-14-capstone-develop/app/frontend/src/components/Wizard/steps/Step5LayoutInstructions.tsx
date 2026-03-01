import React from 'react';
import {
  AlignLeft,
  Shield,
  Grid3X3,
  ChevronDown,
  ChevronUp,
  Folder,
  FileText as FooterIcon,
  Edit3,
  Hash,
  Plus,
  Trash2,
  Save,
  Download,
  Calculator,
} from 'lucide-react';
import { ToggleSwitch } from '../../ui/ToggleSwitch';
import { SaveTemplateModal } from '../../ui/SaveTemplateModal';
import { templateAPI, type ExamTemplate } from '../../../api/templateAPI';
import toast from 'react-hot-toast';

interface MarkingScheme {
  multiCorrectPolicy:
    | 'all_or_nothing'
    | 'partial_credit'
    | 'partial_with_penalty';
  negativeMarking: {
    enabled: boolean;
    penalty: number; // 0.0 to 1.0
    applyTo: 'all_questions' | 'single_choice_only' | 'multi_choice_only';
  };
  sectionWeighting: {
    [sectionId: number]: number; // multiplier
  };
}

interface Step5LayoutInstructionsProps {
  examInstructions: string;
  setExamInstructions: (instructions: string) => void;
  footer: string;
  setFooter: (footer: string) => void;
  academicIntegrity: boolean;
  setAcademicIntegrity: (enabled: boolean) => void;
  customIntegrityStatement: string;
  setCustomIntegrityStatement: (statement: string) => void;
  sections: any[];
  setSections: React.Dispatch<React.SetStateAction<any[]>>;
  sectionInstructions: { [key: number]: string };
  setSectionInstructions: (instructions: { [key: number]: string }) => void;
  sectionQuestionCounts: number[];
  markingScheme: MarkingScheme;
  setMarkingScheme: (scheme: MarkingScheme) => void;
}

export const Step5LayoutInstructions: React.FC<
  Step5LayoutInstructionsProps
> = ({
  examInstructions,
  setExamInstructions,
  footer,
  setFooter,
  academicIntegrity,
  setAcademicIntegrity,
  customIntegrityStatement,
  setCustomIntegrityStatement,
  sections,
  setSections,
  sectionInstructions,
  setSectionInstructions,
  sectionQuestionCounts,
  markingScheme,
  setMarkingScheme,
}) => {
  // Initialize marking scheme with defaults if not provided
  const defaultMarkingScheme: MarkingScheme = {
    multiCorrectPolicy: 'partial_credit',
    negativeMarking: {
      enabled: false,
      penalty: 0.25,
      applyTo: 'all_questions',
    },
    sectionWeighting: {},
  };

  const currentMarkingScheme = markingScheme || defaultMarkingScheme;

  // Ensure negativeMarking exists with proper defaults
  const negativeMarking = currentMarkingScheme.negativeMarking || {
    enabled: false,
    penalty: 0.25,
    applyTo: 'all_questions',
  };

  // Ensure sectionWeighting exists with proper defaults
  const sectionWeighting = currentMarkingScheme.sectionWeighting || {};

  // Safe wrapper for setMarkingScheme
  const safeSetMarkingScheme = (newScheme: MarkingScheme) => {
    if (setMarkingScheme) {
      setMarkingScheme(newScheme);
    }
  };

  // Load default values for a fresh exam
  const loadDefaultValues = () => {
    console.log('🔍 Loading default values for fresh exam');

    // Default exam instructions (3 bullet points)
    const defaultInstructions = [
      'Read all questions carefully before answering',
      'Show all your work for full credit',
      'You may use a calculator if needed',
    ];
    setExamInstructions(
      defaultInstructions.map((instruction) => `• ${instruction}`).join('\n\n')
    );
    setInstructionBullets(defaultInstructions);

    // Default footer
    setFooter('Good luck!');

    // Default academic integrity statement
    setAcademicIntegrity(true);
    setCustomIntegrityStatement(
      'I acknowledge that I will complete this exam independently and honestly. I will not use unauthorized materials, communicate with others, or access external resources during this exam. I understand that academic dishonesty may result in disciplinary action.'
    );

    // Default section instructions
    const defaultSectionInstructions: { [key: number]: string } = {};
    sections.forEach((section, index) => {
      defaultSectionInstructions[section.id] =
        `Answer all questions in this section. Each question is worth equal points.`;
    });
    setSectionInstructions(defaultSectionInstructions);

    // Default marking scheme
    const defaultMarkingScheme: MarkingScheme = {
      multiCorrectPolicy: 'partial_credit',
      negativeMarking: {
        enabled: false,
        penalty: 0.25,
        applyTo: 'all_questions',
      },
      sectionWeighting: {},
    };

    // Set default section weighting (all sections weighted equally)
    sections.forEach((section) => {
      defaultMarkingScheme.sectionWeighting[section.id] = 1.0;
    });

    safeSetMarkingScheme(defaultMarkingScheme);

    console.log('🔍 Default values loaded successfully');
  };

  // Parse exam instructions as bullet points
  const parseInstructions = (instructions: string): string[] => {
    if (!instructions.trim()) return [];
    return instructions
      .split('\n')
      .filter((line) => line.trim().startsWith('•'))
      .map((line) => line.replace('• ', '').trim());
  };

  // Convert bullet points back to string
  const formatInstructions = (bullets: string[]): string => {
    return bullets.map((bullet) => `• ${bullet}`).join('\n\n');
  };

  // Parse instructions into bullets for display
  const [instructionBullets, setInstructionBullets] = React.useState<string[]>(
    () => {
      if (!examInstructions.trim()) {
        return [];
      }
      return parseInstructions(examInstructions);
    }
  );

  // Update exam instructions when bullets change - with debouncing
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      setExamInstructions(formatInstructions(instructionBullets));
    }, 300); // Debounce for 300ms

    return () => clearTimeout(timeoutId);
  }, [instructionBullets]);

  // Update instruction bullets when exam instructions change (e.g., from template loading)
  React.useEffect(() => {
    if (examInstructions.trim()) {
      setInstructionBullets(parseInstructions(examInstructions));
    }
  }, [examInstructions]);

  const addBullet = () => {
    setInstructionBullets([...instructionBullets, '']);
  };

  const updateBullet = (index: number, value: string) => {
    const newBullets = [...instructionBullets];
    newBullets[index] = value;
    setInstructionBullets(newBullets);
  };

  const removeBullet = (index: number) => {
    setInstructionBullets(instructionBullets.filter((_, i) => i !== index));
  };

  const updateSectionInstruction = (sectionId: number, instruction: string) => {
    setSectionInstructions({
      ...sectionInstructions,
      [sectionId]: instruction,
    });
  };

  // State for accordion sections - marking scheme is expanded by default
  const [expandedSections, setExpandedSections] = React.useState<Set<number>>(
    new Set([-1]) // -1 represents marking scheme, expanded by default
  );
  const [showCustomIntegrity, setShowCustomIntegrity] = React.useState(false);

  // Template state
  const [templates, setTemplates] = React.useState<ExamTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<
    number | null
  >(null);
  const [showSaveModal, setShowSaveModal] = React.useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = React.useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = React.useState(false);

  const toggleSection = (sectionId: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // Check if this is a fresh exam configuration (no wizard data saved yet)
  const isFreshExam = () => {
    // Check if any wizard data has been saved to the exam
    // For a fresh exam, these should be empty/default values
    const hasInstructions = examInstructions.trim() !== '';
    const hasFooter = footer.trim() !== '';
    const hasAcademicIntegrity =
      academicIntegrity && customIntegrityStatement.trim() !== '';
    const hasSectionInstructions = Object.keys(sectionInstructions).length > 0;
    const hasMarkingScheme =
      markingScheme && Object.keys(markingScheme.sectionWeighting).length > 0;

    console.log('🔍 isFreshExam() check:');
    console.log(
      '  - hasInstructions:',
      hasInstructions,
      '(',
      examInstructions.trim(),
      ')'
    );
    console.log('  - hasFooter:', hasFooter, '(', footer.trim(), ')');
    console.log(
      '  - hasAcademicIntegrity:',
      hasAcademicIntegrity,
      '(',
      customIntegrityStatement.trim(),
      ')'
    );
    console.log(
      '  - hasSectionInstructions:',
      hasSectionInstructions,
      '(',
      Object.keys(sectionInstructions),
      ')'
    );
    console.log(
      '  - hasMarkingScheme:',
      hasMarkingScheme,
      '(',
      Object.keys(markingScheme?.sectionWeighting || {}),
      ')'
    );

    // Return true if this appears to be a fresh exam (no existing wizard data)
    // A fresh exam should have empty instructions, empty footer, no section instructions, and empty marking scheme
    const isFresh =
      !hasInstructions &&
      !hasFooter &&
      !hasSectionInstructions &&
      !hasMarkingScheme;
    console.log('  - isFresh result:', isFresh);
    return isFresh;
  };

  // Load templates on component mount
  React.useEffect(() => {
    const loadTemplates = async () => {
      setIsLoadingTemplates(true);
      try {
        const response = await templateAPI.getTemplates();
        if (response.success) {
          // Add "(Default)" suffix to default template names
          const templatesWithLabels = response.templates.map(
            (template: any) => ({
              ...template,
              displayName: template.is_default
                ? `${template.name} (Default)`
                : template.name,
            })
          );
          setTemplates(templatesWithLabels);

          // Load default template if available and exam is fresh (no existing wizard data)
          const defaultTemplate = response.templates.find(
            (t: any) => t.is_default
          );
          console.log('🔍 Default template found:', defaultTemplate);
          console.log('🔍 isFreshExam():', isFreshExam());
          console.log('🔍 Templates loaded:', response.templates.length);

          if (defaultTemplate && isFreshExam()) {
            console.log(
              '🔍 Loading default template for fresh exam:',
              defaultTemplate.name
            );
            handleLoadTemplate(defaultTemplate.id);
          } else if (isFreshExam()) {
            // If no default template is available and this is a fresh exam, load default values
            console.log(
              '🔍 No default template available, loading default values for fresh exam'
            );
            loadDefaultValues();
          } else {
            console.log('🔍 Not a fresh exam or no default template found');
          }
        } else {
          toast.error(response.error || 'Failed to load templates');
          // Load default values if template loading fails
          if (isFreshExam()) {
            loadDefaultValues();
          }
        }
      } catch {
        toast.error('Failed to load templates');
        // Load default values if template loading fails
        if (isFreshExam()) {
          loadDefaultValues();
        }
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    loadTemplates();
  }, [sections.length]); // Re-run when sections change

  // Handle template loading
  const handleLoadTemplate = async (templateId: number) => {
    console.log('🔍 Loading template with ID:', templateId);
    try {
      const response = await templateAPI.loadTemplate(templateId);
      console.log('🔍 Template API response:', response);

      if (response.success && response.template) {
        const template = response.template;
        console.log('🔍 Template data:', template);
        console.log('🔍 Current sections:', sections);

        // Load template data into form
        // Convert instructions array back to formatted string
        const formattedInstructions = template.layout_data.instructions
          .map((instruction) => `• ${instruction}`)
          .join('\n\n');
        setExamInstructions(formattedInstructions);
        // Also update the instruction bullets state
        setInstructionBullets(template.layout_data.instructions);
        setFooter(template.layout_data.footer);
        setAcademicIntegrity(template.layout_data.academic_integrity.enabled);
        setCustomIntegrityStatement(
          template.layout_data.academic_integrity.text
        );

        // Load section instructions and titles
        const newSectionInstructions: { [key: number]: string } = {};
        console.log(
          `🔍 Template has ${template.layout_data.sections.length} sections, current exam has ${sections.length} sections`
        );

        if (sections.length === 0) {
          console.log(
            '🔍 Warning: Current exam has no sections, cannot load section-specific data from template'
          );
          // Don't show error toast, just log the warning
        } else {
          template.layout_data.sections.forEach((section, index) => {
            console.log(`🔍 Processing section ${index}:`, section);
            if (sections[index]) {
              newSectionInstructions[sections[index].id] = section.instructions;
              // Update section title if template has one
              if (section.title) {
                setSections((prev) => {
                  const updated = [...prev];
                  updated[index].title = section.title;
                  return updated;
                });
              }
            } else {
              console.log(
                `🔍 No matching section at index ${index} - template has more sections than current exam`
              );
            }
          });
        }

        // If template has fewer sections than current exam, that's okay - just load what we can
        console.log(`🔍 Setting section instructions:`, newSectionInstructions);
        setSectionInstructions(newSectionInstructions);

        // Load marking scheme if template has it
        if (template.layout_data.marking_scheme) {
          console.log(
            '🔍 Loading marking scheme from template:',
            template.layout_data.marking_scheme
          );

          // Map section weighting by section index instead of ID
          const templateMarkingScheme = template.layout_data.marking_scheme;
          const mappedSectionWeighting: { [sectionId: number]: number } = {};

          // Map section weighting from template sections to current sections by index
          template.layout_data.sections.forEach(
            (templateSection, templateIndex) => {
              if (sections[templateIndex]) {
                const currentSectionId = sections[templateIndex].id;
                const templateSectionWeight =
                  templateMarkingScheme.sectionWeighting[templateIndex] || 1;
                mappedSectionWeighting[currentSectionId] =
                  templateSectionWeight;
                console.log(
                  `🔍 Mapped section weighting: template index ${templateIndex} (${templateSection.title}) -> current section ID ${currentSectionId} = ${templateSectionWeight}`
                );
              }
            }
          );

          const mappedMarkingScheme = {
            ...templateMarkingScheme,
            sectionWeighting: mappedSectionWeighting,
          };

          console.log('🔍 Mapped marking scheme:', mappedMarkingScheme);
          safeSetMarkingScheme(mappedMarkingScheme);
        }

        toast.success('Template loaded successfully');
      } else {
        console.error('🔍 Template loading failed:', response.error);
        toast.error(response.error || 'Failed to load template');
        // Load default values if template loading fails
        if (isFreshExam()) {
          loadDefaultValues();
        }
      }
    } catch (error) {
      console.error('🔍 Template loading error:', error);
      toast.error('Failed to load template');
      // Load default values if template loading fails
      if (isFreshExam()) {
        loadDefaultValues();
      }
    }
  };

  // Handle template saving
  const handleSaveTemplate = async (name: string, overwrite: boolean) => {
    setIsSavingTemplate(true);
    try {
      // Prepare template data
      const templateData = {
        name,
        layout_data: {
          instructions: instructionBullets,
          footer,
          academic_integrity: {
            enabled: academicIntegrity,
            text: customIntegrityStatement,
          },
          sections: sections.map((section, index) => ({
            name: `Section ${String.fromCharCode(65 + index)}`,
            title: section.title,
            question_bank_id: section.question_banks?.[0]?.id || 0,
            instructions: sectionInstructions[section.id] || '',
            num_questions: section.question_count || 5,
          })),
          marking_scheme: {
            ...currentMarkingScheme,
            sectionWeighting: sections.reduce(
              (acc, section, index) => {
                acc[index] =
                  currentMarkingScheme.sectionWeighting[section.id] || 1;
                return acc;
              },
              {} as { [index: number]: number }
            ),
          },
        },
      };

      const response = await templateAPI.saveTemplate(templateData);
      if (response.success) {
        toast.success('Template saved successfully');
        // Refresh templates list
        const templatesResponse = await templateAPI.getTemplates();
        if (templatesResponse.success) {
          setTemplates(templatesResponse.templates);
        }
      } else {
        toast.error(response.error || 'Failed to save template');
      }
    } catch {
      toast.error('Failed to save template');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-xl font-semibold text-heading mb-2 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <AlignLeft className="text-purple-600" size={24} />
            </div>
            Layout & Instructions
          </h1>
          <p className="text-sm text-muted">Final touches before generation.</p>
        </div>

        {/* Template Controls - Moved to top right */}
        <div className="flex items-center gap-2">
          <select
            value={selectedTemplateId || ''}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedTemplateId(value ? Number(value) : null);
            }}
            className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 bg-white"
            disabled={isLoadingTemplates}
          >
            <option value="">Select a template...</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              console.log(
                '🔍 Load button clicked with selectedTemplateId:',
                selectedTemplateId
              );
              if (selectedTemplateId) {
                handleLoadTemplate(selectedTemplateId);
              }
            }}
            disabled={!selectedTemplateId || isLoadingTemplates}
            className="bg-blue-600 text-white px-3 py-2 text-sm rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            title="Load template"
          >
            <Download size={16} />
          </button>
          <button
            onClick={() => setShowSaveModal(true)}
            className="bg-primary-btn text-white px-3 py-2 text-sm rounded hover:bg-primary-btn/90 transition-colors flex items-center gap-2"
          >
            <Save size={16} />
            Save Template
          </button>
        </div>
      </div>

      {/* Marking Scheme Card - Enhanced */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
              <Calculator className="text-blue-600" size={16} />
            </div>
            <h3 className="text-sm font-semibold text-heading">
              Marking Scheme
            </h3>
          </div>
          <button
            onClick={() => toggleSection(-1)} // Use -1 as special ID for marking scheme
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title={
              expandedSections.has(-1)
                ? 'Collapse marking scheme'
                : 'Expand marking scheme'
            }
          >
            {expandedSections.has(-1) ? (
              <ChevronUp className="text-gray-600" size={16} />
            ) : (
              <ChevronDown className="text-gray-600" size={16} />
            )}
          </button>
        </div>

        {/* Horizontal Layout with 2 Columns */}
        {expandedSections.has(-1) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Side - Radio Buttons and Toggles */}
            <div className="space-y-6">
              {/* Multi-Correct Answer Policy */}
              <div>
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                  MULTI-CORRECT ANSWER POLICY
                </h4>
                <div className="space-y-3">
                  {[
                    {
                      value: 'all_or_nothing',
                      label: 'All or Nothing',
                      description:
                        'Must get all correct answers to earn points',
                      checked:
                        currentMarkingScheme.multiCorrectPolicy ===
                        'all_or_nothing',
                    },
                    {
                      value: 'partial_credit',
                      label: 'Partial Credit',
                      description:
                        'Earn points for each correct option selected',
                      checked:
                        currentMarkingScheme.multiCorrectPolicy ===
                        'partial_credit',
                    },
                    {
                      value: 'partial_with_penalty',
                      label: 'Partial with Penalty',
                      description:
                        'Partial credit minus penalty for incorrect selections',
                      checked:
                        currentMarkingScheme.multiCorrectPolicy ===
                        'partial_with_penalty',
                    },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex items-start gap-3 cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="radio"
                        name="multiCorrectPolicy"
                        value={option.value}
                        checked={option.checked}
                        onChange={(e) => {
                          safeSetMarkingScheme({
                            ...currentMarkingScheme,
                            multiCorrectPolicy: e.target.value as any,
                          });
                        }}
                        className="mt-0.5 accent-primary-btn"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-800">
                          {option.label}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {option.description}
                        </div>
                        {option.value === 'partial_with_penalty' &&
                          negativeMarking.enabled && (
                            <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
                              ⚠ Penalty Active
                            </div>
                          )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Negative Marking */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      NEGATIVE MARKING
                    </h4>
                    <div className="group relative">
                      <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center cursor-help">
                        <span className="text-xs font-bold text-gray-600">
                          ?
                        </span>
                      </div>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        Deducts points for incorrect answers. Often used to
                        discourage guessing.
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                  <ToggleSwitch
                    enabled={negativeMarking.enabled}
                    onToggle={() => {
                      safeSetMarkingScheme({
                        ...currentMarkingScheme,
                        negativeMarking: {
                          ...negativeMarking,
                          enabled: !negativeMarking.enabled,
                        },
                      });
                    }}
                  />
                </div>

                {negativeMarking.enabled && (
                  <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">
                        Penalty for wrong answers
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="50"
                          step="5"
                          value={negativeMarking.penalty * 100}
                          onChange={(e) => {
                            safeSetMarkingScheme({
                              ...currentMarkingScheme,
                              negativeMarking: {
                                ...negativeMarking,
                                penalty: Number(e.target.value) / 100,
                              },
                            });
                          }}
                          className={`flex-1 accent-primary-btn ${negativeMarking.penalty > 0.4 ? 'accent-red-500' : ''}`}
                        />
                        <span
                          className={`text-sm font-medium min-w-[3rem] ${negativeMarking.penalty > 0.4 ? 'text-red-600' : ''}`}
                        >
                          {Math.round(negativeMarking.penalty * 100)}%
                        </span>
                      </div>
                      {negativeMarking.penalty > 0.4 && (
                        <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          ⚠ High penalty may discourage participation
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">
                        Apply to
                      </label>
                      <select
                        value={negativeMarking.applyTo}
                        onChange={(e) => {
                          safeSetMarkingScheme({
                            ...currentMarkingScheme,
                            negativeMarking: {
                              ...negativeMarking,
                              applyTo: e.target.value as any,
                            },
                          });
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-primary-btn focus:ring-1 focus:ring-primary-btn"
                      >
                        <option value="all_questions">All Questions</option>
                        <option value="single_choice_only">
                          Single Choice Only
                        </option>
                        <option value="multi_choice_only">
                          Multiple Choice Only
                        </option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Section Weighting */}
            <div>
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                SECTION WEIGHTING
              </h4>
              <div className="space-y-3">
                {sections &&
                  sections.map((section, index) => (
                    <div
                      key={section.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center">
                          <Hash className="text-blue-600" size={12} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-800">
                            {section.title ||
                              `Section ${String.fromCharCode(65 + index)}`}
                          </div>
                          <div className="text-xs text-gray-500">
                            {sectionQuestionCounts[index] || 0} questions
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">×</span>
                        <input
                          type="number"
                          min="0.1"
                          max="5"
                          step="0.1"
                          value={sectionWeighting[section.id] || 1}
                          onChange={(e) => {
                            safeSetMarkingScheme({
                              ...currentMarkingScheme,
                              sectionWeighting: {
                                ...sectionWeighting,
                                [section.id]: Number(e.target.value),
                              },
                            });
                          }}
                          className="w-20 px-2 py-1 text-center border rounded text-sm focus:border-primary-btn focus:ring-1 focus:ring-primary-btn"
                        />
                      </div>
                    </div>
                  ))}
              </div>
              <div className="text-xs text-gray-500 mt-4 pt-3 border-t border-gray-200">
                Multipliers adjust section weight. 1.0 = normal weight. 2.0 =
                double the points.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2-Column Grid Layout - Independent Heights */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Exam-wide Instructions - Fixed Height */}
        <div className="bg-white/50 border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-heading mb-3 flex items-center gap-2">
            <AlignLeft className="text-primary-btn" size={18} />
            Exam-wide Instructions
          </h3>
          <p className="text-xs text-muted mb-5">
            These instructions will appear at the top of the exam document.
          </p>
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="space-y-3">
              {instructionBullets.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No instructions added yet</p>
                  <p className="text-xs mt-1">
                    Click "Add instruction" to get started
                  </p>
                </div>
              ) : (
                instructionBullets.map((bullet, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-gray-600 text-lg font-medium w-6 h-6 flex items-center justify-center">
                      •
                    </span>
                    <textarea
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:border-primary-btn focus:ring-1 focus:ring-primary-btn text-sm bg-white resize-none"
                      placeholder="Enter instruction..."
                      value={bullet}
                      onChange={(e) => updateBullet(index, e.target.value)}
                      rows={2}
                    />
                    <button
                      onClick={() => removeBullet(index)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      title="Remove instruction"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}

              <button
                onClick={addBullet}
                className="flex items-center gap-2 text-sm text-primary-btn hover:text-primary-btn/80 transition-colors px-2 py-1 rounded hover:bg-primary-btn/10"
              >
                <Plus className="w-4 h-4" />
                Add instruction
              </button>
            </div>
          </div>
        </div>

        {/* Sections - Allow Vertical Growth */}
        <div className="bg-white/50 border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-heading mb-3 flex items-center gap-2">
            <Grid3X3 className="text-primary-btn" size={18} />
            Sections
          </h3>

          <div className="space-y-2">
            {sections &&
              sections.map((section, index) => {
                const isExpanded = expandedSections.has(section.id);
                const questionCount = sectionQuestionCounts[index] || 5; // Use configured count from Step 2
                return (
                  <div
                    key={section.id}
                    className="bg-blue-50/50 border border-blue-200 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between p-3 hover:bg-blue-100/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Folder className="text-primary-btn" size={16} />
                          <span className="font-semibold text-heading">
                            {section.title ||
                              `Section ${String.fromCharCode(65 + index)}`}
                          </span>
                        </div>

                        {/* Question Count */}
                        <span className="px-2 py-0.5 bg-muted text-xs rounded-full font-medium flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          {questionCount} questions
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="text-primary-btn" size={16} />
                      ) : (
                        <ChevronDown className="text-primary-btn" size={16} />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="p-3 border-t border-blue-200 bg-white/50">
                        {/* Question Bank Info */}
                        {section.question_banks &&
                          section.question_banks.length > 0 && (
                            <div className="mb-4">
                              <label className="block text-xs font-medium text-muted mb-2 uppercase tracking-wide">
                                Question Banks
                              </label>
                              <div className="flex gap-1 flex-wrap">
                                {section.question_banks.map((bank: any) => (
                                  <span
                                    key={bank.id}
                                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium"
                                    title={bank.title}
                                  >
                                    {bank.title.length > 20
                                      ? `${bank.title.substring(0, 20)}...`
                                      : bank.title}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                        {/* Section Instructions */}
                        <div>
                          <label className="block text-xs font-medium text-muted mb-2 uppercase tracking-wide">
                            Section Instructions
                          </label>
                          <textarea
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-primary-btn focus:ring-1 focus:ring-primary-btn text-sm bg-white"
                            rows={3}
                            placeholder="Answer all questions in this section."
                            value={sectionInstructions[section.id] || ''}
                            onChange={(e) =>
                              updateSectionInstruction(
                                section.id,
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

            {(!sections || sections.length === 0) && (
              <div className="text-center py-6">
                <p className="text-muted">No sections configured yet.</p>
                <p className="text-sm text-muted">
                  Go back to Step 2 to add sections.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Small Fixed Height */}
        <div className="bg-white/50 border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-heading mb-3 flex items-center gap-2">
            <FooterIcon className="text-primary-btn" size={18} />
            Footer
          </h3>
          <div className="bg-muted/30 rounded-lg p-3">
            <label className="block text-sm text-muted-foreground mb-2">
              Text to appear at the bottom of each page
            </label>
            <textarea
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-primary-btn focus:ring-1 focus:ring-primary-btn text-base bg-white"
              rows={2}
              placeholder="Enter footer text..."
              value={footer}
              onChange={(e) => setFooter(e.target.value)}
            />
          </div>
        </div>

        {/* Academic Integrity Statement - Collapsed by Default */}
        <div className="bg-white/50 border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-semibold text-heading flex items-center gap-2">
              <Shield className="text-primary-btn" size={18} />
              Include Academic Integrity Statement
            </h3>
            <ToggleSwitch
              enabled={academicIntegrity}
              onToggle={() => setAcademicIntegrity(!academicIntegrity)}
            />
          </div>

          <div
            className={`bg-muted/30 rounded-lg p-3 transition-opacity ${
              !academicIntegrity ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            {academicIntegrity ? (
              <div>
                {/* Show default message in a styled box */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">
                    Academic Integrity Statement:
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {customIntegrityStatement ||
                      'No academic integrity statement configured. Please customize the statement above.'}
                  </p>
                </div>

                <button
                  onClick={() => setShowCustomIntegrity(!showCustomIntegrity)}
                  className="flex items-center gap-2 text-sm text-primary-btn hover:text-primary-btn/80 transition-colors px-2 py-1 rounded hover:bg-primary-btn/10"
                >
                  <Edit3 className="w-4 h-4" />
                  Customize statement
                </button>

                {showCustomIntegrity && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <label className="block text-xs font-medium text-muted mb-2 uppercase tracking-wide">
                      Custom Statement
                    </label>
                    <textarea
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-primary-btn focus:ring-1 focus:ring-primary-btn text-sm bg-white"
                      rows={3}
                      placeholder="Enter custom academic integrity statement..."
                      value={customIntegrityStatement}
                      onChange={(e) =>
                        setCustomIntegrityStatement(e.target.value)
                      }
                    />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted">
                Academic integrity statement will not be included
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Save Template Modal */}
      <SaveTemplateModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveTemplate}
        existingTemplates={templates}
        isLoading={isSavingTemplate}
      />
    </div>
  );
};
