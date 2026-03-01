// Common CSS classes for admin components
export const adminStyles = {
  // Layout
  pageContainer: 'space-y-6',
  fullScreenCenter: 'min-h-screen flex items-center justify-center',
  maxWidthContainer: 'max-w-md w-full space-y-8 p-8',
  maxWidthLarge: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  centerContent: 'text-center',
  centerSection: 'text-center mb-16',

  // Headers
  pageHeader: 'flex items-center justify-between',
  pageTitle:
    'text-heading dark:text-heading-dark text-2xl font-bold font-inter',
  pageSubtitle: 'text-card-info dark:text-card-info-dark mt-1 font-inter',
  authTitle: 'text-3xl font-plex font-bold text-heading dark:text-heading-dark',
  authSubtitle: 'mt-2 text-sm text-card-subtitle dark:text-card-subtitle-dark',
  sectionTitle:
    'text-lg font-plex font-semibold text-heading dark:text-heading-dark mb-2',
  heroTitle:
    'text-5xl font-plex font-bold text-heading dark:text-heading-dark mb-6',
  heroSubtitle:
    'text-xl text-card-info dark:text-card-info-dark max-w-3xl mx-auto leading-relaxed',

  // Navigation
  navbar: 'bg-card dark:bg-card-dark shadow-sm',
  navContainer: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6',
  navContent: 'flex items-center justify-between',
  navBrand: 'flex items-center',
  navIcon:
    'w-12 h-12 bg-primary-btn rounded-lg flex items-center justify-center mr-4',
  navIconLarge: 'w-7 h-7 text-white',
  navTitle: 'text-3xl font-plex font-bold text-heading dark:text-heading-dark',
  navSubtitle: 'text-card-subtitle dark:text-card-subtitle-dark',
  navLinks: 'hidden md:flex space-x-4',
  navLink: 'text-accent-indigo hover:underline',

  // Cards and Containers
  mainCard: 'bg-card dark:bg-card-dark rounded-lg shadow-lg p-8',
  authCard: 'bg-card dark:bg-card-dark rounded-lg shadow-lg p-8',
  featureCard: 'bg-card dark:bg-card-dark rounded-xl shadow-lg p-8',
  featureCardCenter:
    'bg-card dark:bg-card-dark rounded-xl shadow-lg p-8 text-center',
  infoCard:
    'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md p-4',
  warningCard:
    'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-6',
  iconContainer:
    'mx-auto w-16 h-16 bg-primary-btn rounded-lg flex items-center justify-center mb-4',
  iconContainerLarge:
    'w-20 h-20 bg-primary-btn rounded-full flex items-center justify-center mx-auto mb-6',
  iconContainerEmerald:
    'w-20 h-20 bg-accent-emerald rounded-full flex items-center justify-center mx-auto mb-6',
  statusIconContainer:
    'mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4',

  // Grid layouts
  gridTwoCol: 'grid md:grid-cols-2 gap-8 mb-16',

  // Icons
  iconLarge: 'w-8 h-8 text-white',
  iconXLarge: 'w-10 h-10 text-white',
  iconMedium: 'w-6 h-6 text-green-600',
  iconSmall: 'w-5 h-5 text-blue-400 mt-0.5 mr-2',
  iconCheck: 'w-5 h-5 text-accent-emerald mr-3',
  iconWarning: 'w-6 h-6 text-yellow-400 mt-1 mr-4 flex-shrink-0',

  // Error/Success Messages
  errorMessage:
    'bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded',
  successMessage:
    'bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded',
  warningMessage:
    'bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded',

  // Filters and Controls
  filterContainer: 'flex items-center space-x-4',
  filterGroup: 'flex items-center space-x-2',
  filterLabel:
    'text-card-info dark:text-card-info-dark text-sm font-medium font-inter',
  filterSelect:
    'bg-card dark:bg-card-dark text-card-info dark:text-card-info-dark border border-input-border dark:border-input-border-dark rounded py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-btn font-inter',
  countLabel: 'text-card-info dark:text-card-info-dark text-sm font-inter',

  // Loading
  loadingContainer: 'text-center py-8',
  loadingSpinner:
    'inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-btn',
  loadingSpinnerLarge:
    'animate-spin rounded-full h-12 w-12 border-b-2 border-primary-btn mx-auto mb-4',
  loadingText: 'mt-2 text-card-info dark:text-card-info-dark font-inter',

  // Buttons
  primaryButton:
    'w-full bg-primary-btn hover:bg-primary-btn-hover text-white py-2 px-4 rounded-md font-medium transition-colors',
  primaryButtonLarge:
    'bg-primary-btn hover:bg-primary-btn-hover text-white px-8 py-3 rounded-lg font-medium transition-colors',
  secondaryButton:
    'w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-card-info dark:text-card-info-dark py-2 px-4 rounded-md font-medium transition-colors',
  buttonGroup: 'space-y-3',

  // Lists
  featureList: 'space-y-3 text-card-info dark:text-card-info-dark',
  featureItem: 'flex items-center',

  // Tables
  tableContainer: 'bg-card dark:bg-card-dark rounded-lg shadow overflow-hidden',
  table: 'w-full text-left text-sm',
  tableHeader:
    'bg-sidebar-bg dark:bg-sidebar-bg-dark text-sidebar-text dark:text-sidebar-text-dark',
  tableHeaderCell: 'py-3 px-4 font-semibold font-inter',
  tableRow:
    'border-b last:border-none hover:bg-page dark:hover:bg-page-dark transition-colors',
  tableCell: 'py-3 px-4 font-inter text-card-info dark:text-card-info-dark',
  tableCellMedium:
    'py-3 px-4 font-medium font-inter text-card-info dark:text-card-info-dark',
  tableCellInfo: 'py-3 px-4 text-card-info dark:text-card-info-dark font-inter',
  emptyState:
    'text-center py-8 text-card-info dark:text-card-info-dark font-inter',

  // Action buttons
  actionGroup: 'flex space-x-1',
  actionButton: 'text-xs px-2 py-1',

  // Status badges
  badgeBase:
    'px-2 py-1 rounded text-xs font-medium flex items-center font-inter',
  badgeInactive: 'bg-red-100 text-red-800',
  badgeSuperuser: 'bg-purple-100 text-purple-800',
  badgeAdmin: 'bg-green-100 text-green-800',
  badgeActive: 'bg-blue-100 text-blue-800',
  badgeRole: 'px-2 py-1 rounded text-xs font-medium font-inter',
  badgeRoleAdmin: 'bg-purple-100 text-purple-800',
  badgeRoleInstructor: 'bg-blue-100 text-blue-800',

  // MFA status
  mfaEnabled: 'text-green-600 font-medium',
  mfaDisabled: 'text-gray-400',

  // Text styles
  bodyText: 'text-card-info dark:text-card-info-dark',
  bodyTextMuted: 'text-card-subtitle dark:text-card-subtitle-dark',
  bodyTextSmall: 'text-sm text-card-subtitle dark:text-card-subtitle-dark',
  bodyTextBold: 'text-card-info dark:text-card-info-dark font-medium',
  warningTitle: 'text-lg font-semibold text-yellow-800 mb-2',
  warningText: 'text-yellow-700',

  // Layout utilities
  spacingSection: 'mb-6',
  spacingSmall: 'mb-4',
  spacingLarge: 'py-16',
  spacingTop: 'mt-16',
  flexRow: 'flex',
  flexCol: 'flex flex-col',
  flexCenter: 'flex items-center justify-center',
  flexBetween: 'flex flex-col md:flex-row justify-between items-center',
  flexStart: 'flex items-start',

  // Background utilities
  pageBg: 'bg-page dark:bg-page-dark font-inter',
  minScreenBg: 'bg-page dark:bg-page-dark font-inter min-h-screen',
  cardBg: 'bg-card dark:bg-card-dark',

  // Footer
  footer:
    'bg-card dark:bg-card-dark border-t border-input-border dark:border-input-border-dark py-8 mt-16',
  footerLinks: 'flex space-x-6',
  footerLink: 'text-accent-indigo hover:underline text-sm',

  // Form elements
  formGroup: 'space-y-4',
  formInput:
    'w-full px-3 py-2 border border-input-border dark:border-input-border-dark bg-card dark:bg-card-dark text-heading dark:text-heading-dark rounded-md focus:outline-none focus:ring-2 focus:ring-primary-btn',
  formLabel:
    'block text-sm font-medium text-heading dark:text-heading-dark mb-1',

  // Add these new full-width utilities
  fullWidthContainer:
    'min-h-screen min-w-[100vw] w-full bg-page dark:bg-page-dark text-heading dark:text-heading-dark font-inter',
  fullWidthSection: 'px-8 py-10',
  maxWidthCentered: 'max-w-6xl mx-auto',
  maxWidthCenteredSmall: 'max-w-4xl mx-auto',
} as const;
