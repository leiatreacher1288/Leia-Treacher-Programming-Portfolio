import React, { useState } from 'react';
import { StandardButton } from '../ui/StandardButton';
import { X, Upload, FileText } from 'lucide-react';
import { questionAPI, type QuestionBank } from '../../api/questionAPI';

interface QuestionBankImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
  courseId: number;
  selectedQuestionBank: QuestionBank | null;
  availableQuestionBanks?: QuestionBank[];
  onRefreshQuestionBanks?: () => void;
}

export const QuestionBankImportModal: React.FC<
  QuestionBankImportModalProps
> = ({
  isOpen,
  onClose,
  onImportSuccess,
  courseId,
  selectedQuestionBank,
  availableQuestionBanks = [],
  onRefreshQuestionBanks,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<
    Array<{
      filename: string;
      status: 'pending' | 'importing' | 'success' | 'error';
      message?: string;
    }>
  >([]);
  const [targetQuestionBank, setTargetQuestionBank] =
    useState<QuestionBank | null>(selectedQuestionBank);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);

    // Initialize import results
    setImportResults(
      files.map((file) => ({
        filename: file.name,
        status: 'pending',
      }))
    );
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setImportResults((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImport = async () => {
    if (selectedFiles.length === 0) return;

    console.log(
      '📁 QuestionBankImportModal: Starting import for',
      selectedFiles.length,
      'files'
    );
    setIsImporting(true);
    let hasSuccessfulImport = false;

    try {
      // Ensure we have a question bank to import into
      let questionBank = targetQuestionBank || selectedQuestionBank;
      if (!questionBank) {
        console.log(
          '🏦 QuestionBankImportModal: No question bank selected, creating one for course:',
          courseId
        );
        questionBank = await questionAPI.ensureQuestionBankExists(courseId);
        console.log(
          '✅ QuestionBankImportModal: Created/ensured question bank:',
          questionBank.id
        );
      } else {
        console.log(
          '🏦 QuestionBankImportModal: Using existing question bank:',
          questionBank.id
        );
      }

      // Import each file
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        console.log(
          `📄 QuestionBankImportModal: Importing file ${i + 1}/${selectedFiles.length}:`,
          file.name
        );

        // Update status to importing
        setImportResults((prev) =>
          prev.map((result, index) =>
            index === i ? { ...result, status: 'importing' } : result
          )
        );

        try {
          const importResult = await questionAPI.uploadQuestionsFile(
            file,
            questionBank!.id,
            courseId
          );

          console.log(
            `📊 QuestionBankImportModal: Import result for ${file.name}:`,
            importResult
          );

          // Update status based on result
          const isSuccess = importResult.saved > 0;
          if (isSuccess) {
            hasSuccessfulImport = true;
            console.log(
              `✅ QuestionBankImportModal: Successfully imported ${importResult.saved} questions from ${file.name}`
            );
          } else {
            console.log(
              `⚠️ QuestionBankImportModal: No questions imported from ${file.name}`
            );
          }

          setImportResults((prev) =>
            prev.map((result, index) =>
              index === i
                ? {
                    ...result,
                    status: isSuccess ? 'success' : 'error',
                    message: importResult.notes
                      ? importResult.notes.join(', ')
                      : 'Import completed',
                  }
                : result
            )
          );
        } catch (error: any) {
          console.error(
            `❌ QuestionBankImportModal: Failed to import ${file.name}:`,
            error
          );
          setImportResults((prev) =>
            prev.map((result, index) =>
              index === i
                ? {
                    ...result,
                    status: 'error',
                    message:
                      error.response?.data?.message ||
                      error.message ||
                      'Import failed',
                  }
                : result
            )
          );
        }
      }

      // Call refresh functions if any imports were successful
      if (hasSuccessfulImport) {
        console.log(
          '🔄 QuestionBankImportModal: Calling refresh functions after successful import'
        );
        onImportSuccess();
        onRefreshQuestionBanks?.();
      }
    } catch (error) {
      console.error(
        '❌ QuestionBankImportModal: Failed to import files:',
        error
      );
    } finally {
      setIsImporting(false);
    }
  };

  const resetModal = () => {
    setSelectedFiles([]);
    setImportResults([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 relative animate-fade-in max-h-[90vh] overflow-y-auto">
        <button
          onClick={resetModal}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={20} className="text-gray-500" />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-heading">
          Import Questions
        </h2>

        <div className="space-y-6">
          {/* Question Bank Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">
              Target Question Bank
            </h3>
            {availableQuestionBanks.length > 0 ? (
              <div>
                <select
                  value={targetQuestionBank?.id || ''}
                  onChange={(e) => {
                    const bankId = Number(e.target.value);
                    const bank =
                      availableQuestionBanks.find((b) => b.id === bankId) ||
                      null;
                    setTargetQuestionBank(bank);
                  }}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a question bank</option>
                  {availableQuestionBanks.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.title}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-blue-600 mt-1">
                  Or leave empty to create a new question bank
                </p>
              </div>
            ) : (
              <p className="text-sm text-blue-700">
                Will create a new question bank
              </p>
            )}
          </div>

          {/* File Selection */}
          <div>
            <label className="block text-sm font-semibold mb-3 text-heading">
              Select Files
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-btn transition-colors">
              <input
                type="file"
                multiple
                accept=".csv,.pdf,.docx,.txt"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                disabled={isImporting}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-sm text-gray-600">
                  Click to select files or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Supports CSV, PDF, DOCX, and TXT files
                </p>
              </label>
            </div>
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div>
              <h3 className="font-semibold text-heading mb-3">
                Selected Files
              </h3>
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="text-gray-500" size={16} />
                      <span className="text-sm font-medium">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {importResults[index] && (
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            importResults[index].status === 'success'
                              ? 'bg-green-100 text-green-700'
                              : importResults[index].status === 'error'
                                ? 'bg-red-100 text-red-700'
                                : importResults[index].status === 'importing'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {importResults[index].status}
                        </span>
                      )}
                      <button
                        onClick={() => removeFile(index)}
                        className="p-1 hover:bg-red-100 rounded transition-colors"
                        disabled={isImporting}
                      >
                        <X size={14} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Import Results */}
          {importResults.some((result) => result.status !== 'pending') && (
            <div>
              <h3 className="font-semibold text-heading mb-3">
                Import Results
              </h3>
              <div className="space-y-2">
                {importResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      result.status === 'success'
                        ? 'bg-green-50 border-green-200'
                        : result.status === 'error'
                          ? 'bg-red-50 border-red-200'
                          : result.status === 'importing'
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {result.filename}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          result.status === 'success'
                            ? 'bg-green-100 text-green-700'
                            : result.status === 'error'
                              ? 'bg-red-100 text-red-700'
                              : result.status === 'importing'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {result.status}
                      </span>
                    </div>
                    {result.message && (
                      <p className="text-xs text-gray-600 mt-1">
                        {result.message}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <StandardButton
              color="secondary-btn"
              onClick={resetModal}
              disabled={isImporting}
            >
              Cancel
            </StandardButton>
            <StandardButton
              color="primary-btn"
              onClick={handleImport}
              disabled={selectedFiles.length === 0 || isImporting}
              icon={isImporting ? undefined : <Upload size={16} />}
            >
              {isImporting ? 'Importing...' : 'Import Questions'}
            </StandardButton>
          </div>
        </div>
      </div>
    </div>
  );
};
