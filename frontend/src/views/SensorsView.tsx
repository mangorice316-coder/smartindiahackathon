import React, { useState } from 'react';
import { Radio, Activity, Cpu, Battery, Signal, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { KpiCard } from '../components/common/KpiCard';
import { DataTable, ColumnDef } from '../components/common/DataTable';

interface SensorNode {
  id: string;
  name: string;
  sensor_type: 'PIEZOMETER' | 'TILTMETER' | 'EXTENSOMETER' | 'RAIN_GAUGE';
  location: string;
  current_reading: number;
  unit: string;
  status: 'OPTIMAL' | 'WARNING' | 'ALERT' | 'OFFLINE';
  battery_pct: number;
  last_transmission: string;
  threshold_limit: number;
}

const DEFAULT_SENSORS: SensorNode[] = [
  {
    id: 'SN-PZ-01',
    name: 'Chooralmala Crown Piezometer PZ-01',
    sensor_type: 'PIEZOMETER',
    location: 'Chooralmala Upper Ridge (11.536° N, 76.132° E)',
    current_reading: 68.4,
    unit: 'kPa',
    status: 'ALERT',
    battery_pct: 92,
    last_transmission: '12s ago',
    threshold_limit: 60.0,
  },
  {
    id: 'SN-TM-01',
    name: 'Mundakkai Slope Inclinometer TM-01',
    sensor_type: 'TILTMETER',
    location: 'Mundakkai Catchment Crest',
    current_reading: 3.8,
    unit: 'deg (°)',
    status: 'WARNING',
    battery_pct: 88,
    last_transmission: '45s ago',
    threshold_limit: 2.5,
  },
  {
    id: 'SN-EX-01',
    name: 'Meppadi Tension Crack Extensometer EX-01',
    sensor_type: 'EXTENSOMETER',
    location: 'Meppadi Road Shoulder',
    current_reading: 18.2,
    unit: 'mm',
    status: 'ALERT',
    battery_pct: 95,
    last_transmission: '8s ago',
    threshold_limit: 12.0,
  },
  {
    id: 'SN-RG-01',
    name: 'Wayanad Tipping-Bucket Rain Gauge RG-01',
    sensor_type: 'RAIN_GAUGE',
    location: 'Vythiri Automatic Weather Station',
    current_reading: 38.2,
    unit: 'mm/h',
    status: 'ALERT',
    battery_pct: 99,
    last_transmission: '2m ago',
    threshold_limit: 25.0,
  },
  {
    id: 'SN-PZ-02',
    name: 'Idukki Hillfoot Piezometer PZ-02',
    sensor_type: 'PIEZOMETER',
    location: 'Munnar Tea Estate Hillslope',
    current_reading: 32.1,
    unit: 'kPa',
    status: 'OPTIMAL',
    battery_pct: 78,
    last_transmission: '1m ago',
    threshold_limit: 55.0,
  },
  {
    id: 'SN-TM-02',
    name: 'Nilgiris Ghaut Inclinometer TM-02',
    sensor_type: 'TILTMETER',
    location: 'Coonoor Mountain Corridor',
    current_reading: 0.9,
    unit: 'deg (°)',
    status: 'OPTIMAL',
    battery_pct: 84,
    last_transmission: '3m ago',
    threshold_limit: 2.5,
  },
];

export const SensorsView: React.FC = () => {
  const [sensors, setSensors] = useState<SensorNode[]>(DEFAULT_SENSORS);
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);

  const handleRefresh = () => {
    setIsCalibrating(true);
    setTimeout(() => {
      setIsCalibrating(false);
    }, 800);
  };

  const columns: ColumnDef<SensorNode>[] = [
    {
      key: 'name',
      header: 'SENSOR NODE',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Radio size={13} />
          </div>
          <div>
            <span className="font-bold text-white block text-xs">{row.name}</span>
            <span className="text-[10px] font-mono text-slate-400">{row.location}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'sensor_type',
      header: 'MODALITY',
      sortable: true,
      render: (row) => (
        <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-slate-300 font-mono text-[10px] font-bold">
          {row.sensor_type}
        </span>
      ),
    },
    {
      key: 'current_reading',
      header: 'LIVE VALUE',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className={`font-mono text-xs font-black ${
          row.status === 'ALERT' ? 'text-red-400' : row.status === 'WARNING' ? 'text-amber-300' : 'text-emerald-400'
        }`}>
          {row.current_reading} {row.unit}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'TELEMETRY STATUS',
      sortable: true,
      render: (row) => {
        const isAlert = row.status === 'ALERT';
        const isWarning = row.status === 'WARNING';
        return (
          <span
            className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border flex items-center gap-1 w-fit ${
              isAlert
                ? 'bg-red-500/20 text-red-300 border-red-500/40'
                : isWarning
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isAlert ? 'bg-red-400 animate-ping' : isWarning ? 'bg-amber-400' : 'bg-emerald-400'}`} />
            <span>{row.status}</span>
          </span>
        );
      },
    },
    {
      key: 'battery_pct',
      header: 'BATTERY',
      sortable: true,
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5 font-mono text-xs text-slate-300">
          <Battery size={13} className={row.battery_pct > 50 ? 'text-emerald-400' : 'text-amber-400'} />
          <span>{row.battery_pct}%</span>
        </div>
      ),
    },
    {
      key: 'last_transmission',
      header: 'LAST PING',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-[11px] text-slate-400">{row.last_transmission}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6" role="region" aria-label="Field Geotechnical Sensors View">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#253042]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-xl font-bold font-sans uppercase tracking-tight text-white">
              IN-SITU SENSOR TELEMETRY & SENSING FABRIC
            </h1>
          </div>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Real-time pore-pressure piezometers, slope tiltmeters, and extensometer arrays in the Western Ghats
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold transition-all active:scale-95"
        >
          <RefreshCw size={12} className={isCalibrating ? 'animate-spin' : ''} />
          <span>Poll In-Situ Mesh</span>
        </button>
      </div>

      {/* Sensor Health KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Active Sensor Nodes"
          value={`${sensors.length} / ${sensors.length}`}
          status="SUCCESS"
          trend="STABLE"
          trendValue="100% Online"
          thresholdLabel="Mesh Transmission Healthy"
          icon={<Radio size={16} />}
        />
        <KpiCard
          label="Pore Pressure Peak"
          value="68.4"
          unit="kPa"
          status="CRITICAL"
          trend="UP"
          trendValue="+14.2 kPa"
          thresholdLabel="Critical Threshold: 60 kPa"
          icon={<Activity size={16} />}
        />
        <KpiCard
          label="Max Tension Crack Aperture"
          value="18.2"
          unit="mm"
          status="CRITICAL"
          trend="UP"
          trendValue="Widening > 12mm/h"
          thresholdLabel="Structural failure imminent"
          icon={<AlertTriangle size={16} />}
        />
        <KpiCard
          label="Average Battery Health"
          value="89.8%"
          status="SUCCESS"
          thresholdLabel="Solar Harvesting Active"
          icon={<Battery size={16} />}
        />
      </div>

      {/* Sensor Grid Table */}
      <DataTable
        title="Field Telemetry Register"
        subtitle="Cryptographically verified wireless sensor telemetry stream"
        columns={columns}
        data={sensors}
        searchPlaceholder="Search sensor nodes by name or location..."
        searchKey="name"
        exportFileName="BHU_SURAKSHA_Sensor_Nodes"
      />
    </div>
  );
};
