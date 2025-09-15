import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class AppErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Error Boundary caught an error:', error, errorInfo);
  }

  private getErrorReport = () => {
    const { error } = this.state;
    const timestamp = new Date().toISOString();
    const userAgent = navigator.userAgent;
    const url = window.location.href;

    return `Error Report - ${timestamp}
    
URL: ${url}
User Agent: ${userAgent}

Error: ${error?.name || 'Unknown Error'}
Message: ${error?.message || 'No message available'}

Stack Trace:
${error?.stack || 'No stack trace available'}

Component Stack:
${this.state.hasError ? 'Error occurred in React component tree' : 'N/A'}
`;
  };

  private copyErrorReport = async () => {
    try {
      await navigator.clipboard.writeText(this.getErrorReport());
      alert('Error report copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy error report:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = this.getErrorReport();
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Error report copied to clipboard!');
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-6">An unexpected error occurred. Please refresh the page.</p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-3"
              >
                Reload Page
              </button>
              <button
                onClick={this.copyErrorReport}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Copy Error Report
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}