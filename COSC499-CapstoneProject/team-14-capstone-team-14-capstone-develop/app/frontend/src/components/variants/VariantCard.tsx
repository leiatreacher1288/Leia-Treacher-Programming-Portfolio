import {
  Edit,
  Download,
  Lock,
  Unlock,
  FileText,
  Key,
  FileSpreadsheet,
  FileDown,
  Eye,
} from 'lucide-react';
import { useState } from 'react';
import { StandardButton } from '../ui/StandardButton';
import type { Variant } from '../../api/examAPI';
import { examAPI } from '../../api/examAPI';

// Preview Modal Component
interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportType: 'exam' | 'answerKey';
  format: string;
  variant: Variant;
  examTitle: string;
}

const PreviewModal = ({
  isOpen,
  onClose,
  exportType,
  format,
  variant,
  examTitle,
}: PreviewModalProps) => {
  if (!isOpen) return null;

  const renderExamPreview = () => {
    if (format === 'csv') {
      return (
        <div className="font-mono text-xs bg-gray-100 p-4 rounded overflow-x-auto">
          <div className="text-gray-600 mb-2 font-bold">
            Variant,Question Number,Question Text,Choice A,Choice B,Choice
            C,Choice D,Choice E,Points
          </div>
          {variant.questions.map((q, idx) => (
            <div key={idx} className="whitespace-nowrap mb-1">
              {variant.version_label},{idx + 1},"{q.question.prompt}","
              {q.question.choices?.A || ''}","{q.question.choices?.B || ''}","
              {q.question.choices?.C || ''}
              ","{q.question.choices?.D || ''}","{q.question.choices?.E || ''}",
              {q.question.points}
            </div>
          ))}
        </div>
      );
    }

    // PDF/DOCX preview
    return (
      <div className="bg-white p-8 text-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {examTitle} — Variant {variant.version_label}
        </h1>
        {variant.questions.map((q, idx) => (
          <div key={idx} className="mb-6">
            <p className="font-semibold mb-2">
              {idx + 1}. {q.question.prompt}
            </p>
            {q.question.choices &&
              Object.entries(q.question.choices).map(([key, value]) => (
                <p key={key} className="ml-6 mb-1">
                  {key}. {value}
                </p>
              ))}
          </div>
        ))}
      </div>
    );
  };

  const renderAnswerKeyPreview = () => {
    if (format === 'csv') {
      return (
        <div className="font-mono text-xs bg-gray-100 p-4 rounded">
          <div className="text-gray-600 mb-2 font-bold">
            Variant {variant.version_label}
          </div>
          <div className="text-gray-600 mb-2 font-bold">Question,Answer</div>
          {variant.questions.map((q, idx) => (
            <div key={idx}>
              {idx + 1},
              {Array.isArray(q.question.correct_answer)
                ? q.question.correct_answer.join(', ')
                : q.question.correct_answer}
            </div>
          ))}
        </div>
      );
    }

    // PDF/DOCX preview
    return (
      <div className="bg-white p-8 text-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {examTitle} - Variant {variant.version_label} Answer Key
        </h1>
        <div className="max-w-md mx-auto">
          {variant.questions.map((q, idx) => (
            <p key={idx} className="mb-2 text-lg">
              {idx + 1}.{' '}
              {Array.isArray(q.question.correct_answer)
                ? q.question.correct_answer.join(', ')
                : q.question.correct_answer}
            </p>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />

      {/* Modal - Made smaller */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[80vh] bg-white rounded-xl shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">
            Preview: {examTitle}{' '}
            {exportType === 'answerKey' ? 'Answer Key' : 'Exam'} (
            {format.toUpperCase()})
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {exportType === 'exam'
            ? renderExamPreview()
            : renderAnswerKeyPreview()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end">
          <StandardButton onClick={onClose} color="primary-btn">
            Close Preview
          </StandardButton>
        </div>
      </div>
    </>
  );
};

// Export Format Modal Component
interface ExportFormatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (type: 'exam' | 'answerKey', format: string) => void;
  variant: Variant;
  examTitle: string;
  isExporting: boolean;
}

const ExportFormatModal = ({
  isOpen,
  onClose,
  onExport,
  variant,
  examTitle,
  isExporting,
}: ExportFormatModalProps) => {
  const [exportType, setExportType] = useState<'exam' | 'answerKey'>('exam');
  const [selectedFormat, setSelectedFormat] = useState<string>('pdf');
  const [showPreview, setShowPreview] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    if (selectedFormat) {
      onExport(exportType, selectedFormat);
    }
  };

  // Get format icon
  const getFormatIcon = () => {
    switch (selectedFormat) {
      case 'csv':
        return <FileSpreadsheet size={16} className="text-gray-600" />;
      case 'docx':
        return <FileText size={16} className="text-gray-600" />;
      case 'pdf':
      default:
        return <FileDown size={16} className="text-gray-600" />;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-lg z-40 w-full max-w-md mx-4 border border-input-border">
        <div className="p-6">
          <h2 className="text-xl font-bold text-heading mb-4">
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
                onChange={(e) =>
                  setExportType(e.target.value as 'exam' | 'answerKey')
                }
                className="w-full px-4 py-3 border border-input-border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-btn focus:border-primary-btn"
              >
                <option value="exam">Full Exam</option>
                <option value="answerKey">Answer Key Only</option>
              </select>
            </div>

            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Format
              </label>
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="w-full px-4 py-3 border border-input-border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-btn focus:border-primary-btn"
              >
                <option value="pdf">PDF</option>
                <option value="docx">Word Document (DOCX)</option>
                <option value="csv">CSV Spreadsheet</option>
              </select>
            </div>

            {/* File Info with Preview Button - Changed background to yellow */}
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getFormatIcon()}
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">
                      {examTitle}_Variant_{variant.version_label}
                      {exportType === 'answerKey' ? '_AnswerKey' : ''}.
                      {selectedFormat}
                    </p>
                    <p className="text-gray-600">
                      {exportType === 'answerKey'
                        ? 'Answer key with correct answers only'
                        : `Full exam with all ${variant.questions.length} questions`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPreview(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-all duration-200"
                >
                  <Eye size={16} />
                  Preview
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-1">
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

      {/* Preview Modal */}
      <PreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        exportType={exportType}
        format={selectedFormat}
        variant={variant}
        examTitle={examTitle}
      />
    </>
  );
};

// Helper function
function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

// Main Component
interface VariantCardProps {
  variant: Variant;
  onEdit: () => void;
  examId?: number;
}

export const VariantCard = ({ variant, onEdit, examId }: VariantCardProps) => {
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const effectiveExamId =
    examId || (variant as any).exam || (variant as any).exam_id;
  const examTitle = (variant as any).exam_title || 'Exam';

  // Unified export handler
  const handleExport = async (type: 'exam' | 'answerKey', format: string) => {
    setIsExporting(true);
    try {
      let blob: Blob;
      let filename: string;

      if (type === 'answerKey') {
        // Answer key exports
        if (format === 'csv') {
          blob = await examAPI.exportAnswerKey(effectiveExamId, [variant.id]);
          filename = `${examTitle}_Variant_${variant.version_label}_AnswerKey.csv`;
        } else {
          // For PDF and DOCX answer keys
          if (format === 'pdf') {
            blob = await examAPI.exportAnswerKeyPDF(
              effectiveExamId,
              variant.id
            );
            filename = `${examTitle}_Variant_${variant.version_label}_AnswerKey.pdf`;
          } else {
            blob = await examAPI.exportAnswerKeyDOCX(
              effectiveExamId,
              variant.id
            );
            filename = `${examTitle}_Variant_${variant.version_label}_AnswerKey.docx`;
          }
        }
      } else {
        // Full exam exports
        if (format === 'csv') {
          blob = await examAPI.exportVariantCSV(effectiveExamId, variant.id);
          filename = `${examTitle}_Variant_${variant.version_label}.csv`;
        } else {
          blob = await examAPI.exportVariantFile(
            effectiveExamId,
            variant.id,
            format as 'docx' | 'pdf'
          );
          filename = `${examTitle}_Variant_${variant.version_label}.${format}`;
        }
      }

      downloadBlob(blob, filename);
      setShowFormatModal(false);
    } catch (err) {
      alert('Export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <div className="bg-card rounded-lg border p-6 min-h-[210px] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">
              Exam Version: {variant.version_label}
            </h3>
            {variant.is_locked ? (
              <Lock className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Unlock className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {variant.questions.length} questions
          </div>
        </div>

        <div className="mt-auto">
          <div className="text-sm text-muted-foreground mb-3">
            Created: {new Date(variant.created_at).toLocaleDateString()}
          </div>

          <div className="flex gap-2">
            <StandardButton
              onClick={onEdit}
              color="primary-btn"
              className="flex-1 flex items-center justify-center py-2 text-m h-14"
              icon={<Edit size={14} />}
            >
              Edit
            </StandardButton>

            <StandardButton
              onClick={() => setShowFormatModal(true)}
              color="primary-btn"
              className="flex-1 flex items-center justify-center py-2 text-m h-14"
              icon={<Download size={14} />}
              disabled={isExporting}
            >
              Export
            </StandardButton>
          </div>
        </div>
      </div>

      <ExportFormatModal
        isOpen={showFormatModal}
        onClose={() => setShowFormatModal(false)}
        onExport={handleExport}
        variant={variant}
        examTitle={examTitle}
        isExporting={isExporting}
      />
    </>
  );
};
