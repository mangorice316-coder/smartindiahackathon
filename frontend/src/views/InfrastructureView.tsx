import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Table, Column } from '../components/common/Table';
import { FilterBar } from '../components/common/FilterBar';
import { InfrastructureAsset } from '../types';
import { Building2, ShieldAlert } from 'lucide-react';

interface InfrastructureViewProps {
  infrastructure: InfrastructureAsset[];
  onSelectLocation?: (locationId: number) => void;
}

export const InfrastructureView: React.FC<InfrastructureViewProps> = ({
  infrastructure,
  onSelectLocation,
}) => {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedTier, setSelectedTier] = useState('ALL');

  const filtered = infrastructure.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.location_name && item.location_name.toLowerCase().includes(search.toLowerCase()));
    const matchType = selectedType === 'ALL' || item.asset_type === selectedType;
    const matchTier = selectedTier === 'ALL' || String(item.lifeline_tier) === selectedTier;
    return matchSearch && matchType && matchTier;
  });

  const columns: Column<InfrastructureAsset>[] = [
    {
      key: 'name',
      header: 'Infrastructure Asset',
      render: (item) => (
        <div>
          <div className="font-semibold text-slate-100">{item.name}</div>
          <div className="text-[10px] text-slate-400 font-mono">
            GPS: {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
          </div>
        </div>
      )
    },
    {
      key: 'asset_type',
      header: 'Category',
      render: (item) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-900 border border-slate-700 text-slate-300">
          {item.asset_type}
        </span>
      )
    },
    {
      key: 'location_name',
      header: 'Catchment Zone',
      render: (item) => (
        <span className="text-slate-300 font-sans">{item.location_name || 'N/A'}</span>
      )
    },
    {
      key: 'lifeline_tier',
      header: 'Lifeline Tier',
      render: (item) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
          item.lifeline_tier === 1
            ? 'bg-red-950/70 text-red-300 border border-red-600/70'
            : 'bg-slate-900 text-slate-400 border border-slate-700'
        }`}>
          {item.lifeline_tier === 1 ? 'TIER 1 (CRITICAL)' : 'TIER 2 (SECONDARY)'}
        </span>
      )
    },
    {
      key: 'capacity',
      header: 'Capacity / Population Served',
      render: (item) => (
        <span className="font-mono text-slate-200">
          {item.capacity ? item.capacity.toLocaleString() : 'N/A'}
        </span>
      )
    },
    {
      key: 'exposure_weight',
      header: 'Exposure Multiplier',
      render: (item) => (
        <span className="font-mono text-orange-400 font-semibold">{item.exposure_weight}x</span>
      )
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header Info & Filters */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Filter infrastructure assets by name or catchment..."
        filters={
          <div className="flex items-center gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="HIGHWAY">Highways</option>
              <option value="BRIDGE">Bridges</option>
              <option value="HOSPITAL">Hospitals</option>
              <option value="SCHOOL">Schools</option>
              <option value="POWER_SUBSTATION">Power Substations</option>
              <option value="VILLAGE">Settlements</option>
            </select>

            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:outline-none"
            >
              <option value="ALL">All Tiers</option>
              <option value="1">Tier 1 Lifelines</option>
              <option value="2">Tier 2 Secondary</option>
            </select>
          </div>
        }
      />

      {/* Main Asset Table */}
      <Card
        title={`Critical Lifeline Inventory (${filtered.length} Assets)`}
        subtitle="Assets analyzed for direct debris impact and access isolation during slope failures"
      >
        <Table columns={columns} data={filtered} />
      </Card>
    </div>
  );
};
