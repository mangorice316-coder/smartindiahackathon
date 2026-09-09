import React, { useState } from 'react';
import { SeasonalDataPoint } from '../../types';
import { Calendar, CloudRain, Mountain, Droplets, Info } from 'lucide-react';

interface SeasonalChartProps {
  data: SeasonalDataPoint[];
}

export const SeasonalChart: React.FC<SeasonalChartProps> = ({ data }) => {
  const [hoveredMonth, setHoveredMonth] = useState<SeasonalDataPoint | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 font-mono text-xs">
        No seasonal distribution data available for current selection.
      </div>
    );
  }

  // Find maximum values for scaling
  const maxEvents = Math.max(...data.map(d => d.event_count), 5);
  const maxRainfall = Math.max(...data.map(d => d.avg_rainfall_mm), 100);

  // SVG dimensions
  const width = 680;
  const height = 240;
  const paddingLeft = 45;
  const paddingRight = 45;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const barSlotWidth = chartWidth / data.length;
  const barWidth = Math.min(barSlotWidth * 0.55, 30);

  // Helper coordinate calculators
  const getX = (index: number) => paddingLeft + index * barSlotWidth + barSlotWidth / 2;
  const getBarY = (count: number) => paddingTop + chartHeight - (count / maxEvents) * chartHeight;
  const getRainfallY = (rain: number) => paddingTop + chartHeight - (rain / maxRainfall) * chartHeight;

  // Build path for rainfall line
  const rainfallPath = data.map((d, i) => {
    const x = getX(i);
    const y = getRainfallY(d.avg_rainfall_mm);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <div className="space-y-3">
      {/* Legend and Peak Indicator Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-amber-500/80 border border-amber-400"></div>
            <span className="text-slate-300 font-medium">Historical Failure Frequency (Events)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-cyan-400"></div>
            <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
            <span className="text-slate-300 font-medium">Avg Antecedent Rainfall (mm)</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-950/60 text-red-300 border border-red-800">
            ★ SW Monsoon Core Peak (Jul–Aug)
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950/60 text-blue-300 border border-blue-800">
            ▲ NE Monsoon (Oct–Nov)
          </span>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative bg-slate-950/50 border border-slate-800/80 rounded-lg p-2 overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[580px] select-none">
          <defs>
            {/* Gradient for Bars */}
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#b45309" stopOpacity="0.4" />
            </linearGradient>

            {/* Gradient for Monsoon Peak Bars */}
            <linearGradient id="peakBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#991b1b" stopOpacity="0.5" />
            </linearGradient>
          </defs>

          {/* Grid lines (horizontal) */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = paddingTop + chartHeight * (1 - ratio);
            const eventVal = Math.round(ratio * maxEvents);
            const rainVal = Math.round(ratio * maxRainfall);
            return (
              <g key={idx} className="opacity-40">
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#334155"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                {/* Left Y Axis Label (Event Count) */}
                <text x={paddingLeft - 8} y={y + 3} textAnchor="end" className="text-[9px] fill-slate-500 font-mono">
                  {eventVal}
                </text>
                {/* Right Y Axis Label (Rainfall mm) */}
                <text x={width - paddingRight + 8} y={y + 3} textAnchor="start" className="text-[9px] fill-cyan-500/80 font-mono">
                  {rainVal}m
                </text>
              </g>
            );
          })}

          {/* Monsoon Peak Background Highlights */}
          {data.map((d, i) => {
            if (!d.is_monsoon_peak) return null;
            const x = paddingLeft + i * barSlotWidth;
            return (
              <rect
                key={`peak-bg-${i}`}
                x={x}
                y={paddingTop}
                width={barSlotWidth}
                height={chartHeight}
                fill="rgba(239, 68, 68, 0.08)"
              />
            );
          })}

          {/* Event Bars */}
          {data.map((d, i) => {
            const barHeight = (d.event_count / maxEvents) * chartHeight;
            const x = getX(i) - barWidth / 2;
            const y = paddingTop + chartHeight - barHeight;
            const isHovered = hoveredMonth?.month === d.month;

            return (
              <g
                key={`bar-${i}`}
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredMonth(d)}
                onMouseLeave={() => setHoveredMonth(null)}
              >
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(barHeight, 2)}
                  rx={2}
                  fill={d.is_monsoon_peak ? 'url(#peakBarGrad)' : 'url(#barGrad)'}
                  stroke={isHovered ? '#ffffff' : d.is_monsoon_peak ? '#f87171' : '#f59e0b'}
                  strokeWidth={isHovered ? 1.5 : 0.5}
                />
                {d.event_count > 0 && (
                  <text
                    x={getX(i)}
                    y={Math.max(y - 4, paddingTop + 10)}
                    textAnchor="middle"
                    className={`text-[10px] font-mono font-bold ${
                      d.is_monsoon_peak ? 'fill-red-300' : 'fill-amber-300'
                    }`}
                  >
                    {d.event_count}
                  </text>
                )}
              </g>
            );
          })}

          {/* Rainfall Curve Line */}
          <path
            d={rainfallPath}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="filter drop-shadow"
          />

          {/* Rainfall Markers */}
          {data.map((d, i) => {
            const cx = getX(i);
            const cy = getRainfallY(d.avg_rainfall_mm);
            const isHovered = hoveredMonth?.month === d.month;
            return (
              <circle
                key={`rain-pt-${i}`}
                cx={cx}
                cy={cy}
                r={isHovered ? 5 : 3.5}
                fill="#0e7490"
                stroke="#22d3ee"
                strokeWidth={isHovered ? 2.5 : 1.5}
                className="cursor-pointer transition-all"
                onMouseEnter={() => setHoveredMonth(d)}
                onMouseLeave={() => setHoveredMonth(null)}
              />
            );
          })}

          {/* X Axis Month Labels */}
          {data.map((d, i) => {
            const x = getX(i);
            const isPeak = d.is_monsoon_peak;
            return (
              <g key={`month-lbl-${i}`}>
                <text
                  x={x}
                  y={height - paddingBottom + 16}
                  textAnchor="middle"
                  className={`text-[10px] font-mono font-semibold ${
                    isPeak ? 'fill-red-400' : 'fill-slate-400'
                  }`}
                >
                  {d.month_name.slice(0, 3).toUpperCase()}
                </text>
                {isPeak && (
                  <circle cx={x} cy={height - paddingBottom + 26} r={2} fill="#ef4444" />
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Floating Details Card */}
        {hoveredMonth && (
          <div className="mt-2 p-2.5 bg-slate-900 border border-slate-700 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-slate-100">{hoveredMonth.month_name}</span>
              {hoveredMonth.is_monsoon_peak && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-red-950 text-red-300 border border-red-700">
                  PEAK MONSOON
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-[11px] font-mono">
              <span className="text-amber-300">
                Landslides: <strong>{hoveredMonth.event_count}</strong>
              </span>
              <span className="text-cyan-300">
                Avg 24h Rain: <strong>{hoveredMonth.avg_rainfall_mm.toFixed(1)} mm</strong>
              </span>
              <span className="text-red-400">
                Casualties: <strong>{hoveredMonth.total_casualties}</strong>
              </span>
              <span className="text-slate-400">
                Debris: <strong>{hoveredMonth.total_volume_m3.toLocaleString()} m³</strong>
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
        <Info size={13} className="text-slate-500" />
        <span>
          Monsoon seasonality demonstrates heavy clustering between June and September (Southwest Monsoon), with secondary activity in Southern peninsular hotspots during the Northeast Monsoon (October–November).
        </span>
      </div>
    </div>
  );
};
