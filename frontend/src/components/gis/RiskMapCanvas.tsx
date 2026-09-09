import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, Eye, EyeOff, MapPin, AlertTriangle, Building2, Mountain, Droplets, Compass, Maximize2, ShieldAlert } from 'lucide-react';
import { GISLayerVisibility } from '../../types';

interface RiskMapCanvasProps {
  riskZonesGeoJSON?: any;
  riskGridGeoJSON?: any;
  environmentalGeoJSON?: any;
  infrastructureGeoJSON?: any;
  historicalLandslidesGeoJSON?: any;
  selectedLocationId?: number | null;
  onSelectLocation?: (locationId: number) => void;
  onDispatchInspection?: (locationId: number) => void;
  onLaunchSimulation?: (locationId: number) => void;
  height?: string;
  flyToCoords?: [number, number] | null;
}

const CATEGORY_SYMBOLS: Record<string, string> = {
  CRITICAL: '▲!',
  HIGH: '▲',
  MODERATE: '■',
  LOW: '●'
};

const CATEGORY_COLORS: Record<string, { stroke: string; fill: string; text: string }> = {
  CRITICAL: { stroke: '#ef4444', fill: 'rgba(239, 68, 68, 0.45)', text: '#fca5a5' },
  HIGH: { stroke: '#f97316', fill: 'rgba(249, 115, 22, 0.35)', text: '#fdba74' },
  MODERATE: { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.25)', text: '#fde68a' },
  LOW: { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.20)', text: '#86efac' }
};

