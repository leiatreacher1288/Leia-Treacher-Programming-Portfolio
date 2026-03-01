import {
  Provider as TooltipProvider,
  Root as Tooltip,
  Trigger as TooltipTrigger,
  Content as RadixTooltipContent,
  Portal as TooltipPortal,
  Arrow as TooltipArrow,
} from '@radix-ui/react-tooltip';

import { type ReactNode } from 'react';
import clsx from 'clsx';

interface TooltipContentProps {
  children: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

// Export this for wrapping the whole app, only once in app.tsx
export { TooltipProvider };

// Use this in each tooltip
export { Tooltip, TooltipTrigger };

export const TooltipContent = ({
  children,
  side = 'top',
}: TooltipContentProps) => (
  <TooltipPortal>
    <RadixTooltipContent
      side={side}
      sideOffset={6}
      className={clsx(
        'z-50 max-w-xs rounded-md bg-gray-900 px-3 py-2 text-sm text-white shadow-md animate-fade-in'
      )}
    >
      {children}
      <TooltipArrow className="fill-gray-900" />
    </RadixTooltipContent>
  </TooltipPortal>
);
