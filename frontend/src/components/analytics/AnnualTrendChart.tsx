import React, { useState } from 'react';
import { AnnualTrendDataPoint } from '../../types';
import { Calendar, Users, Mountain, Info } from 'lucide-react';

interface AnnualTrendChartProps {
  data: AnnualTrendDataPoint[];
}

export const AnnualTrendChart: React.FC<AnnualTrendChartProps> = ({ data }) => {
  const [hoveredYear, setHoveredYear] = useState<AnnualTrendDataPoint | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 font-mono text-xs">
        No annual trend series recorded.
      </div>
    );
  }

  const maxEvents = Math.max(...data.map(d => d.event_count), 5);
  const maxCasualties = Math.max(...data.map(d => d.total_casualties), 20);

  const width = 680;
  const height = 230;
  const paddingLeft = 45;
  const paddingRight = 45;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const slotWidth = chartWidth / data.length;
  const barWidth = Math.min(slotWidth * 0.55, 36);

  const getX = (index: number) => paddingLeft + index * slotWidth + slotWidth / 2;
  const getY = (count: number) => paddingTop + chartHeight - (count / maxEvents) * chartHeight;
  const getCasualtyY = (cas: number) => paddingTop + chartHeight - (cas / maxCasualties) * chartHeight;

  // Build casualty line
  const casualtyPath = data.map((d, i) => {
    const x = getX(i);
    const y = getCasualtyY(d.total_casualties);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-red-600"></span>
            <span className="text-slate-300 font-medium">Critical</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-orange-500"></span>
            <span className="text-slate-300 font-medium">Severe</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-500"></span>
            <span className="text-slate-300 font-medium">Moderate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500"></span>
            <span className="text-slate-300 font-medium">Minor</span>
          </div>
          <div className="flex items-center gap-1.5 ml-2">
            <span className="w-4 h-0.5 bg-red-400"></span>
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            <span className="text-red-300 font-medium">Casualties Line</span>
          </div>
        </div>

        <div className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
          Historical Horizon: {data[0]?.year} – {data[data.length - 1]?.year}
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative bg-slate-950/60 border border-slate-800/80 rounded-lg p-2 overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[580px] select-none">
          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = paddingTop + chartHeight * (1 - ratio);
            const eventVal = Math.round(ratio * maxEvents);
            const casVal = Math.round(ratio * maxCasualties);
            return (
              <g key={`y-grid-${idx}`} className="opacity-30">
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#334155"
                  strokeWidth="1"
                />
                <text x={paddingLeft - 8} y={y + 3} textAnchor="end" className="text-[9px] fill-slate-500 font-mono">
                  {eventVal}
                </text>
                <text x={width - paddingRight + 8} y={y + 3} textAnchor="start" className="text-[9px] fill-red-400 font-mono">
                  {casVal}
                </text>
              </g>
            );
          })}

          {/* Stacked Bars per Year */}
          {data.map((d, i) => {
            const x = getX(i) - barWidth / 2;
            let currentY = paddingTop + chartHeight;

            // Minor
            const minorHeight = (d.minor_events / maxEvents) * chartHeight;
            currentY -= minorHeight;
            const minorY = currentY;

            // Moderate
            const modHeight = (d.moderate_events / maxEvents) * chartHeight;
            currentY -= modHeight;
            const modY = currentY;

            // Severe
            const sevHeight = (d.severe_events / maxEvents) * chartHeight;
            currentY -= sevHeight;
            const sevY = currentY;

            // Critical
            const critHeight = (d.critical_events / maxEvents) * chartHeight;
            currentY -= critHeight;
            const critY = currentY;

            const isHovered = hoveredYear?.year === d.year;

            return (
              <g
                key={`year-bar-${i}`}
                className="cursor-pointer transition-all"
                onMouseEnter={() => setHoveredYear(d)}
                onMouseLeave={() => setHoveredYear(null)}
              >
                {/* Minor Segment */}
                {minorHeight > 0 && (
                  <rect x={x} y={minorY} width={barWidth} height={minorHeight} fill="#10b981" />
                )}
                {/* Moderate Segment */}
                {modHeight > 0 && (
                  <rect x={x} y={modY} width={barWidth} height={modHeight} fill="#f59e0b" />
                )}
                {/* Severe Segment */}
                {sevHeight > 0 && (
                  <rect x={x} y={sevY} width={barWidth} height={sevHeight} fill="#f97316" />
                )}
                {/* Critical Segment */}
                {critHeight > 0 && (
                  <rect x={x} y={critY} width={barWidth} height={critHeight} fill="#ef4444" rx={1} />
                )}

                {/* Total label above bar */}
                {d.event_count > 0 && (
                  <text
                    x={getX(i)}
                    y={Math.max(currentY - 4, paddingTop + 8)}
                    textAnchor="middle"
                    className="text-[10px] font-mono font-bold fill-slate-200"
                  >
                    {d.event_count}
                  </text>
                )}
              </g>
            );
          })}

          {/* Casualties Trend Line */}
          <path
            d={casualtyPath}
            fill="none"
            stroke="#f87171"
            strokeWidth="2.5"
            strokeDasharray="4 2"
            strokeLinecap="round"
          />

          {/* Casualties Points */}
          {data.map((d, i) => {
            const cx = getX(i);
            const cy = getCasualtyY(d.total_casualties);
            return (
              <circle
                key={`cas-pt-${i}`}
                cx={cx}
                cy={cy}
                r={3.5}
                fill="#ef4444"
                stroke="#ffffff"
                strokeWidth={1}
              />
            );
          })}

          {/* X Axis Year Labels */}
          {data.map((d, i) => (
            <text
              key={`year-lbl-${i}`}
              x={getX(i)}
              y={height - paddingBottom + 16}
              textAnchor="middle"
              className="text-[10px] font-mono fill-slate-400 font-semibold"
            >
              {d.year}
            </text>
          ))}
        </svg>

        {/* Hover Floating Details Card */}
        {hoveredYear && (
          <div className="mt-2 p-2.5 bg-slate-900 border border-slate-700 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-mono font-bold text-slate-100">{hoveredYear.year} Annual Overview</span>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="text-slate-200">
                Total Events: <strong>{hoveredYear.event_count}</strong>
              </span>
              <span className="text-red-400">
                Critical: <strong>{hoveredYear.critical_events}</strong>
              </span>
              <span className="text-orange-400">
                Severe: <strong>{hoveredYear.severe_events}</strong>
              </span>
              <span className="text-red-300">
                Casualties: <strong>{hoveredYear.total_casualties}</strong>
              </span>
              <span className="text-slate-400">
                Debris: <strong>{hoveredYear.total_debris_volume_m3.toLocaleString()} m³</strong>
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
        <Info size={13} className="text-slate-500" />
        <span>
          Annual stacking illustrates multi-year clustering associated with anomalous monsoon precipitation surges (notably 2018 Kerala, 2021 Chamoli flash floods, and 2024 Wayanad disasters).
        </span>
      </div>
    </div>
  );
};
