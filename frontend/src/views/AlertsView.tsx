import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../components/common/Card';
import { Table, Column } from '../components/common/Table';
import { Dialog } from '../components/common/Dialog';
import { SeverityBadge, PriorityBadge, StatusBadge, RiskBadge } from '../components/common/Badge';
import { AlertItem, AlertPriority, AlertSeverity, AlertStatus, AlertsSummaryMetrics, AlertTriggerConfig } from '../types';
import { api } from '../services/api';
import {
  Siren,
  AlertTriangle,
  CheckCircle2,
  UserCheck,
  ClipboardList,
  Sliders,
  FileCode,
  RefreshCw,
  Search,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  Send,
  Building,
  Radio
} from 'lucide-react';

interface AlertsViewProps {
  alerts: AlertItem[];
  onAcknowledgeAlert: (id: number, acknowledged_by: string, notes?: string) => Promise<void>;
  onRefresh: () => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  onAcknowledgeAlert,
  onRefresh,
}) => {
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Summary Metrics
  const [summary, setSummary] = useState<AlertsSummaryMetrics | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  // Modals
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
  const [actionType, setActionType] = useState<'ACKNOWLEDGE' | 'ASSIGN' | 'INSPECT' | 'RESOLVE' | null>(null);
  const [operatorName, setOperatorName] = useState<string>('Duty Incident Commander');
  const [assignedSquad, setAssignedSquad] = useState<string>('NDRF Quick Response Team 1');
  const [actionNotes, setActionNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // CAP Modal
  const [capAlert, setCapAlert] = useState<AlertItem | null>(null);
  const [capPayload, setCapPayload] = useState<any>(null);
  const [isLoadingCap, setIsLoadingCap] = useState<boolean>(false);
  const [copiedCap, setCopiedCap] = useState<boolean>(false);

  // Thresholds Config Modal
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [config, setConfig] = useState<AlertTriggerConfig | null>(null);
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);

  // Quick Dispatch Inspection Modal
  const [dispatchAlert, setDispatchAlert] = useState<AlertItem | null>(null);
  const [dispatchOfficer, setDispatchOfficer] = useState<string>('Geotech Specialist');
  const [dispatchTeam, setDispatchTeam] = useState<string>('Rapid Slope Assessment Unit');
  const [dispatchHours, setDispatchHours] = useState<number>(12);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);

  // Load alert summary metrics and trigger config
  const fetchSummaryAndConfig = async () => {
    try {
      const s = await api.getAlertSummary();
      setSummary(s);
    } catch {
      // Fallback compute from props
      const active = alerts.filter(a => ['ACTIVE', 'GENERATED'].includes(a.status)).length;
      const ack = alerts.filter(a => a.status === 'ACKNOWLEDGED').length;
      const assign = alerts.filter(a => a.status === 'ASSIGNED').length;
      const under = alerts.filter(a => a.status === 'UNDER_INSPECTION').length;
      const res = alerts.filter(a => ['RESOLVED', 'CLOSED'].includes(a.status)).length;
      setSummary({
        total_alerts: alerts.length,
        active_alerts: active,
        acknowledged_alerts: ack,
        assigned_alerts: assign,
        under_inspection_alerts: under,
        resolved_alerts: res,
        closed_alerts: 0,
        critical_priority_alerts: alerts.filter(a => a.priority === 'CRITICAL').length,
        high_priority_alerts: alerts.filter(a => a.priority === 'HIGH').length,
        medium_priority_alerts: alerts.filter(a => a.priority === 'MEDIUM').length,
        low_priority_alerts: alerts.filter(a => a.priority === 'LOW').length,
        recent_escalations_24h: alerts.reduce((acc, a) => acc + (a.escalation_count || 0), 0),
        timestamp: new Date().toISOString()
      });
    }

    try {
      const cfg = await api.getAlertConfig();
      setConfig(cfg);
    } catch {
      // Offline fallback
    }
  };

  useEffect(() => {
    fetchSummaryAndConfig();
  }, [alerts]);

  // Run Evaluation Engine
  const handleRunEvaluation = async () => {
    setIsEvaluating(true);
    try {
      await api.evaluateAlerts();
      await fetchSummaryAndConfig();
      onRefresh();
    } catch (e) {
      console.error('Trigger evaluation error:', e);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Open CAP Payload Modal
  const handleOpenCAP = async (alertItem: AlertItem) => {
    setCapAlert(alertItem);
    setIsLoadingCap(true);
    setCopiedCap(false);
    try {
      const capData = await api.getAlertCAP(alertItem.id);
      setCapPayload(capData);
    } catch {
      // Standalone fallback CAP preview
      setCapPayload({
        identifier: `IN-NDMA-${alertItem.alert_code || `ALT-${alertItem.id}`}`,
        sender: 'ndma-incois-landslide-early-warning@gov.in',
        sent: alertItem.timestamp,
        status: 'Actual',
        msgType: 'Alert',
        scope: 'Public',
        info: {
          category: 'Geo',
          event: 'Landslide Hazard Warning',
          urgency: alertItem.priority === 'CRITICAL' ? 'Immediate' : 'Expected',
          severity: alertItem.severity === 'EVACUATION' ? 'Extreme' : 'Severe',
          certainty: 'Observed',
          headline: `LANDSLIDE EARLY WARNING: ${alertItem.location_name} (${alertItem.district})`,
          description: `Operational Priority ${alertItem.priority}: Risk Score ${alertItem.risk_score.toFixed(1)}/100. Trigger: ${alertItem.trigger_condition}.`,
          instruction: alertItem.recommended_action
        },
        is_demo: true,
        disclaimer: 'DEMO ONLY: Simulated OASIS CAP v1.2 Early Warning message.'
      });
    } finally {
      setIsLoadingCap(false);
    }
  };

  // Lifecycle Action Execution
  const handleExecuteLifecycleAction = async () => {
    if (!selectedAlert || !actionType) return;
    setIsSubmitting(true);
    try {
      if (actionType === 'ACKNOWLEDGE') {
        await onAcknowledgeAlert(selectedAlert.id, operatorName, actionNotes);
      } else if (actionType === 'ASSIGN') {
        await api.assignAlert(selectedAlert.id, assignedSquad, actionNotes);
      } else if (actionType === 'INSPECT') {
        await api.updateAlertStatus(selectedAlert.id, 'UNDER_INSPECTION', operatorName, actionNotes);
      } else if (actionType === 'RESOLVE') {
        await api.resolveAlert(selectedAlert.id, operatorName, actionNotes || 'Threat abated, slope stabilized.');
      }
      setSelectedAlert(null);
      setActionType(null);
      setActionNotes('');
      await fetchSummaryAndConfig();
      onRefresh();
    } catch (e: any) {
      alert(`Action failed: ${e?.message || 'Error updating alert status'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dispatch Quick Field Inspection Task
  const handleDispatchInspection = async () => {
    if (!dispatchAlert) return;
    setIsDispatching(true);
    try {
      await api.createInspection({
        location_id: dispatchAlert.location_id,
        reason: `Dispatched from Early Warning Alert [${dispatchAlert.alert_code || `ALT-${dispatchAlert.id}`}]: ${dispatchAlert.trigger_condition}`,
        assigned_officer: dispatchOfficer,
        assigned_team: dispatchTeam,
        deadline_hours: dispatchHours,
        notes: `Physical verification required for: ${dispatchAlert.recommended_action}`
      });
      // Optionally transition alert to ASSIGNED or UNDER_INSPECTION
      await api.assignAlert(dispatchAlert.id, dispatchTeam, `Field squad dispatched for inspection (Officer: ${dispatchOfficer})`);
      setDispatchAlert(null);
      await fetchSummaryAndConfig();
      onRefresh();
      alert('Inspection Mission created and Squad dispatched successfully!');
    } catch (e: any) {
      alert(`Dispatch failed: ${e?.message || 'Error creating inspection task'}`);
    } finally {
      setIsDispatching(false);
    }
  };

  // Save Config
  const handleSaveConfig = async () => {
    if (!config) return;
    setIsSavingConfig(true);
    try {
      const updated = await api.updateAlertConfig(config);
      setConfig(updated);
      setIsConfigOpen(false);
      alert('Alert Trigger Thresholds updated successfully.');
    } catch (e: any) {
      alert(`Failed to save config: ${e?.message || 'Error'}`);
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Filtered Alert List
  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      // Status filter
      if (statusFilter === 'ACTIVE_ONLY') {
        if (!['ACTIVE', 'GENERATED'].includes(a.status)) return false;
      } else if (statusFilter !== 'ALL') {
        if (a.status !== statusFilter) return false;
      }

      // Priority filter
      if (priorityFilter !== 'ALL' && a.priority !== priorityFilter) return false;

      // Severity filter
      if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchLoc = a.location_name.toLowerCase().includes(q);
        const matchDist = a.district.toLowerCase().includes(q);
        const matchCode = (a.alert_code || '').toLowerCase().includes(q);
        const matchTrig = a.trigger_condition.toLowerCase().includes(q);
        if (!matchLoc && !matchDist && !matchCode && !matchTrig) return false;
      }

      return true;
    });
  }, [alerts, statusFilter, priorityFilter, severityFilter, searchQuery]);

  // Table Columns
  const columns: Column<AlertItem>[] = [
    {
      key: 'priority',
      header: 'Operational Priority',
      render: (item) => (
        <div className="flex flex-col gap-1 items-start">
          <PriorityBadge priority={item.priority || (item.risk_score >= 70 ? 'CRITICAL' : item.risk_score >= 50 ? 'HIGH' : 'MEDIUM')} />
          <div className="text-[10px] font-mono text-slate-400">
            {item.alert_code || `ALT-2026-${item.id.toString().padStart(4, '0')}`}
          </div>
        </div>
      )
    },
    {
      key: 'severity',
      header: 'Physical Hazard',
      render: (item) => (
        <div className="flex flex-col gap-1 items-start">
          <SeverityBadge severity={item.severity} />
          {item.risk_category && (
            <span className="text-[10px] font-mono text-slate-400">
              Risk Cat: <span className="font-semibold text-slate-300">{item.risk_category}</span>
            </span>
          )}
        </div>
      )
    },
    {
      key: 'location_name',
      header: 'Target Catchment & District',
      render: (item) => (
        <div>
          <div className="font-semibold text-slate-100 flex items-center gap-1.5">
            {item.location_name}
            {item.escalation_count && item.escalation_count > 0 ? (
              <span className="px-1.5 py-0.2 bg-amber-950 text-amber-300 border border-amber-600 rounded text-[9px] font-mono font-bold animate-pulse">
                +{item.escalation_count} ESCALATED
              </span>
            ) : null}
          </div>
          <div className="text-[11px] text-slate-400 font-sans flex items-center gap-2 mt-0.5">
            <span>{item.district}</span>
            <span className="text-slate-600">•</span>
            <span className="font-mono text-amber-400">Score: {item.risk_score.toFixed(1)}/100</span>
          </div>
        </div>
      )
    },
    {
      key: 'trigger_condition',
      header: 'Evaluated Trigger Condition',
      render: (item) => (
        <div className="max-w-xs space-y-1">
          <div className="text-slate-200 font-mono text-[11px] font-medium leading-tight line-clamp-2">
            {item.trigger_condition}
          </div>
          {item.affected_infrastructure && item.affected_infrastructure.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-orange-300">
              <Building size={11} />
              <span>{item.affected_infrastructure.length} exposed assets</span>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'recommended_action',
      header: 'Mandatory SOP Protocol',
      render: (item) => (
        <div className="text-slate-300 font-sans text-[11px] line-clamp-2 max-w-sm bg-slate-900/60 p-1.5 rounded border border-slate-800">
          {item.recommended_action}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Lifecycle State',
      render: (item) => (
        <div className="flex flex-col gap-1 items-start">
          <StatusBadge status={item.status} />
          {item.assigned_to ? (
            <span className="text-[10px] font-mono text-cyan-400 truncate max-w-[120px]">
              Assigned: {item.assigned_to}
            </span>
          ) : item.acknowledged_by ? (
            <span className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
              Ack: {item.acknowledged_by}
            </span>
          ) : (
            <span className="text-[10px] font-mono text-red-400 animate-pulse">
              Unassigned
            </span>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Operational Actions',
      className: 'text-right',
      render: (item) => {
        const isGen = ['GENERATED', 'ACTIVE'].includes(item.status);
        const isAck = item.status === 'ACKNOWLEDGED';
        const isAssigned = item.status === 'ASSIGNED';
        const isUnder = item.status === 'UNDER_INSPECTION';
        const isResolved = ['RESOLVED', 'CLOSED'].includes(item.status);

        return (
          <div className="flex items-center justify-end gap-1.5 flex-wrap">
            {/* CAP OASIS v1.2 Preview Button */}
            <button
              onClick={() => handleOpenCAP(item)}
              title="Inspect OASIS CAP v1.2 Standard Alert Payload"
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded text-[11px] font-mono flex items-center gap-1 transition-colors"
            >
              <FileCode size={11} />
              <span>CAP</span>
            </button>

            {/* Direct Field Inspection Dispatch */}
            {!isResolved && (
              <button
                onClick={() => setDispatchAlert(item)}
                title="Dispatch Ground Geotechnical Inspection Squad"
                className="px-2 py-1 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 rounded text-[11px] font-mono flex items-center gap-1 transition-colors"
              >
                <ClipboardList size={11} />
                <span>Inspect</span>
              </button>
            )}

            {/* Lifecycle Transition Buttons */}
            {isGen && (
              <button
                onClick={() => {
                  setSelectedAlert(item);
                  setActionType('ACKNOWLEDGE');
                }}
                className="px-2.5 py-1 bg-red-950/90 hover:bg-red-900 text-red-300 border border-red-700 rounded text-xs font-mono font-bold transition-colors shadow-sm"
              >
                Acknowledge
              </button>
            )}

            {isAck && (
              <button
                onClick={() => {
                  setSelectedAlert(item);
                  setActionType('ASSIGN');
                }}
                className="px-2.5 py-1 bg-orange-950/90 hover:bg-orange-900 text-orange-300 border border-orange-700 rounded text-xs font-mono font-bold transition-colors"
              >
                Assign Squad
              </button>
            )}

            {isAssigned && (
              <button
                onClick={() => {
                  setSelectedAlert(item);
                  setActionType('INSPECT');
                }}
                className="px-2.5 py-1 bg-blue-950/90 hover:bg-blue-900 text-blue-300 border border-blue-700 rounded text-xs font-mono font-bold transition-colors"
              >
                Start Survey
              </button>
            )}

            {isUnder && (
              <button
                onClick={() => {
                  setSelectedAlert(item);
                  setActionType('RESOLVE');
                }}
                className="px-2.5 py-1 bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 rounded text-xs font-mono font-bold transition-colors"
              >
                Resolve & Close
              </button>
            )}

            {isResolved && (
              <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-500" />
                <span>Cleared</span>
              </span>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-4">
      {/* Simulation/Demo Banner */}
      <div className="p-2.5 bg-amber-950/40 border border-amber-800/60 rounded-lg flex items-center justify-between text-xs font-mono text-amber-300">
        <div className="flex items-center gap-2">
          <AlertTriangle size={15} className="text-amber-400 shrink-0" />
          <span>
            <strong>DECISION SUPPORT INTELLIGENCE ONLY:</strong> Early Warning priority algorithms recommend operational field actions. All simulated CAP broadcasts are marked <span className="font-bold underline">is_demo=true</span>.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsConfigOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded transition-colors"
          >
            <Sliders size={12} />
            <span>Thresholds</span>
          </button>
          <button
            onClick={handleRunEvaluation}
            disabled={isEvaluating}
            className="flex items-center gap-1.5 px-3 py-1 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-700/70 rounded font-bold transition-colors"
          >
            <RefreshCw size={12} className={isEvaluating ? 'animate-spin' : ''} />
            <span>{isEvaluating ? 'Evaluating...' : 'Evaluate Triggers'}</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5 font-mono">
        <div className="p-3 bg-[#111827] border border-slate-800 rounded-lg">
          <div className="text-[10px] text-slate-400 uppercase">Total Alerts</div>
          <div className="text-xl font-bold text-slate-100 mt-1">{summary?.total_alerts ?? alerts.length}</div>
        </div>
        <div className="p-3 bg-red-950/30 border border-red-800/40 rounded-lg">
          <div className="text-[10px] text-red-400 uppercase flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
            Active / New
          </div>
          <div className="text-xl font-bold text-red-300 mt-1">
            {summary?.active_alerts ?? alerts.filter(a => ['ACTIVE', 'GENERATED'].includes(a.status)).length}
          </div>
        </div>
        <div className="p-3 bg-orange-950/20 border border-orange-800/40 rounded-lg">
          <div className="text-[10px] text-orange-400 uppercase">Acknowledged</div>
          <div className="text-xl font-bold text-orange-300 mt-1">
            {summary?.acknowledged_alerts ?? alerts.filter(a => a.status === 'ACKNOWLEDGED').length}
          </div>
        </div>
        <div className="p-3 bg-cyan-950/20 border border-cyan-800/40 rounded-lg">
          <div className="text-[10px] text-cyan-400 uppercase">Assigned Squads</div>
          <div className="text-xl font-bold text-cyan-300 mt-1">
            {summary?.assigned_alerts ?? alerts.filter(a => a.status === 'ASSIGNED').length}
          </div>
        </div>
        <div className="p-3 bg-blue-950/20 border border-blue-800/40 rounded-lg">
          <div className="text-[10px] text-blue-400 uppercase">In Survey</div>
          <div className="text-xl font-bold text-blue-300 mt-1">
            {summary?.under_inspection_alerts ?? alerts.filter(a => a.status === 'UNDER_INSPECTION').length}
          </div>
        </div>
        <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-lg">
          <div className="text-[10px] text-emerald-400 uppercase">Resolved & Safe</div>
          <div className="text-xl font-bold text-emerald-300 mt-1">
            {summary?.resolved_alerts ?? alerts.filter(a => ['RESOLVED', 'CLOSED'].includes(a.status)).length}
          </div>
        </div>
        <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-lg">
          <div className="text-[10px] text-amber-400 uppercase">Escalations (24h)</div>
          <div className="text-xl font-bold text-amber-300 mt-1">
            {summary?.recent_escalations_24h ?? alerts.reduce((acc, a) => acc + (a.escalation_count || 0), 0)}
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="p-3 bg-[#111827] border border-slate-800 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-400 text-[11px] uppercase mr-1">Status:</span>
          {[
            { id: 'ALL', label: `All (${alerts.length})` },
            { id: 'ACTIVE_ONLY', label: `Active (${alerts.filter(a => ['ACTIVE', 'GENERATED'].includes(a.status)).length})` },
            { id: 'ACKNOWLEDGED', label: 'Acknowledged' },
            { id: 'ASSIGNED', label: 'Assigned' },
            { id: 'UNDER_INSPECTION', label: 'In Survey' },
            { id: 'RESOLVED', label: 'Resolved' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                statusFilter === tab.id
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Priority, Severity & Search */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Priority */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical Priority</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>

          {/* Severity */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="EVACUATION">Evacuation</option>
            <option value="WARNING">Warning</option>
            <option value="WATCH">Watch</option>
            <option value="ADVISORY">Advisory</option>
          </select>

          {/* Search Box */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search catchment, code, district..."
              className="pl-7 pr-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-400 w-52"
            />
          </div>
        </div>
      </div>

      {/* Main Alerts Table */}
      <Card title={`Early Warning Operational Queue (${filteredAlerts.length} Active Records)`}>
        <Table columns={columns} data={filteredAlerts} emptyMessage="No alerts matching selected status and priority filters." />
      </Card>

      {/* Lifecycle Action Transition Dialog */}
      <Dialog
        isOpen={Boolean(selectedAlert && actionType)}
        onClose={() => {
          setSelectedAlert(null);
          setActionType(null);
        }}
        title={
          actionType === 'ACKNOWLEDGE'
            ? 'Acknowledge Early Warning Alert'
            : actionType === 'ASSIGN'
            ? 'Assign Field Squad to Catchment Alert'
            : actionType === 'INSPECT'
            ? 'Commence Geotechnical Slope Survey'
            : 'Resolve & Close Early Warning Alert'
        }
        subtitle={selectedAlert ? `${selectedAlert.alert_code || `ALT-${selectedAlert.id}`} • ${selectedAlert.location_name} (${selectedAlert.district})` : ''}
        footer={
          <>
            <button
              onClick={() => {
                setSelectedAlert(null);
                setActionType(null);
              }}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleExecuteLifecycleAction}
              disabled={isSubmitting}
              className={`px-3 py-1.5 rounded font-mono text-xs font-bold transition-colors ${
                actionType === 'RESOLVE'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                  : 'bg-red-600 hover:bg-red-500 text-black'
              }`}
            >
              {isSubmitting ? 'Recording State Change...' : 'Confirm Action & Log Audit Trail'}
            </button>
          </>
        }
      >
        {selectedAlert && (
          <div className="space-y-3 font-mono">
            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Trigger:</span>
                <span className="text-amber-300 font-bold">{selectedAlert.trigger_condition}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Physical Severity / Risk:</span>
                <span className="text-red-400 font-bold">{selectedAlert.severity} ({selectedAlert.risk_score.toFixed(1)}/100)</span>
              </div>
              <div className="text-[11px] text-slate-300 font-sans border-t border-slate-800 pt-1 mt-1">
                <strong>Standard SOP:</strong> {selectedAlert.recommended_action}
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Authorizing Officer Name / Call Sign</label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 font-sans focus:outline-none focus:border-cyan-400"
              />
            </div>

            {actionType === 'ASSIGN' && (
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Assigned Response Squad / Team</label>
                <input
                  type="text"
                  value={assignedSquad}
                  onChange={(e) => setAssignedSquad(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 font-sans focus:outline-none focus:border-cyan-400"
                />
              </div>
            )}

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                {actionType === 'RESOLVE' ? 'Geotechnical Resolution Findings & Clearance Notes' : 'Dispatch / Operational Notes'}
              </label>
              <textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder={
                  actionType === 'RESOLVE'
                    ? 'e.g. Field inspection confirmed retention wall stable; debris culverts cleared; rainfall ceased.'
                    : 'e.g. NDRF Squad 2 mobilized with drone lidar; siren activated in lower valley.'
                }
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 font-sans focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>
        )}
      </Dialog>

      {/* OASIS Common Alerting Protocol (CAP v1.2) Viewer Dialog */}
      <Dialog
        isOpen={Boolean(capAlert)}
        onClose={() => {
          setCapAlert(null);
          setCapPayload(null);
        }}
        title="OASIS Common Alerting Protocol (CAP v1.2) Payload"
        subtitle={capAlert ? `Identifier: IN-NDMA-${capAlert.alert_code || `ALT-${capAlert.id}`}` : ''}
        footer={
          <>
            <button
              onClick={() => {
                if (capPayload) {
                  navigator.clipboard.writeText(JSON.stringify(capPayload, null, 2));
                  setCopiedCap(true);
                  setTimeout(() => setCopiedCap(false), 2000);
                }
              }}
              className="px-3 py-1.5 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 font-mono text-xs font-bold"
            >
              {copiedCap ? 'Copied JSON!' : 'Copy CAP JSON'}
            </button>
            <button
              onClick={() => {
                setCapAlert(null);
                setCapPayload(null);
              }}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs"
            >
              Close
            </button>
          </>
        }
      >
        <div className="space-y-3 font-mono text-xs">
          <div className="p-2 bg-slate-900 border border-slate-800 rounded flex items-center justify-between text-[11px] text-slate-400">
            <span>Standard: <strong>OASIS CAP v1.2 Compliant</strong></span>
            <span className="text-amber-400">DEMO SIMULATION PAYLOAD</span>
          </div>

          {isLoadingCap ? (
            <div className="p-8 text-center text-slate-400">
              <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-cyan-400" />
              <span>Formatting CAP XML/JSON payload...</span>
            </div>
          ) : capPayload ? (
            <div className="bg-slate-950 p-3 rounded border border-slate-800 max-h-96 overflow-y-auto">
              <pre className="text-[11px] text-cyan-300 leading-relaxed font-mono whitespace-pre-wrap">
                {JSON.stringify(capPayload, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="text-red-400">Failed to format CAP structure.</div>
          )}
        </div>
      </Dialog>

      {/* Trigger Thresholds Configuration Modal */}
      <Dialog
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        title="Configure Alert Trigger Thresholds"
        subtitle="Operational Parameters for Anti-Fatigue & Multi-Trigger Early Warning Engine"
        footer={
          <>
            <button
              onClick={() => setIsConfigOpen(false)}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveConfig}
              disabled={isSavingConfig}
              className="px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-bold"
            >
              {isSavingConfig ? 'Saving...' : 'Apply Threshold Updates'}
            </button>
          </>
        }
      >
        {config ? (
          <div className="space-y-3 font-mono text-xs">
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded text-slate-300 text-[11px] font-sans">
              Thresholds govern automatic alert dispatching, cooldown suppressions, and escalation on worsened conditions.
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 block uppercase mb-1">Critical Risk Score Threshold</label>
                <input
                  type="number"
                  value={config.critical_risk_score_threshold}
                  onChange={(e) => setConfig({ ...config, critical_risk_score_threshold: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block uppercase mb-1">High Risk Score Threshold</label>
                <input
                  type="number"
                  value={config.high_risk_score_threshold}
                  onChange={(e) => setConfig({ ...config, high_risk_score_threshold: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block uppercase mb-1">Rapid Rainfall Intensity (mm/h)</label>
                <input
                  type="number"
                  value={config.rapid_rainfall_mm_h_threshold}
                  onChange={(e) => setConfig({ ...config, rapid_rainfall_mm_h_threshold: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block uppercase mb-1">24h Critical Accumulation (mm)</label>
                <input
                  type="number"
                  value={config.critical_accum_rainfall_24h_mm}
                  onChange={(e) => setConfig({ ...config, critical_accum_rainfall_24h_mm: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block uppercase mb-1">Cooldown Window (Minutes)</label>
                <input
                  type="number"
                  value={config.cooldown_window_minutes}
                  onChange={(e) => setConfig({ ...config, cooldown_window_minutes: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block uppercase mb-1">Escalation Score Delta (+pts)</label>
                <input
                  type="number"
                  value={config.escalation_score_delta_threshold}
                  onChange={(e) => setConfig({ ...config, escalation_score_delta_threshold: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-slate-400 font-mono text-xs">Loading configuration...</div>
        )}
      </Dialog>

      {/* Direct Inspection Dispatch Dialog */}
      <Dialog
        isOpen={Boolean(dispatchAlert)}
        onClose={() => setDispatchAlert(null)}
        title="Dispatch Geotechnical Field Squad"
        subtitle={dispatchAlert ? `Target: ${dispatchAlert.location_name} • Trigger: ${dispatchAlert.trigger_condition}` : ''}
        footer={
          <>
            <button
              onClick={() => setDispatchAlert(null)}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleDispatchInspection}
              disabled={isDispatching}
              className="px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-bold"
            >
              {isDispatching ? 'Creating Mission...' : 'Create Mission & Dispatch Squad'}
            </button>
          </>
        }
      >
        {dispatchAlert && (
          <div className="space-y-3 font-mono text-xs">
            <div className="p-2.5 bg-cyan-950/40 border border-cyan-800/60 rounded text-cyan-300 text-[11px]">
              This will create a prioritized Inspection Task with an automated deadline and update this Alert to ASSIGNED.
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block uppercase mb-1">Assigned Officer</label>
              <input
                type="text"
                value={dispatchOfficer}
                onChange={(e) => setDispatchOfficer(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 font-sans"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block uppercase mb-1">Field Squad / Team</label>
              <input
                type="text"
                value={dispatchTeam}
                onChange={(e) => setDispatchTeam(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 font-sans"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block uppercase mb-1">Mission Deadline Window</label>
              <select
                value={dispatchHours}
                onChange={(e) => setDispatchHours(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value={4}>4 Hours (Emergency Urgent)</option>
                <option value={12}>12 Hours (Standard Priority P1/P2)</option>
                <option value={24}>24 Hours (Next Day Survey)</option>
                <option value={48}>48 Hours (Routine Monitoring)</option>
              </select>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};
