import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../../ui/Button';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
  level?: 'app' | 'route' | 'feature';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDiagnostics: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDiagnostics: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    // In production, send to telemetry / audit logging service
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDiagnostics: false,
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  toggleDiagnostics = (): void => {
    this.setState((prev) => ({ showDiagnostics: !prev.showDiagnostics }));
  };

  render(): ReactNode {
    const { hasError, error, errorInfo, showDiagnostics } = this.state;
    const {
      fallbackTitle = 'Telemetry Module Disrupted',
      fallbackMessage = 'An unexpected runtime anomaly occurred in this operational view. Surrounding systems remain functional.',
      level = 'feature',
      children,
    } = this.props;

    if (hasError) {
      return (
        <div
          role="alert"
          className={`
            flex flex-col items-center justify-center p-6 rounded-xl border border-red-500/40
            bg-slate-950/90 text-center shadow-glow-red/20 my-4 text-left
            ${level === 'app' ? 'min-h-[50vh]' : 'min-h-[220px]'}
          `.trim()}
        >
          <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-500/60 flex items-center justify-center text-red-400 mb-3 shadow-glow-red/30">
            <AlertOctagon className="w-6 h-6" />
          </div>

          <h2 className="text-base font-bold text-white mb-1">{fallbackTitle}</h2>
          <p className="text-xs text-slate-400 max-w-md mb-4 text-center">{fallbackMessage}</p>

          <div className="flex items-center gap-3">
            <Button
              variant="danger"
              size="sm"
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={this.handleReset}
            >
              Recover Module
            </Button>
            <Button
              variant="ghost"
              size="sm"
              rightIcon={showDiagnostics ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              onClick={this.toggleDiagnostics}
            >
              {showDiagnostics ? 'Hide Diagnostic' : 'View Diagnostic'}
            </Button>
          </div>

          {showDiagnostics && (
            <div className="mt-4 p-3 bg-slate-900 border border-slate-800 rounded w-full max-w-lg text-left overflow-x-auto text-[11px] font-mono text-red-300">
              <p className="font-bold text-red-400 mb-1">Error: {error?.toString()}</p>
              <pre className="text-slate-400 text-[10px] leading-tight whitespace-pre-wrap">
                {errorInfo?.componentStack || error?.stack || 'No stack trace available.'}
              </pre>
            </div>
          )}
        </div>
      );
    }

    return children;
  }
}
