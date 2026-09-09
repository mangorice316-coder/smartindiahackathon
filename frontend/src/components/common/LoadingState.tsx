import React from 'react';
import { AlertTriangle, WifiOff, Clock, ShieldAlert, FileQuestion, RefreshCw, ServerCrash } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  subMessage?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading operational telemetry...',
  subMessage = 'Querying catchment sensors & geotechnical models'
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-3">
      <div className="relative flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-slate-700 border-t-cyan-400 rounded-full animate-spin" />
        <span className="absolute w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
      </div>
      <div className="text-center">
        <p className="text-xs font-mono font-semibold uppercase text-slate-200 tracking-wider">{message}</p>
        <p className="text-[11px] text-slate-500 font-sans mt-0.5">{subMessage}</p>
      </div>
    </div>
  );
};

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Records Found',
  description = 'No telemetry or events match current filter criteria.',
  action
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-800 rounded-lg bg-slate-900/20">
      <FileQuestion className="w-8 h-8 text-slate-600 mb-2" />
      <h4 className="text-xs font-mono font-semibold uppercase text-slate-300">{title}</h4>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded border border-slate-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export type KnownErrorCode =
  | 'NO_DATA'
  | 'DATA_UNAVAILABLE'
  | 'API_TIMEOUT'
  | 'INVALID_LOCATION'
  | 'MODEL_UNAVAILABLE'
  | 'MISSING_FEATURE'
  | 'INSUFFICIENT_DATA'
  | 'PERMISSION_DENIED'
  | 'SERVER_ERROR';

interface ErrorStateProps {
  errorCode?: KnownErrorCode | string;
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  errorCode = 'SERVER_ERROR',
  title,
  message,
  onRetry
}) => {
  const getErrorMeta = () => {
    switch (errorCode) {
      case 'API_TIMEOUT':
        return {
          icon: <Clock className="w-8 h-8 text-amber-500" />,
          defaultTitle: 'Telemetry Synchronization Delayed',
          defaultMessage: 'The remote meteorological station took longer than expected to respond. System is operating continuously on latest verified observations.'
        };
      case 'DATA_UNAVAILABLE':
        return {
          icon: <WifiOff className="w-8 h-8 text-orange-500" />,
          defaultTitle: 'Live Telemetry Stream Buffering',
          defaultMessage: 'Real-time telemetry feed is temporarily buffering. The system has automatically engaged calibrated catchment observations.'
        };
      case 'MODEL_UNAVAILABLE':
        return {
          icon: <ServerCrash className="w-8 h-8 text-amber-400" />,
          defaultTitle: 'Risk Assessment Temporarily Unavailable',
          defaultMessage: 'The latest available risk assessment is still shown. Physical slope stability limit equilibrium calculations continue uninterrupted.'
        };
      case 'PERMISSION_DENIED':
        return {
          icon: <ShieldAlert className="w-8 h-8 text-red-400" />,
          defaultTitle: 'Operational Clearance Required',
          defaultMessage: 'Current security context is not authorized for this command. Switch to an authenticated Commander or Analyst role in the header.'
        };
      case 'MISSING_FEATURE':
      case 'INSUFFICIENT_DATA':
        return {
          icon: <AlertTriangle className="w-8 h-8 text-amber-400" />,
          defaultTitle: 'Feature Parameter Incomplete',
          defaultMessage: 'Certain localized slope or soil cohesion readings are incomplete. Standard regional geological priors are being applied.'
        };
      case 'INVALID_LOCATION':
        return {
          icon: <AlertTriangle className="w-8 h-8 text-amber-400" />,
          defaultTitle: 'Catchment Coordinates Outside Monitored Zone',
          defaultMessage: 'The requested sector is outside active disaster surveillance boundaries. Showing closest monitored sub-basin.'
        };
      default:
        return {
          icon: <ServerCrash className="w-8 h-8 text-amber-500" />,
          defaultTitle: 'Subsystem Synchronization Notice',
          defaultMessage: 'Unable to refresh telemetry right now. The latest available assessment is still shown to ensure continuous situational awareness.'
        };
    }
  };

  const meta = getErrorMeta();

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border border-slate-800 rounded-lg bg-slate-900/60 shadow-lg">
      <div className="mb-3">{meta.icon}</div>
      <span className="text-[10px] font-mono font-bold tracking-widest text-amber-400 uppercase bg-amber-950/60 px-2.5 py-0.5 rounded border border-amber-800/50 mb-1.5">
        OPERATIONAL ADVISORY
      </span>
      <h4 className="text-sm font-display font-semibold text-slate-100 mt-1">{title || meta.defaultTitle}</h4>
      <p className="text-xs text-slate-300 max-w-md mt-1 mb-4 font-sans leading-relaxed">{message || meta.defaultMessage}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-900/40 hover:bg-red-900/60 text-red-200 text-xs font-mono font-semibold rounded border border-red-700/60 transition-colors"
        >
          <RefreshCw size={13} />
          <span>RETRY OPERATION</span>
        </button>
      )}
    </div>
  );
};
