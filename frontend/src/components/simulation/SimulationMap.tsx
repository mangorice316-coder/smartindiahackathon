import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { SimulationResult, SimulationDifferenceClass, RiskCategory } from '../../types';
import { Layers, MapPin, AlertTriangle, ShieldAlert, CheckCircle2, TrendingUp, Info } from 'lucide-react';

interface SimulationMapProps {
  results: SimulationResult[];
  activeLayer: 'difference' | 'scenario' | 'baseline';
  onChangeLayer: (layer: 'difference' | 'scenario' | 'baseline') => void;
  selectedLocationId?: number | null;
  onSelectLocation?: (locationId: number) => void;
  height?: string;
}

const CATEGORY_COLORS: Record<RiskCategory, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MODERATE: '#eab308',
  LOW: '#10b981'
};

const DIFFERENCE_COLORS: Record<SimulationDifferenceClass, { color: string; label: string; bg: string }> = {
  NEWLY_CRITICAL: { color: '#dc2626', label: 'Newly Critical Zone', bg: 'rgba(220, 38, 38, 0.4)' },
  NEWLY_HIGH: { color: '#ea580c', label: 'Newly High Risk', bg: 'rgba(234, 88, 12, 0.35)' },
  RISK_INCREASED: { color: '#f59e0b', label: 'Risk Increased (ΔR ≥ 5)', bg: 'rgba(245, 158, 11, 0.3)' },
  UNCHANGED: { color: '#64748b', label: 'Unchanged / Steady', bg: 'rgba(100, 116, 139, 0.25)' },
  RISK_DECREASED: { color: '#10b981', label: 'Risk Decreased', bg: 'rgba(16, 185, 129, 0.25)' }
};

