import React from 'react';

export const Sparkline: React.FC<{ data: number[]; height?: number; color?: string }> = ({
  data,
  height = 36,
  color = '#00e5ff'
}) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * 100;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg className="w-full overflow-visible" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

export const FeatureContributionBar: React.FC<{
  label: string;
  value: string | number;
  score: number;
  direction: 'INCREASES_RISK' | 'DECREASES_RISK';
}> = ({ label, value, score, direction }) => {
  const isIncrease = direction === 'INCREASES_RISK';
  const barColor = isIncrease ? 'bg-red-500' : 'bg-emerald-500';

  return (
    <div className="space-y-1 text-xs">
      <div className="flex justify-between font-mono text-[11px]">
        <span className="text-slate-300 font-medium">{label}</span>
        <span className="text-slate-400">{value}</span>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden flex">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] font-mono text-slate-500">
        <span className={isIncrease ? 'text-red-400' : 'text-emerald-400'}>
          {isIncrease ? '▲ Amplifies Hazard' : '▼ Reinforces Stability'}
        </span>
        <span>Impact: {score.toFixed(0)}%</span>
      </div>
    </div>
  );
};
