import { useState } from 'react';
import { Download } from 'lucide-react';
import { StandardButton } from '../ui/StandardButton';
import { examAPI } from '../../api/examAPI';
import type { Variant } from '../../api/examAPI';

interface ExportIndividualVariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  variant: Variant;
  examTitle: string;
  examId: number;
}

export const ExportIndividualVariantModal = ({
  isOpen,
  onClose,
  variant,
  examTitle,
  examId,
}: ExportIndividualVariantModalProps) => {
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

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-lg z-50 w-full max-w-md mx-4">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Download className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold">
              Export Variant {variant.version_label}
            </h3>
          </div>

          <div className="space-y-6">
            {/* Export Type Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Type
              </label>
              <select
                value={exportType}
                onChange={(e) =>
                  setExportType(e.target.value as 'exam' | 'answerKey')
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm"
              >
                <option value="exam">Full Exam Paper</option>
                <option value="answerKey">Answer Key</option>
              </select>
            </div>

            {/* Format Dropdown (only for exam export) */}
            {exportType === 'exam' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as 'pdf' | 'docx')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm"
                >
                  <option value="pdf">PDF</option>
                  <option value="docx">DOCX</option>
                </select>
              </div>
            )}

            {/* Answer Key Format Info (when answer key is selected) */}
            {exportType === 'answerKey' && (
              <div className="p-3 bg-gray-50 rounded-md">
                <div className="text-sm text-gray-600">
                  <strong>Format:</strong> CSV (fixed format)
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Answer keys are always exported as CSV files
                </div>
              </div>
            )}

            {/* Question count info */}
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
              <strong>
                {variant.question_count || variant.questions?.length || 0}{' '}
                questions
              </strong>{' '}
              will be exported
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <StandardButton onClick={onClose} color="secondary-btn" size="sm">
              Cancel
            </StandardButton>
            <StandardButton
              onClick={handleExport}
              color="primary-btn"
              size="sm"
              icon={<Download size={16} />}
              disabled={isExporting}
            >
              {isExporting ? 'Exporting...' : 'Export'}
            </StandardButton>
          </div>
        </div>
      </div>
    </>
  );
};
