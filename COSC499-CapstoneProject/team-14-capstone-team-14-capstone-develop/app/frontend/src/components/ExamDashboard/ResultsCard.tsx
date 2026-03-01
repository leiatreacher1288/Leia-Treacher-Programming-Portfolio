import React, { useState, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { StandardButton } from '../ui/StandardButton';
import {
  Upload,
  Download,
  Trash2,
  AlertTriangle,
  Users,
  ChevronDown,
  ChevronUp,
  FileText,
  FileSpreadsheet,
  FileType,
  Lock,
  HelpCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

import type {
  ExamDetail,
  ImportResult,
  ExamResultsResponse,
  ResultExportFormat,
} from '../../api/examAPI';
import type { Student } from '../../api/studentAPI';
import { examAPI } from '../../api/examAPI';
import { studentAPI } from '../../api/studentAPI';

interface ResultsCardProps {
  exam: ExamDetail;
  currentVariantSet?: any;
  onVariantSetChange?: (variantSet: any) => void;
}

interface MissingStudentsModalProps {
  missingStudents: Student[];
  onCancel: () => void;
  onProceed: () => void;
}

interface ImportError {
  type:
    | 'missing_column'
    | 'extra_students'
    | 'missing_students'
    | 'invalid_format'
    | 'variant_mismatch'
    | 'parse_error'
    | 'other';
  message: string;
  details?: any;
}

const MissingStudentsModal: React.FC<MissingStudentsModalProps> = ({
  missingStudents,
  onCancel,
  onProceed,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] shadow-xl overflow-hidden flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="text-amber-500" size={24} />
          <h3 className="text-lg font-semibold text-gray-900">
            Missing Student Results Detected
          </h3>
        </div>

        <p className="text-gray-600 mb-4">
          The following {missingStudents.length} student
          {missingStudents.length !== 1 ? 's' : ''} registered in the course{' '}
          {missingStudents.length !== 1 ? 'were' : 'was'} not detected in the
          import file:
        </p>

        <div className="flex-1 overflow-y-auto mb-4 border rounded-lg">
          <table className="min-w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                  Student ID
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                  Preferred Name
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                  Legal Name
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                  Section
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {missingStudents.map((student) => {
                const hasPreferredName =
                  student.preferred_name && student.preferred_name !== '';
                const displayName = hasPreferredName
                  ? student.effective_name ||
                    student.display_name ||
                    student.name
                  : student.name;

                return (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm">{student.student_id}</td>
                    <td className="px-4 py-2 text-sm">
                      {displayName}
                      {hasPreferredName && (
                        <span
                          className="ml-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                          title={`Preferred: ${student.preferred_name}`}
                        >
                          Preferred
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {student.name}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {student.section || 'N/A'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> If you proceed, these students will receive a
            score of 0% for this exam.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Cancel Import
          </button>
          <button
            onClick={onProceed}
            className="flex-1 bg-primary-btn hover:bg-primary-btn-hover text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Proceed with Zeros
          </button>
        </div>
      </div>
    </div>
  );
};

const ExtraStudentsModal: React.FC<{
  extraStudents: string[];
  onCancel: () => void;
  onProceed: () => void;
}> = ({ extraStudents, onCancel, onProceed }) => {
  if (extraStudents.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] shadow-xl overflow-hidden flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="text-orange-500" size={24} />
          <h3 className="text-lg font-semibold text-gray-900">
            Unknown Students Detected
          </h3>
        </div>

        <p className="text-gray-600 mb-4">
          The following {extraStudents.length} student
          {extraStudents.length !== 1 ? 's' : ''} in the import file{' '}
          {extraStudents.length !== 1 ? 'are' : 'is'} not registered in the
          course:
        </p>

        <div className="flex-1 overflow-y-auto mb-4 border rounded-lg">
          <table className="min-w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                  Student ID
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {extraStudents.map((studentId) => (
                <tr key={studentId} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm font-mono">{studentId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-orange-800">
            <strong>Note:</strong> If you proceed, these students will be
            skipped and their results will not be imported.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Cancel Import
          </button>
          <button
            onClick={onProceed}
            className="flex-1 bg-primary-btn hover:bg-primary-btn-hover text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Proceed and Skip
          </button>
        </div>
      </div>
    </div>
  );
};

const VariantMismatchModal: React.FC<{
  invalidVariants: string[];
  validVariants: string[];
  affectedRows: Record<string, number[]>;
  totalRows: number;
  validRows: number;
  onClose: () => void;
  onProceed?: () => void;
}> = ({
  invalidVariants,
  validVariants,
  affectedRows,
  totalRows,
  validRows,
  onClose,
  onProceed,
}) => {
  const canProceed = validRows > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] shadow-xl overflow-hidden flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="text-amber-500" size={24} />
          <h3 className="text-lg font-semibold text-gray-900">
            Variant Code Mismatch
          </h3>
        </div>

        <div className="mb-4">
          <p className="text-gray-800 font-medium mb-2">
            The CSV file contains variant codes that don't exist for this exam.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm font-medium text-red-800 mb-2">
                Invalid Variants Found:
              </p>
              <div className="flex flex-wrap gap-2">
                {invalidVariants.map((variant) => (
                  <span
                    key={variant}
                    className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm font-mono"
                  >
                    {variant}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm font-medium text-green-800 mb-2">
                Valid Variants for This Exam:
              </p>
              <div className="flex flex-wrap gap-2">
                {validVariants.map((variant) => (
                  <span
                    key={variant}
                    className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm font-mono"
                  >
                    {variant}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-700 font-medium mb-2">Summary:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Total rows in file: {totalRows}</li>
              <li>• Rows with invalid variants: {totalRows - validRows}</li>
              <li>• Rows with valid variants: {validRows}</li>
            </ul>
          </div>

          {Object.entries(affectedRows).length > 0 && (
            <div className="border rounded-lg p-3 max-h-32 overflow-y-auto">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Affected rows by variant:
              </p>
              {Object.entries(affectedRows).map(([variant, rows]) => (
                <div key={variant} className="text-sm text-gray-600 mb-1">
                  <span className="font-mono">{variant}</span>: Rows{' '}
                  {rows.slice(0, 5).join(', ')}
                  {rows.length > 5 && ` and ${rows.length - 5} more`}
                </div>
              ))}
            </div>
          )}
        </div>

        {canProceed && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> If you proceed, only the {validRows} rows
              with valid variant codes will be imported. The remaining{' '}
              {totalRows - validRows} rows will be skipped.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Cancel Import
          </button>
          {canProceed && onProceed && (
            <button
              onClick={onProceed}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Import Valid Rows Only
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ImportErrorModal: React.FC<{
  error: ImportError;
  onClose: () => void;
}> = ({ error, onClose }) => {
  // If it's a variant mismatch, show the specialized modal
  if (error.type === 'variant_mismatch' && error.details) {
    return (
      <VariantMismatchModal
        invalidVariants={error.details.invalidVariants}
        validVariants={error.details.validVariants}
        affectedRows={error.details.affectedRows}
        totalRows={error.details.totalRows}
        validRows={error.details.validRows}
        onClose={onClose}
        onProceed={
          error.details.canProceed
            ? async () => {
                // For now, just close the modal
                onClose();
                // You could implement partial import logic here later
              }
            : undefined
        }
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="text-red-500" size={24} />
          <h3 className="text-lg font-semibold text-gray-900">Import Error</h3>
        </div>

        <div className="mb-6">
          <p className="text-gray-800 font-medium mb-2">{error.message}</p>

          {error.type === 'missing_column' && error.details && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 mb-2">Required columns:</p>
              <ul className="list-disc list-inside text-sm text-gray-600">
                <li>student_id (or studentid, student id)</li>
                <li>variant_code (or variant)</li>
                <li>q1, q2, q3... (question responses)</li>
              </ul>
              {error.details.foundColumns && (
                <p className="text-sm text-gray-700 mt-2">
                  Found columns: {error.details.foundColumns.join(', ')}
                </p>
              )}
            </div>
          )}

          {error.type === 'invalid_format' && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                Please ensure your CSV file:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                <li>Has headers in the first row</li>
                <li>Uses commas to separate values</li>
                <li>Has one student per row</li>
                <li>Includes all required columns</li>
              </ul>
            </div>
          )}

          {error.type === 'parse_error' && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium mb-2">
                CSV Format Issues Detected
              </p>
              <p className="text-sm text-red-600 mb-3">
                The file contains formatting errors that prevent proper parsing.
              </p>
              <div className="bg-white p-3 rounded border border-red-200">
                <p className="text-sm text-gray-700 font-medium mb-2">
                  Common Issues:
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Missing or empty values in required columns</li>
                  <li>• Incorrect data types (e.g., text in numeric fields)</li>
                  <li>• Malformed multiple-choice answers</li>
                  <li>• Extra spaces or special characters</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  );
};

const CSVFormatHelpModal: React.FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] shadow-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <HelpCircle className="text-blue-600" size={24} />
            <h3 className="text-xl font-semibold text-gray-900">
              CSV Import Format Guide
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
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

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Required Columns */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-blue-900 mb-3">
              Required Columns
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-blue-800 mb-2">
                  Student Information:
                </p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>
                    •{' '}
                    <code className="bg-blue-100 px-1 rounded">student_id</code>{' '}
                    - Student's unique ID
                  </li>
                  <li>
                    •{' '}
                    <code className="bg-blue-100 px-1 rounded">
                      variant_code
                    </code>{' '}
                    - Exam variant (A, B, C, etc.)
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800 mb-2">
                  Question Responses:
                </p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>
                    •{' '}
                    <code className="bg-blue-100 px-1 rounded">
                      q1, q2, q3...
                    </code>{' '}
                    - One column per question
                  </li>
                  <li>• Use question numbers that match your exam</li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800 mb-2">
                  Optional Column:
                </p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>
                    •{' '}
                    <code className="bg-blue-100 px-1 rounded">
                      total_score
                    </code>{' '}
                    - Total score from OMR machine (optional)
                  </li>
                  <li>• Must be the last column if included</li>
                  <li>
                    • Stored for reference only - answers will be re-scored
                    using your exam's answer key
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Answer Format */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-green-900 mb-3">
              Answer Format
            </h4>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-green-800 mb-2">
                  Single Choice Questions:
                </p>
                <p className="text-sm text-green-700">
                  Use single letter:{' '}
                  <code className="bg-green-100 px-1 rounded">A</code>,{' '}
                  <code className="bg-green-100 px-1 rounded">B</code>,{' '}
                  <code className="bg-green-100 px-1 rounded">C</code>, etc.
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-green-800 mb-2">
                  Multiple Choice Questions:
                </p>
                <p className="text-sm text-green-700">
                  Use double quotes around multiple answers with spaces:{' '}
                  <code className="bg-green-100 px-1 rounded">"A B C"</code>,{' '}
                  <code className="bg-green-100 px-1 rounded">"D E"</code>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-green-800 mb-2">
                  No Answer:
                </p>
                <p className="text-sm text-green-700">
                  Leave empty or use{' '}
                  <code className="bg-green-100 px-1 rounded">""</code> for
                  unanswered questions
                </p>
              </div>
            </div>
          </div>

          {/* Example */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">
              Example CSV Format
            </h4>
            <div className="bg-white border rounded-lg p-3 overflow-x-auto">
              <pre className="text-sm text-gray-700 font-mono">
                {`student_id,variant_code,q1,q2,q3,q4,q5,total_score
12345678,A,A,"B C",D,"",E,4
23456789,B,B,C,"A D","E F",G,3
34567890,A,"A B",C,D,E,"",5`}
              </pre>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Note:</strong> The first row should contain column
              headers. Each subsequent row represents one student's responses.
            </p>
          </div>

          {/* Common Issues */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-amber-900 mb-3">
              Common Issues to Avoid
            </h4>
            <ul className="text-sm text-amber-800 space-y-2">
              <li>
                • <strong>Missing quotes:</strong> Multiple answers must be in
                double quotes:{' '}
                <code className="bg-amber-100 px-1 rounded">"A B C"</code> not{' '}
                <code className="bg-amber-100 px-1 rounded">A B C</code>
              </li>
              <li>
                • <strong>Empty cells:</strong> Don't leave cells completely
                empty - use{' '}
                <code className="bg-amber-100 px-1 rounded">""</code> for no
                answer
              </li>
              <li>
                • <strong>Extra spaces:</strong> Remove leading/trailing spaces
                from answers
              </li>
              <li>
                • <strong>Wrong variant codes:</strong> Use only variant codes
                that exist for this exam
              </li>
              <li>
                • <strong>Missing columns:</strong> Include all required columns
                (student_id, variant_code, q1, q2, etc.)
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

const ExportFormatModal: React.FC<{
  onClose: () => void;
  onExport: (format: 'csv' | 'pdf' | 'docx') => void;
}> = ({ onClose, onExport }) => {
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'pdf' | 'docx'>(
    'csv'
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Select Export Format
        </h3>

        <div className="space-y-3 mb-6">
          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="format"
              value="csv"
              checked={selectedFormat === 'csv'}
              onChange={(e) => setSelectedFormat(e.target.value as 'csv')}
              className="mr-3"
            />
            <FileSpreadsheet className="w-5 h-5 mr-3 text-green-600" />
            <div className="flex-1">
              <div className="font-medium">CSV</div>
              <div className="text-sm text-gray-600">
                Spreadsheet format, opens in Excel
              </div>
            </div>
          </label>

          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="format"
              value="pdf"
              checked={selectedFormat === 'pdf'}
              onChange={(e) => setSelectedFormat(e.target.value as 'pdf')}
              className="mr-3"
            />
            <FileText className="w-5 h-5 mr-3 text-red-600" />
            <div className="flex-1">
              <div className="font-medium">PDF</div>
              <div className="text-sm text-gray-600">
                Formatted report, ready to print
              </div>
            </div>
          </label>

          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="format"
              value="docx"
              checked={selectedFormat === 'docx'}
              onChange={(e) => setSelectedFormat(e.target.value as 'docx')}
              className="mr-3"
            />
            <FileType className="w-5 h-5 mr-3 text-blue-600" />
            <div className="flex-1">
              <div className="font-medium">Word Document</div>
              <div className="text-sm text-gray-600">
                Editable document format
              </div>
            </div>
          </label>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onExport(selectedFormat);
              onClose();
            }}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
};

export const ResultsCard: React.FC<ResultsCardProps> = ({
  exam,
  currentVariantSet,
  onVariantSetChange,
}) => {
  const [data, setData] = useState<ExamResultsResponse | null>(null);
  const [importSummary, setImportSummary] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [missingStudents, setMissingStudents] = useState<Student[]>([]);
  const [extraStudents, setExtraStudents] = useState<string[]>([]);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showPreferredNames, setShowPreferredNames] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showCSVHelpModal, setShowCSVHelpModal] = useState(false);
  const [importError, setImportError] = useState<ImportError | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch results and students on mount / when exam.id changes
  useEffect(() => {
    (async () => {
      try {
        // Fetch exam results
        const resp = await examAPI.getExamResults(exam.id);
        setData(resp);

        // Fetch students to get preferred name data
        if (exam.course) {
          const studentData = await studentAPI.getStudents(exam.course);
          setStudents(studentData);
        }
      } catch (e: any) {
        console.error('Failed to load results:', e);
        setError('Could not load exam results');
      }
    })();
  }, [exam.id, exam.course]);

  // Helper function to get student details
  const getStudentDetails = (studentId: string) => {
    return students.find((s) => s.student_id === studentId);
  };

  // Check if any students have preferred names
  const hasStudentsWithPreferredNames = students.some(
    (s) => s.preferred_name && s.preferred_name !== ''
  );

  // Check if the current variant set is locked
  const hasLockedVariant = () => {
    if (currentVariantSet) {
      return currentVariantSet.is_locked || false;
    }
    return exam.variants?.some((variant) => variant.is_locked) || false;
  };

  // Open file picker with validation
  const handleImportClick = () => {
    if (!hasLockedVariant()) {
      toast.error(
        'You must lock a variant set before importing results. Please go to the Variants tab and lock a variant set.',
        {
          duration: 5000,
          icon: <Lock className="w-5 h-5" />,
        }
      );
      return;
    }
    fileInputRef.current?.click();
  };

  // Validate CSV format and content
  const validateCSVFile = async (file: File): Promise<ImportError | null> => {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter((line) => line.trim());

      if (lines.length === 0) {
        return {
          type: 'invalid_format',
          message: 'The CSV file is empty.',
        };
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

      // Check for required columns
      const hasStudentId = headers.some(
        (h) =>
          h === 'student_id' ||
          h === 'studentid' ||
          h === 'student id' ||
          (h.includes('student') && h.includes('id'))
      );

      const hasVariant = headers.some(
        (h) => h === 'variant_code' || h === 'variant' || h === 'version'
      );

      const hasQuestions = headers.some((h) => h.match(/^q\d+$/));

      if (!hasStudentId || !hasVariant || !hasQuestions) {
        return {
          type: 'missing_column',
          message: 'The CSV file is missing required columns.',
          details: {
            foundColumns: headers,
            missingStudentId: !hasStudentId,
            missingVariant: !hasVariant,
            missingQuestions: !hasQuestions,
          },
        };
      }

      return null;
    } catch (e) {
      return {
        type: 'other',
        message:
          'Failed to read the CSV file. Please ensure it is properly formatted.',
      };
    }
  };

  // Check for missing students in import
  const checkMissingStudents = async (file: File): Promise<Student[]> => {
    try {
      // Get all students in the course
      const courseId = exam.course;
      if (!courseId) {
        console.error('No course ID available');
        return [];
      }

      const allStudents = await studentAPI.getStudents(courseId);

      // Parse CSV to get student IDs from import file
      const text = await file.text();
      const lines = text.split('\n').filter((line) => line.trim());
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

      // More flexible header matching
      const studentIdIndex = headers.findIndex(
        (h) =>
          h === 'student_id' ||
          h === 'studentid' ||
          h === 'student id' ||
          (h.includes('student') && h.includes('id'))
      );

      if (studentIdIndex === -1) {
        throw new Error('No student_id column found in CSV');
      }

      const importedStudentIds = new Set<string>();
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values[studentIdIndex]) {
          const studentId = values[studentIdIndex].trim();
          importedStudentIds.add(studentId);
        }
      }

      // Find students in course but not in import
      const missing = allStudents.filter((student) => {
        const isActive = student.is_active !== false;
        const notInImport = !importedStudentIds.has(student.student_id);
        return notInImport && isActive;
      });

      return missing;
    } catch (e) {
      console.error('Error checking missing students:', e);
      return [];
    }
  };

  const checkExtraStudents = async (file: File): Promise<string[]> => {
    try {
      // Get all students in the course
      const courseId = exam.course;
      if (!courseId) {
        console.error('No course ID available');
        return [];
      }

      const allStudents = await studentAPI.getStudents(courseId);
      const courseStudentIds = new Set(allStudents.map((s) => s.student_id));

      // Parse CSV to get student IDs from import file
      const text = await file.text();
      const lines = text.split('\n').filter((line) => line.trim());
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

      // More flexible header matching
      const studentIdIndex = headers.findIndex(
        (h) =>
          h === 'student_id' ||
          h === 'studentid' ||
          h === 'student id' ||
          (h.includes('student') && h.includes('id'))
      );

      if (studentIdIndex === -1) {
        throw new Error('No student_id column found in CSV');
      }

      const extraStudentIds: string[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values[studentIdIndex]) {
          const studentId = values[studentIdIndex].trim();
          if (!courseStudentIds.has(studentId)) {
            extraStudentIds.push(studentId);
          }
        }
      }

      return extraStudentIds;
    } catch (e) {
      console.error('Error checking extra students:', e);
      return [];
    }
  };

  // Import CSV with missing student check
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset previous errors
    setError(null);
    setImportError(null);

    // Validate file format
    const validationError = await validateCSVFile(file);
    if (validationError) {
      setImportError(validationError);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Check for missing students
    const missing = await checkMissingStudents(file);
    const extra = await checkExtraStudents(file);

    if (missing.length > 0) {
      setMissingStudents(missing);
      setExtraStudents([]);
      setPendingImportFile(file);
    } else if (extra.length > 0) {
      setExtraStudents(extra);
      setMissingStudents([]);
      setPendingImportFile(file);
    } else {
      // No missing or extra students, proceed with normal import
      await performImport(file);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Perform the actual import
  const performImport = async (file: File, includeZeros: boolean = false) => {
    const form = new FormData();
    form.append('file', file);
    form.append('format', 'csv');

    // If we need to include zeros for missing students, we'll need to handle this
    if (includeZeros && missingStudents.length > 0) {
      // Create a modified CSV that includes the missing students with zeros
      const text = await file.text();
      const lines = text.split('\n').filter((line) => line.trim());
      const headers = lines[0].split(',').map((h) => h.trim());

      // Find variant and question columns
      const variantIndex = headers.findIndex(
        (h) =>
          h.toLowerCase() === 'variant_code' || h.toLowerCase() === 'variant'
      );
      const questionColumns = headers.filter((h) => h.match(/^q\d+$/i));

      // Add missing students with zeros
      let modifiedCsv = lines.join('\n');
      missingStudents.forEach((student) => {
        const zeroAnswers = questionColumns.map(() => '').join(',');
        const defaultVariant = exam.variants?.[0]?.version_label || 'A';
        const newLine = `\n${student.student_id},${variantIndex !== -1 ? defaultVariant : ''},${zeroAnswers}`;
        modifiedCsv += newLine;
      });

      // Create new file with modified content
      const modifiedFile = new File([modifiedCsv], file.name, {
        type: file.type,
      });
      form.set('file', modifiedFile);
    }

    try {
      const summary = await examAPI.importResults(exam.id, form);
      setImportSummary(summary);
      setError(null);
      const resp = await examAPI.getExamResults(exam.id);
      setData(resp);
    } catch (e: any) {
      console.error('Import failed payload:', e.response?.data || e.message);

      // Check if this is a validation error from the backend
      if (e.response?.data?.validation_result?.errors) {
        const validationResult = e.response.data.validation_result;

        // Check for parse errors (like NoneType errors)
        const parseErrors = validationResult.errors.filter(
          (err: any) => err.type === 'parse_error'
        );

        if (parseErrors.length > 0) {
          setImportError({
            type: 'parse_error',
            message:
              'CSV format issues detected. Please check the file format.',
            details: {
              errors: parseErrors,
              totalRecords: validationResult.total_records,
              validRecords: validationResult.valid_records,
            },
          });
          setError(null);
          return;
        }

        // Check for variant mismatch errors
        const variantErrors = validationResult.errors.filter(
          (err: any) => err.type === 'invalid_variant'
        );

        if (variantErrors.length > 0) {
          // Extract unique invalid variants and their row numbers
          const invalidVariantsMap: Record<string, number[]> = {};
          variantErrors.forEach((err: any) => {
            const match = err.message.match(/Variant code (\w+) not found/);
            if (match) {
              const variant = match[1];
              if (!invalidVariantsMap[variant]) {
                invalidVariantsMap[variant] = [];
              }
              invalidVariantsMap[variant].push(err.row);
            }
          });

          const invalidVariants = Object.keys(invalidVariantsMap);
          const validVariants =
            exam.variants?.map((v) => v.version_label) || [];

          setImportError({
            type: 'variant_mismatch',
            message: 'Variant code mismatch detected',
            details: {
              invalidVariants,
              validVariants,
              affectedRows: invalidVariantsMap,
              totalRows: validationResult.total_records,
              validRows: validationResult.valid_records,
              canProceed: validationResult.valid_records > 0,
              originalFile: file,
            },
          });
          setError(null);
          return;
        }
      }

      // For other errors, show as before
      setError(
        typeof e.response?.data === 'object'
          ? JSON.stringify(e.response.data, null, 2)
          : e.message || 'Import failed'
      );
      setImportSummary(null);
    }
  };

  // Handle missing students modal actions
  const handleCancelImport = () => {
    setMissingStudents([]);
    setExtraStudents([]);
    setPendingImportFile(null);
  };

  const handleProceedWithZeros = async () => {
    if (pendingImportFile) {
      await performImport(pendingImportFile, true);
    }
    setMissingStudents([]);
    setExtraStudents([]);
    setPendingImportFile(null);
  };

  const handleProceedWithExtraStudents = async () => {
    if (pendingImportFile) {
      await performImport(pendingImportFile, false);
    }
    setMissingStudents([]);
    setExtraStudents([]);
    setPendingImportFile(null);
  };

  // Export with format selection
  // In ResultsCard.tsx, make sure your handleExport looks like this:

  const handleExport = async (format: 'csv' | 'pdf' | 'docx') => {
    if (!data || data.results.length === 0) {
      setError('No results to export');
      return;
    }

    setError(null);

    try {
      let blob: Blob;
      let filename: string;

      // IMPORTANT: Make sure you're calling the NEW methods here
      switch (format) {
        case 'csv':
          blob = await examAPI.exportResultsCSV(exam.id); // NOT exportResultsFile!
          filename = `${exam.title.replace(/\s+/g, '_')}_results_csv.zip`;
          break;
        case 'pdf':
          blob = await examAPI.exportResultsPDF(exam.id); // NOT exportResultsFile!
          filename = `${exam.title.replace(/\s+/g, '_')}_results_pdf.zip`;
          break;
        case 'docx':
          blob = await examAPI.exportResultsDOCX(exam.id); // NOT exportResultsFile!
          filename = `${exam.title.replace(/\s+/g, '_')}_results_docx.zip`;
          break;
        default:
          throw new Error('Invalid format');
      }

      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Export failed:', error);

      if (error.response && error.response.data instanceof Blob) {
        const text = await error.response.data.text();
        setError(`Export failed: ${text}`);
      } else if (error.response?.status === 404) {
        setError('Export endpoint not found. Please check if the exam exists.');
      } else if (error.response?.status === 403) {
        setError('You do not have permission to export these results.');
      } else {
        setError('Failed to export results. Please try again.');
      }
    }
  };

  const resultCount = data?.results?.length || 0;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Results Summary</h3>
            <p className="text-sm text-gray-600">
              {resultCount} student{resultCount !== 1 ? 's' : ''} • Upload CSV
              of student answers and analyze performance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCSVHelpModal(true)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
            title="CSV Format Help"
          >
            <HelpCircle className="w-4 h-4" />
            Format Help
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
            {isCollapsed ? 'Expand' : 'Collapse'}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Locked Variant Status */}
          {!hasLockedVariant() ? (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600" />
                <span className="text-sm text-amber-800">
                  {currentVariantSet ? (
                    <>
                      <strong>Selected variant set is not locked.</strong> Lock
                      this variant set to view/import its results.
                    </>
                  ) : (
                    <>
                      <strong>No locked variant set found.</strong> You must
                      lock a variant set in the Variants tab before importing
                      results.
                    </>
                  )}
                </span>
              </div>
            </div>
          ) : (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800">
                  <strong>Variant set is locked.</strong> You can now import
                  results for this exam.
                </span>
              </div>
            </div>
          )}

          {/* Import / Export Buttons with Preferred Name Toggle */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <StandardButton
              onClick={handleImportClick}
              icon={<Upload size={16} />}
              color="secondary-btn"
              size="sm"
              disabled={!hasLockedVariant()}
              title={
                !hasLockedVariant()
                  ? 'Lock a variant set first'
                  : 'Import results'
              }
            >
              Import Results
            </StandardButton>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />

            <StandardButton
              onClick={() => setShowExportModal(true)}
              icon={<Download size={16} />}
              color="secondary-btn"
              size="sm"
            >
              Export
            </StandardButton>
            <StandardButton
              onClick={() => setShowDeleteAllConfirm(true)}
              icon={<Trash2 size={16} />}
              color="danger-btn"
              size="sm"
            >
              Delete All Results
            </StandardButton>

            {/* Preferred Name Toggle */}
            {hasStudentsWithPreferredNames && (
              <label className="ml-auto flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={showPreferredNames}
                  onChange={(e) => setShowPreferredNames(e.target.checked)}
                  className="rounded"
                />
                Show preferred names
              </label>
            )}
          </div>

          {/* Feedback Banners */}
          {importSummary && (
            <div className="p-3 bg-green-100 text-green-800 rounded-lg mb-4 text-sm">
              <strong>Import complete!</strong> Imported{' '}
              {importSummary.imported}, failed {importSummary.failed}.
              {importSummary.warnings.length > 0 && (
                <ul className="mt-2 list-disc list-inside">
                  {importSummary.warnings.map((w, i) => (
                    <li key={i}>
                      Row {w.row}: {w.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-100 text-red-800 rounded-lg mb-4 text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Results Table - Only show if selected variant set is locked */}
          {hasLockedVariant() ? (
            <div className="overflow-x-auto max-h-96">
              <table className="min-w-full bg-white border rounded-lg">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">
                      Student ID
                    </th>
                    {showPreferredNames && (
                      <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">
                        Preferred Name
                      </th>
                    )}
                    <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">
                      Legal Name
                    </th>
                    <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">
                      Variant
                    </th>
                    <th className="px-3 py-2 text-right text-sm font-medium text-gray-700">
                      Score (%)
                    </th>
                    <th className="px-3 py-2 text-right text-sm font-medium text-gray-700">
                      Submitted At
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data && data.results.length > 0 ? (
                    data.results.map((r) => {
                      // Get student details for preferred name info
                      const studentDetails = getStudentDetails(r.student_id);
                      const hasPreferredName =
                        studentDetails?.preferred_name &&
                        studentDetails.preferred_name !== '';

                      let displayName: string;
                      let legalName: string;

                      if (
                        showPreferredNames &&
                        hasPreferredName &&
                        studentDetails
                      ) {
                        // Show effective name (preferred + last name) when preferred names are enabled
                        displayName =
                          studentDetails.effective_name ||
                          studentDetails.display_name ||
                          r.student_name;
                        legalName = studentDetails.name || r.student_name;
                      } else {
                        // Show legal name in both columns when preferred names are disabled or not available
                        displayName = studentDetails?.name || r.student_name;
                        legalName = studentDetails?.name || r.student_name;
                      }

                      return (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {r.student_id}
                          </td>
                          {showPreferredNames && (
                            <td className="px-3 py-2 text-sm text-gray-900">
                              {displayName}
                            </td>
                          )}
                          <td className="px-3 py-2 text-sm text-gray-600">
                            {legalName}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {r.variant_label}
                          </td>
                          <td className="px-3 py-2 text-sm text-right text-gray-900">
                            {r.percentage_score.toFixed(2)}%
                          </td>
                          <td className="px-3 py-2 text-sm text-right text-gray-600">
                            {new Date(r.submitted_at).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        className="px-3 py-6 text-center text-gray-500 text-sm"
                        colSpan={showPreferredNames ? 6 : 5}
                      >
                        No results to display.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-lg">
              <p className="text-sm">
                Results will be displayed here once the selected variant set is
                locked.
              </p>
            </div>
          )}

          {/* Info box about preferred names if any exist */}
          {hasStudentsWithPreferredNames &&
            !isCollapsed &&
            data &&
            data.results.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Some students have preferred names.
                  When enabled, the Preferred Name column shows their preferred
                  name with their last name. The Legal Name column always shows
                  their official name for administrative purposes.
                </p>
              </div>
            )}
        </>
      )}

      {/* CSV Format Help Modal */}
      {showCSVHelpModal && (
        <CSVFormatHelpModal onClose={() => setShowCSVHelpModal(false)} />
      )}

      {/* Export Format Modal */}
      {showExportModal && (
        <ExportFormatModal
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
        />
      )}

      {/* Import Error Modal */}
      {importError && (
        <ImportErrorModal
          error={importError}
          onClose={() => setImportError(null)}
        />
      )}

      {/* Missing Students Modal */}
      {missingStudents.length > 0 && (
        <MissingStudentsModal
          missingStudents={missingStudents}
          onCancel={handleCancelImport}
          onProceed={handleProceedWithZeros}
        />
      )}

      {/* Extra Students Modal */}
      {extraStudents.length > 0 && (
        <ExtraStudentsModal
          extraStudents={extraStudents}
          onCancel={handleCancelImport}
          onProceed={handleProceedWithExtraStudents}
        />
      )}

      {/* Delete All Confirmation Modal */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 mb-6 text-center">
              Delete all results for this exam?
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteAllConfirm(false)}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg"
              >
                No
              </button>
              <button
                onClick={async () => {
                  try {
                    await examAPI.deleteAllResults(exam.id);
                    const resp = await examAPI.getExamResults(exam.id);
                    setData(resp);
                    setImportSummary(null);
                    setError(null);
                  } catch (err) {
                    console.error('Delete all failed:', err);
                    setError('Could not delete all results');
                  } finally {
                    setShowDeleteAllConfirm(false);
                  }
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-lg"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
