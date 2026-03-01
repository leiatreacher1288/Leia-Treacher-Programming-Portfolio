# Frontend Service

## Overview

The Frontend service is a modern React application built with TypeScript, providing a comprehensive user interface for ExamVault. Built with Vite, Tailwind CSS, and React Router, it offers responsive design, efficient data management, and seamless integration with the backend API for paper-based exam management.

## 🏗️ Architecture

### Technology Stack

**Core Framework:**
- **React 18+**: Modern React with hooks and functional components
- **TypeScript**: Type-safe development with comprehensive type definitions
- **Vite**: Fast build tool and development server
- **React Router**: Client-side routing with nested routes

**Styling & UI:**
- **Tailwind CSS**: Utility-first CSS framework
- **Headless UI**: Unstyled, accessible UI components
- **React Icons**: Comprehensive icon library
- **Custom Components**: Reusable component library

**State Management:**
- **React Context**: Global state management
- **React Query**: Server state management and caching
- **Local Storage**: Persistent client-side state

**Development Tools:**
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Vitest**: Unit testing framework
- **MSW**: API mocking for development

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── admin/           # Admin-specific components
│   ├── Analytics/       # Analytics and chart components
│   ├── cards/           # Card-based UI components
│   ├── CourseConfig/    # Course configuration components
│   ├── ExamConfig/      # Exam configuration components
│   ├── ExamDashboard/   # Exam dashboard components
│   ├── Exams/           # Exam-related components
│   ├── Layouts/         # Layout components
│   ├── navigation/      # Navigation components
│   ├── QuestionBank/    # Question bank components
│   ├── Routes/          # Route components
│   ├── ui/              # Base UI components
│   ├── variants/        # Exam variant components
│   └── Wizard/          # Wizard flow components
├── pages/               # Page components
│   ├── admin/           # Admin pages
│   └── [other pages]    # Main application pages
├── api/                 # API integration
├── context/             # React context providers
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── themes/              # Theme configurations
```

## 🔧 Key Components

### Admin Components
- **AdminDashboard**: Main admin interface
- **AdminUsersManagement**: User management interface
- **AdminGlobalConfig**: System configuration
- **AdminPrivacy**: Privacy and compliance tools
- **AdminHealth**: System health monitoring

### Analytics Components
- **PerformanceCharts**: Student performance visualization
- **ScoreDistributions**: Score analysis charts
- **SimilarityAnalysis**: Answer pattern similarity analysis
- **ExportReports**: Report generation tools

### Exam Components
- **ExamWizard**: Step-by-step exam creation
- **ExamConfig**: Exam configuration interface
- **VariantGenerator**: Exam variant management
- **ExamDashboard**: Exam administration interface

### Question Bank Components
- **QuestionEditor**: Question creation and editing
- **ImportWizard**: Multi-format import interface
- **QuestionPreview**: Question preview and validation
- **BulkOperations**: Bulk question management

## 📊 Features

### User Interface
- **Responsive Design**: Mobile-first responsive layout
- **Dark Mode**: Complete dark/light theme support
- **Accessibility**: WCAG 2.1 compliant components
- **Loading States**: Comprehensive loading indicators
- **Error Handling**: User-friendly error messages

### Data Management Features
- **State Updates**: Efficient data synchronization
- **API Integration**: Seamless backend communication
- **Auto-save**: Automatic form saving
- **Progress Tracking**: Operation progress indicators

### Advanced UI
- **Drag & Drop**: Intuitive drag-and-drop interfaces
- **Modal System**: Comprehensive modal management
- **Toast Notifications**: User feedback system
- **Form Validation**: Client-side validation
- **File Upload**: Multi-format file upload support

### Performance
- **Code Splitting**: Route-based code splitting
- **Lazy Loading**: Component lazy loading
- **Image Optimization**: Optimized image loading
- **Caching**: Intelligent data caching
- **Bundle Optimization**: Optimized bundle sizes

## 🛠️ Development

### Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Run linting
npm run lint
```

### Environment Configuration

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000/ws

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DARK_MODE=true
VITE_ENABLE_DEBUG_MODE=false

# External Services
VITE_SENTRY_DSN=your-sentry-dsn
VITE_GOOGLE_ANALYTICS_ID=your-ga-id
```

### Component Development

```typescript
// Example component structure
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Button, LoadingSpinner } from '@/components/ui';

interface ExamCardProps {
  exam: Exam;
  onEdit: (exam: Exam) => void;
  onDelete: (examId: string) => void;
}

