import { AuditLogEntry } from '../types';

const STORAGE_KEY = 'lrids_c2_audit_trail_v1';

const DEFAULT_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'AUD-2026-0912-001',
    timestamp: '2026-09-12T04:12:00Z',
    user_role: 'DISASTER_COMMANDER',
    action_type: 'EVACUATION',
    action_title: 'Mandatory Tier-1 Evacuation: Chooralmala Sector',
    target: 'Chooralmala (Wayanad)',
    rationale: 'Factor of Safety (Fs 0.88) crossed limit equilibrium threshold. Immediate 1,420 resident evacuation.',
    previous_state: 'WARNING_MONITORING',
    new_state: 'MANDATORY_EVACUATION_ISSUED',
    authorized_by: 'District Magistrate (C2-EOC-WAYANAD)',
    status: 'COMMITTED',
  },
  {
    id: 'AUD-2026-0912-002',
    timestamp: '2026-09-12T04:30:00Z',
    user_role: 'INFRASTRUCTURE_AUTHORITY',
    action_type: 'ROAD_CLOSURE',
    action_title: 'Preemptive Closure of Meppadi-Chooralmala Bridge & SH-59',
    target: 'SH-59 & Meppadi Bridge Corridor',
    rationale: 'Pore-water pressure exceeding 68 kPa with severe scour risk at northern abutment.',
    previous_state: 'OPEN_RESTRICTED',
    new_state: 'CLOSED_BARRICADED',
    authorized_by: 'PWD Executive Engineer (Roads Division)',
    status: 'COMMITTED',
  },
  {
    id: 'AUD-2026-0912-003',
    timestamp: '2026-09-12T05:00:00Z',
    user_role: 'GEOLOGICAL_ANALYST',
    action_type: 'FIELD_DISPATCH',
    action_title: 'Deploy Geological Rapid Response Team Alpha',
    target: 'Chooralmala Upper Ridge Scar',
    rationale: 'Monitor tension crack widening rates (> 12mm/hr) using portable extensometers.',
    previous_state: 'STANDBY',
    new_state: 'DEPLOYED_EN_ROUTE',
    authorized_by: 'GSI Nodal Officer',
    status: 'COMMITTED',
  }
];

export class AuditLogger {
  private static loadLogs(): AuditLogEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Unable to access localStorage for audit trail:', e);
    }
    return DEFAULT_AUDIT_LOGS;
  }

  private static saveLogs(logs: AuditLogEntry[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to persist audit trail to localStorage:', e);
    }
  }

  public static getLogs(): AuditLogEntry[] {
    return this.loadLogs();
  }

  public static logAction(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const logs = this.loadLogs();
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `AUD-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newEntry);
    this.saveLogs(logs);

    // Dispatch global event for live UI reactivity
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('audit-log-updated', { detail: newEntry }));
    }

    return newEntry;
  }

  public static exportToJSON(): string {
    const logs = this.loadLogs();
    return JSON.stringify(logs, null, 2);
  }

  public static exportToCSV(): string {
    const logs = this.loadLogs();
    const headers = [
      'Log ID',
      'Timestamp',
      'User Role',
      'Action Type',
      'Action Title',
      'Target Location',
      'Rationale',
      'Previous State',
      'New State',
      'Authorized By',
      'Status'
    ];

    const rows = logs.map(l => [
      `"${l.id}"`,
      `"${l.timestamp}"`,
      `"${l.user_role}"`,
      `"${l.action_type}"`,
      `"${l.action_title.replace(/"/g, '""')}"`,
      `"${l.target.replace(/"/g, '""')}"`,
      `"${l.rationale.replace(/"/g, '""')}"`,
      `"${l.previous_state}"`,
      `"${l.new_state}"`,
      `"${l.authorized_by.replace(/"/g, '""')}"`,
      `"${l.status}"`
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  public static downloadExport(format: 'json' | 'csv'): void {
    const isCSV = format === 'csv';
    const content = isCSV ? this.exportToCSV() : this.exportToJSON();
    const type = isCSV ? 'text/csv;charset=utf-8;' : 'application/json;charset=utf-8;';
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LRIDS_C2_Audit_Trail_${new Date().toISOString().replace(/[:.]/g, '-')}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
