import React from 'react';
import { Dialog } from '../common/Dialog';
import { HistoricalLandslide } from '../../types';
import {
  Calendar,
  MapPin,
  AlertTriangle,
  Mountain,
  Droplets,
  Building2,
  Users,
  ShieldCheck,
  FileText,
  Activity,
  Layers,
  Info
} from 'lucide-react';

interface HistoricalEventDetailModalProps {
  event: HistoricalLandslide | null;
  isOpen: boolean;
  onClose: () => void;
}

export const HistoricalEventDetailModal: React.FC<HistoricalEventDetailModalProps> = ({
  event,
  isOpen,
  onClose
}) => {
  if (!event) return null;

  const severityColor = (sev?: string) => {
    switch (sev) {
      case 'CATASTROPHIC':
        return 'bg-red-950/80 text-red-300 border-red-600/80';
      case 'SEVERE':
        return 'bg-orange-950/80 text-orange-300 border-orange-600/80';
      case 'MODERATE':
        return 'bg-amber-950/80 text-amber-300 border-amber-600/80';
      default:
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-600/80';
    }
  };

  const confidenceBadge = (conf?: string) => {
    switch (conf) {
      case 'HIGH':
        return 'bg-emerald-900/50 text-emerald-300 border-emerald-500/50';
      case 'MEDIUM':
        return 'bg-amber-900/50 text-amber-300 border-amber-500/50';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Failure Event Dossier #${event.id} — ${event.location_name || 'Catchment Scar'}`}
      subtitle={`${event.district || 'Unassigned District'}, ${event.state || 'India'} • Cataloged Empirical Observation`}
      maxWidth="xl"
      footer={
        <button
          onClick={onClose}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-md border border-slate-700 transition-colors"
        >
          Close Dossier
        </button>
      }
    >
      <div className="space-y-4">
        {/* Top Badges & Data Provenance */}
        <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
          <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold uppercase border ${severityColor(event.severity || event.damage_rating)}`}>
            {event.severity || event.damage_rating || 'MODERATE'} SEVERITY
          </span>

          <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold bg-blue-950/60 text-blue-300 border border-blue-800 flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-blue-400" />
            Source: {event.data_source || 'GSI_BHUKOSH'}
          </span>

          <span className={`px-2.5 py-1 rounded text-xs font-mono font-semibold border flex items-center gap-1.5 ${confidenceBadge(event.data_confidence)}`}>
            Confidence: {event.data_confidence || 'HIGH'}
          </span>

          {event.is_demo && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/50 text-purple-300 border border-purple-800">
              HISTORICAL INVENTORY
            </span>
          )}
        </div>

        {/* Core Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-lg">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
              <Calendar size={13} className="text-cyan-400" />
              Event Date
            </div>
            <div className="text-sm font-mono font-bold text-slate-100">{event.event_date}</div>
          </div>

          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-lg">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
              <Droplets size={13} className="text-blue-400" />
              24h Antecedent Rain
            </div>
            <div className="text-sm font-mono font-bold text-blue-300">
              {event.rainfall_conditions_mm !== undefined && event.rainfall_conditions_mm !== null
                ? `${event.rainfall_conditions_mm.toFixed(1)} mm`
                : 'Not Recorded'}
            </div>
          </div>

          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-lg">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
              <Mountain size={13} className="text-amber-400" />
              Estimated Volume
            </div>
            <div className="text-sm font-mono font-bold text-slate-100">
              {event.estimated_volume_m3 ? `${event.estimated_volume_m3.toLocaleString()} m³` : 'Unspecified'}
            </div>
          </div>

          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-lg">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
              <Users size={13} className="text-red-400" />
              Casualties
            </div>
            <div className={`text-sm font-mono font-bold ${event.casualties > 0 ? 'text-red-400' : 'text-slate-300'}`}>
              {event.casualties} {event.casualties === 1 ? 'person' : 'people'}
            </div>
          </div>
        </div>

        {/* Secondary Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="p-3 bg-slate-900/40 border border-slate-800/80 rounded-lg space-y-1.5">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <MapPin size={13} className="text-emerald-400" />
              Geographic Coordinates
            </div>
            <div className="font-mono text-xs text-slate-200">
              Latitude: {event.latitude.toFixed(5)}°N, Longitude: {event.longitude.toFixed(5)}°E
            </div>
            {event.affected_area_m2 && (
              <div className="text-xs text-slate-300">
                <span className="text-slate-400">Affected Surface Footprint:</span>{' '}
                <span className="font-mono font-semibold">{event.affected_area_m2.toLocaleString()} m²</span>
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-900/40 border border-slate-800/80 rounded-lg space-y-1.5">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Activity size={13} className="text-amber-400" />
              Trigger Mechanism
            </div>
            <div className="font-mono text-xs font-semibold text-amber-200">
              {event.trigger_type.replace(/_/g, ' ')}
            </div>
            <div className="text-xs text-slate-400">
              Impact Classification: <span className="font-mono text-slate-200">{event.damage_rating}</span>
            </div>
          </div>
        </div>

        {/* Geotechnical Field Notes */}
        {event.notes && (
          <div className="p-3.5 bg-slate-900/50 border border-slate-800 rounded-lg space-y-1">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <FileText size={13} className="text-slate-300" />
              Field Investigation Notes & Geological Mechanism
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">{event.notes}</p>
          </div>
        )}

        {/* Nearby Infrastructure Exposure */}
        <div className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-lg space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Building2 size={14} className="text-indigo-400" />
              Critical Infrastructure in Proximity (&le; 2.5 km)
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
              {event.nearby_infrastructure?.length || 0} Assets Detected
            </span>
          </div>

          {event.nearby_infrastructure && event.nearby_infrastructure.length > 0 ? (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {event.nearby_infrastructure.map((infra, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800">
                      Tier {infra.lifeline_tier}
                    </span>
                    <div>
                      <span className="font-medium text-slate-200">{infra.name}</span>
                      <span className="text-slate-500 ml-2 text-[10px] uppercase font-mono">({infra.asset_type})</span>
                    </div>
                  </div>
                  <div className="font-mono text-[11px] text-amber-300">
                    ~{Math.round(infra.distance_m)} m away
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">
              No designated critical lifelines located within 2,500m radius of this failure scar.
            </p>
          )}
        </div>

        {/* Epistemic Note */}
        <div className="p-2.5 bg-slate-900/30 border border-slate-800/50 rounded flex items-start gap-2 text-[11px] text-slate-400">
          <Info size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
          <span>
            <strong>Epistemic Note:</strong> Historical event details reflect empirical geological and disaster management records. Proximity to infrastructure assets is calculated using geospatial Haversine metrics against verified database assets.
          </span>
        </div>
      </div>
    </Dialog>
  );
};
