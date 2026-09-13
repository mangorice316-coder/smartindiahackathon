import React, { useState, useEffect } from 'react';
import { ShieldCheck, Download, Search, FileText, Lock, CheckCircle2, RotateCcw, ArrowRight } from 'lucide-react';
import { AuditLogger } from '../services/auditLogger';
import { AuditLogEntry } from '../types';
import { DataTable, ColumnDef } from '../components/common/DataTable';
import { KpiCard } from '../components/common/KpiCard';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>(() => AuditLogger.getLogs());

  useEffect(() => {
    const handleUpdate = () => {
      setLogs(AuditLogger.getLogs());
    };
    window.addEventListener('audit-log-updated', handleUpdate);
    return () => window.removeEventListener('audit-log-updated', handleUpdate);
  }, []);

  const handleDownloadJSON = () => {
    AuditLogger.downloadExport('json');
  };

  const handleDownloadCSV = () => {
    AuditLogger.downloadExport('csv');
  };

  const columns: ColumnDef<AuditLogEntry>[] = [
    {
      key: 'id',
      header: 'LOG ID / TIMESTAMP',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-cyan-400 block">{row.id}</span>
          <span className="text-[10px] font-mono text-slate-400">
            {new Date(row.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • {new Date(row.timestamp).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      key: 'action_title',
      header: 'COMMAND ACTION / TARGET',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-bold text-white text-xs block font-sans">{row.action_title}</span>
          <span className="text-[10px] font-mono text-slate-400">Target: {row.target}</span>
        </div>
      ),
    },
    {
      key: 'action_type',
      header: 'MODALITY',
      sortable: true,
      render: (row) => (
        <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-slate-300 font-mono text-[10px] font-bold">
          {row.action_type}
        </span>
      ),
    },
    {
      key: 'state_transition',
      header: 'STATE TRANSITION',
      render: (row) => (
        <div className="flex items-center gap-1.5 font-mono text-[10px]">
          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">{row.previous_state}</span>
          <ArrowRight size={10} className="text-slate-500" />
          <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 font-bold border border-red-500/40">
            {row.new_state}
          </span>
        </div>
      ),
    },
    {
      key: 'authorized_by',
      header: 'AUTHORIZED BY',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-semibold text-slate-200 block">{row.authorized_by}</span>
          <span className="text-[10px] font-mono text-slate-500">{row.user_role}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'INTEGRITY',
      sortable: true,
      render: (row) => (
        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] font-bold flex items-center gap-1 w-fit">
          <CheckCircle2 size={10} />
          <span>{row.status}</span>
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6" role="region" aria-label="Operational Command Audit Trail">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#253042]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <h1 className="text-xl font-bold font-sans uppercase tracking-tight text-white">
              OPERATIONAL DECISION AUDIT REGISTER
            </h1>
          </div>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Immutable command trail for evacuation orders, road barricades, and field dispatch directives
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-[#253042] text-xs font-mono font-medium transition-all"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleDownloadJSON}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold transition-all"
          >
            <Download size={13} />
            <span>Export JSON Snapshot</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Logged Directives"
          value={logs.length}
          status="INFO"
          thresholdLabel="100% Cryptographic Integrity"
          icon={<FileText size={16} />}
        />
        <KpiCard
          label="Evacuation Orders Issued"
          value={logs.filter(l => l.action_type === 'EVACUATION').length}
          status="CRITICAL"
          thresholdLabel="Tier-1 High-Consequence"
          icon={<Lock size={16} />}
        />
        <KpiCard
          label="Road Closures Enacted"
          value={logs.filter(l => l.action_type === 'ROAD_CLOSURE').length}
          status="WARNING"
          thresholdLabel="PWD Highway Corridors"
          icon={<ShieldCheck size={16} />}
        />
        <KpiCard
          label="Compliance Verification"
          value="NDMA 2026"
          status="SUCCESS"
          thresholdLabel="Audit Standard Certified"
          icon={<CheckCircle2 size={16} />}
        />
      </div>

      {/* Audit Log Data Table */}
      <DataTable
        title="Immutable Command Log Entries"
        subtitle="Chronological sequence of all authorized C2 operational decisions"
        columns={columns}
        data={logs}
        searchPlaceholder="Search audit logs by ID, action, or target..."
        searchKey="action_title"
        exportFileName="LRIDS_Audit_Register"
      />
    </div>
  );
};
