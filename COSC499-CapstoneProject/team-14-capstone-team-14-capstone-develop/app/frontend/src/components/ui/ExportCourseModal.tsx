import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Archive,
  FileText,
  Users,
  BarChart3,
  BookOpen,
  Calendar,
  Shield,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { courseAPI } from '../../api/courseAPI';

interface ExportCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: {
    id: number;
    code: string;
    title: string;
  };
}

interface ExportOptions {
  questionBanks: boolean;
  exams: boolean;
  students: boolean;
  results: boolean;
  dateRange: {
    enabled: boolean;
    from: string;
    to: string;
  };
  anonymizeStudents: boolean;
  format: 'zip' | 'pdf' | 'docx' | 'csv';
}

interface ExportHistory {
  id: string;
  createdAt: string;
  expiresAt: string;
  size: string;
  status: 'completed' | 'processing' | 'failed';
  downloadUrl?: string;
  format: 'zip' | 'pdf' | 'docx' | 'csv';
}

export const ExportCourseModal: React.FC<ExportCourseModalProps> = ({
  isOpen,
  onClose,
  course,
}) => {
  const [activeTab, setActiveTab] = useState<'configure' | 'history'>(
    'configure'
  );
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('');
  const [exportHistory, setExportHistory] = useState<ExportHistory[]>([]);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  const [options, setOptions] = useState<ExportOptions>({
    questionBanks: true,
    exams: true,
    students: true,
    results: true,
    dateRange: {
      enabled: false,
      from: '',
      to: '',
    },
    anonymizeStudents: false,
    format: 'zip',
  });

  useEffect(() => {
    if (isOpen) {
      loadExportHistory();
    }
  }, [isOpen, course.id]);

  const loadExportHistory = async () => {
    try {
      const data = await courseAPI.getExportHistory(course.id);
      console.log('Export history data:', data);
      setExportHistory(data);
    } catch (error) {
      console.error('Failed to load export history:', error);
      setExportHistory([]);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus('Preparing export...');
    setExportError(null);
    setExportSuccess(false);
    setExportProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setExportProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 500);

      console.log('Exporting with options:', {
        question_banks: options.questionBanks,
        exams: options.exams,
        students: options.students,
        results: options.results,
        anonymize_students: options.anonymizeStudents,
        date_range_enabled: options.dateRange.enabled,
        date_from: options.dateRange.from,
        date_to: options.dateRange.to,
        format: options.format,
      });

      // Build the export request data
      const exportData: any = {
        question_banks: options.questionBanks,
        exams: options.exams,
        students: options.students,
        results: options.results,
        anonymize_students: options.anonymizeStudents,
        format: options.format,
      };

      // Only include date fields if date range is enabled and dates are provided
      if (options.dateRange.enabled) {
        if (options.dateRange.from) {
          exportData.date_from = options.dateRange.from;
        }
        if (options.dateRange.to) {
          exportData.date_to = options.dateRange.to;
        }
        exportData.date_range_enabled = true;
      } else {
        exportData.date_range_enabled = false;
      }

      // The API will return the file directly
      const blob = await courseAPI.exportCourse(course.id, exportData);

      clearInterval(progressInterval);
      setExportProgress(100);
      setExportStatus('Finalizing export...');

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // ALWAYS use .zip extension because backend always returns a ZIP file
      const filename = `${course.code}_export_${options.format}_${new Date().toISOString().split('T')[0]}.zip`;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);

      setIsExporting(false);
      setExportStatus('');
      setExportSuccess(true);

      // Clear success message after 5 seconds
      setTimeout(() => {
        setExportSuccess(false);
      }, 5000);

      // Refresh history after a short delay
      setTimeout(() => {
        loadExportHistory();
      }, 1500);
    } catch (error: any) {
      setIsExporting(false);
      setExportProgress(0);

      console.error('Export error details:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);

      // If we have a blob response, read it to get the actual error message
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          console.error('Error response body:', text);

          // Try to parse as JSON
          try {
            const errorData = JSON.parse(text);
            console.error('Parsed error data:', errorData);

            // Extract error message from the response
            if (errorData.error) {
              setExportError(`Export failed: ${errorData.error}`);
            } else if (errorData.detail) {
              setExportError(`Export failed: ${errorData.detail}`);
            } else if (errorData.message) {
              setExportError(`Export failed: ${errorData.message}`);
            } else {
              setExportError(`Export failed: ${text}`);
            }
            return;
          } catch (parseError) {
            // Not JSON, use the text as is
            setExportError(`Export failed: ${text}`);
            return;
          }
        } catch (readError) {
          console.error('Failed to read error response:', readError);
        }
      }

      // Fallback error handling
      if (error.response?.status === 401) {
        setExportError('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        setExportError("You don't have permission to export this course.");
      } else if (error.response?.status === 404) {
        setExportError('Course not found. It may have been deleted.');
      } else if (error.response?.status === 500) {
        setExportError('Server error. Please try again later.');
      } else if (error.message?.includes('network')) {
        setExportError('Network error. Please check your connection.');
      } else {
        setExportError(
          `Export failed: ${error.message || 'Unknown error occurred'}`
        );
      }
    }
  };

  const handleDownloadPrevious = async (exportId: string) => {
    try {
      // Use courseAPI to download the export
      const blob = await courseAPI.downloadExport(course.id, exportId);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${course.code}_export.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download export. It may have expired or been deleted.');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl h-[85vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Export Course
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {course.code} - {course.title}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 ml-3">
            <div className="flex">
              <button
                onClick={() => setActiveTab('configure')}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-all ${
                  activeTab === 'configure'
                    ? 'text-white bg-primary-btn border-primary-btn'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Configure Export
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-all ${
                  activeTab === 'history'
                    ? 'text-white bg-primary-btn border-primary-btn'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Export History
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            {activeTab === 'configure' && !isExporting && (
              <div className="space-y-6">
                {/* Data Types */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Select Data to Export
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={options.questionBanks}
                        onChange={(e) =>
                          setOptions({
                            ...options,
                            questionBanks: e.target.checked,
                          })
                        }
                        className="h-4 w-4 text-primary-btn rounded"
                      />
                      <BookOpen size={20} className="text-gray-400" />
                      <div className="flex-1">
                        <div className="font-medium">Question Banks</div>
                        <div className="text-sm text-gray-500">
                          All question banks and their questions
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={options.exams}
                        onChange={(e) =>
                          setOptions({ ...options, exams: e.target.checked })
                        }
                        className="h-4 w-4 text-primary-btn rounded"
                      />
                      <FileText size={20} className="text-gray-400" />
                      <div className="flex-1">
                        <div className="font-medium">Exams & Variants</div>
                        <div className="text-sm text-gray-500">
                          All exams, their variants, and configurations
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={options.students}
                        onChange={(e) =>
                          setOptions({ ...options, students: e.target.checked })
                        }
                        className="h-4 w-4 text-primary-btn rounded"
                      />
                      <Users size={20} className="text-gray-400" />
                      <div className="flex-1">
                        <div className="font-medium">Student Rosters</div>
                        <div className="text-sm text-gray-500">
                          Enrolled students and their information
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={options.results}
                        onChange={(e) =>
                          setOptions({ ...options, results: e.target.checked })
                        }
                        className="h-4 w-4 text-primary-btn rounded"
                      />
                      <BarChart3 size={20} className="text-gray-400" />
                      <div className="flex-1">
                        <div className="font-medium">Results & Analytics</div>
                        <div className="text-sm text-gray-500">
                          Exam results, grades, and performance analytics
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <label className="flex items-center gap-3 mb-3">
                    <input
                      type="checkbox"
                      checked={options.dateRange.enabled}
                      onChange={(e) =>
                        setOptions({
                          ...options,
                          dateRange: {
                            ...options.dateRange,
                            enabled: e.target.checked,
                          },
                        })
                      }
                      className="h-4 w-4 text-primary-btn rounded"
                    />
                    <Calendar size={20} className="text-gray-400" />
                    <span className="font-medium">Filter by Date Range</span>
                  </label>

                  {options.dateRange.enabled && (
                    <div className="flex gap-4 ml-10">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          From
                        </label>
                        <input
                          type="date"
                          value={options.dateRange.from}
                          onChange={(e) =>
                            setOptions({
                              ...options,
                              dateRange: {
                                ...options.dateRange,
                                from: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-btn focus:border-transparent"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          To
                        </label>
                        <input
                          type="date"
                          value={options.dateRange.to}
                          onChange={(e) =>
                            setOptions({
                              ...options,
                              dateRange: {
                                ...options.dateRange,
                                to: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-btn focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Privacy Options */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Privacy Options
                  </h3>
                  <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.anonymizeStudents}
                      onChange={(e) =>
                        setOptions({
                          ...options,
                          anonymizeStudents: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-primary-btn rounded"
                    />
                    <Shield size={20} className="text-gray-400" />
                    <div className="flex-1">
                      <div className="font-medium">Anonymize Student Data</div>
                      <div className="text-sm text-gray-500">
                        Replace student names and IDs with anonymous identifiers
                      </div>
                    </div>
                  </label>
                </div>

                {/* Export Format */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Export Format
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={`flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer ${
                        options.format === 'zip'
                          ? 'border-primary-btn bg-primary-btn/5'
                          : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="format"
                        value="zip"
                        checked={options.format === 'zip'}
                        onChange={(e) =>
                          setOptions({
                            ...options,
                            format: e.target.value as
                              | 'zip'
                              | 'pdf'
                              | 'docx'
                              | 'csv',
                          })
                        }
                        className="h-4 w-4 text-primary-btn"
                      />
                      <Archive size={20} className="text-gray-400" />
                      <div className="flex-1">
                        <div className="font-medium">Raw Data (ZIP)</div>
                        <div className="text-sm text-gray-500">
                          Original data files in JSON/CSV format
                        </div>
                      </div>
                    </label>

                    <label
                      className={`flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer ${
                        options.format === 'pdf'
                          ? 'border-primary-btn bg-primary-btn/5'
                          : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="format"
                        value="pdf"
                        checked={options.format === 'pdf'}
                        onChange={(e) =>
                          setOptions({
                            ...options,
                            format: e.target.value as
                              | 'zip'
                              | 'pdf'
                              | 'docx'
                              | 'csv',
                          })
                        }
                        className="h-4 w-4 text-primary-btn"
                      />
                      <FileText size={20} className="text-gray-400" />
                      <div className="flex-1">
                        <div className="font-medium">PDF Reports</div>
                        <div className="text-sm text-gray-500">
                          Formatted PDF documents
                        </div>
                      </div>
                    </label>

                    <label
                      className={`flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer ${
                        options.format === 'docx'
                          ? 'border-primary-btn bg-primary-btn/5'
                          : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="format"
                        value="docx"
                        checked={options.format === 'docx'}
                        onChange={(e) =>
                          setOptions({
                            ...options,
                            format: e.target.value as
                              | 'zip'
                              | 'pdf'
                              | 'docx'
                              | 'csv',
                          })
                        }
                        className="h-4 w-4 text-primary-btn"
                      />
                      <FileText size={20} className="text-gray-400" />
                      <div className="flex-1">
                        <div className="font-medium">Word Documents</div>
                        <div className="text-sm text-gray-500">
                          Editable DOCX reports
                        </div>
                      </div>
                    </label>

                    <label
                      className={`flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer ${
                        options.format === 'csv'
                          ? 'border-primary-btn bg-primary-btn/5'
                          : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="format"
                        value="csv"
                        checked={options.format === 'csv'}
                        onChange={(e) =>
                          setOptions({
                            ...options,
                            format: e.target.value as
                              | 'zip'
                              | 'pdf'
                              | 'docx'
                              | 'csv',
                          })
                        }
                        className="h-4 w-4 text-primary-btn"
                      />
                      <BarChart3 size={20} className="text-gray-400" />
                      <div className="flex-1">
                        <div className="font-medium">Spreadsheets</div>
                        <div className="text-sm text-gray-500">
                          CSV/Excel compatible format
                        </div>
                      </div>
                    </label>
                  </div>
                  <p className="text-sm text-gray-500 mt-3">
                    All formats include the selected data (question banks,
                    exams, students, results) packaged together.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExport}
                    disabled={
                      !options.questionBanks &&
                      !options.exams &&
                      !options.students &&
                      !options.results
                    }
                    className="px-4 py-2 bg-primary-btn text-white rounded-lg hover:bg-primary-btn-hover transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Archive size={16} />
                    Generate Archive
                  </button>
                </div>

                {/* Success/Error Messages */}
                {exportSuccess && (
                  <div className="mt-4 text-center text-green-600 font-medium">
                    ✓ Export downloaded successfully! Check your downloads
                    folder.
                  </div>
                )}
                {exportError && (
                  <div className="mt-4 text-center text-red-600 font-medium">
                    {exportError}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'configure' && isExporting && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-64 mb-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Exporting...</span>
                    <span>{Math.round(exportProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-btn h-2 rounded-full transition-all duration-300"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                </div>
                <p className="text-gray-600 text-center">{exportStatus}</p>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                {exportHistory.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Archive size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No export history available</p>
                  </div>
                ) : (
                  exportHistory.map((item) => (
                    <div
                      key={item.id}
                      className="border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            {item.format
                              ? item.format.toUpperCase()
                              : 'Archive'}{' '}
                            Export from{' '}
                            {new Date(item.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.size} • Expires{' '}
                            {new Date(item.expiresAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.status === 'completed' && (
                            <button
                              onClick={() => handleDownloadPrevious(item.id)}
                              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm flex items-center gap-2"
                            >
                              <Download size={16} />
                              Download
                            </button>
                          )}
                          {item.status === 'processing' && (
                            <span className="text-sm text-amber-600">
                              Processing...
                            </span>
                          )}
                          {item.status === 'failed' && (
                            <span className="text-sm text-red-600">Failed</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
