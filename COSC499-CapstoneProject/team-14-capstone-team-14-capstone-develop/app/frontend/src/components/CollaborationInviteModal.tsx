import { useState } from 'react';
import { X, UserPlus, Check, XCircle, Users } from 'lucide-react';

interface CourseInvite {
  id: number;
  courseId: number;
  courseCode: string;
  courseTitle: string;
  inviterName: string;
  inviterEmail: string;
  role: 'SEC' | 'TA' | 'OTH';
  permissions: 'FULL' | 'LIMITED' | 'NONE';
  createdAt: string;
}

interface CollaborationInvitesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (inviteId: number) => Promise<void>;
  onDecline: (inviteId: number) => Promise<void>;
  invites: CourseInvite[];
}

const ROLE_LABELS = {
  SEC: 'Secondary Instructor',
  TA: 'Teaching Assistant',
  OTH: 'Other',
};

const PERMISSION_LABELS = {
  FULL: 'Full Access',
  LIMITED: 'Limited Access',
  NONE: 'No Access',
};

export const CollaborationInvitesModal = ({
  isOpen,
  onClose,
  onAccept,
  onDecline,
  invites,
}: CollaborationInvitesModalProps) => {
  const [processingInvites, setProcessingInvites] = useState<Set<number>>(
    new Set()
  );
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAccept = async (inviteId: number) => {
    setProcessingInvites((prev) => new Set(prev).add(inviteId));
    setError(null);

    try {
      await onAccept(inviteId);
    } catch (err: any) {
      console.error('Failed to accept invite:', err);
      setError('Failed to accept invitation. Please try again.');
      setProcessingInvites((prev) => {
        const next = new Set(prev);
        next.delete(inviteId);
        return next;
      });
    }
  };

  const handleDecline = async (inviteId: number) => {
    setProcessingInvites((prev) => new Set(prev).add(inviteId));
    setError(null);

    try {
      await onDecline(inviteId);
    } catch (err: any) {
      console.error('Failed to decline invite:', err);
      setError('Failed to decline invitation. Please try again.');
      setProcessingInvites((prev) => {
        const next = new Set(prev);
        next.delete(inviteId);
        return next;
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        data-testid="modal-backdrop"
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users size={20} className="text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Collaboration Invites
              </h2>
            </div>
            <button
              onClick={onClose}
              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {invites.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-3 bg-gray-100 rounded-full inline-flex mb-4">
                  <UserPlus size={24} className="text-gray-400" />
                </div>
                <p className="text-gray-500">No pending invitations</p>
              </div>
            ) : (
              <div className="space-y-4">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {invite.courseCode}
                          </h3>
                          <span className="text-sm text-gray-500">
                            {formatDate(invite.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-2">
                          {invite.courseTitle}
                        </p>
                        <div className="space-y-1 text-sm">
                          <p className="text-gray-600">
                            <span className="font-medium">Invited by:</span>{' '}
                            {invite.inviterName} ({invite.inviterEmail})
                          </p>
                          <p className="text-gray-600">
                            <span className="font-medium">Role:</span>{' '}
                            {ROLE_LABELS[invite.role]}
                          </p>
                          <p className="text-gray-600">
                            <span className="font-medium">Permissions:</span>{' '}
                            {PERMISSION_LABELS[invite.permissions]}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleDecline(invite.id)}
                          disabled={processingInvites.has(invite.id)}
                          className="px-3 py-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-sm font-medium"
                        >
                          {processingInvites.has(invite.id) ? (
                            <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <XCircle size={14} />
                          )}
                          Decline
                        </button>
                        <button
                          onClick={() => handleAccept(invite.id)}
                          disabled={processingInvites.has(invite.id)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-sm font-medium"
                        >
                          {processingInvites.has(invite.id) ? (
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Check size={14} />
                          )}
                          Accept
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