export const SimulationMap: React.FC<SimulationMapProps> = ({
  results,
  activeLayer,
  onChangeLayer,
  selectedLocationId,
  onSelectLocation,
  height = '420px'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: false,
      attributionControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
      subdomains: 'abcd'
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers when results or activeLayer changes
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;

    const group = layerGroupRef.current;
    group.clearLayers();

    const bounds: L.LatLngExpression[] = [];

    results.forEach((item) => {
      if (item.latitude === undefined || item.longitude === undefined || item.latitude === null || item.longitude === null) {
        return;
      }

      const latLng: [number, number] = [item.latitude, item.longitude];
      bounds.push(latLng);

      let markerColor = '#64748b';
      let statusLabel = '';
      let radius = 12;

      if (activeLayer === 'baseline') {
        markerColor = CATEGORY_COLORS[item.baseline_category] || '#10b981';
        statusLabel = `Baseline: ${item.baseline_category} (${item.baseline_risk_score.toFixed(1)})`;
        radius = Math.max(9, Math.min(22, 9 + item.baseline_risk_score * 0.13));
      } else if (activeLayer === 'scenario') {
        markerColor = CATEGORY_COLORS[item.simulated_category] || '#ef4444';
        statusLabel = `Simulated: ${item.simulated_category} (${item.simulated_risk_score.toFixed(1)})`;
        radius = Math.max(9, Math.min(22, 9 + item.simulated_risk_score * 0.13));
      } else {
        // Difference
        const diffClass = item.difference_class || (item.risk_score_delta >= 5 ? 'RISK_INCREASED' : 'UNCHANGED');
        const meta = DIFFERENCE_COLORS[diffClass] || DIFFERENCE_COLORS.UNCHANGED;
        markerColor = meta.color;
        statusLabel = meta.label;
        radius = Math.max(10, Math.min(24, 10 + Math.abs(item.risk_score_delta) * 0.35));
      }

      const isSelected = selectedLocationId === item.location_id;

      const circle = L.circleMarker(latLng, {
        radius: isSelected ? radius + 4 : radius,
        fillColor: markerColor,
        color: isSelected ? '#38bdf8' : '#ffffff',
        weight: isSelected ? 3 : 1.5,
        opacity: 0.9,
        fillOpacity: isSelected ? 0.85 : 0.65
      });

      // Tooltip
      circle.bindTooltip(
        `<div class="font-mono text-xs">
          <strong>${item.location_name}</strong><br/>
          <span>${statusLabel}</span><br/>
          <span>ΔR: <strong>${item.risk_score_delta > 0 ? `+${item.risk_score_delta}` : item.risk_score_delta}</strong></span>
        </div>`,
        { direction: 'top', className: 'sim-map-tooltip' }
      );

      // Popup
      const popupHtml = `
        <div style="font-family: monospace; font-size: 11px; min-width: 200px; color: #f1f5f9; background: #0f172a; padding: 6px; border-radius: 6px;">
          <div style="font-weight: bold; font-size: 12px; margin-bottom: 4px; color: #38bdf8;">${item.location_name}</div>
          <div style="color: #94a3b8; font-size: 10px; margin-bottom: 6px;">${item.district || 'Western Ghats / Himalayas'}</div>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span style="color: #94a3b8;">Baseline Risk:</span>
            <strong>${item.baseline_risk_score.toFixed(1)} (${item.baseline_category})</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span style="color: #94a3b8;">Simulated Risk:</span>
            <strong style="color: ${item.simulated_category === 'CRITICAL' ? '#ef4444' : '#f97316'};">${item.simulated_risk_score.toFixed(1)} (${item.simulated_category})</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span style="color: #94a3b8;">Risk Delta (ΔR):</span>
            <strong style="color: ${item.risk_score_delta > 0 ? '#ef4444' : '#94a3b8'};">${item.risk_score_delta > 0 ? `+${item.risk_score_delta}` : item.risk_score_delta}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: #94a3b8;">Factor of Safety:</span>
            <span>Fs: ${item.baseline_fs} &rarr; <strong style="color: ${item.simulated_fs < 1.0 ? '#ef4444' : '#38bdf8'};">${item.simulated_fs}</strong></span>
          </div>

          ${item.affected_infrastructure_names.length > 0 ? `
            <div style="border-top: 1px solid #334155; padding-top: 4px; margin-top: 4px; font-size: 10px; color: #fbbf24;">
              <strong>Threatened Lifelines (${item.affected_infrastructure_names.length}):</strong><br/>
              ${item.affected_infrastructure_names.slice(0, 2).join(', ')}
            </div>
          ` : ''}
        </div>
      `;
      circle.bindPopup(popupHtml);

      circle.on('click', () => {
        if (onSelectLocation) onSelectLocation(item.location_id);
      });

      group.addLayer(circle);
    });

    if (bounds.length > 0) {
      mapInstanceRef.current.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 10 });
    }
  }, [results, activeLayer, selectedLocationId]);

  return (
    <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
      {/* Layer Switcher Toolbar */}
      <div className="absolute top-3 left-3 z-[1000] flex items-center gap-1.5 p-1 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-md font-mono text-xs">
        <span className="text-slate-400 text-[10px] uppercase px-1.5 flex items-center gap-1">
          <Layers size={12} />
          Layer:
        </span>
        <button
          onClick={() => onChangeLayer('difference')}
          className={`px-2 py-1 rounded text-[11px] font-bold transition-colors ${
            activeLayer === 'difference'
              ? 'bg-amber-950 text-amber-300 border border-amber-600'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Difference (ΔR)
        </button>
        <button
          onClick={() => onChangeLayer('scenario')}
          className={`px-2 py-1 rounded text-[11px] font-bold transition-colors ${
            activeLayer === 'scenario'
              ? 'bg-red-950 text-red-300 border border-red-600'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Scenario Saturated
        </button>
        <button
          onClick={() => onChangeLayer('baseline')}
          className={`px-2 py-1 rounded text-[11px] font-bold transition-colors ${
            activeLayer === 'baseline'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-600'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Baseline
        </button>
      </div>

      {/* Dynamic Map Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] p-2 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-md font-mono text-[10px] space-y-1">
        <div className="text-slate-400 uppercase font-bold text-[9px]">
          {activeLayer === 'difference' ? 'Difference Layer Legend' : 'Risk Severity Legend'}
        </div>
        {activeLayer === 'difference' ? (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
              <span className="text-red-400 font-bold">Newly Critical Zone</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-600" />
              <span className="text-orange-400">Newly High Risk</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-amber-400">Risk Surge (ΔR ≥ 5)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
              <span className="text-slate-400">Unchanged / Resilient</span>
            </div>
          </div>
        ) : (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-red-400 font-bold">Critical (Score &gt; 70)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span className="text-orange-400">High (51-70)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-amber-400">Moderate (31-50)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-400">Low (≤ 30)</span>
            </div>
          </div>
        )}
      </div>

      {/* Map DOM container */}
      <div ref={mapContainerRef} style={{ height, width: '100%' }} />
    </div>
  );
};
