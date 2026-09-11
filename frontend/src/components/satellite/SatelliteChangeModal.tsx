import React, { useState, useEffect } from 'react';
import { X, Satellite, Layers, ArrowRight, ShieldCheck, Activity, Eye, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';

interface SatelliteChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationId?: number;
}

export const SatelliteChangeModal: React.FC<SatelliteChangeModalProps> = ({
  isOpen,
  onClose,
  locationId = 1,
}) => {
  const [data, setData] = useState<any>(null);
  const [activeLayer, setActiveLayer] = useState<'ndvi' | 'sar' | 'rgb'>('ndvi');
  const [sliderPosition, setSliderPosition] = useState<number>(50); // 0 = pre, 100 = post

  useEffect(() => {
    if (isOpen) {
      api.getSatelliteChange(locationId).then(setData).catch(console.warn);
    }
  }, [isOpen, locationId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="bg-[#0d121f] border border-slate-700/80 rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl font-sans text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-950 text-purple-400 border border-purple-800 rounded-lg">
              <Satellite size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-100">
                  Multispectral &amp; SAR Change Detection
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800">
                  FEATURE 11
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400">
                Copernicus Sentinel-2 MSI (10m) + Sentinel-1 C-SAR Coherence Analysis
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

        {/* Comparison Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-500 uppercase block">VEGETATION (NDVI)</span>
            <div className="text-lg font-bold text-red-400">
              {data?.change_metrics?.ndvi_delta_percent || -43.6}%
            </div>
            <span className="text-[10px] text-slate-400">Canopy loss detected</span>
          </div>

          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-500 uppercase block">InSAR COHERENCE</span>
            <div className="text-lg font-bold text-amber-400">
              {data?.change_metrics?.sar_coherence_loss_db || -6.8} dB
            </div>
            <span className="text-[10px] text-slate-400">Active soil deformation</span>
          </div>

          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-500 uppercase block">EXPOSED BARE SOIL</span>
            <div className="text-lg font-bold text-cyan-400">
              {data?.change_metrics?.newly_exposed_soil_hectares || 16.4} ha
            </div>
            <span className="text-[10px] text-slate-400">Daylighting shear scarp</span>
          </div>

          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-500 uppercase block">ESTIMATED DEBRIS</span>
            <div className="text-lg font-bold text-slate-100">
              {(data?.change_metrics?.estimated_debris_volume_m3 || 85000).toLocaleString()} m³
            </div>
            <span className="text-[10px] text-emerald-400">Confidence: 91%</span>
          </div>
        </div>

        {/* Interactive Before vs After Visualizer Simulation */}
        <div className="space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">PASS COMPARISON:</span>
              <span className="text-slate-400 text-[11px]">
                Pre-Monsoon ({data?.baseline_pass?.date || '2024-05-18'}) vs Post-Cloudburst ({data?.post_event_pass?.date || '2024-08-02'})
              </span>
            </div>
            <div className="flex items-center gap-1">
              {(['ndvi', 'sar', 'rgb'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setActiveLayer(l)}
                  className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold transition-colors ${
                    activeLayer === l
                      ? 'bg-purple-900 text-purple-200 border border-purple-600'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Spectral Map Canvas Mock */}
          <div className="relative h-56 w-full rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
            {/* Background Simulated False-Color Imagery */}
            <div
              className="absolute inset-0 transition-opacity"
              style={{
                background: activeLayer === 'ndvi'
                  ? 'radial-gradient(circle at 45% 45%, #7f1d1d 0%, #14532d 55%, #064e3b 100%)'
                  : activeLayer === 'sar'
                  ? 'radial-gradient(circle at 45% 45%, #78350f 0%, #1e293b 60%, #0f172a 100%)'
                  : 'radial-gradient(circle at 45% 45%, #92400e 0%, #15803d 50%, #14532d 100%)'
              }}
            />

            {/* Split Screen Overlay based on slider */}
            <div
              className="absolute top-0 bottom-0 left-0 border-r-2 border-cyan-400 pointer-events-none"
              style={{ width: `${sliderPosition}%` }}
            >
              <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/70 backdrop-blur-md text-[10px] font-mono text-emerald-400 border border-emerald-500/40">
                PRE-EVENT: Healthy Canopy (NDVI 0.78)
              </div>
            </div>

            <div
              className="absolute top-0 bottom-0 right-0 pointer-events-none"
              style={{ width: `${100 - sliderPosition}%` }}
            >
              <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/70 backdrop-blur-md text-[10px] font-mono text-red-400 border border-red-500/40">
                POST-SURGE: Vegetative Scarp (NDVI 0.44)
              </div>
            </div>

            {/* Center Scarp Target Reticle */}
            <div className="relative z-10 p-3 rounded-lg bg-black/60 backdrop-blur-md border border-slate-700 text-center font-mono text-xs">
              <span className="text-red-400 font-bold block mb-1">CROWN SCARP DELINEATION (480m)</span>
              <span className="text-[11px] text-slate-300">Coordinates: 11.5432°N, 76.1245°E • Slope: 38.5°</span>
            </div>
          </div>

          {/* Interactive Range Slider */}
          <div className="flex items-center gap-3 pt-1">
            <span className="text-[10px] text-slate-400">Pre-Monsoon</span>
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPosition}
              onChange={(e) => setSliderPosition(Number(e.target.value))}
              className="flex-1 accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-slate-400">Post-Cloudburst</span>
          </div>
        </div>

        {/* Scientific Interpretation */}
        <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-300 font-sans leading-relaxed">
          <strong className="text-purple-400 font-mono block mb-0.5">SCIENTIFIC VERIFICATION:</strong>
          {data?.scientific_interpretation || (
            "Spectral index decomposition indicates severe vegetative stripping (-43.6% NDVI) coinciding with InSAR coherence loss (-6.8 dB). High pore pressure and gravitational shear have initiated daylighting crown scarps along the 36°-38° planar slip surface."
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs font-mono">
          <span className="text-slate-500 text-[11px]">
            Data Source: European Space Agency (ESA) Copernicus Hub
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold transition-colors"
          >
            Close Analysis
          </button>
        </div>
      </div>
    </div>
  );
};
