// tailwind.config.js
import { type Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class', // Enable manual dark mode toggle
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  variants: {
    extend: {
      display: ['group-hover', 'radix-state-open'],
    },
  },
  theme: {
    extend: {
      colors: {
        // === Light/Dark Mode Color System ===
        // Sidebar
        'sidebar-bg': '#1E293B',
        'sidebar-bg-dark': '#0F172A',
        'sidebar-text': '#FFFFFF',
        'sidebar-text-dark': '#F8FAFC',
        'logo-indigo': '#818CF8',
        'nav-link': '#D1D5DB',
        'nav-link-dark': '#E2E8F0',
        'nav-hover': '#334155',
        'nav-hover-dark': '#1E293B',
        'filter-heading': '#9CA3AF',
        'filter-heading-dark': '#CBD5E1',
        'select-border': '#475569',
        'select-border-dark': '#334155',
        'select-border-focus': '#6366F1',

        // Main Content
        page: '#FAFAF6',
        'page-dark': '#1E293B',
        heading: '#1F2937',
        'heading-dark': '#F8FAFC',
        'primary-btn': '#6366F1',
        'primary-btn-hover': '#4F46E5',
        'input-border': '#D1D5DB',
        'input-border-dark': '#475569',
        'search-icon': '#9CA3AF',
        'search-icon-dark': '#CBD5E1',

        // Card System
        card: '#FFFFFF',
        'card-dark': '#334155',
        'card-subtitle': '#6B7280',
        'card-subtitle-dark': '#E2E8F0',
        'card-info': '#4B5563',
        'card-info-dark': '#F1F5F9',
        'accent-emerald': '#10B981',
        'accent-amber': '#F59E0B',
        'accent-indigo': '#6366F1',
        'secondary-btn': '#F3F4F6',
        'secondary-btn-dark': '#334155',
        'secondary-btn-hover': '#EEF2FF',
        'secondary-btn-hover-dark': '#475569',
        'secondary-blue': '#E0E7FF',
        'secondary-blue-dark': '#1E293B',
        'secondary-blue-hover': '#C7D2FE',
        'secondary-blue-hover-dark': '#334155',

        // Status & Action Buttons
        'danger-btn': '#EF4444',
        'danger-btn-hover': '#DC2626',
        'success-btn': '#10B981',
        'success-btn-hover': '#059669',
        'warning-btn': '#F59E0B',
        'warning-btn-hover': '#D97706',
        'info-btn': '#3B82F6',
        'info-btn-hover': '#2563EB',

        // === Status Colors ===
        'status-active': '#10B981',
        'status-inactive': '#EF4444',
        'status-pending': '#F59E0B',
        'status-approved': '#10B981',

        // === Background Variants ===
        'page-bg': '#FAFAF6',
        'card-bg': '#FFFFFF',
        'input-bg': '#FFFFFF',
        'disabled-bg': '#F3F4F6',

        // === Border Colors ===
        'border-light': '#E5E7EB',
        'border-medium': '#D1D5DB',
        'border-dark': '#9CA3AF',

        // === Text Colors ===
        'text-primary': '#1F2937',
        'text-primary-dark': '#F8FAFC',
        'text-secondary': '#4B5563',
        'text-secondary-dark': '#F1F5F9',
        'text-muted': '#6B7280',
        'text-muted-dark': '#E2E8F0',
        'text-light': '#9CA3AF',
        'text-light-dark': '#CBD5E1',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        plex: ['IBM Plex Sans', 'sans-serif'],
        // Add system font fallbacks
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      fontSize: {
        // Enhanced font sizes for admin panel
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      spacing: {
        // Custom spacing for admin layouts
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
        '34': '8.5rem',
        '38': '9.5rem',
      },
      boxShadow: {
        // Enhanced shadows for admin components
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover':
          '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        dropdown:
          '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        modal:
          '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      },
      borderRadius: {
        // Consistent border radius
        DEFAULT: '0.5rem',
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
      },
      keyframes: {
        glow: {
          '0%, 100%': {
            boxShadow: '0 0 30px 8px var(--glow-color)',
          },
          '50%': {
            boxShadow: '0 0 60px 16px var(--glow-color)',
          },
        },
        // Additional animations for admin panel
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        'glow-slow': 'glow 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 2s ease-in-out infinite',
      },
      transitionDuration: {
        // Custom transition durations
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

export default config;
