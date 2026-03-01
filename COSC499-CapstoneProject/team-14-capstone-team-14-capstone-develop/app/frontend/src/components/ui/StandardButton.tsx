// src/components/ui/StandardButton.tsx
import type {
  ReactNode,
  ButtonHTMLAttributes,
  AnchorHTMLAttributes,
} from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

/** All the existing “color” options you had */
export type ButtonColor =
  | 'primary-btn'
  | 'secondary-btn'
  | 'secondary-blue'
  | 'danger-btn'
  | 'success-btn'
  | 'accent-indigo'
  | 'info-btn'
  | 'special-btn'
  | 'success-outline'
  | 'danger-outline'
  | 'info-outline';

/** Map from your old colors → Tailwind classes */
const colorClassMap: Record<ButtonColor, string> = {
  'primary-btn': 'bg-primary-btn text-white hover:bg-primary-btn-hover',
  'secondary-btn': 'bg-secondary-btn text-heading hover:bg-secondary-btn-hover',
  'secondary-blue':
    'bg-secondary-blue text-primary-btn hover:bg-secondary-blue-hover',
  'danger-btn': 'bg-danger-btn text-white hover:bg-danger-btn-hover',
  'success-btn': 'bg-success-btn text-white hover:bg-success-btn-hover',
  'accent-indigo': 'bg-accent-indigo text-white hover:bg-primary-btn-hover',
  'info-btn': 'bg-info-btn text-white hover:bg-info-btn-hover',
  'special-btn': 'bg-[#A78BFA] text-white hover:bg-[#8B5CF6]',
  'success-outline':
    'bg-green-50 text-success-btn border border-success-btn hover:bg-green-100',
  'danger-outline':
    'bg-red-50 text-danger-btn border border-danger-btn hover:bg-red-100',
  'info-outline':
    'bg-blue-50 text-info-btn border border-info-btn hover:bg-blue-100',
};

/** New “variant” options, used *instead* of color when provided */
const variantClassMap: Record<'outline' | 'default', string> = {
  outline:
    'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-100',
  default: '', // fallback to whatever colorClassMap[color] gives you
};

/** New “size” options */
const sizeClassMap: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'px-3 py-1 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-5 py-3 text-lg',
};

export interface StandardButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** your old props */
  children?: ReactNode;
  icon?: ReactNode;
  color?: ButtonColor;
  to?: string;

  /** NEW: if set, overrides colorClassMap */
  variant?: 'outline' | 'default';
  /** NEW */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StandardButton = ({
  children,
  icon,
  color = 'primary-btn',
  variant,
  size = 'md',
  to,
  className = '',
  ...props
}: StandardButtonProps) => {
  const baseStyle =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

  // choose variant classes if provided, otherwise fall back to your old color map
  const colorStyle = variant
    ? variantClassMap[variant]
    : colorClassMap[color] || colorClassMap['primary-btn'];

  const sizeStyle = sizeClassMap[size];

  const content = (
    <>
      {icon && <span className="text-base mr-2 flex-shrink-0">{icon}</span>}
      {children}
    </>
  );

  const classes = clsx(baseStyle, colorStyle, sizeStyle, className);

  if (to) {
    // render as a react-router Link
    return (
      <Link
        to={to}
        className={classes}
        {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {content}
      </Link>
    );
  }

  // render as a native button
  return (
    <button className={classes} {...props}>
      {content}
    </button>
  );
};
