import React, { useState, type ReactNode } from 'react';

type Action = {
  label: ReactNode;
  onClick: () => void;
};

interface ActionMenuProps {
  actions: Action[];
  children: ReactNode;
}

export const ActionMenu: React.FC<ActionMenuProps> = ({
  actions,
  children,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block text-left overflow-visible">
      <div onClick={() => setOpen((o) => !o)} className="cursor-pointer">
        {children}
      </div>

      {open && (
        <div
          className="
            absolute right-0 mt-1 w-36
            bg-white dark:bg-white
            border border-gray-200
            rounded-md shadow-lg z-50
            overflow-visible
          "
        >
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => {
                action.onClick();
                setOpen(false);
              }}
              className="
                block w-full text-left px-4 py-2 text-sm
                text-gray-800 hover:bg-gray-100
              "
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
