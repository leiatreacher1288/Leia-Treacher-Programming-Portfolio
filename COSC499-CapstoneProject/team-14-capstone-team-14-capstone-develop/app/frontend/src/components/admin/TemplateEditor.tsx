import React, { useState, useEffect } from 'react';
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
  Calculator,
} from 'lucide-react';
import { ToggleSwitch } from '../ui/ToggleSwitch';
import { type TemplateFormData } from '../../utils/templateHelpers';

interface MarkingScheme {
  multiCorrectPolicy:
    | 'all_or_nothing'
    | 'partial_credit'
    | 'partial_with_penalty';
  negativeMarking: {
    enabled: boolean;
    penalty: number;
    applyTo: 'all_questions' | 'single_choice_only' | 'multi_choice_only';
  };
  sectionWeighting: {
    [sectionId: number]: number;
  };
}

interface Section {
  id: number;
  title: string;
  instructions: string;
}

interface TemplateEditorProps {
  template: TemplateFormData;
  onChange: (data: TemplateFormData) => void;
  onSectionsChange?: (sections: Section[]) => void;
  sections?: Array<{ id: number; title: string; question_count: number }>;
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  onChange,
  onSectionsChange,
  sections = [],
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set([-1]) // Marking scheme expanded by default
  );
  const [showCustomIntegrity, setShowCustomIntegrity] = useState(false);

  // Section management state
  const [templateSections, setTemplateSections] = useState<Section[]>(() => {
    // Initialize from sections prop if available
    if (sections && sections.length > 0) {
      return sections.map((section, index) => ({
        id: section.id,
        title: section.title || `Section ${String.fromCharCode(65 + index)}`,
        instructions: template.section_instructions[section.id] || '',
      }));
    }
    return [];
  });

  const defaultIntegrityStatement =
    'I confirm that I will not give or receive unauthorized aid on this examination. I understand that academic dishonesty includes, but is not limited to, cheating, plagiarism, and the unauthorized use of materials or devices.';

  const updateTemplate = (updates: Partial<TemplateFormData>) => {
    onChange({ ...template, ...updates });
  };

  const toggleSection = (sectionId: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const addInstruction = () => {
    updateTemplate({
      layout_instructions: [...template.layout_instructions, ''],
    });
  };

  const updateInstruction = (index: number, value: string) => {
    const newInstructions = [...template.layout_instructions];
    newInstructions[index] = value;
    updateTemplate({ layout_instructions: newInstructions });
  };

  const removeInstruction = (index: number) => {
    updateTemplate({
      layout_instructions: template.layout_instructions.filter(
        (_, i) => i !== index
      ),
    });
  };

  const updateSectionInstruction = (sectionId: number, instruction: string) => {
    updateTemplate({
      section_instructions: {
        ...template.section_instructions,
        [sectionId]: instruction,
      },
    });
  };

  const updateMarkingScheme = (updates: Partial<MarkingScheme>) => {
    updateTemplate({
      marking_scheme: { ...template.marking_scheme, ...updates },
    });
  };

  // Section management functions
  const addSection = () => {
    const newSection: Section = {
      id: Date.now(), // Use timestamp as temporary ID
      title: `Section ${String.fromCharCode(65 + templateSections.length)}`,
      instructions: '',
    };
    const updatedSections = [...templateSections, newSection];
    setTemplateSections(updatedSections);

    // Update template with new section
    const newSectionInstructions = { ...template.section_instructions };
    newSectionInstructions[newSection.id] = '';

    // Update marking scheme section weighting
    const newSectionWeighting = { ...template.marking_scheme.sectionWeighting };
    newSectionWeighting[newSection.id] = 1; // Default weight of 1

    updateTemplate({
      section_instructions: newSectionInstructions,
      marking_scheme: {
        ...template.marking_scheme,
        sectionWeighting: newSectionWeighting,
      },
    });

    // Notify parent component
    onSectionsChange?.(updatedSections);
  };

  const updateSectionTitle = (sectionId: number, title: string) => {
    const updatedSections = templateSections.map((section) =>
      section.id === sectionId ? { ...section, title } : section
    );
    setTemplateSections(updatedSections);
    onSectionsChange?.(updatedSections);
  };

  const updateSectionInstructions = (
    sectionId: number,
    instructions: string
  ) => {
    const updatedSections = templateSections.map((section) =>
      section.id === sectionId ? { ...section, instructions } : section
    );
    setTemplateSections(updatedSections);

    updateTemplate({
      section_instructions: {
        ...template.section_instructions,
        [sectionId]: instructions,
      },
    });

    onSectionsChange?.(updatedSections);
  };

  const removeSection = (sectionId: number) => {
    const updatedSections = templateSections.filter(
      (section) => section.id !== sectionId
    );
    setTemplateSections(updatedSections);

    const newSectionInstructions = { ...template.section_instructions };
    delete newSectionInstructions[sectionId];

    // Remove section from marking scheme weighting
    const newSectionWeighting = { ...template.marking_scheme.sectionWeighting };
    delete newSectionWeighting[sectionId];

    updateTemplate({
      section_instructions: newSectionInstructions,
      marking_scheme: {
        ...template.marking_scheme,
        sectionWeighting: newSectionWeighting,
      },
    });

    onSectionsChange?.(updatedSections);
  };

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      {/* Basic Info */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Template Name
        </label>
        <input
          type="text"
          value={template.name}
          onChange={(e) => updateTemplate({ name: e.target.value })}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter template name"
        />
      </div>

      {/* Marking Scheme */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
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
            onClick={() => toggleSection(-1)}
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
                        template.marking_scheme.multiCorrectPolicy ===
                        'all_or_nothing',
                    },
                    {
                      value: 'partial_credit',
                      label: 'Partial Credit',
                      description:
                        'Earn points for each correct option selected',
                      checked:
                        template.marking_scheme.multiCorrectPolicy ===
                        'partial_credit',
                    },
                    {
                      value: 'partial_with_penalty',
                      label: 'Partial with Penalty',
                      description:
                        'Partial credit minus penalty for incorrect selections',
                      checked:
                        template.marking_scheme.multiCorrectPolicy ===
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
                          updateTemplate({
                            marking_scheme: {
                              ...template.marking_scheme,
                              multiCorrectPolicy: e.target.value as any,
                            },
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
                  </div>
                  <ToggleSwitch
                    enabled={template.marking_scheme.negativeMarking.enabled}
                    onToggle={() => {
                      updateTemplate({
                        marking_scheme: {
                          ...template.marking_scheme,
                          negativeMarking: {
                            ...template.marking_scheme.negativeMarking,
                            enabled:
                              !template.marking_scheme.negativeMarking.enabled,
                          },
                        },
                      });
                    }}
                  />
                </div>

                {template.marking_scheme.negativeMarking.enabled && (
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
                          value={
                            template.marking_scheme.negativeMarking.penalty *
                            100
                          }
                          onChange={(e) => {
                            updateTemplate({
                              marking_scheme: {
                                ...template.marking_scheme,
                                negativeMarking: {
                                  ...template.marking_scheme.negativeMarking,
                                  penalty: Number(e.target.value) / 100,
                                },
                              },
                            });
                          }}
                          className="flex-1 accent-primary-btn"
                        />
                        <span className="text-sm font-medium min-w-[3rem]">
                          {Math.round(
                            template.marking_scheme.negativeMarking.penalty *
                              100
                          )}
                          %
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">
                        Apply to
                      </label>
                      <select
                        value={template.marking_scheme.negativeMarking.applyTo}
                        onChange={(e) => {
                          updateTemplate({
                            marking_scheme: {
                              ...template.marking_scheme,
                              negativeMarking: {
                                ...template.marking_scheme.negativeMarking,
                                applyTo: e.target.value as any,
                              },
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
                {templateSections.map((section, index) => (
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
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">×</span>
                      <input
                        type="number"
                        min="0.1"
                        max="5"
                        step="0.1"
                        value={
                          template.marking_scheme.sectionWeighting[
                            section.id
                          ] || 1
                        }
                        onChange={(e) => {
                          updateTemplate({
                            marking_scheme: {
                              ...template.marking_scheme,
                              sectionWeighting: {
                                ...template.marking_scheme.sectionWeighting,
                                [section.id]: Number(e.target.value),
                              },
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

      {/* Sections */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-green-100 flex items-center justify-center">
              <Grid3X3 className="text-green-600" size={16} />
            </div>
            <h3 className="text-sm font-semibold text-heading">Sections</h3>
          </div>
        </div>

        <div className="space-y-4">
          {/* Add Section Button */}
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-semibold text-gray-700">
              Template Sections
            </h4>
            <button
              onClick={addSection}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors px-3 py-2 rounded-lg hover:bg-blue-50 border border-blue-200"
            >
              <Plus className="w-4 h-4" />
              Add Section
            </button>
          </div>

          {/* Template Sections */}
          {templateSections.map((section, index) => {
            const isExpanded = expandedSections.has(section.id);
            return (
              <div
                key={section.id}
                className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden"
              >
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded transition-colors flex-1"
                    >
                      <Folder className="text-blue-600" size={16} />
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) =>
                          updateSectionTitle(section.id, e.target.value)
                        }
                        className="font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 flex-1"
                        placeholder="Section title..."
                      />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => removeSection(section.id)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      title="Remove section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="text-gray-600" size={16} />
                    ) : (
                      <ChevronDown className="text-gray-600" size={16} />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-3 border-t border-gray-200 bg-white">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                        Section Instructions
                      </label>
                      <textarea
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm bg-white"
                        rows={3}
                        placeholder="Answer all questions in this section."
                        value={section.instructions}
                        onChange={(e) =>
                          updateSectionInstructions(section.id, e.target.value)
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {templateSections.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Folder className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No sections added yet</p>
              <p className="text-xs mt-1">
                Click "Add Section" to create template sections
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Exam-wide Instructions */}
        <div className="bg-white/50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlignLeft className="text-blue-600" size={18} />
            Exam-wide Instructions
          </h3>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="space-y-3">
              {template.layout_instructions.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No instructions added yet</p>
                  <p className="text-xs mt-1">
                    Click "Add instruction" to get started
                  </p>
                </div>
              ) : (
                template.layout_instructions.map((instruction, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-gray-600 text-lg font-medium w-6 h-6 flex items-center justify-center">
                      •
                    </span>
                    <textarea
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm bg-white resize-none"
                      placeholder="Enter instruction..."
                      value={instruction}
                      onChange={(e) => updateInstruction(index, e.target.value)}
                      rows={2}
                    />
                    <button
                      onClick={() => removeInstruction(index)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      title="Remove instruction"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}

              <button
                onClick={addInstruction}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors px-2 py-1 rounded hover:bg-blue-50"
              >
                <Plus className="w-4 h-4" />
                Add instruction
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white/50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FooterIcon className="text-blue-600" size={18} />
            Footer
          </h3>
          <div className="bg-gray-50 rounded-lg p-3">
            <label className="block text-sm text-gray-600 mb-2">
              Text to appear at the bottom of each page
            </label>
            <textarea
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-base bg-white"
              rows={2}
              placeholder="Faculty of Computer Science - UBCO"
              value={template.footer_text}
              onChange={(e) => updateTemplate({ footer_text: e.target.value })}
            />
          </div>
        </div>

        {/* Academic Integrity Statement */}
        <div className="bg-white/50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="text-blue-600" size={18} />
              Include Academic Integrity Statement
            </h3>
            <ToggleSwitch
              enabled={template.academic_integrity_statement !== ''}
              onToggle={() => {
                if (template.academic_integrity_statement === '') {
                  updateTemplate({
                    academic_integrity_statement: defaultIntegrityStatement,
                  });
                } else {
                  updateTemplate({ academic_integrity_statement: '' });
                }
              }}
            />
          </div>

          <div
            className={`bg-gray-50 rounded-lg p-3 transition-opacity ${
              template.academic_integrity_statement === ''
                ? 'opacity-50 pointer-events-none'
                : ''
            }`}
          >
            {template.academic_integrity_statement ? (
              <div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">
                    Academic Integrity Statement:
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {template.academic_integrity_statement}
                  </p>
                </div>

                <button
                  onClick={() => setShowCustomIntegrity(!showCustomIntegrity)}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors px-2 py-1 rounded hover:bg-blue-50"
                >
                  <Edit3 className="w-4 h-4" />
                  Customize statement
                </button>

                {showCustomIntegrity && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                      Custom Statement
                    </label>
                    <textarea
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm bg-white"
                      rows={3}
                      placeholder="Enter custom academic integrity statement..."
                      value={template.academic_integrity_statement}
                      onChange={(e) =>
                        updateTemplate({
                          academic_integrity_statement: e.target.value,
                        })
                      }
                    />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Academic integrity statement will not be included
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Default Template Checkbox */}
      <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
        <input
          type="checkbox"
          id="is_default"
          checked={template.is_default}
          onChange={(e) => updateTemplate({ is_default: e.target.checked })}
          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label
          htmlFor="is_default"
          className="text-sm font-medium text-gray-700"
        >
          Set as default template
        </label>
      </div>
    </div>
  );
};
