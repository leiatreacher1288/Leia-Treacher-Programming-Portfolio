import { type ExamTemplate } from '../api/templateAPI';

export interface TemplateFormData {
  name: string;
  layout_instructions: string[];
  footer_text: string;
  academic_integrity_statement: string;
  marking_scheme: {
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
  };
  section_instructions: Record<string, string>;
  is_default: boolean;
}

export const defaultMarkingScheme = {
  multiCorrectPolicy: 'partial_credit' as const,
  negativeMarking: {
    enabled: false,
    penalty: 0.25,
    applyTo: 'all_questions' as const,
  },
  sectionWeighting: {},
};

export const defaultTemplateFormData: TemplateFormData = {
  name: '',
  layout_instructions: [
    'No notes or devices allowed. One 8.5 x 11 inch handwritten sheet is permitted.',
    'Please read all questions carefully before answering.',
    'Use a dark pen or pencil to fill in your answers.',
  ],
  footer_text: '',
  academic_integrity_statement: '',
  marking_scheme: defaultMarkingScheme,
  section_instructions: {},
  is_default: false,
};

export const convertTemplateToFormData = (template: any): TemplateFormData => {
  const layoutData = template.layout_data || {};

  return {
    name: template.name || '',
    layout_instructions:
      layoutData.instructions || defaultTemplateFormData.layout_instructions,
    footer_text: layoutData.footer || '',
    academic_integrity_statement: layoutData.academic_integrity?.text || '',
    marking_scheme: layoutData.marking_scheme || defaultMarkingScheme,
    section_instructions:
      layoutData.sections?.reduce(
        (acc: Record<string, string>, section: any, index: number) => {
          acc[index] = section.instructions || '';
          return acc;
        },
        {} as Record<string, string>
      ) || {},
    is_default: template.is_default || false,
  };
};

export const convertFormDataToTemplate = (
  formData: TemplateFormData,
  originalTemplate?: any,
  templateSections?: any[]
): any => {
  // Create sections from template sections if provided, otherwise use original sections
  let sections = [];

  if (templateSections && templateSections.length > 0) {
    // Use template sections (admin-created sections)
    sections = templateSections.map((section, index) => ({
      name: `Section ${String.fromCharCode(65 + index)}`,
      title: section.title,
      instructions: section.instructions,
      num_questions: 5, // Default question count for template sections
    }));
  } else {
    // Use original sections if available
    const originalSections = originalTemplate?.layout_data?.sections || [];
    sections = originalSections.map((section: any, index: number) => ({
      ...section,
      instructions:
        formData.section_instructions[index] || section.instructions || '',
    }));
  }

  return {
    name: formData.name,
    layout_data: {
      instructions: formData.layout_instructions,
      footer: formData.footer_text,
      academic_integrity: {
        enabled: formData.academic_integrity_statement !== '',
        text: formData.academic_integrity_statement,
      },
      sections: sections,
      marking_scheme: formData.marking_scheme,
    },
    is_default: formData.is_default,
  };
};
