import type { Variant } from '../../api/examAPI';
import {
  Download,
  FileArchive,
  FileText,
  FileStack,
  XCircle,
} from 'lucide-react';
import { SectionTitle } from '../cards/SectionTitle';
import { StandardButton } from '../ui/StandardButton';
import clsx from 'clsx';
import { useState } from 'react';
import ConfirmModal from '../ui/ConfirmModal';
import axiosInstance from '../../api/axiosInstance';

interface ExportSetCardProps {
  exportSet: {
    id: number;
    exported_at: string;
    variants_exported: Variant[];
    export_format: string;
    exported_by?: string;
  };
  index: number;
}

export const ExportSetCard = ({ exportSet, index }: ExportSetCardProps) => {
  const [visible, setVisible] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  if (!visible) return null;

  const date = exportSet.exported_at ? new Date(exportSet.exported_at) : null;
  const formatted =
    date && !isNaN(date.getTime())
      ? date.toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Unknown';

  const variantCount = exportSet.variants_exported?.length || 0;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // Use axiosInstance to ensure Authorization header is sent
      await axiosInstance.delete(`/export_history/${exportSet.id}/`);
      setVisible(false);
    } catch {
      alert('Failed to delete export history.');
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div
      className={clsx(
        'bg-card border border-border-light rounded-lg shadow-sm hover:shadow-md transition mb-8 px-6 py-4 relative group',
        index === 0 ? 'mt-2' : ''
      )}
    >
      {/* Delete Icon Button - top right */}
      <StandardButton
        icon={<XCircle size={20} />}
        color="danger-outline"
        className="absolute top-3 right-3 p-2 !px-2 !py-2 rounded-full opacity-70 hover:opacity-100 transition"
        onClick={() => setShowConfirm(true)}
        disabled={deleting}
        aria-label="Delete Export Record"
      />
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-y-2">
        <div className="flex items-center gap-4 flex-wrap">
          <SectionTitle
            icon={<FileStack className="text-primary-btn w-5 h-5" />}
            title={`Exported on ${formatted}`}
          />
          <span className="ml-2 inline-block text-xs bg-blue-100 text-blue-700 rounded-full px-3 py-1 font-semibold align-middle">
            {variantCount} variant{variantCount !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <StandardButton
            icon={<Download size={16} />}
            color="primary-btn"
            onClick={() => alert('Export all DOCX')}
          >
            Export All Variants (DOCX)
          </StandardButton>
          <StandardButton
            icon={<FileText size={16} />}
            color="secondary-blue"
            onClick={() => alert('Export all Answer Keys')}
          >
            Export All Answer Keys (PDF)
          </StandardButton>
          <StandardButton
            icon={<FileText size={16} />}
            color="secondary-blue"
            onClick={() => alert('Export Bubble Sheets')}
          >
            Export Bubble Sheets (PDF)
          </StandardButton>
          <StandardButton
            icon={<FileArchive size={16} />}
            color="secondary-btn"
            onClick={() => alert('Export ZIP')}
          >
            Export All (ZIP)
          </StandardButton>
        </div>
      </div>
      {/* Variants Row */}
      <div className="divide-y divide-border-light">
        {Array.isArray(exportSet.variants_exported) &&
        exportSet.variants_exported.length > 0 ? (
          exportSet.variants_exported.map((variant) => (
            <div key={variant.id} className="py-2 px-2">
              <span className="font-semibold">
                Variant {variant.version_label}
              </span>
            </div>
          ))
        ) : (
          <div className="py-2 px-2 text-card-info">No variants exported.</div>
        )}
      </div>
      {/* Confirm Modal */}
      {showConfirm && (
        <ConfirmModal
          open={showConfirm}
          title="Delete Export Record?"
          description="Are you sure you want to delete this export record? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
          loading={deleting}
        />
      )}
    </div>
  );
};
