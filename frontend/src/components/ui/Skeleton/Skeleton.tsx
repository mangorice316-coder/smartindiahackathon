import React from 'react';
import { SkeletonProps } from './Skeleton.types';

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  variant = 'rectangular',
  className = '',
  style,
  ...props
}) => {
  const variantStyles = {
    text: 'rounded h-4 w-full',
    rectangular: 'rounded-md',
    circular: 'rounded-full',
  }[variant];

  return (
    <div
      className={`bg-slate-800/60 animate-pulse ${variantStyles} ${className}`.trim()}
      style={{
        width,
        height,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
};

export const KpiSkeleton: React.FC = () => (
  <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 animate-pulse space-y-3">
    <div className="flex justify-between items-center">
      <div className="h-3 w-24 bg-slate-800 rounded" />
      <div className="h-4 w-4 bg-slate-800 rounded-full" />
    </div>
    <div className="h-8 w-32 bg-slate-700 rounded mt-2" />
    <div className="pt-2 border-t border-white/[0.05] flex justify-between">
      <div className="h-3 w-16 bg-slate-800 rounded" />
      <div className="h-3 w-20 bg-slate-800 rounded" />
    </div>
  </div>
);

export const ChartSkeleton: React.FC = () => (
  <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 animate-pulse space-y-4">
    <div className="flex justify-between items-center">
      <div className="h-4 w-36 bg-slate-700 rounded" />
      <div className="h-4 w-20 bg-slate-800 rounded" />
    </div>
    <div className="h-48 w-full bg-slate-800/60 rounded-xl" />
    <div className="flex justify-between items-center pt-2">
      <div className="h-3 w-28 bg-slate-800 rounded" />
      <div className="h-3 w-24 bg-slate-800 rounded" />
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 animate-pulse space-y-3">
    <div className="flex justify-between items-center">
      <div className="h-4 w-44 bg-slate-700 rounded" />
      <div className="h-8 w-32 bg-slate-800 rounded-xl" />
    </div>
    <div className="space-y-2 mt-3">
      <div className="h-8 w-full bg-slate-800 rounded-lg" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 w-full bg-slate-800/40 rounded-lg" />
      ))}
    </div>
  </div>
);

export const IncidentSkeleton: React.FC = () => (
  <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 animate-pulse space-y-4">
    <div className="flex gap-3">
      <div className="h-6 w-24 bg-red-900/50 rounded-lg" />
      <div className="h-6 w-28 bg-amber-900/50 rounded-lg" />
    </div>
    <div className="h-8 w-72 bg-slate-700 rounded" />
    <div className="h-4 w-96 bg-slate-800 rounded" />
    <div className="h-16 w-full bg-slate-800/50 rounded-xl" />
  </div>
);
