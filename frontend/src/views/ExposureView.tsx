import React, { useState, useMemo } from 'react';
import { Building2, Users, AlertTriangle, ShieldCheck, Download, Search, Compass, MapPin, Eye } from 'lucide-react';
import { InfrastructureAsset, LocationSummary } from '../types';
import { DataTable, ColumnDef } from '../components/common/DataTable';
import { KpiCard } from '../components/common/KpiCard';

interface ExposureViewProps {
  infrastructure?: InfrastructureAsset[];
  locations?: LocationSummary[];
  onSelectLocation?: (locId: number) => void;
}

export const ExposureView: React.FC<ExposureViewProps> = ({
  infrastructure = [],
  locations = [],
  onSelectLocation,
}) => {
  const [selectedTier, setSelectedTier] = useState<number | 'ALL'>('ALL');

  const totalExposedPopulation = useMemo(() => {
    return locations.reduce((sum, l) => sum + (l.population || 0), 0);
  }, [locations]);

  const highExposureAssets = useMemo(() => {
    return infrastructure.filter(a => a.exposure_weight >= 0.7);
  }, [infrastructure]);

  const filteredAssets = useMemo(() => {
    if (selectedTier === 'ALL') return infrastructure;
    return infrastructure.filter(a => a.lifeline_tier === selectedTier);
  }, [infrastructure, selectedTier]);

  const columns: ColumnDef<InfrastructureAsset>[] = [
    {
      key: 'name',
      header: 'INFRASTRUCTURE ASSET',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Building2 size={13} />
          </div>
          <div>
            <span className="font-bold text-white block text-xs">{row.name}</span>
            <span className="text-[10px] font-mono text-slate-400">{row.district || 'Western Ghats Corridor'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'asset_type',
      header: 'TYPE',
      sortable: true,
      render: (row) => (
        <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-slate-300 font-mono text-[11px]">
          {row.asset_type.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'lifeline_tier',
      header: 'LIFELINE TIER',
      sortable: true,
      render: (row) => (
        <span
          className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${
            row.lifeline_tier === 1
              ? 'bg-red-500/20 text-red-300 border-red-500/40'
              : row.lifeline_tier === 2
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}
        >
          TIER {row.lifeline_tier}
        </span>
      ),
    },
    {
      key: 'capacity',
      header: 'DESIGN CAPACITY',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className="font-mono text-white text-xs font-semibold">
          {row.capacity ? `${row.capacity.toLocaleString()} units` : 'N/A'}
        </span>
      ),
    },
    {
      key: 'exposure_weight',
      header: 'EXPOSURE VULNERABILITY',
      sortable: true,
      align: 'right',
      render: (row) => {
        const pct = Math.round(row.exposure_weight * 100);
        return (
          <div className="flex items-center justify-end gap-2">
            <div className="w-16 h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/[0.08]">
              <div
                className={`h-full rounded-full ${
                  pct >= 80 ? 'bg-red-500' : pct >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="font-mono text-xs font-bold text-slate-200">{pct}%</span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6" role="region" aria-label="Infrastructure Exposure Dashboard">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#253042]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <h1 className="text-xl font-bold font-sans uppercase tracking-tight text-white">
              POPULATION & INFRASTRUCTURE EXPOSURE
            </h1>
          </div>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Vulnerability mapping of arterial highways, bridge abutments, hospitals, and residential sectors
          </p>
        </div>

        {/* Tier filter pill */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#10151F] border border-[#253042]">
          {(['ALL', 1, 2, 3] as const).map(t => (
            <button
              key={String(t)}
              onClick={() => setSelectedTier(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                selectedTier === t
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t === 'ALL' ? 'All Tiers' : `Tier ${t}`}
            </button>
          ))}
        </div>
      </div>

      {/* Exposure KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Exposed Population"
          value={totalExposedPopulation.toLocaleString()}
          unit="Citizens"
          status="CRITICAL"
          trend="UP"
          trendValue="+14.8%"
          thresholdLabel="High-threat zone"
          icon={<Users size={16} />}
        />
        <KpiCard
          label="Monitored Lifeline Assets"
          value={infrastructure.length}
          unit="Corridors"
          status="INFO"
          trend="STABLE"
          trendValue="100% Surveyed"
          thresholdLabel="PWD & OSM ODbL 1.0"
          icon={<Building2 size={16} />}
        />
        <KpiCard
          label="Tier-1 Critical Lifelines"
          value={infrastructure.filter(a => a.lifeline_tier === 1).length}
          unit="Assets"
          status="CRITICAL"
          thresholdLabel="Vulnerable to debris cut-off"
          icon={<AlertTriangle size={16} />}
        />
        <KpiCard
          label="High-Vulnerability Assets"
          value={highExposureAssets.length}
          unit="Facilities"
          status="WARNING"
          thresholdLabel="Exposure Weight ≥ 70%"
          icon={<ShieldCheck size={16} />}
        />
      </div>

      {/* Detailed Exposure Table */}
      <DataTable
        title="Vulnerable Lifeline Corridor Register"
        subtitle="Ranked by exposure score and geotechnical hazard proximity"
        columns={columns}
        data={filteredAssets}
        searchPlaceholder="Filter assets (e.g., 'Bridge', 'Highway', 'Hospital')..."
        searchKey="name"
        exportFileName="BHU_SURAKSHA_Exposure_Register"
      />
    </div>
  );
};
