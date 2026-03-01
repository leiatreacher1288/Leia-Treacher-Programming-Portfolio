import { UserPlus } from 'lucide-react';

interface CollaborationInvitesButtonProps {
  inviteCount: number;
  onClick: () => void;
}

export const CollaborationInvitesButton = ({
  inviteCount,
  onClick,
}: CollaborationInvitesButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="relative flex items-center gap-2 text-white bg-primary-btn hover:bg-primary-btn-hover text-sm font-medium px-4 py-2 rounded-lg transition-colors"
    >
      <UserPlus size={18} />
      Collaboration Invites
      {/* Notification Badge */}
      {inviteCount > 0 && (
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">
            {inviteCount > 9 ? '9+' : inviteCount}
          </span>
        </div>
      )}
    </button>
  );
};
