import React, { useState } from 'react';
import {
  RefreshCw,
  Edit,
  Download,
  Lock,
  Unlock,
  Layers,
  MoreVertical,
  Trash2,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';
import type { ExamDetail, Variant } from '../../api/examAPI';
import { VariantEditModal } from '../variants/VariantEditModal';
import { StandardButton } from '../ui/StandardButton';
import { examAPI } from '../../api/examAPI';

interface VariantGridCardProps {
  exam: ExamDetail;
  variants: Variant[];
  isGenerating: boolean;
  onGenerateVariants: () => Promise<void>;
  onVariantEdit?: () => void;
}

// Export Modal Component
interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  variant: Variant;
  examTitle: string;
  examId: number;
}

const ExportModal = ({
  isOpen,
  onClose,
  variant,
  examTitle,
  examId,
}: ExportModalProps) => {
  const [exportType, setExportType] = useState<'exam' | 'answerKey'>('exam');
  const [format, setFormat] = useState<'pdf' | 'docx'>('pdf');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      let blob: Blob;
      let filename: string;

      if (exportType === 'answerKey') {
        // Use exportVariantFile with answer_key format for single variant
        blob = await examAPI.exportVariantFile(
          examId,
          variant.id,
          'answer_key'
        );
        filename = `${examTitle}_Variant_${variant.version_label}_AnswerKey.csv`;
      } else {
        // For exam export, use exportVariantFile for PDF and DOCX
        blob = await examAPI.exportVariantFile(examId, variant.id, format);
        filename = `${examTitle}_Variant_${variant.version_label}.${format}`;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-lg z-50 w-full max-w-md mx-4 border border-gray-200">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Export Variant {variant.version_label}
          </h2>

          <div className="space-y-4">
            {/* Export Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What to Export
              </label>
              <select
                value={exportType}
                onChange={(e) => {
                  setExportType(e.target.value as 'exam' | 'answerKey');
                  // Reset format to PDF when switching
                  setFormat('pdf');
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="exam">Full Exam</option>
                <option value="answerKey">Answer Key</option>
              </select>
            </div>

            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Format
              </label>
              {exportType === 'answerKey' ? (
                // For answer key, show CSV only
                <div className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>CSV Spreadsheet</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Answer Key Format
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Answer keys are only available in CSV format
                  </p>
                </div>
              ) : (
                // For exam export, show PDF and DOCX only
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as 'pdf' | 'docx')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pdf">PDF</option>
                  <option value="docx">Word Document (DOCX)</option>
                </select>
              )}
            </div>

            {/* File Info */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm">
                <p className="font-medium text-gray-900">
                  {examTitle}_Variant_{variant.version_label}_
                  {exportType === 'answerKey' ? 'AnswerKey.csv' : `${format}`}
                </p>
                <p className="text-gray-600">
                  {variant.questions.length} questions in{' '}
                  {exportType === 'answerKey' ? 'CSV' : format.toUpperCase()}{' '}
                  format
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <StandardButton
              onClick={onClose}
              disabled={isExporting}
              color="danger-btn"
            >
              Cancel
            </StandardButton>
            <StandardButton
              onClick={handleExport}
              disabled={isExporting}
              color="primary-btn"
              icon={<Download size={16} />}
            >
              {isExporting ? 'Exporting...' : 'Export'}
            </StandardButton>
          </div>
        </div>
      </div>
    </>
  );
};

export const VariantGridCard: React.FC<VariantGridCardProps> = ({
  exam,
  variants,
  isGenerating,
  onGenerateVariants,
  onVariantEdit,
}) => {
  const [showVariantEditModal, setShowVariantEditModal] = useState(false);
  const [editingVariant, setEditingVariant] = useState<any>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportingVariant, setExportingVariant] = useState<Variant | null>(
    null
  );

  const variantCount = variants.length;
  const hasVariants = variantCount > 0;

  const handleEditVariant = (variant: Variant) => {
    const transformed = {
      id: variant.id,
      version_label: variant.version_label,
      is_locked: variant.is_locked,
      questions: (variant.questions || []).map((q, index) => ({
        id: index,
        question: q.question,
        order: index,
        randomized_choices: q.question.choices,
        randomized_correct_answer: q.question.correct_answer,
      })),
    };
    setEditingVariant(transformed);
    setShowVariantEditModal(true);
  };

  const handleExportVariant = (variant: Variant) => {
    setExportingVariant(variant);
    setShowExportModal(true);
  };

  return (
    <>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Layers className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                Generated Variants
              </h3>
              <p className="text-sm text-gray-600">
                Review, edit, and export your generated variants
              </p>
            </div>
          </div>
          <StandardButton
            onClick={onGenerateVariants}
            disabled={isGenerating}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <RefreshCw
              className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`}
            />
            {hasVariants ? 'Regenerate' : 'Generate Variants'}
          </StandardButton>
        </div>

        {variantCount === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No variants generated yet</p>
            <StandardButton
              onClick={onGenerateVariants}
              disabled={isGenerating}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Generate First Variant
            </StandardButton>
          </div>
        ) : (
          <>
            {/* Variants Legend */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center mt-0.5">
                  <Layers className="text-blue-600" size={12} />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-1">
                    Variant Management
                  </h4>
                  <p className="text-xs text-blue-700">
                    Variants are locked once used in an exam to preserve
                    results. Locked variants cannot be edited but can still be
                    exported.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-1">
              {variants.map((variant) => (
                <div
                  key={variant.id}
                  className="border border-gray-200 rounded-xl shadow-sm p-4 flex flex-col justify-between relative hover:shadow-md transition-shadow bg-white"
                >
                  {/* Header with Lock Status and Kebab Menu */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg text-gray-900">
                        Variant {variant.version_label}
                      </h3>
                      {variant.is_locked && (
                        <div
                          className="flex items-center gap-1"
                          title="Variant is locked"
                        >
                          <Lock className="w-4 h-4 text-orange-600" />
                          <span className="text-xs text-orange-600 font-medium">
                            Locked
                          </span>
                        </div>
                      )}
                      {/* TODO: Add hasResults prop when available */}
                      {false && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          <FileSpreadsheet className="w-3 h-3" />
                          Results Uploaded
                        </div>
                      )}
                    </div>

                    {/* Kebab Menu */}
                    <div className="relative">
                      <button
                        onClick={() => {
                          // TODO: Implement kebab menu state
                          console.log('Kebab menu for variant:', variant.id);
                        }}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="More options"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  {/* Question Count and Creation Date */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-500">
                      {variant.questions?.length || 0} questions
                    </div>
                    <div className="text-xs text-gray-400">
                      Created:{' '}
                      {new Date(
                        variant.created_at || Date.now()
                      ).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Main Action Buttons */}
                  <div className="flex gap-2 w-full">
                    {!variant.is_locked && (
                      <button
                        onClick={() => handleEditVariant(variant)}
                        className="flex-1 min-w-0 flex items-center justify-center gap-1 text-sm text-blue-600 border border-blue-200 hover:bg-blue-50 px-3 py-1 rounded-md"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => handleExportVariant(variant)}
                      className="flex-1 min-w-0 flex items-center justify-center gap-1 text-sm text-green-600 border border-green-200 hover:bg-green-50 px-3 py-1 rounded-md"
                    >
                      <Download className="w-3 h-3" />
                      Export
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Variant Edit Modal */}
      {showVariantEditModal && editingVariant && (
        <VariantEditModal
          isOpen={showVariantEditModal}
          onClose={() => {
            setShowVariantEditModal(false);
            setEditingVariant(null);
          }}
          variant={editingVariant}
          onSave={async () => {
            // Don't reload the page - let the parent handle data refresh
            // The changes are already saved to the backend by VariantEditModal
            console.log('Variant edit completed - changes saved to backend');
            onVariantEdit?.();
          }}
          onExport={() => {
            setExportingVariant(editingVariant);
            setShowExportModal(true);
          }}
        />
      )}

      {/* Export Modal */}
      {showExportModal && exportingVariant && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => {
            setShowExportModal(false);
            setExportingVariant(null);
          }}
          variant={exportingVariant}
          examTitle={exam.title}
          examId={exam.id}
        />
      )}
    </>
  );
};
