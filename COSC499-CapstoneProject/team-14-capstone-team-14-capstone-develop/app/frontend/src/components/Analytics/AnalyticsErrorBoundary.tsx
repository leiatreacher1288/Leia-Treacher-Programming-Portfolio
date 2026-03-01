// src/components/Analytics/AnalyticsErrorBoundary.tsx
import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AnalyticsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      'Analytics Error Boundary caught an error:',
      error,
      errorInfo
    );
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center p-8 bg-white rounded-xl shadow-sm border border-red-200">
          <div className="text-center max-w-md">
            <div className="text-red-400 mb-4">
              <AlertTriangle size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Analytics Error
            </h3>
            <p className="text-gray-600 mb-4">
              {this.props.fallbackMessage ||
                'Something went wrong while loading the analytics data. This might be due to incomplete data or a temporary issue.'}
            </p>
            {this.props.onRetry && (
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
            )}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Technical Details
                </summary>
                <pre className="mt-2 p-3 bg-gray-50 rounded text-xs text-red-600 overflow-auto">
                  {this.state.error.message}
                  {'\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easy wrapping
export const withAnalyticsErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallbackMessage?: string
) => {
  const WrappedComponent = (props: P) => (
    <AnalyticsErrorBoundary fallbackMessage={fallbackMessage}>
      <Component {...props} />
    </AnalyticsErrorBoundary>
  );

  WrappedComponent.displayName = `withAnalyticsErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};
