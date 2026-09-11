import React, { useState } from 'react';
import { X, Send, AlertTriangle, CheckCircle2, ShieldAlert, Camera, MapPin, Activity } from 'lucide-react';
import { api } from '../../services/api';
import { LocationSummary } from '../../types';

interface ReportIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: LocationSummary[];
  onIncidentReported?: (res: any) => void;
}

export const ReportIncidentModal: React.FC<ReportIncidentModalProps> = ({
  isOpen,
  onClose,
  locations,
  onIncidentReported,
}) => {
  const [locationId, setLocationId] = useState<number>(1);
  const [reporterName, setReporterName] = useState<string>('Duty Field Officer (Wayanad)');
  const [crackWidth, setCrackWidth] = useState<number>(18.5);
  const [seepageObserved, setSeepageObserved] = useState<boolean>(true);
  const [treeTiltObserved, setTreeTiltObserved] = useState<boolean>(true);
  const [evidenceNotes, setEvidenceNotes] = useState<string>(
    'Expanding tension fissures along crown scarp above tea plantation terraces; daylighting toe spring observed with turbid brown runout.'
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.reportGroundIncident({
        location_id: locationId,
        reporter_name: reporterName,
        crack_width_mm: crackWidth,
        seepage_observed: seepageObserved,
        tree_tilt_observed: treeTiltObserved,
        evidence_notes: evidenceNotes,
      });
      setResult(res);
      if (onIncidentReported) onIncidentReported(res);
    } catch (err: any) {
      alert(err.message || 'Failed to submit incident report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="bg-[#0d121f] border border-slate-700/80 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl font-sans text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-950 text-orange-400 border border-orange-800 rounded-lg">
              <AlertTriangle size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-100">
                  Field Incident &amp; Crack Report
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-950 text-orange-300 border border-orange-800">
                  FEATURE 15
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400">
                Ground Physical Verification &amp; Model Recalibration Loop
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {result ? (
          /* Confirmation State */
          <div className="space-y-3.5 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-600/60 space-y-2 text-emerald-300">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 size={18} className="text-emerald-400" />
                <span>Ground Verification Recorded!</span>
              </div>
              <p className="text-xs font-sans text-slate-300 leading-relaxed">
                Task <strong className="font-mono text-emerald-300">{result.task_code}</strong> created and dispatched.
                Catchment model risk has been recalibrated based on physical ground tension crack input.
              </p>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Urgency Tier:</span>
                <span className="font-bold text-red-400">{result.urgency_tier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Priority Score:</span>
                <span className="font-bold text-orange-300">{result.priority_score} / 100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Risk Recalibration:</span>
                <span className="font-bold text-red-400">{result.recalibration_delta}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Squad:</span>
                <span className="font-bold text-slate-200">{result.assigned_team}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  setResult(null);
                  onClose();
                }}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold"
              >
                Close &amp; Return to Dashboard
              </button>
            </div>
          </div>
        ) : (
          /* Form State */
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-sans">
            <div>
              <label className="text-slate-400 font-mono text-[11px] block mb-1">
                Target Catchment Sector:
              </label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.district})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-mono text-[11px] block mb-1">
                Observer / Field Officer:
              </label>
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Tension Crack Width Range Slider */}
            <div>
              <div className="flex justify-between font-mono text-[11px] mb-1">
                <span className="text-slate-400">Tension Crack Width:</span>
                <strong className={crackWidth > 15 ? 'text-red-400' : 'text-amber-400'}>
                  {crackWidth} mm
                </strong>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="0.5"
                value={crackWidth}
                onChange={(e) => setCrackWidth(Number(e.target.value))}
                className="w-full accent-orange-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-0.5">
                <span>0mm (Hairline)</span>
                <span>15mm (Critical Threshold)</span>
                <span>60mm (Failure)</span>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
              <label className="flex items-center gap-2 p-2 bg-slate-900/60 border border-slate-800 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={seepageObserved}
                  onChange={(e) => setSeepageObserved(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 accent-cyan-400"
                />
                <span className="text-slate-300">Toe Water Seepage</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-900/60 border border-slate-800 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={treeTiltObserved}
                  onChange={(e) => setTreeTiltObserved(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 accent-cyan-400"
                />
                <span className="text-slate-300">Tilting Trees / Poles</span>
              </label>
            </div>

            {/* Observation Notes */}
            <div>
              <label className="text-slate-400 font-mono text-[11px] block mb-1">
                Geological Observation Notes:
              </label>
              <textarea
                rows={2}
                value={evidenceNotes}
                onChange={(e) => setEvidenceNotes(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-400 text-xs"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800 font-mono">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Send size={12} />
                <span>{isSubmitting ? 'Recording...' : 'Submit Incident & Recalibrate'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
