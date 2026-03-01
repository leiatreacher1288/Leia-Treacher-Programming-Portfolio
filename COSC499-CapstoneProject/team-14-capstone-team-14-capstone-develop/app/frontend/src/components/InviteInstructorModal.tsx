// src/components/InviteInstructorModal.tsx
import { useState } from 'react';
import { Mail, User, Send } from 'lucide-react';

interface InviteInstructorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, role: string) => Promise<void>;
  permissions?: {
    SEC: string;
    TA: string;
    OTH: string;
  };
}

export const InviteInstructorModal = ({
  isOpen,
  onClose,
  onInvite,
  permissions,
}: InviteInstructorModalProps) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('SEC'); // Default to Secondary Instructor
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await onInvite(email, role);
      setEmail('');
      setRole('SEC');
      onClose();
    } catch (err: any) {
      console.error('Failed to invite instructor:', err);
      // Extract error message from backend response
      const errorMessage =
        err?.response?.data?.error ||
        err?.message ||
        'Failed to send invitation. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions = [
    { value: 'SEC', label: 'Secondary Instructor' },
    { value: 'TA', label: 'Teaching Assistant' },
    { value: 'OTH', label: 'Other' },
  ];

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
          className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail size={20} className="text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Invite Course Collaborator
              </h2>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={16} className="text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                  placeholder="collaborator@university.edu"
                  disabled={isLoading}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                The user must have an account to be added as a collaborator
              </p>
            </div>

            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Collaborator Role
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={16} className="text-gray-400" />
                </div>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  disabled={isLoading}
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              {permissions && permissions[role as keyof typeof permissions] && (
                <p className="mt-2 text-sm text-gray-600">
                  This role will have{' '}
                  <strong>
                    {permissions[role as keyof typeof permissions]}
                  </strong>{' '}
                  to the course materials and settings.
                </p>
              )}
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-4">
              <p className="text-sm text-gray-700">
                <strong>Permission Details:</strong>
                <br />• <strong>Full Access:</strong> Can edit course, manage
                students, and modify settings
                <br />• <strong>Limited Access:</strong> Can view course
                materials but cannot make changes
                <br />• <strong>No Access:</strong> Cannot access course until
                permissions are updated
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors font-medium"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !email}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Send Invitation
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
