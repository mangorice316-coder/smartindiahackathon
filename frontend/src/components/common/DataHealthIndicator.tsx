import React from 'react';
import { DataSourceHealth, DataQualityStatus } from '../../types';
import { CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

export const DataHealthIndicator: React.FC<{ source: DataSourceHealth }> = ({ source }) => {
  const getStatusDisplay = (status: DataQualityStatus) => {
    switch (status) {
      case 'HEALTHY':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
          color: 'text-emerald-400',
          bg: 'bg-emerald-950/40 border-emerald-800/40',
          label: 'HEALTHY'
        };
      case 'DEGRADED':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
          color: 'text-amber-400',
          bg: 'bg-amber-950/40 border-amber-800/40',
          label: 'DEGRADED'
        };
      case 'STALE':
        return {
          icon: <Clock className="w-3.5 h-3.5 text-orange-400" />,
          color: 'text-orange-400',
          bg: 'bg-orange-950/40 border-orange-800/40',
          label: 'STALE'
        };
      default:
        return {
          icon: <XCircle className="w-3.5 h-3.5 text-red-400" />,
          color: 'text-red-400',
          bg: 'bg-red-950/40 border-red-800/40',
          label: 'FAILING'
        };
    }
  };

  const current = getStatusDisplay(source.quality_status);

  return (
    <div className="flex items-center justify-between p-2.5 bg-slate-900/60 border border-slate-800 rounded text-xs font-mono">
      <div className="flex items-center gap-2">
        {current.icon}
        <div>
          <span className="text-slate-200 font-semibold">{source.source_name}</span>
          <div className="text-[10px] text-slate-500">{source.provider_type}</div>
        </div>
      </div>
      <div className="text-right">
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${current.bg} ${current.color}`}>
          {current.label}
        </span>
        <div className="text-[10px] text-slate-500 mt-0.5">
          {source.freshness_seconds}s latency | {(100 - source.missing_value_rate * 100).toFixed(0)}% coverage
        </div>
      </div>
    </div>
  );
};