export const ExamCard: React.FC<ExamCardProps> = ({ exam, onEdit, onDelete }) => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['exam-stats', exam.id],
    queryFn: () => fetchExamStats(exam.id)
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold">{exam.title}</h3>
      <p className="text-gray-600">{exam.description}</p>
      <div className="flex gap-2 mt-4">
        <Button onClick={() => onEdit(exam)}>Edit</Button>
        <Button variant="destructive" onClick={() => onDelete(exam.id)}>
          Delete
        </Button>
      </div>
    </Card>
  );
};
```

## 🧪 Testing

### Testing Strategy

```typescript
// Example test structure
import { render, screen, fireEvent } from '@testing-library/react';
import { ExamCard } from './ExamCard';

describe('ExamCard', () => {
  const mockExam = {
    id: '1',
    title: 'Test Exam',
    description: 'Test Description'
  };

  it('renders exam information correctly', () => {
    render(<ExamCard exam={mockExam} onEdit={jest.fn()} onDelete={jest.fn()} />);
    
    expect(screen.getByText('Test Exam')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = jest.fn();
    render(<ExamCard exam={mockExam} onEdit={onEdit} onDelete={jest.fn()} />);
    
    fireEvent.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledWith(mockExam);
  });
});
```

### Test Coverage

The frontend includes comprehensive tests covering:
- Component rendering and interactions
- API integration and error handling
- Form validation and submission
- Route navigation and protection
- State management and context
- Accessibility and responsive design

## 📈 Performance Optimization

### Bundle Optimization
- **Code Splitting**: Route-based and component-based splitting
- **Tree Shaking**: Unused code elimination
- **Dynamic Imports**: Lazy loading of heavy components
- **Bundle Analysis**: Bundle size optimization

### Runtime Performance
- **React.memo**: Component memoization
- **useMemo/useCallback**: Hook optimization
- **Virtual Scrolling**: Large list optimization
- **Image Lazy Loading**: Optimized image loading

### Caching Strategy
- **React Query**: Intelligent server state caching
- **Local Storage**: Persistent client state
- **Service Worker**: Offline capability
- **CDN Integration**: Static asset optimization

## 🔒 Security

### Client-Side Security
- **Input Validation**: Comprehensive form validation
- **XSS Prevention**: Content sanitization
- **CSRF Protection**: Token-based CSRF protection
- **Secure Headers**: Security header configuration

### Authentication
- **JWT Management**: Secure token handling
- **Route Protection**: Protected route components
- **Authentication Management**: Secure authentication handling
- **Logout Handling**: Secure logout process

## 🎨 Theming & Styling

- **[Tailwind Style Guide](public/tailwind-style-guide.md)** - Predefined color classes and design tokens

### Design System

```typescript
// Theme configuration
export const theme = {
  colors: {
    primary: {
      50: '#eff6ff',
      500: '#3b82f6',
      900: '#1e3a8a'
    },
    // ... other color scales
  },
  spacing: {
    // Tailwind spacing scale
  },
  typography: {
    // Typography scale
  }
};
```

### Component Library

```typescript
// Example component with theming
export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  ...props 
}) => {
  const baseClasses = 'font-medium rounded-lg transition-colors';
  const variantClasses = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    destructive: 'bg-red-500 text-white hover:bg-red-600'
  };
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]}`}
      {...props}
    >
      {children}
    </button>
  );
};
```

## 🔄 Migration History

### Recent Changes
- **v1.0**: Initial React application setup
- **v1.1**: Added TypeScript and type safety
- **v1.2**: Implemented component library
- **v1.3**: Added admin interface
- **v1.4**: Enhanced analytics components
- **v1.5**: Improved performance optimization

## 📚 Related Documentation

- [API Documentation](../docs/api/README.md)
- [Testing Guide](../docs/TESTING_GUIDE.md)
- [Troubleshooting Guide](../docs/TROUBLESHOOTING_GUIDE.md)

## 🤝 Contributing

When contributing to the frontend service:

1. **Type Safety**: Ensure all components are properly typed
2. **Accessibility**: Test with screen readers and keyboard navigation
3. **Performance**: Monitor bundle size and runtime performance
4. **Testing**: Write comprehensive tests for new components
5. **Documentation**: Update component documentation

## 📞 Support

For issues related to the frontend service:
- Check the [troubleshooting guide](../docs/TROUBLESHOOTING_GUIDE.md)
- Review the [API documentation](../docs/api/README.md)
- Create an issue with the `frontend` label
