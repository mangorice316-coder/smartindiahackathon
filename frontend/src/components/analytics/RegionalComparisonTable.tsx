import React, { useState } from 'react';
import { RegionalComparisonItem } from '../../types';
import { Table, Column } from '../common/Table';
import { MapPin, Mountain, AlertTriangle, Building2, Users, ArrowUpDown } from 'lucide-react';

interface RegionalComparisonTableProps {
  data: RegionalComparisonItem[];
  onSelectDistrict?: (district: string) => void;
  selectedDistrict?: string;
}

export const RegionalComparisonTable: React.FC<RegionalComparisonTableProps> = ({
  data,
  onSelectDistrict,
  selectedDistrict
}) => {
  const [sortKey, setSortKey] = useState<keyof RegionalComparisonItem>('total_events');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 font-mono text-xs">
        No regional comparison data available.
      </div>
    );
  }

  const handleSort = (key: keyof RegionalComparisonItem) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const valA = a[sortKey];
    const valB = b[sortKey];
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortAsc ? valA - valB : valB - valA;
    }
    return sortAsc
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });

  const getSeverityBadge = (score: number) => {
    if (score >= 3.0) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-300 border border-red-700">CATASTROPHIC ({score.toFixed(1)})</span>;
    } else if (score >= 2.0) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-950 text-orange-300 border border-orange-700">SEVERE ({score.toFixed(1)})</span>;
    } else if (score >= 1.0) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-700">MODERATE ({score.toFixed(1)})</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">LOW ({score.toFixed(1)})</span>;
  };

  return (
    <div className="space-y-3">
      {/* Table Subheader */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <p>Comparative regional vulnerability matrix across surveyed mountainous districts:</p>
        <span className="text-[11px] font-mono text-slate-500">
          Click row or district to filter entire analytics dashboard
        </span>
      </div>

      <div className="overflow-x-auto border border-slate-800 rounded-lg bg-[#111827]">
        <table className="w-full text-left text-xs text-slate-300 border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 font-mono text-[11px] text-slate-400">
              <th
                className="py-3 px-4 cursor-pointer hover:text-slate-100"
                onClick={() => handleSort('district')}
              >
                <div className="flex items-center gap-1.5">
                  <MapPin size={13} />
                  District & State
                  <ArrowUpDown size={11} className="text-slate-500" />
                </div>
              </th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-slate-100 text-center"
                onClick={() => handleSort('total_events')}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <Mountain size={13} />
                  Cataloged Events
                  <ArrowUpDown size={11} className="text-slate-500" />
                </div>
              </th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-slate-100 text-center"
                onClick={() => handleSort('avg_severity_score')}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <AlertTriangle size={13} />
                  Avg Severity
                  <ArrowUpDown size={11} className="text-slate-500" />
                </div>
              </th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-slate-100 text-center"
                onClick={() => handleSort('total_casualties')}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <Users size={13} />
                  Casualties
                  <ArrowUpDown size={11} className="text-slate-500" />
                </div>
              </th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-slate-100 text-center"
                onClick={() => handleSort('avg_slope_degrees')}
              >
                <div className="flex items-center justify-center gap-1.5">
                  Avg Slope
                  <ArrowUpDown size={11} className="text-slate-500" />
                </div>
              </th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-slate-100 text-center"
                onClick={() => handleSort('critical_infrastructure_count')}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <Building2 size={13} />
                  Lifelines
                  <ArrowUpDown size={11} className="text-slate-500" />
                </div>
              </th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-slate-100 text-center"
                onClick={() => handleSort('historical_alerts_count')}
              >
                Alerts Issued
              </th>
              <th className="py-3 px-4">
                Primary Trigger
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {sortedData.map((row) => {
              const isSelected = selectedDistrict === row.district;
              return (
                <tr
                  key={row.district}
                  onClick={() => onSelectDistrict && onSelectDistrict(isSelected ? 'ALL' : row.district)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-950/40 border-l-4 border-l-blue-500 text-slate-100'
                      : 'hover:bg-slate-900/60'
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-100">{row.district}</div>
                    <div className="text-[10px] font-mono text-slate-400">{row.state}</div>
                  </td>

                  <td className="py-3 px-4 text-center font-mono font-bold text-amber-300">
                    {row.total_events}
                  </td>

                  <td className="py-3 px-4 text-center">
                    {getSeverityBadge(row.avg_severity_score)}
                  </td>

                  <td className="py-3 px-4 text-center font-mono font-bold">
                    <span className={row.total_casualties > 0 ? 'text-red-400' : 'text-slate-500'}>
                      {row.total_casualties}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center font-mono text-slate-300">
                    {row.avg_slope_degrees.toFixed(1)}°
                  </td>

                  <td className="py-3 px-4 text-center font-mono text-indigo-300">
                    {row.critical_infrastructure_count}
                  </td>

                  <td className="py-3 px-4 text-center font-mono text-red-300">
                    {row.historical_alerts_count}
                  </td>

                  <td className="py-3 px-4 text-[11px] font-mono text-slate-400">
                    {row.predominant_trigger.replace(/_/g, ' ')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
