import React from 'react';
import { StandardButton } from './StandardButton';
import { Lock, AlertTriangle, Trash2, Unlock } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  variant?: 'danger' | 'primary' | 'warning';
  icon?: 'lock' | 'unlock' | 'warning' | 'trash' | 'none';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
  variant = 'danger',
  icon = 'none',
}) => {
  if (!open) return null;

  const getConfirmButtonColor = () => {
    switch (variant) {
      case 'primary':
        return 'primary-btn';
      case 'warning':
        return 'danger-btn'; // Fallback to danger for warning
      case 'danger':
      default:
        return 'danger-btn';
    }
  };

  const getIcon = () => {
    switch (icon) {
      case 'lock':
        return <Lock className="w-6 h-6 text-primary-600" />;
      case 'unlock':
        return <Unlock className="w-6 h-6 text-orange-500" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
      case 'trash':
        return <Trash2 className="w-6 h-6 text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-8">
        {/* Header with Icon and Title */}
        <div className="flex items-center gap-4 mb-6">
          {getIcon()}
          <h2 className="text-2xl font-bold text-heading">{title}</h2>
        </div>

        {/* Description */}
        {description && (
          <p className="text-card-info mb-8 leading-relaxed text-sm">
            {description}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <StandardButton
            color="secondary-btn"
            onClick={onCancel}
            disabled={loading}
            size="sm"
          >
            {cancelText}
          </StandardButton>
          <StandardButton
            color={getConfirmButtonColor()}
            onClick={onConfirm}
            disabled={loading}
            size="sm"
          >
            {loading ? 'Processing...' : confirmText}
          </StandardButton>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
