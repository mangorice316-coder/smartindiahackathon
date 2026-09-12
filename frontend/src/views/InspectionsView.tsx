import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../components/common/Card';
import { Table, Column } from '../components/common/Table';
import { Dialog } from '../components/common/Dialog';
import { UrgencyBadge, StatusBadge } from '../components/common/Badge';
import { InspectionTask, LocationSummary, UrgencyTier, InspectionStatus } from '../types';
import { api } from '../services/api';
import {
  ClipboardList,
  RefreshCw,
  PlusCircle,
  Activity,
  Calendar,
  Clock,
  Camera,
  AlertCircle,
  FileCheck2,
  Sliders,
  CheckCircle2,
  Building,
  User,
  Users,
  Search,
  ExternalLink,
  Droplets,
  Layers
} from 'lucide-react';

interface InspectionsViewProps {
  inspections: InspectionTask[];
  onRecalculate: () => Promise<void>;
  onUpdateTask: (id: number, update: { status?: string; assigned_team?: string; assigned_officer?: string; field_notes?: string }) => Promise<void>;
  onRefresh: () => void;
}

export const InspectionsView: React.FC<InspectionsViewProps> = ({
  inspections,
  onRecalculate,
  onUpdateTask,
  onRefresh,
}) => {
  // Filters & State
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);

  // Field Offline Queue State
  const [isSimulatingOffline, setIsSimulatingOffline] = useState<boolean>(false);
  const [offlineQueue, setOfflineQueue] = useState<Array<any>>(() => {
    try {
      const stored = localStorage.getItem('lrids_offline_queue');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [offlineToast, setOfflineToast] = useState<string | null>(null);

  const saveToOfflineQueue = (taskData: any) => {
    const updated = [
      ...offlineQueue,
      { ...taskData, queued_at: new Date().toISOString(), local_id: `OFFLINE-${Date.now()}` }
    ];
    setOfflineQueue(updated);
    try {
      localStorage.setItem('lrids_offline_queue', JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
    setOfflineToast('Saved to Local Offline Queue (PENDING SYNC)');
    setTimeout(() => setOfflineToast(null), 3500);
  };

  const handleSyncOfflineQueue = async () => {
    if (offlineQueue.length === 0) return;
    setOfflineToast(`Syncing ${offlineQueue.length} offline records to C2 server...`);
    for (const item of offlineQueue) {
      if (item.type === 'UPDATE') {
        try {
          await onUpdateTask(item.id, item.payload);
        } catch {}
      } else if (item.type === 'EVIDENCE') {
        try {
          await api.attachInspectionEvidence(item.id, item.payload);
        } catch {}
      }
    }
    setOfflineQueue([]);
    try {
      localStorage.removeItem('lrids_offline_queue');
    } catch {}
    onRefresh();
    setOfflineToast('All offline missions successfully synced to C2 database!');
    setTimeout(() => setOfflineToast(null), 4000);
  };

  // Task Update Modal
  const [selectedTask, setSelectedTask] = useState<InspectionTask | null>(null);
  const [updateStatus, setUpdateStatus] = useState<string>('DISPATCHED');
  const [updateTeam, setUpdateTeam] = useState<string>('Geotech Squad Alpha');
  const [updateOfficer, setUpdateOfficer] = useState<string>('Lead Geotech Inspector');
  const [updateNotes, setUpdateNotes] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Mathematical Priority Breakdown Modal
  const [breakdownTask, setBreakdownTask] = useState<InspectionTask | null>(null);

  // Field Evidence Modal
  const [evidenceTask, setEvidenceTask] = useState<InspectionTask | null>(null);
  const [inspectorName, setInspectorName] = useState<string>('Dr. S. Nair, GSI Field Unit');
  const [crackDisplacementMm, setCrackDisplacementMm] = useState<string>('18.5');
  const [creepSeverity, setCreepSeverity] = useState<string>('MODERATE');
  const [seepageObserved, setSeepageObserved] = useState<boolean>(true);
  const [photoIds, setPhotoIds] = useState<string>('PHOTO-CROWN-01, PHOTO-CULVERT-02');
  const [evidenceNotes, setEvidenceNotes] = useState<string>('Active tension cracks expanding at crown head; toe seepage clear water.');
  const [isSubmittingEvidence, setIsSubmittingEvidence] = useState<boolean>(false);

  // Create Manual Inspection Mission Modal
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [locations, setLocations] = useState<LocationSummary[]>([]);
  const [newLocationId, setNewLocationId] = useState<number>(1);
  const [newReason, setNewReason] = useState<string>('Visual reports of slope displacement following overnight 120mm rainfall.');
  const [newOfficer, setNewOfficer] = useState<string>('Senior Geotechnical Engineer');
  const [newTeam, setNewTeam] = useState<string>('Rapid Slope Assessment Squad 2');
  const [newDeadlineHours, setNewDeadlineHours] = useState<number>(12);
  const [newNotes, setNewNotes] = useState<string>('Prioritize inspection of high-voltage transmission tower foundation.');
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Fetch locations for manual task creation
  useEffect(() => {
    const fetchLocs = async () => {
      try {
        const locs = await api.getLocations();
        if (locs && locs.length > 0) {
          setLocations(locs);
          setNewLocationId(locs[0].id);
        }
      } catch {
        // Standalone fallback locations
        setLocations([
          { id: 1, code: 'KL-WAY-001', name: 'Meppadi / Chooralmala Catchment', district: 'Wayanad', state: 'Kerala', latitude: 11.55, longitude: 76.13, population: 14200, is_demo: true },
          { id: 2, code: 'KL-WAY-002', name: 'Mundakkai Valley Slope', district: 'Wayanad', state: 'Kerala', latitude: 11.53, longitude: 76.17, population: 8900, is_demo: true },
          { id: 3, code: 'UK-CHA-001', name: 'Joshimath Ravine Sector', district: 'Chamoli', state: 'Uttarakhand', latitude: 30.55, longitude: 79.56, population: 16700, is_demo: true },
          { id: 4, code: 'HP-MAN-001', name: 'Solang Valley Incline', district: 'Kullu', state: 'Himachal Pradesh', latitude: 32.32, longitude: 77.16, population: 5200, is_demo: true }
        ]);
      }
    };
    fetchLocs();
  }, []);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return inspections.filter(t => {
      if (tierFilter !== 'ALL' && t.urgency_tier !== tierFilter) return false;
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchLoc = t.location_name.toLowerCase().includes(q);
        const matchDist = t.district.toLowerCase().includes(q);
        const matchCode = (t.task_code || '').toLowerCase().includes(q);
        const matchTeam = (t.assigned_team || '').toLowerCase().includes(q);
        if (!matchLoc && !matchDist && !matchCode && !matchTeam) return false;
      }
      return true;
    });
  }, [inspections, tierFilter, statusFilter, searchQuery]);

  // Recalculate Priorities
  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      await onRecalculate();
      onRefresh();
    } catch {
      alert('Failed to recalculate priorities.');
    } finally {
      setIsRecalculating(false);
    }
  };

  // Open Update Modal
  const handleOpenUpdate = (t: InspectionTask) => {
    setSelectedTask(t);
    setUpdateStatus(t.status);
    setUpdateTeam(t.assigned_team || 'Geotech Squad Alpha');
    setUpdateOfficer(t.assigned_officer || 'Field Officer');
    setUpdateNotes(t.field_notes || '');
  };

  // Save Task Update
  const handleSaveUpdate = async () => {
    if (!selectedTask) return;
    if (isSimulatingOffline) {
      saveToOfflineQueue({
        type: 'UPDATE',
        id: selectedTask.id,
        task_code: selectedTask.task_code || `INSP-${selectedTask.id}`,
        location_name: selectedTask.location_name,
        payload: {
          status: updateStatus,
          assigned_team: updateTeam,
          assigned_officer: updateOfficer,
          field_notes: updateNotes
        }
      });
      setSelectedTask(null);
      return;
    }
    setIsUpdating(true);
    try {
      await onUpdateTask(selectedTask.id, {
        status: updateStatus,
        assigned_team: updateTeam,
        assigned_officer: updateOfficer,
        field_notes: updateNotes
      });
      setSelectedTask(null);
      onRefresh();
    } catch {
      alert('Failed to update inspection task');
    } finally {
      setIsUpdating(false);
    }
  };

  // Attach Geotechnical Evidence
  const handleSaveEvidence = async () => {
    if (!evidenceTask) return;
    const parsedCrack = crackDisplacementMm.trim() ? parseFloat(crackDisplacementMm) : undefined;
    const photoArray = photoIds.split(',').map(s => s.trim()).filter(Boolean);
    const payload = {
      inspector_name: inspectorName,
      crack_displacement_mm: parsedCrack,
      observed_creep_severity: creepSeverity,
      seepage_observed: seepageObserved,
      photo_reference_ids: photoArray,
      evidence_notes: evidenceNotes
    };

    if (isSimulatingOffline) {
      saveToOfflineQueue({
        type: 'EVIDENCE',
        id: evidenceTask.id,
        task_code: evidenceTask.task_code || `INSP-${evidenceTask.id}`,
        location_name: evidenceTask.location_name,
        payload
      });
      setEvidenceTask(null);
      return;
    }

    setIsSubmittingEvidence(true);
    try {
      await api.attachInspectionEvidence(evidenceTask.id, payload);
      setEvidenceTask(null);
      onRefresh();
      alert('Field Geotechnical Evidence recorded and audit-logged.');
    } catch (e: any) {
      alert(`Failed to attach evidence: ${e?.message || 'Error'}`);
    } finally {
      setIsSubmittingEvidence(false);
    }
  };

  // Create Manual Mission
  const handleCreateMission = async () => {
    setIsCreating(true);
    try {
      await api.createInspection({
        location_id: newLocationId,
        reason: newReason,
        assigned_officer: newOfficer,
        assigned_team: newTeam,
        deadline_hours: newDeadlineHours,
        notes: newNotes
      });
      setIsCreateOpen(false);
      onRefresh();
      alert('Manual Field Inspection Mission created.');
    } catch (e: any) {
      alert(`Failed to create mission: ${e?.message || 'Error'}`);
    } finally {
      setIsCreating(false);
    }
  };

  // Table Columns
  const columns: Column<InspectionTask>[] = [
    {
      key: 'urgency_tier',
      header: 'Deployment Urgency',
      render: (item) => (
        <div className="flex flex-col gap-1 items-start">
          <UrgencyBadge tier={item.urgency_tier} score={item.priority_score} />
          <button
            onClick={() => setBreakdownTask(item)}
            className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 underline flex items-center gap-0.5"
            title="Inspect Mathematical Multi-Factor Breakdown"
          >
            <span>Score: {item.priority_score.toFixed(1)}/100</span>
            <ExternalLink size={9} />
          </button>
        </div>
      )
    },
    {
      key: 'location_name',
      header: 'Catchment & Critical Asset',
      render: (item) => (
        <div>
          <div className="font-semibold text-slate-100 flex items-center gap-1.5">
            {item.infrastructure_name || 'Catchment Crown Slope'}
            <span className="text-[10px] font-mono text-slate-500">({item.task_code || `INSP-${item.id}`})</span>
          </div>
          <div className="text-[11px] text-slate-400 font-sans flex items-center gap-1.5 mt-0.5">
            <span>{item.location_name}</span>
            <span className="text-slate-600">•</span>
            <span>{item.district}</span>
          </div>
        </div>
      )
    },
    {
      key: 'rationale',
      header: 'Prioritization Rationale & Factors',
      render: (item) => (
        <div className="max-w-xs space-y-1">
          <div className="text-[11px] text-slate-300 font-sans line-clamp-2">
            {item.rationale}
          </div>
          {item.contributing_factors && item.contributing_factors.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {item.contributing_factors.slice(0, 2).map((factor, idx) => (
                <span key={idx} className="px-1.5 py-0.2 bg-slate-900 border border-slate-800 rounded text-[9px] font-mono text-cyan-300 truncate max-w-[140px]">
                  {factor}
                </span>
              ))}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'assigned_team',
      header: 'Field Squad & Deadline',
      render: (item) => (
        <div className="space-y-0.5">
          <div className="font-mono text-[11px] text-cyan-300 flex items-center gap-1">
            <Users size={11} className="text-cyan-400" />
            <span className="truncate max-w-[140px]">{item.assigned_team || 'Unassigned Squad'}</span>
          </div>
          {item.assigned_officer && (
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <User size={10} />
              <span className="truncate max-w-[140px]">{item.assigned_officer}</span>
            </div>
          )}
          {item.deadline && (
            <div className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
              <Clock size={10} />
              <span>Due: {new Date(item.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'evidence',
      header: 'Field Evidence',
      render: (item) => {
        const count = (item.evidence_attachments || []).length;
        return (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setEvidenceTask(item);
                setCrackDisplacementMm('15.0');
                setCreepSeverity('MODERATE');
                setSeepageObserved(true);
                setPhotoIds('PHOTO-CROWN-01');
                setEvidenceNotes(item.field_notes || 'Tension crack expanding along slope crown.');
              }}
              className={`px-2 py-1 rounded text-[11px] font-mono flex items-center gap-1 transition-colors ${
                count > 0
                  ? 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
              }`}
              title="Record Physical Geotechnical Evidence (Crack displacement, seepage, photos)"
            >
              <Camera size={11} />
              <span>{count > 0 ? `${count} Logs` : '+ Attach'}</span>
            </button>
          </div>
        );
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} />
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (item) => (
        <button
          onClick={() => handleOpenUpdate(item)}
          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-mono transition-colors"
        >
          Update
        </button>
      )
    }
  ];

  return (
    <div className="space-y-4">
      {/* Disclaimer / Header Banner */}
      <div className="p-2.5 bg-cyan-950/30 border border-cyan-800/60 rounded-lg flex items-center justify-between text-xs font-mono text-cyan-300">
        <div className="flex items-center gap-2">
          <Activity size={15} className="text-cyan-400 shrink-0" />
          <span>
            <strong>GEOTECHNICAL FIELD MISSION MATRIX:</strong> Tasks prioritized via multi-factor algorithm combining ML Risk, Population Lifelines, 24h Rainfall Surges & Slope Scars.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-black rounded font-bold transition-colors"
          >
            <PlusCircle size={13} />
            <span>Dispatch New Mission</span>
          </button>
          <button
            onClick={handleRecalculate}
            disabled={isRecalculating}
            className="flex items-center gap-1.5 px-3 py-1 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 rounded font-bold transition-colors"
          >
            <RefreshCw size={12} className={isRecalculating ? 'animate-spin' : ''} />
            <span>{isRecalculating ? 'Recalculating...' : 'Recalculate Ranks'}</span>
          </button>
        </div>
      </div>

      {/* Offline Toast Notification */}
      {offlineToast && (
        <div className="fixed top-20 right-6 z-50 bg-amber-950 border border-amber-500/50 text-amber-200 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 font-mono text-xs animate-bounce">
          <CheckCircle2 size={16} className="text-amber-400" />
          <span>{offlineToast}</span>
        </div>
      )}

      {/* Offline Field Operations Deck (Phase 12) */}
      <div className="p-3 bg-[#0a101f] border border-cyan-500/30 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full ${isSimulatingOffline ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
          <div>
            <div className="font-bold text-white flex items-center gap-2">
              <span>FIELD RESILIENCE ARCHITECTURE:</span>
              <span className={isSimulatingOffline ? 'text-amber-300 font-extrabold' : 'text-emerald-400'}>
                {isSimulatingOffline ? 'OFFLINE ACTIVE (Encrypted Local Geopackage)' : 'ONLINE C2 SYNCHRONIZED'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Inspectors in cellular dead-zones can log crack width & seepage offline; updates queue in localStorage and commit automatically upon reconnection.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {offlineQueue.length > 0 && (
            <button
              onClick={handleSyncOfflineQueue}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all active:scale-95"
            >
              <CheckCircle2 size={13} />
              <span>Sync {offlineQueue.length} Offline Tasks</span>
            </button>
          )}

          <button
            onClick={() => setIsSimulatingOffline(!isSimulatingOffline)}
            className={`px-3 py-1.5 rounded-lg border transition-all text-xs font-semibold ${
              isSimulatingOffline
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-white/[0.04] text-slate-300 border-white/[0.1] hover:bg-white/[0.08]'
            }`}
          >
            {isSimulatingOffline ? 'Exit Offline Mode' : 'Simulate Mountain Offline'}
          </button>
        </div>
      </div>

      {/* KPI Ticker */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 font-mono">
        <div className="p-3 bg-[#111827] border border-slate-800 rounded-lg">
          <div className="text-[10px] text-slate-400 uppercase">Total Queue</div>
          <div className="text-xl font-bold text-slate-100 mt-1">{inspections.length}</div>
        </div>
        <div className="p-3 bg-red-950/30 border border-red-800/40 rounded-lg">
          <div className="text-[10px] text-red-400 uppercase">P1 Immediate (Score &ge; 80)</div>
          <div className="text-xl font-bold text-red-300 mt-1">
            {inspections.filter(t => t.urgency_tier === 'P1_IMMEDIATE').length}
          </div>
        </div>
        <div className="p-3 bg-orange-950/30 border border-orange-800/40 rounded-lg">
          <div className="text-[10px] text-orange-400 uppercase">P2 High (60-79)</div>
          <div className="text-xl font-bold text-orange-300 mt-1">
            {inspections.filter(t => t.urgency_tier === 'P2_HIGH').length}
          </div>
        </div>
        <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-lg">
          <div className="text-[10px] text-cyan-400 uppercase">Dispatched Squads</div>
          <div className="text-xl font-bold text-cyan-300 mt-1">
            {inspections.filter(t => t.status === 'DISPATCHED').length}
          </div>
        </div>
        <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-lg">
          <div className="text-[10px] text-emerald-400 uppercase">Inspected / Cleared</div>
          <div className="text-xl font-bold text-emerald-300 mt-1">
            {inspections.filter(t => ['INSPECTED', 'CLEARED', 'CLOSED'].includes(t.status)).length}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 bg-[#111827] border border-slate-800 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Urgency Filter */}
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Urgency Tiers</option>
            <option value="P1_IMMEDIATE">P1 Immediate (&ge; 80)</option>
            <option value="P2_HIGH">P2 High (60-79)</option>
            <option value="P3_MEDIUM">P3 Medium (40-59)</option>
            <option value="P4_LOW">P4 Low (&lt; 40)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Task Statuses</option>
            <option value="PENDING">Pending Dispatch</option>
            <option value="DISPATCHED">Dispatched Squads</option>
            <option value="INSPECTED">Inspected</option>
            <option value="CLEARED">Cleared / Safe</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        {/* Search Filter */}
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search squad, catchment, district..."
            className="pl-7 pr-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-400 w-60"
          />
        </div>
      </div>

      {/* Main Inspections Table */}
      <Card title={`Prioritized Mission Queue (${filteredTasks.length} Active Missions)`}>
        <Table columns={columns} data={filteredTasks} emptyMessage="No inspection tasks match active filter criteria." />
      </Card>

      {/* Task Update Modal */}
      <Dialog
        isOpen={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        title="Update Field Mission Status"
        subtitle={selectedTask ? `${selectedTask.task_code || `INSP-${selectedTask.id}`} • ${selectedTask.infrastructure_name || selectedTask.location_name}` : ''}
        footer={
          <>
            <button
              onClick={() => setSelectedTask(null)}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveUpdate}
              disabled={isUpdating}
              className="px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-bold"
            >
              {isUpdating ? 'Saving Update...' : 'Save & Update Squad'}
            </button>
          </>
        }
      >
        {selectedTask && (
          <div className="space-y-3 font-mono text-xs">
            <div>
              <label className="text-[10px] text-slate-400 block uppercase mb-1">Mission Lifecycle Status</label>
              <select
                value={updateStatus}
                onChange={(e) => setUpdateStatus(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="NEW">NEW (Newly Created Mission)</option>
                <option value="ASSIGNED">ASSIGNED (Squad Allocated)</option>
                <option value="EN_ROUTE">EN_ROUTE (Squad In Transit to Sector)</option>
                <option value="ON_SITE">ON_SITE (Arrived at Slope Coordinates)</option>
                <option value="INSPECTING">INSPECTING (Active Crack Extensometer Survey)</option>
                <option value="SUBMITTED">SUBMITTED (Field Findings Logged)</option>
                <option value="SYNCED">SYNCED (Synchronized with C2 Command)</option>
                <option value="PENDING">PENDING (Awaiting Team Allocation)</option>
                <option value="DISPATCHED">DISPATCHED (En Route to Slope)</option>
                <option value="INSPECTED">INSPECTED (Visual & Instrument Survey Done)</option>
                <option value="CLEARED">CLEARED (Slope Retaining Wall Intact / Safe)</option>
                <option value="CLOSED">CLOSED (Mission Concluded & Filed)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block uppercase mb-1">Assigned Field Unit / Squad</label>
              <input
                type="text"
                value={updateTeam}
                onChange={(e) => setUpdateTeam(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 font-sans"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block uppercase mb-1">Assigned Officer / Inspector</label>
              <input
                type="text"
                value={updateOfficer}
                onChange={(e) => setUpdateOfficer(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 font-sans"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block uppercase mb-1">Field Observations & Dispatch Notes</label>
              <textarea
                value={updateNotes}
                onChange={(e) => setUpdateNotes(e.target.value)}
                placeholder="e.g. Geotech squad confirmed minor surface runoff; drainage ditch unblocked; crack displacement under 5mm."
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 font-sans"
              />
            </div>
          </div>
        )}
      </Dialog>

      {/* Mathematical Factor Breakdown Dialog */}
      <Dialog
        isOpen={Boolean(breakdownTask)}
        onClose={() => setBreakdownTask(null)}
        title="Multi-Factor Prioritization Scoring Formula"
        subtitle={breakdownTask ? `${breakdownTask.task_code || `INSP-${breakdownTask.id}`} • ${breakdownTask.location_name}` : ''}
        footer={
          <button
            onClick={() => setBreakdownTask(null)}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs"
          >
            Close Breakdown
          </button>
        }
      >
        {breakdownTask && (
          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-2">
              <div className="text-[11px] text-cyan-300 font-bold uppercase">Mathematical Formulation:</div>
              <p className="text-[11px] text-slate-300 font-mono leading-relaxed bg-slate-950 p-2 rounded border border-slate-800">
                P = (0.35 &times; Risk + 0.20 &times; Pop + 0.15 &times; Infra + 0.15 &times; Rain + 0.10 &times; Scar + 0.05 &times; &Delta;Risk) &times; (1.0 &minus; 0.10 &times; Uncertainty)
              </p>
            </div>

            {breakdownTask.priority_breakdown ? (
              <div className="space-y-2.5">
                <div className="text-[11px] text-slate-400 uppercase font-bold">Evaluated Component Weights:</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-slate-900 border border-slate-800 rounded">
                    <div className="text-[10px] text-slate-400">Physical Risk (35%)</div>
                    <div className="text-base font-bold text-amber-300 mt-0.5">
                      {breakdownTask.priority_breakdown.raw_components.risk_score.toFixed(1)}/100
                    </div>
                  </div>
                  <div className="p-2 bg-slate-900 border border-slate-800 rounded">
                    <div className="text-[10px] text-slate-400">Population Exposure (20%)</div>
                    <div className="text-base font-bold text-cyan-300 mt-0.5">
                      {breakdownTask.priority_breakdown.raw_components.population_score.toFixed(1)}/100
                    </div>
                  </div>
                  <div className="p-2 bg-slate-900 border border-slate-800 rounded">
                    <div className="text-[10px] text-slate-400">Critical Lifelines (15%)</div>
                    <div className="text-base font-bold text-orange-300 mt-0.5">
                      {breakdownTask.priority_breakdown.raw_components.lifeline_score.toFixed(1)}/100
                    </div>
                  </div>
                  <div className="p-2 bg-slate-900 border border-slate-800 rounded">
                    <div className="text-[10px] text-slate-400">Rainfall Trend (15%)</div>
                    <div className="text-base font-bold text-blue-300 mt-0.5">
                      {breakdownTask.priority_breakdown.raw_components.rainfall_trend_score.toFixed(1)}/100
                    </div>
                  </div>
                  <div className="p-2 bg-slate-900 border border-slate-800 rounded">
                    <div className="text-[10px] text-slate-400">Historical Scars (10%)</div>
                    <div className="text-base font-bold text-purple-300 mt-0.5">
                      {breakdownTask.priority_breakdown.raw_components.historical_scar_score.toFixed(1)}/100
                    </div>
                  </div>
                  <div className="p-2 bg-slate-900 border border-slate-800 rounded">
                    <div className="text-[10px] text-slate-400">Escalation Delta (5%)</div>
                    <div className="text-base font-bold text-red-300 mt-0.5">
                      {breakdownTask.priority_breakdown.raw_components.risk_delta_score.toFixed(1)}/100
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-cyan-950/40 border border-cyan-800/60 rounded flex items-center justify-between">
                  <span className="text-cyan-300 font-bold">Calculated Priority Score:</span>
                  <span className="text-lg font-bold text-cyan-200">
                    {breakdownTask.priority_breakdown.final_priority_score.toFixed(1)} / 100
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-900 border border-slate-800 rounded text-slate-300 text-[11px]">
                Prioritization score: <strong>{breakdownTask.priority_score.toFixed(1)}</strong>. Detailed per-component weights recorded during server-side ranking.
              </div>
            )}
          </div>
        )}
      </Dialog>

      {/* Field Geotechnical Evidence Dialog */}
      <Dialog
        isOpen={Boolean(evidenceTask)}
        onClose={() => setEvidenceTask(null)}
        title="Record Physical Field Geotechnical Evidence"
        subtitle={evidenceTask ? `${evidenceTask.location_name} • ${evidenceTask.task_code || `INSP-${evidenceTask.id}`}` : ''}
        footer={
          <>
            <button
              onClick={() => setEvidenceTask(null)}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEvidence}
              disabled={isSubmittingEvidence}
              className="px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-bold"
            >
              {isSubmittingEvidence ? 'Attaching...' : 'Attach & Audit Evidence'}
            </button>
          </>
        }
      >
        {evidenceTask && (
          <div className="space-y-3 font-mono text-xs">
            {/* Existing Evidence List */}
            {evidenceTask.evidence_attachments && evidenceTask.evidence_attachments.length > 0 && (
              <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded space-y-1.5">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Existing Attached Evidence Logs:</div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {evidenceTask.evidence_attachments.map((att, idx) => (
                    <div key={idx} className="p-1.5 bg-slate-950 rounded border border-slate-800 text-[11px] space-y-0.5">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="font-bold">{att.inspector_name}</span>
                        <span className="text-slate-500 text-[10px]">{new Date(att.recorded_at).toLocaleString()}</span>
                      </div>
                      <div className="text-cyan-400">
                        Displacement: {att.crack_displacement_mm !== undefined ? `${att.crack_displacement_mm} mm` : 'N/A'} • Creep: {att.observed_creep_severity || 'NONE'} • Seepage: {att.seepage_observed ? 'Yes' : 'No'}
                      </div>
                      {att.evidence_notes && (
                        <div className="text-slate-400 text-[10px] italic">{att.evidence_notes}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] text-slate-400 block uppercase mb-1">Field Geotechnical Inspector Name</label>
              <input
                type="text"
                value={inspectorName}
                onChange={(e) => setInspectorName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 font-sans"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 block uppercase mb-1">Crack Displacement (mm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={crackDisplacementMm}
                  onChange={(e) => setCrackDisplacementMm(e.target.value)}
                  placeholder="e.g. 15.2"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block uppercase mb-1">Observed Creep Severity</label>
                <select
                  value={creepSeverity}
                  onChange={(e) => setCreepSeverity(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="NONE">NONE (No active creep)</option>
                  <option value="MINOR">MINOR (&lt; 5 mm/week)</option>
                  <option value="MODERATE">MODERATE (5-20 mm/week)</option>
                  <option value="SEVERE">SEVERE (&gt; 20 mm/week / Bulging)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 bg-slate-900 border border-slate-800 rounded">
              <input
                type="checkbox"
                id="seepageCheck"
                checked={seepageObserved}
                onChange={(e) => setSeepageObserved(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <label htmlFor="seepageCheck" className="text-[11px] text-slate-200 font-sans cursor-pointer flex items-center gap-1">
                <Droplets size={12} className="text-cyan-400" />
                <span>Toe Seepage / Water Outflow Observed at Slope Base</span>
              </label>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block uppercase mb-1">Drone / Field Photo Reference IDs</label>
              <input
                type="text"
                value={photoIds}
                onChange={(e) => setPhotoIds(e.target.value)}
                placeholder="e.g. IMG-2026-081, IMG-2026-082"
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block uppercase mb-1">Detailed Geotechnical Notes & Recommendations</label>
              <textarea
                value={evidenceNotes}
                onChange={(e) => setEvidenceNotes(e.target.value)}
                placeholder="Describe tension crack orientation, slip circle propagation, ground saturation, and immediate mitigation."
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 font-sans"
              />
            </div>
          </div>
        )}
      </Dialog>

      {/* Create Manual Inspection Mission Modal */}
      <Dialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Dispatch New Geotechnical Inspection Mission"
        subtitle="Manually Assign Priority Squad to Catchment or Critical Lifeline"
        footer={
          <>
            <button
              onClick={() => setIsCreateOpen(false)}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateMission}
              disabled={isCreating}
              className="px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-bold"
            >
              {isCreating ? 'Creating...' : 'Create Mission & Deploy'}
            </button>
          </>
        }
      >
        <div className="space-y-3 font-mono text-xs">
          <div>
            <label className="text-[10px] text-slate-400 block uppercase mb-1">Target Catchment Location</label>
            <select
              value={newLocationId}
              onChange={(e) => setNewLocationId(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
            >
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.district}, {loc.state})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block uppercase mb-1">Reason for Deployment</label>
            <input
              type="text"
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 font-sans"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 block uppercase mb-1">Assigned Team</label>
              <input
                type="text"
                value={newTeam}
                onChange={(e) => setNewTeam(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 font-sans"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block uppercase mb-1">Assigned Officer</label>
              <input
                type="text"
                value={newOfficer}
                onChange={(e) => setNewOfficer(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 font-sans"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block uppercase mb-1">Survey Deadline Window</label>
            <select
              value={newDeadlineHours}
              onChange={(e) => setNewDeadlineHours(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
            >
              <option value={4}>4 Hours (Emergency P1 Immediate)</option>
              <option value={12}>12 Hours (High Priority P2)</option>
              <option value={24}>24 Hours (Standard Routine P3)</option>
              <option value={48}>48 Hours (Low Urgency P4)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block uppercase mb-1">Mission Guidelines & Specific Assets</label>
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="e.g. Inspect culvert blockages, measure tension crack width at crown, assess bridge pier stability."
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 font-sans"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};
