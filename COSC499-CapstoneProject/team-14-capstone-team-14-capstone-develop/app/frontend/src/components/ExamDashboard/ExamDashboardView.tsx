import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Wand2,
  Users,
  Calendar,
  BookOpen,
  Hash,
  Target,
  Scale,
  FileText,
} from 'lucide-react';
import type { ExamDetail } from '../../api/examAPI';
import { AnalyticsModal } from './AnalyticsModal';
import { AnalyticsPreviewCard } from './AnalyticsPreviewCard';
import { VariantSetManager } from '../variants/VariantSetManager';
import { ExportCard } from './ExportCard';
import { ResultsCard } from './ResultsCard';

interface ExamDashboardViewProps {
  exam: ExamDetail;
  course: any;
  onGenerateVariants: () => Promise<void>;
  onWizardOpen: () => void;
  onVariantEdit?: () => void;
  prioritizeRecentSet?: boolean; // New prop to prioritize recent set when coming from wizard
}

export const ExamDashboardView: React.FC<ExamDashboardViewProps> = ({
  exam,
  course,
  onGenerateVariants,
  onWizardOpen,
  onVariantEdit,
  prioritizeRecentSet = false,
}) => {
  const navigate = useNavigate();
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [currentVariantSet, setCurrentVariantSet] = useState<any>(null);

  // Calculate exam metadata for the header
  const examMetadata = {
    variants: currentVariantSet?.variants?.length || exam.variants?.length || 0,
    questionsPerVariant: exam.questions_per_variant,
    weight: exam.weight || 0,
    requiredToPass: exam.required_to_pass || false,
    lastEdited: new Date(exam.updated_at).toLocaleDateString(),
    createdBy: exam.created_by_name || 'Unknown',
  };

  const handleBackToCourse = () => {
    if (course?.id) {
      navigate(`/courses/${course.id}`);
    } else {
      navigate(-1); // Fallback to browser history
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToCourse}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Course
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {exam.title}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {course?.title} • {course?.code}
                  </p>
                  {exam.description && (
                    <p className="text-sm text-gray-500 mt-1">
                      {exam.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onWizardOpen}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              <Wand2 className="w-4 h-4" />
              Edit with Wizard
            </button>
          </div>
        </div>
      </div>

      {/* Exam Metadata Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-2">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Variants</p>
                <p className="font-semibold">{examMetadata.variants}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Questions</p>
                <p className="font-semibold">
                  {examMetadata.questionsPerVariant}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Weight</p>
                <p className="font-semibold">{examMetadata.weight}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Required</p>
                <p className="font-semibold">
                  {examMetadata.requiredToPass ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Last Edited</p>
                <p className="font-semibold">{examMetadata.lastEdited}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Created By</p>
                <p className="font-semibold">{examMetadata.createdBy}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-4">
        {/* Top Row - Variants and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <VariantSetManager
            examTitle={exam.title}
            examId={exam.id}
            onGenerateVariants={onGenerateVariants}
            onLockSet={async (setId) => {
              // TODO: Implement lock set functionality
              console.log('Lock set:', setId);
            }}
            onDeleteSet={async (setId) => {
              // TODO: Implement delete set functionality
              console.log('Delete set:', setId);
            }}
            onEditVariant={(variant) => {
              // TODO: Implement edit variant functionality
              console.log('Edit variant:', variant);
              // For now, just call the parent's onVariantEdit
              onVariantEdit?.();
            }}
            onExportVariant={(variant) => {
              // TODO: Implement export variant functionality
              console.log('Export variant:', variant);
            }}
            onCurrentVariantSetChange={setCurrentVariantSet}
            prioritizeRecentSet={prioritizeRecentSet}
          />
          <AnalyticsPreviewCard
            exam={exam}
            onViewFull={() => setShowAnalyticsModal(true)}
            currentVariantSet={currentVariantSet}
          />
        </div>

        {/* Bottom Row - Export and Results */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ExportCard
            examId={exam.id}
            examTitle={exam.title}
            variantCount={
              currentVariantSet?.variants?.length || exam.variants?.length || 0
            }
            currentVariantSet={currentVariantSet}
          />
          <div className="md:col-span-2">
            <ResultsCard
              exam={exam}
              currentVariantSet={currentVariantSet}
              onVariantSetChange={setCurrentVariantSet}
            />
          </div>
        </div>
      </div>

      {/* Analytics Modal */}
      <AnalyticsModal
        isOpen={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
        exam={exam}
        currentVariantSet={currentVariantSet}
      />
    </div>
  );
};
