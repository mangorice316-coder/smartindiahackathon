import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { FileText, Printer, Download, ExternalLink } from 'lucide-react';

interface ReportsViewProps {
  sitRep: any;
  onRefresh: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ sitRep, onRefresh }) => {
  const [copied, setCopied] = useState(false);

  const handleDownloadJSON = () => {
    if (!sitRep) return;
    const blob = new Blob([JSON.stringify(sitRep, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SITREP_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openPrintableReport = () => {
    window.open('/api/v1/reports/html', '_blank');
  };

  const summary = sitRep?.executive_summary || {};
  const hotspots = sitRep?.critical_hotspots || [];

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#111827] border border-slate-800 rounded-lg">
        <div>
          <h3 className="font-display font-bold text-sm text-slate-100 uppercase">Emergency Situation Report (SitRep)</h3>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Auto-synthesized multi-hazard report formatted for State Disaster Management Authorities
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={openPrintableReport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors"
          >
            <Printer size={13} />
            <span>Printable HTML / PDF</span>
          </button>
          <button
            onClick={handleDownloadJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 rounded font-bold transition-colors"
          >
            <Download size={13} />
            <span>Export Raw JSON</span>
          </button>
        </div>
      </div>

      {/* SitRep Document Preview */}
      <Card title={sitRep?.report_title || 'Landslide Situation Report'} subtitle={`Report ID: ${sitRep?.report_id || 'SITREP-LIVE'}`}>
        <div className="space-y-4 font-mono text-xs">
          {/* Executive Summary Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded">
            <div>
              <span className="text-[10px] text-slate-500 uppercase">Monitored Zones</span>
              <div className="text-base font-bold text-slate-200">{summary.monitored_zones_count || 5}</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase">Population at Risk</span>
              <div className="text-base font-bold text-slate-200">{(summary.total_population_at_risk || 0).toLocaleString()}</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase">Active Alerts</span>
              <div className="text-base font-bold text-red-400">{summary.active_emergency_alerts_count || 0}</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase">Max 24h Rainfall</span>
              <div className="text-base font-bold text-cyan-400">{summary.max_24h_recorded_rainfall_mm || 0} mm</div>
            </div>
          </div>

          {/* Critical Hotspots Section */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-200 uppercase text-xs">1. Active Slope Hotspots</h4>
            <div className="space-y-2">
              {hotspots.map((h: any, i: number) => (
                <div key={i} className="p-2.5 bg-slate-900/40 border border-slate-800 rounded flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-200">{h.location_name} ({h.district})</div>
                    <div className="text-[11px] text-slate-400">Fs = {h.geotechnical_fs} ({h.geotechnical_stability})</div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      h.risk_category === 'CRITICAL' ? 'bg-red-950 text-red-300 border border-red-600' : 'bg-orange-950 text-orange-300 border border-orange-600'
                    }`}>
                      {h.risk_category} ({h.risk_score}/100)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legal and Geotechnical Disclaimer */}
          <div className="p-3 bg-red-950/20 border-l-4 border-red-600 text-slate-400 text-[11px] font-sans leading-relaxed">
            <strong className="text-red-400 font-mono text-xs block mb-1">SCIENTIFIC DECISION SUPPORT DISCLAIMER:</strong>
            {sitRep?.scientific_disclaimer ||
              'This assessment estimates geotechnical landslide hazard and community exposure. It does NOT guarantee whether a slope failure will occur. Corroborate with ground instrumentation and on-site geotechnical inspection.'}
          </div>
        </div>
      </Card>
    </div>
  );
};