export const RiskMapCanvas: React.FC<RiskMapCanvasProps> = ({
  riskZonesGeoJSON,
  riskGridGeoJSON,
  environmentalGeoJSON,
  infrastructureGeoJSON,
  historicalLandslidesGeoJSON,
  selectedLocationId,
  onSelectLocation,
  onDispatchInspection,
  onLaunchSimulation,
  height = '620px',
  flyToCoords
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // GeoJSON Layer References
  const riskZonesLayerRef = useRef<L.GeoJSON | null>(null);
  const riskGridLayerRef = useRef<L.GeoJSON | null>(null);
  const drainageLayerRef = useRef<L.GeoJSON | null>(null);
  const geologyLayerRef = useRef<L.GeoJSON | null>(null);
  const infraLayerRef = useRef<L.GeoJSON | null>(null);
  const historicalLayerRef = useRef<L.GeoJSON | null>(null);

  // Layer Visibility State
  const [layers, setLayers] = useState<GISLayerVisibility>({
    riskZones: true,
    riskGrid: true,
    drainage: true,
    geologyFaults: true,
    villages: true,
    roads: true,
    bridges: true,
    schools: true,
    hospitals: true,
    historicalScars: true
  });

  const [showLayerPanel, setShowLayerPanel] = useState(true);
  const [showLegend, setShowLegend] = useState(true);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default center at Western Ghats (Wayanad/Idukki region) with view of India
    const map = L.map(mapContainerRef.current, {
      center: [11.6854, 76.132], // Meppadi / Wayanad
      zoom: 9,
      zoomControl: false,
    });

    // Dark Matter Tactical Base Tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO | NDMA Tactical Risk GIS',
      subdomains: 'abcd',
      maxZoom: 18,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapInstanceRef.current = map;

    // Handle popup action button clicks
    map.on('popupopen', (e) => {
      const popupNode = e.popup.getElement();
      if (!popupNode) return;

      const inspectBtn = popupNode.querySelector('[data-action="inspect"]');
      if (inspectBtn) {
        inspectBtn.addEventListener('click', () => {
          const locId = Number(inspectBtn.getAttribute('data-location-id'));
          if (locId && onSelectLocation) onSelectLocation(locId);
        });
      }

      const dispatchBtn = popupNode.querySelector('[data-action="dispatch"]');
      if (dispatchBtn) {
        dispatchBtn.addEventListener('click', () => {
          const locId = Number(dispatchBtn.getAttribute('data-location-id'));
          if (locId && onDispatchInspection) onDispatchInspection(locId);
        });
      }

      const simBtn = popupNode.querySelector('[data-action="simulate"]');
      if (simBtn) {
        simBtn.addEventListener('click', () => {
          const locId = Number(simBtn.getAttribute('data-location-id'));
          if (locId && onLaunchSimulation) onLaunchSimulation(locId);
        });
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle explicit flyTo
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (flyToCoords && flyToCoords.length === 2 && !isNaN(flyToCoords[0]) && !isNaN(flyToCoords[1])) {
      map.flyTo(flyToCoords, 12, { animate: true, duration: 1.2 });
    }
  }, [flyToCoords]);

  // Handle Selected Location fly-to and styling
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedLocationId || !riskZonesGeoJSON?.features) return;

    const feature = riskZonesGeoJSON.features.find(
      (f: any) => f.properties?.location_id === selectedLocationId
    );
    if (feature && feature.geometry) {
      if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
        const bounds = L.geoJSON(feature).getBounds();
        if (bounds.isValid()) {
          map.flyToBounds(bounds, { maxZoom: 13, padding: [60, 60], animate: true, duration: 1.2 });
        }
      } else if (feature.properties.latitude && feature.properties.longitude) {
        map.flyTo([feature.properties.latitude, feature.properties.longitude], 12, { animate: true, duration: 1.2 });
      }
    }
  }, [selectedLocationId, riskZonesGeoJSON]);

  // 1. RISK CATCHMENT ZONES LAYER
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (riskZonesLayerRef.current) {
      map.removeLayer(riskZonesLayerRef.current);
      riskZonesLayerRef.current = null;
    }

    if (riskZonesGeoJSON && layers.riskZones) {
      const geoLayer = L.geoJSON(riskZonesGeoJSON, {
        style: (feature) => {
          const props = feature?.properties || {};
          const cat = props.risk_category || 'LOW';
          const styleConfig = CATEGORY_COLORS[cat] || CATEGORY_COLORS.LOW;
          const isSelected = selectedLocationId && props.location_id === selectedLocationId;

          return {
            color: isSelected ? '#00e5ff' : styleConfig.stroke,
            fillColor: styleConfig.fill,
            fillOpacity: isSelected ? 0.8 : (cat === 'CRITICAL' ? 0.6 : 0.4),
            weight: isSelected ? 3.5 : (cat === 'CRITICAL' ? 2.5 : 1.5),
            dashArray: isSelected ? '4, 4' : (cat === 'CRITICAL' ? '6, 3' : undefined),
          };
        },
        onEachFeature: (feature, layer) => {
          const p = feature.properties || {};
          const cat = p.risk_category || 'LOW';
          const sym = CATEGORY_SYMBOLS[cat] || '●';
          const styleConfig = CATEGORY_COLORS[cat] || CATEGORY_COLORS.LOW;
          const fsColor = p.geotechnical_fs < 1.0 ? '#ef4444' : p.geotechnical_fs < 1.3 ? '#f59e0b' : '#10b981';

          const popupContent = `
            <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 250px; font-size: 11px; line-height: 1.4; color: #f8fafc;">
              <!-- Header -->
              <div style="display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 1px solid #334155; padding-bottom: 6px; margin-bottom: 8px;">
                <div>
                  <div style="font-weight: 700; font-size: 13px; color: #ffffff; letter-spacing: 0.01em;">${p.name}</div>
                  <div style="color: #94a3b8; font-size: 10px; font-family: monospace;">${p.district}, ${p.state} | CODE: ${p.code || 'ZONE-' + p.location_id}</div>
                </div>
                <div style="background: ${styleConfig.fill}; border: 1px solid ${styleConfig.stroke}; color: ${styleConfig.text}; font-size: 10px; font-weight: 800; font-family: monospace; padding: 2px 6px; border-radius: 4px; white-space: nowrap;">
                  ${sym} ${cat} (${Math.round(p.risk_score || 0)})
                </div>
              </div>

              <!-- Geotechnical & Rainfall Grid -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; background: rgba(15, 23, 42, 0.7); padding: 8px; border-radius: 6px; border: 1px solid #1e293b; margin-bottom: 8px; font-family: monospace;">
                <div>
                  <div style="color: #64748b; font-size: 9px;">24H RAINFALL</div>
                  <div style="font-weight: 700; font-size: 12px; color: #38bdf8;">${p.rainfall_accum_24h || 0} mm</div>
                </div>
                <div>
                  <div style="color: #64748b; font-size: 9px;">7D RAINFALL</div>
                  <div style="font-weight: 700; font-size: 12px; color: #818cf8;">${p.rainfall_7d_mm || 0} mm</div>
                </div>
                <div>
                  <div style="color: #64748b; font-size: 9px;">SLOPE / STABILITY</div>
                  <div style="font-weight: 700; font-size: 12px; color: #fbbf24;">${p.slope_degrees || 0}°</div>
                </div>
                <div>
                  <div style="color: #64748b; font-size: 9px;">FACTOR OF SAFETY (Fs)</div>
                  <div style="font-weight: 700; font-size: 12px; color: ${fsColor};">${p.geotechnical_fs || 'N/A'}</div>
                </div>
              </div>

              <!-- Primary Hazard Driver -->
              <div style="background: rgba(30, 41, 59, 0.6); padding: 6px 8px; border-radius: 4px; border-left: 3px solid ${styleConfig.stroke}; margin-bottom: 8px;">
                <div style="color: #94a3b8; font-size: 9px; font-family: monospace; text-transform: uppercase;">Primary Risk Driver</div>
                <div style="color: #e2e8f0; font-size: 11px; font-weight: 600;">${p.top_factor || 'Continuous Antecedent Precipitation'}</div>
              </div>

              <!-- Exposed Demographics -->
              <div style="display: flex; justify-content: space-between; font-size: 10px; color: #cbd5e1; margin-bottom: 10px;">
                <span>Exposed Population:</span>
                <strong style="font-family: monospace; color: #f8fafc;">${(p.population || 0).toLocaleString()} residents</strong>
              </div>

              <!-- Tactical Actions -->
              <div style="display: flex; flex-direction: column; gap: 4px;">
                <button
                  data-action="inspect"
                  data-location-id="${p.location_id}"
                  style="background: #0284c7; color: #ffffff; border: none; border-radius: 4px; padding: 5px 8px; font-weight: 600; font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;"
                >
                  Inspect Geotechnical & Lifelines Drawer &rarr;
                </button>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                  <button
                    data-action="dispatch"
                    data-location-id="${p.location_id}"
                    style="background: #334155; color: #cbd5e1; border: 1px solid #475569; border-radius: 4px; padding: 4px; font-size: 9px; cursor: pointer; text-align: center;"
                  >
                    Dispatch Team
                  </button>
                  <button
                    data-action="simulate"
                    data-location-id="${p.location_id}"
                    style="background: #334155; color: #cbd5e1; border: 1px solid #475569; border-radius: 4px; padding: 4px; font-size: 9px; cursor: pointer; text-align: center;"
                  >
                    Simulate Storm
                  </button>
                </div>
              </div>
            </div>
          `;

          layer.bindPopup(popupContent, { maxWidth: 290 });
          layer.on({
            click: () => {
              if (onSelectLocation && p.location_id) {
                onSelectLocation(p.location_id);
              }
            }
          });
        }
      }).addTo(map);

      riskZonesLayerRef.current = geoLayer;
    }
  }, [riskZonesGeoJSON, layers.riskZones, selectedLocationId]);

  // 2. MICRO-CATCHMENT RISK GRID LAYER
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (riskGridLayerRef.current) {
      map.removeLayer(riskGridLayerRef.current);
      riskGridLayerRef.current = null;
    }

    if (riskGridGeoJSON && layers.riskGrid) {
      const geoLayer = L.geoJSON(riskGridGeoJSON, {
        style: (feature) => {
          const props = feature?.properties || {};
          return {
            color: props.stroke_color || '#ef4444',
            fillColor: props.fill_color || 'rgba(239, 68, 68, 0.4)',
            fillOpacity: 0.35,
            weight: 0.8,
            dashArray: '2, 2'
          };
        },
        onEachFeature: (feature, layer) => {
          const p = feature.properties || {};
          const cat = p.risk_category || 'MODERATE';
          const sym = CATEGORY_SYMBOLS[cat] || '■';
          layer.bindPopup(`
            <div style="font-family: monospace; font-size: 11px; color: #f8fafc; min-width: 170px;">
              <strong style="color: #38bdf8;">Grid Cell #${p.cell_id}</strong><br/>
              <span style="color: #94a3b8;">${p.parent_location_name} Micro-Zone</span><br/>
              <hr style="border-color: #334155; margin: 4px 0;"/>
              ML Probability: <strong>${Math.round((p.risk_probability || 0) * 100)}%</strong><br/>
              Risk Category: <strong style="color: ${p.stroke_color};">${sym} ${cat}</strong><br/>
              Slope: <strong>${p.slope_degrees}°</strong> | Moisture: <strong>${Math.round((p.soil_moisture || 0) * 100)}%</strong>
            </div>
          `);
        }
      }).addTo(map);

      riskGridLayerRef.current = geoLayer;
    }
  }, [riskGridGeoJSON, layers.riskGrid]);

  // 3. ENVIRONMENTAL OVERLAYS (Drainage & Faults)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (drainageLayerRef.current) {
      map.removeLayer(drainageLayerRef.current);
      drainageLayerRef.current = null;
    }
    if (geologyLayerRef.current) {
      map.removeLayer(geologyLayerRef.current);
      geologyLayerRef.current = null;
    }

    if (environmentalGeoJSON?.features) {
      const drainageFeatures = environmentalGeoJSON.features.filter((f: any) => f.properties?.layer_type === 'drainage');
      const faultFeatures = environmentalGeoJSON.features.filter((f: any) => f.properties?.layer_type === 'geology_fault');

      if (drainageFeatures.length > 0 && layers.drainage) {
        drainageLayerRef.current = L.geoJSON({ type: 'FeatureCollection', features: drainageFeatures } as any, {
          style: {
            color: '#06b6d4',
            weight: 2.5,
            opacity: 0.85
          },
          onEachFeature: (feature, layer) => {
            const p = feature.properties || {};
            layer.bindPopup(`
              <div style="font-family: monospace; font-size: 11px; color: #06b6d4;">
                <strong>${p.name}</strong><br/>
                <span style="color: #94a3b8;">Discharge Flow: ${p.flow_rate_m3_s || 25} m³/s</span>
              </div>
            `);
          }
        }).addTo(map);
      }

      if (faultFeatures.length > 0 && layers.geologyFaults) {
        geologyLayerRef.current = L.geoJSON({ type: 'FeatureCollection', features: faultFeatures } as any, {
          style: {
            color: '#a855f7',
            weight: 2,
            dashArray: '5, 5',
            opacity: 0.9
          },
          onEachFeature: (feature, layer) => {
            const p = feature.properties || {};
            layer.bindPopup(`
              <div style="font-family: monospace; font-size: 11px; color: #d8b4fe;">
                <strong>${p.name}</strong><br/>
                <span style="color: #94a3b8;">Kinematics: ${p.slip_type || 'Shear Zone'}</span>
              </div>
            `);
          }
        }).addTo(map);
      }
    }
  }, [environmentalGeoJSON, layers.drainage, layers.geologyFaults]);

  // 4. INFRASTRUCTURE POINT ASSETS LAYER
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (infraLayerRef.current) {
      map.removeLayer(infraLayerRef.current);
      infraLayerRef.current = null;
    }

    if (infrastructureGeoJSON?.features) {
      // Filter features based on active sub-layer toggles
      const activeFeatures = infrastructureGeoJSON.features.filter((f: any) => {
        const type = (f.properties?.asset_type || '').toLowerCase();
        if (type.includes('hospital') || type.includes('health') || type.includes('clinic')) return layers.hospitals;
        if (type.includes('bridge') || type.includes('culvert')) return layers.bridges;
        if (type.includes('school') || type.includes('college')) return layers.schools;
        if (type.includes('road') || type.includes('highway')) return layers.roads;
        if (type.includes('village') || type.includes('habitation') || type.includes('community')) return layers.villages;
        return true;
      });

      infraLayerRef.current = L.geoJSON({ type: 'FeatureCollection', features: activeFeatures } as any, {
        pointToLayer: (feature, latlng) => {
          const p = feature.properties || {};
          const type = (p.asset_type || '').toLowerCase();

          let color = '#38bdf8'; // Default cyan
          let radius = 5;

          if (type.includes('hospital')) {
            color = '#ef4444'; // Red for hospital
            radius = 6.5;
          } else if (type.includes('bridge')) {
            color = '#8b5cf6'; // Purple for bridges
            radius = 6;
          } else if (type.includes('school')) {
            color = '#eab308'; // Yellow for schools
            radius = 5.5;
          } else if (type.includes('road')) {
            color = '#f97316'; // Orange for road cuts
            radius = 5;
          } else if (type.includes('village')) {
            color = '#10b981'; // Green for villages
            radius = 5.5;
          }

          return L.circleMarker(latlng, {
            radius,
            fillColor: color,
            color: '#ffffff',
            weight: 1.5,
            opacity: 1,
            fillOpacity: 0.95
          });
        },
        onEachFeature: (feature, layer) => {
          const p = feature.properties || {};
          const tierColor = p.lifeline_tier === 1 ? '#ef4444' : p.lifeline_tier === 2 ? '#f59e0b' : '#38bdf8';
          layer.bindPopup(`
            <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; color: #f8fafc; min-width: 180px;">
              <strong style="color: #ffffff; font-size: 12px;">${p.name}</strong><br/>
              <span style="color: #94a3b8;">${p.asset_type}</span><br/>
              <span style="display: inline-block; margin-top: 4px; padding: 2px 6px; border-radius: 3px; font-family: monospace; font-size: 9px; font-weight: 700; background: rgba(15, 23, 42, 0.8); border: 1px solid ${tierColor}; color: ${tierColor};">
                LIFELINE TIER ${p.lifeline_tier || 3}
              </span>
              <div style="margin-top: 6px; font-family: monospace; font-size: 10px; color: #cbd5e1;">
                Catchment: ${p.location_name || 'Regional'}<br/>
                Capacity / Serves: ${(p.capacity || 0).toLocaleString()}
              </div>
            </div>
          `);
        }
      }).addTo(map);
    }
  }, [infrastructureGeoJSON, layers]);

  // 5. HISTORICAL LANDSLIDE SCARS LAYER
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (historicalLayerRef.current) {
      map.removeLayer(historicalLayerRef.current);
      historicalLayerRef.current = null;
    }

    if (historicalLandslidesGeoJSON && layers.historicalScars) {
      historicalLayerRef.current = L.geoJSON(historicalLandslidesGeoJSON, {
        pointToLayer: (feature, latlng) => {
          return L.circleMarker(latlng, {
            radius: 5,
            fillColor: '#ea580c',
            color: '#ffedd5',
            weight: 1.5,
            opacity: 1,
            fillOpacity: 0.85
          });
        },
        onEachFeature: (feature, layer) => {
          const p = feature.properties || {};
          layer.bindPopup(`
            <div style="font-family: monospace; font-size: 11px; color: #f8fafc; min-width: 190px;">
              <strong style="color: #fb923c;">Landslide Inventory Scar</strong><br/>
              Date: <strong>${p.event_date}</strong><br/>
              Trigger: <strong>${p.trigger_type}</strong><br/>
              Casualties: <strong style="color: ${p.casualties > 0 ? '#ef4444' : '#94a3b8'};">${p.casualties}</strong><br/>
              Damage: <strong>${p.damage_rating}</strong><br/>
              Volume: <strong>${p.estimated_volume_m3 ? p.estimated_volume_m3.toLocaleString() + ' m³' : 'Unspecified'}</strong>
            </div>
          `);
        }
      }).addTo(map);
    }
  }, [historicalLandslidesGeoJSON, layers.historicalScars]);

  const handleResetBounds = () => {
    const map = mapInstanceRef.current;
    if (!map || !riskZonesLayerRef.current) return;
    try {
      const bounds = riskZonesLayerRef.current.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], animate: true, duration: 1.0 });
      }
    } catch (e) {
      map.setView([15.5, 76.5], 6);
    }
  };

  const toggleLayer = (key: keyof GISLayerVisibility) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="relative w-full rounded-lg overflow-hidden border border-slate-800 bg-[#0b0f19]" style={{ height }}>
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Tactical Layer Switcher */}
      <div className="absolute top-3 right-3 z-[400] max-w-xs">
        <div className="bg-[#111827]/95 backdrop-blur-md border border-slate-700/80 rounded-lg p-2.5 shadow-2xl text-xs font-mono">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-700/60 text-slate-200">
            <button
              onClick={() => setShowLayerPanel(!showLayerPanel)}
              className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-cyan-400 hover:text-cyan-300"
            >
              <Layers size={13} />
              <span>GIS Overlays ({Object.values(layers).filter(Boolean).length})</span>
            </button>
            <button
              onClick={handleResetBounds}
              title="Fit map to all catchments"
              className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800"
            >
              <Maximize2 size={12} />
            </button>
          </div>

          {showLayerPanel && (
            <div className="mt-2 space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {/* Hazard Layers */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Hazard Polygons</span>
                <label className="flex items-center justify-between text-[11px] text-slate-300 hover:text-white cursor-pointer py-0.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-red-500/80 border border-red-400" />
                    Risk Catchments
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.riskZones}
                    onChange={() => toggleLayer('riskZones')}
                    className="rounded border-slate-700 bg-slate-800 text-cyan-400 focus:ring-0 cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between text-[11px] text-slate-300 hover:text-white cursor-pointer py-0.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded border border-dashed border-red-400 bg-red-400/20" />
                    Micro Risk Grid
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.riskGrid}
                    onChange={() => toggleLayer('riskGrid')}
                    className="rounded border-slate-700 bg-slate-800 text-cyan-400 focus:ring-0 cursor-pointer"
                  />
                </label>
              </div>

              {/* Environmental Overlays */}
              <div className="pt-1.5 border-t border-slate-800/80 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Environmental</span>
                <label className="flex items-center justify-between text-[11px] text-slate-300 hover:text-white cursor-pointer py-0.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-0.5 bg-cyan-400" />
                    Drainage Stream Corridors
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.drainage}
                    onChange={() => toggleLayer('drainage')}
                    className="rounded border-slate-700 bg-slate-800 text-cyan-400 focus:ring-0 cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between text-[11px] text-slate-300 hover:text-white cursor-pointer py-0.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-0.5 border-b border-dashed border-purple-400" />
                    Geological Faults
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.geologyFaults}
                    onChange={() => toggleLayer('geologyFaults')}
                    className="rounded border-slate-700 bg-slate-800 text-cyan-400 focus:ring-0 cursor-pointer"
                  />
                </label>
              </div>

              {/* Critical Lifelines */}
              <div className="pt-1.5 border-t border-slate-800/80 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Lifeline Assets</span>
                <label className="flex items-center justify-between text-[11px] text-slate-300 hover:text-white cursor-pointer py-0.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Hospitals & Medical
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.hospitals}
                    onChange={() => toggleLayer('hospitals')}
                    className="rounded border-slate-700 bg-slate-800 text-cyan-400 focus:ring-0 cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between text-[11px] text-slate-300 hover:text-white cursor-pointer py-0.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    Bridges & Culverts
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.bridges}
                    onChange={() => toggleLayer('bridges')}
                    className="rounded border-slate-700 bg-slate-800 text-cyan-400 focus:ring-0 cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between text-[11px] text-slate-300 hover:text-white cursor-pointer py-0.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    Highways & Roads
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.roads}
                    onChange={() => toggleLayer('roads')}
                    className="rounded border-slate-700 bg-slate-800 text-cyan-400 focus:ring-0 cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between text-[11px] text-slate-300 hover:text-white cursor-pointer py-0.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    Schools & Shelters
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.schools}
                    onChange={() => toggleLayer('schools')}
                    className="rounded border-slate-700 bg-slate-800 text-cyan-400 focus:ring-0 cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between text-[11px] text-slate-300 hover:text-white cursor-pointer py-0.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Villages & Habitations
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.villages}
                    onChange={() => toggleLayer('villages')}
                    className="rounded border-slate-700 bg-slate-800 text-cyan-400 focus:ring-0 cursor-pointer"
                  />
                </label>
              </div>

              {/* Historical */}
              <div className="pt-1.5 border-t border-slate-800/80 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">History</span>
                <label className="flex items-center justify-between text-[11px] text-slate-300 hover:text-white cursor-pointer py-0.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-600 border border-orange-300" />
                    Historical Scars
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.historicalScars}
                    onChange={() => toggleLayer('historicalScars')}
                    className="rounded border-slate-700 bg-slate-800 text-cyan-400 focus:ring-0 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Accessible Non-Color Tactical Legend */}
      <div className="absolute bottom-3 left-3 z-[400]">
        <div className="bg-[#111827]/95 backdrop-blur-md border border-slate-700/80 rounded-lg p-2.5 shadow-2xl text-[11px] font-mono text-slate-300">
          <div className="flex items-center justify-between pb-1 border-b border-slate-700/60 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <ShieldAlert size={12} className="text-amber-400" />
              Tactical Risk Legend
            </span>
            <button
              onClick={() => setShowLegend(!showLegend)}
              className="text-slate-400 hover:text-white text-[10px]"
            >
              {showLegend ? 'Hide' : 'Show'}
            </button>
          </div>

          {showLegend && (
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="font-black text-red-400 bg-red-950/70 border border-red-500 rounded px-1 text-[10px]">▲!</span>
                <span className="font-semibold text-red-300">CRITICAL</span>
                <span className="text-slate-500 text-[10px]">(Fs &lt; 1.0, Score &gt; 70)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-orange-400 bg-orange-950/60 border border-orange-500 rounded px-1 text-[10px]">▲</span>
                <span className="font-semibold text-orange-300">HIGH</span>
                <span className="text-slate-500 text-[10px]">(Score 51 - 70)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-amber-400 bg-amber-950/60 border border-amber-500 rounded px-1 text-[10px]">■</span>
                <span className="font-semibold text-amber-300">MODERATE</span>
                <span className="text-slate-500 text-[10px]">(Score 31 - 50)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-emerald-400 bg-emerald-950/60 border border-emerald-500 rounded px-1 text-[10px]">●</span>
                <span className="font-semibold text-emerald-300">LOW</span>
                <span className="text-slate-500 text-[10px]">(Score 0 - 30)</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
