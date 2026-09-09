import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { HistoricalLandslide, TimelineSnapshot } from '../../types';
import { Layers, MapPin, Maximize2, ShieldAlert, Mountain, Droplets, Users } from 'lucide-react';

interface HistoricalEventMapProps {
  events: HistoricalLandslide[];
  activeSnapshot?: TimelineSnapshot | null;
  onSelectEvent: (event: HistoricalLandslide) => void;
  selectedEventId?: number | null;
  height?: string;
}

const DISTRICT_COORDS: Record<string, [number, number]> = {
  Wayanad: [11.6854, 76.132],
  Idukki: [9.8494, 76.9744],
  Chamoli: [30.418, 79.327],
  Shimla: [31.1048, 77.1734],
  Nilgiris: [11.4102, 76.695]
};

export const HistoricalEventMap: React.FC<HistoricalEventMapProps> = ({
  events,
  activeSnapshot,
  onSelectEvent,
  selectedEventId,
  height = '500px'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const scarsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const snapshotCatchmentsLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20.5937, 78.9629], // Center of India
      zoom: 5,
      zoomControl: false,
    });

    // Dark base tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO | Historical Landslide Catalog',
      subdomains: 'abcd',
      maxZoom: 18,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    scarsLayerGroupRef.current = L.layerGroup().addTo(map);
    snapshotCatchmentsLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Scars Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const scarsGroup = scarsLayerGroupRef.current;
    if (!map || !scarsGroup) return;

    scarsGroup.clearLayers();

    const bounds = L.latLngBounds([]);

    events.forEach((ev) => {
      const lat = ev.latitude;
      const lng = ev.longitude;
      if (typeof lat !== 'number' || typeof lng !== 'number') return;

      bounds.extend([lat, lng]);

      const isSelected = selectedEventId === ev.id;
      const sev = (ev.severity || ev.damage_rating || 'MODERATE').toUpperCase();

      let color = '#f59e0b';
      let fillColor = 'rgba(245, 158, 11, 0.4)';
      let radius = 8;

      if (sev === 'CATASTROPHIC') {
        color = '#ef4444';
        fillColor = 'rgba(239, 68, 68, 0.6)';
        radius = 12;
      } else if (sev === 'SEVERE') {
        color = '#f97316';
        fillColor = 'rgba(249, 115, 22, 0.5)';
        radius = 10;
      } else if (sev === 'MINOR') {
        color = '#10b981';
        fillColor = 'rgba(16, 185, 129, 0.4)';
        radius = 6;
      }

      if (isSelected) {
        radius += 4;
      }

      const marker = L.circleMarker([lat, lng], {
        radius,
        color: isSelected ? '#ffffff' : color,
        fillColor,
        fillOpacity: 0.85,
        weight: isSelected ? 3 : 1.5,
      });

      // Tooltip content
      const tooltipContent = `
        <div style="font-family: sans-serif; font-size: 11px; line-height: 1.4; color: #f1f5f9; background: #0f172a; padding: 6px 8px; border-radius: 6px; border: 1px solid #334155;">
          <div style="font-weight: bold; color: #f8fafc; font-size: 12px;">${ev.location_name || 'Failure Scar'}</div>
          <div style="color: #94a3b8; font-size: 10px; margin-bottom: 4px;">${ev.district || ''}, ${ev.event_date}</div>
          <div style="display: flex; gap: 8px;">
            <span style="color: ${color}; font-weight: bold;">${sev}</span>
            <span style="color: #67e8f9;">${ev.rainfall_conditions_mm ? `${ev.rainfall_conditions_mm.toFixed(0)}mm rain` : ''}</span>
          </div>
          ${ev.casualties > 0 ? `<div style="color: #f87171; font-weight: bold; margin-top: 2px;">⚠️ ${ev.casualties} Casualties</div>` : ''}
          <div style="color: #cbd5e1; font-size: 9px; margin-top: 4px; font-style: italic;">Click to inspect dossier</div>
        </div>
      `;

      marker.bindTooltip(tooltipContent, {
        direction: 'top',
        offset: [0, -8],
        opacity: 0.95,
        className: 'historical-scar-tooltip'
      });

      marker.on('click', () => {
        onSelectEvent(ev);
      });

      scarsGroup.addLayer(marker);
    });

    if (events.length > 0 && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 11 });
    }
  }, [events, selectedEventId, onSelectEvent]);

  // Update Active Timeline Snapshot Catchments
  useEffect(() => {
    const map = mapInstanceRef.current;
    const snapGroup = snapshotCatchmentsLayerRef.current;
    if (!map || !snapGroup) return;

    snapGroup.clearLayers();

    if (!activeSnapshot || !activeSnapshot.catchments) return;

    activeSnapshot.catchments.forEach((catchment) => {
      let riskColor = '#10b981';
      if (catchment.risk_category === 'CRITICAL') riskColor = '#ef4444';
      else if (catchment.risk_category === 'HIGH') riskColor = '#f97316';
      else if (catchment.risk_category === 'MODERATE') riskColor = '#f59e0b';

      const circle = L.circle([catchment.latitude, catchment.longitude], {
        radius: 3500, // 3.5km footprint
        color: riskColor,
        fillColor: riskColor,
        fillOpacity: 0.18,
        weight: 1.5,
        dashArray: '4 4'
      });

      circle.bindTooltip(`
        <div style="font-family: sans-serif; font-size: 11px; color: #f8fafc; background: #0f172a; padding: 5px 8px; border-radius: 4px; border: 1px solid #334155;">
          <strong>${catchment.name}</strong> (${catchment.district})<br/>
          <span style="color: ${riskColor}; font-weight: bold;">${catchment.risk_category} (Score: ${catchment.risk_score.toFixed(1)})</span><br/>
          <span>24h Rain: ${catchment.rainfall_24h_mm.toFixed(1)} mm</span>
        </div>
      `);

      snapGroup.addLayer(circle);
    });
  }, [activeSnapshot]);

  const handleFlyToDistrict = (districtName: string) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const coords = DISTRICT_COORDS[districtName];
    if (coords) {
      map.flyTo(coords, 10, { duration: 1.2 });
    }
  };

  const handleFitAll = () => {
    const map = mapInstanceRef.current;
    if (!map || events.length === 0) return;
    const bounds = L.latLngBounds([]);
    events.forEach(e => {
      if (typeof e.latitude === 'number' && typeof e.longitude === 'number') {
        bounds.extend([e.latitude, e.longitude]);
      }
    });
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  };

  return (
    <div className="relative rounded-lg overflow-hidden border border-slate-800 shadow-md">
      {/* Top Map Action Header */}
      <div className="absolute top-3 left-3 z-[400] flex flex-wrap items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-md border border-slate-700 shadow-lg text-xs">
        <button
          onClick={handleFitAll}
          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-[11px] flex items-center gap-1 border border-slate-600 transition-colors"
        >
          <Maximize2 size={12} /> Fit All Scars
        </button>

        <span className="text-slate-600">|</span>

        {Object.keys(DISTRICT_COORDS).map((d) => (
          <button
            key={d}
            onClick={() => handleFlyToDistrict(d)}
            className="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white font-mono text-[10px] border border-slate-700/80 transition-colors"
          >
            {d}
          </button>
        ))}
      </div>

      {/* Map Container */}
      <div ref={mapContainerRef} style={{ height }} className="w-full bg-[#0b0f19]" />

      {/* Bottom Floating Legend */}
      <div className="absolute bottom-3 left-3 z-[400] bg-slate-900/90 backdrop-blur-md p-2.5 rounded-md border border-slate-700 shadow-lg text-xs font-mono space-y-1.5">
        <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
          Failure Scar Severity
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span className="text-red-300">Catastrophic</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            <span className="text-orange-300">Severe</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-amber-300">Moderate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-emerald-300">Minor</span>
          </div>
        </div>
        {activeSnapshot && (
          <div className="pt-1.5 border-t border-slate-800 text-[10px] text-cyan-300 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full border border-dashed border-cyan-400"></span>
            Timeline Catchment Risk Footprints
          </div>
        )}
      </div>
    </div>
  );
};
