import React, { useState } from 'react';
import { StandardButton } from '../ui/StandardButton';
import { Download, FileText, FileDown } from 'lucide-react';
import { examAPI } from '../../api/examAPI';
import toast from 'react-hot-toast';

// Helper function for consistent time formatting
const formatLocalTime = (dateString: string | Date) => {
  try {
    const date =
      typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) {
      return new Date().toLocaleString('en-US', {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    }

    return date.toLocaleString('en-US', {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch (e) {
    return new Date().toLocaleString('en-US', {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }
};

interface ExportCardProps {
  examId: number;
  examTitle: string;
  variantCount: number;
  currentVariantSet?: {
    id: string;
    name: string;
    created_at: string | Date;
    variants: Array<{ id: number; version_label: string }>;
  };
}

export const ExportCard: React.FC<ExportCardProps> = ({
  examId,
  examTitle,
  variantCount,
  currentVariantSet,
}) => {
  const [includeAnswerKeys, setIncludeAnswerKeys] = useState(true);
  const [selectedFormats, setSelectedFormats] = useState<string[]>(['docx']);

  const formats = [
    { key: 'docx', label: 'DOCX', icon: FileText },
    { key: 'pdf', label: 'PDF', icon: FileDown },
  ];

  const toggleFormat = (format: string) => {
    setSelectedFormats((prev) =>
      prev.includes(format)
        ? prev.filter((f) => f !== format)
        : [...prev, format]
    );
  };

  const handleDownload = async () => {
    try {
      console.log(
        'Downloading with formats:',
        selectedFormats,
        'include keys:',
        includeAnswerKeys
      );

      // Get variant IDs from current variant set, or use all variants if no current set
      const variantIds = currentVariantSet
        ? currentVariantSet.variants.map((v) => v.id)
        : undefined;

      // Export each selected format
      for (const format of selectedFormats) {
        let blob: Blob;

        if (format === 'docx') {
          // Export variants as DOCX
          blob = await examAPI.exportVariants(examId, 'docx', variantIds);
        } else if (format === 'pdf') {
          // Export variants as PDF
          blob = await examAPI.exportVariants(examId, 'pdf', variantIds);
        } else {
          continue;
        }

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        // Generate filename - these are ZIP files containing all variants
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `${examTitle}_variants_${format}_${timestamp}.zip`;

        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      // Export answer keys if requested
      if (includeAnswerKeys) {
        try {
          const answerKeyBlob = await examAPI.exportAnswerKey(
            examId,
            variantIds,
            'csv'
          );
          const url = window.URL.createObjectURL(answerKeyBlob);
          const link = document.createElement('a');
          link.href = url;

          const timestamp = new Date().toISOString().split('T')[0];
          const filename = `${examTitle}_answer_keys_${timestamp}.zip`;

          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Answer key export failed:', error);
          // Don't show error to user, just log it
        }
      }

      // Show success message with toast
      const message = includeAnswerKeys
        ? `Successfully exported ${selectedFormats.length} format(s) and answer keys with layout settings including exam instructions, footer, and academic integrity statement.`
        : `Successfully exported ${selectedFormats.length} format(s) with layout settings including exam instructions, footer, and academic integrity statement.`;
      toast.success(message);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Download className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Export Exam</h3>
          <p className="text-sm text-gray-600">Download all variants</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Export Formats
          </label>
          <div className="flex gap-2">
            {formats.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => toggleFormat(key)}
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                  selectedFormats.includes(key)
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Answer Keys Checkbox */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="include-answer-keys"
            checked={includeAnswerKeys}
            onChange={(e) => setIncludeAnswerKeys(e.target.checked)}
            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
          <label
            htmlFor="include-answer-keys"
            className="text-sm text-gray-700"
          >
            Include answer keys
          </label>
        </div>

        {/* Info Text */}
        <p className="text-xs text-gray-500">
          {currentVariantSet
            ? `All ${currentVariantSet.variants.length} variants from "${formatLocalTime(currentVariantSet.created_at)}" will be included`
            : `All ${variantCount} variants will be included`}
        </p>

        {/* Download Button */}
        <StandardButton
          onClick={handleDownload}
          disabled={selectedFormats.length === 0}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          Download ZIP
        </StandardButton>
      </div>
    </div>
  );
};
