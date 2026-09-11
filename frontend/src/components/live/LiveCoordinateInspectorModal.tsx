import React, { useState } from 'react';
import {
  X,
  Compass,
  CloudRain,
  Activity,
  ShieldAlert,
  Cpu,
  RefreshCw,
  Search,
  Droplets,
  Thermometer,
  Layers,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { api } from '../../services/api';

interface LiveCoordinateInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLat?: number;
  initialLon?: number;
}

const PRESET_HOTSPOTS = [
  { name: 'Wayanad (Chooralmala)', lat: 11.5365, lon: 76.1322, slope: 36.5, state: 'Kerala' },
  { name: 'Munnar (Idukki)', lat: 10.0889, lon: 77.0595, slope: 34.0, state: 'Kerala' },
  { name: 'Shimla Slopes', lat: 31.1048, lon: 77.1734, slope: 38.0, state: 'Himachal Pradesh' },
  { name: 'Chamoli (Garhwal)', lat: 30.4074, lon: 79.3274, slope: 42.0, state: 'Uttarakhand' },
  { name: 'Nilgiris (Coonoor)', lat: 11.3530, lon: 76.7959, slope: 32.5, state: 'Tamil Nadu' },
  { name: 'Darjeeling Slopes', lat: 27.0410, lon: 88.2663, slope: 35.0, state: 'West Bengal' },
];

export const LiveCoordinateInspectorModal: React.FC<LiveCoordinateInspectorModalProps> = ({
  isOpen,
  onClose,
  initialLat = 11.5365,
  initialLon = 76.1322,
}) => {
  const [lat, setLat] = useState<number>(initialLat);
  const [lon, setLon] = useState<number>(initialLon);
  const [slope, setSlope] = useState<number>(34.0);
  const [siteName, setSiteName] = useState<string>('Selected Terrain Sector');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunEvaluation = async (targetLat = lat, targetLon = lon, targetSlope = slope, name = siteName) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.evaluateLiveCoordinate({
        latitude: targetLat,
        longitude: targetLon,
        location_name: name,
        slope_degrees: targetSlope,
        cohesion_kpa: 16.0,
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch live real-time evaluation');
    } finally {
      setIsLoading(false);
    }
  };

  const selectPreset = (preset: typeof PRESET_HOTSPOTS[0]) => {
    setLat(preset.lat);
    setLon(preset.lon);
    setSlope(preset.slope);
    setSiteName(`${preset.name}, ${preset.state}`);
    handleRunEvaluation(preset.lat, preset.lon, preset.slope, `${preset.name}, ${preset.state}`);
  };

  return (
    <div className="fixed inset-0 z-[2200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-[#0b0f19] border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 bg-[#0e1424] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <Compass size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-display font-bold text-white tracking-tight">
                  Real-Time Live GPS Landslide Hazard Inspector
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  100% REALTIME METEOROLOGY
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Pulls live Open-Meteo ECMWF/GFS weather and executes coupled limit-equilibrium ($F_s$) + Gradient Boosting ML on any point on Earth
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 font-mono text-xs">
          {/* Quick Preset Selector */}
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
              Select High-Vulnerability Hotspot Preset:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {PRESET_HOTSPOTS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => selectPreset(p)}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    lat === p.lat && lon === p.lon
                      ? 'bg-emerald-950/70 border-emerald-600 text-emerald-200'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="font-bold text-[11px] truncate">{p.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{p.slope}° slope</div>
                </button>
              ))}
            </div>
          </div>

          {/* Coordinate & Terrain Input Controls */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">
                  Latitude (°N)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">
                  Longitude (°E)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={lon}
                  onChange={(e) => setLon(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">
                  Terrain Slope Angle (Degrees)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="5"
                  max="70"
                  value={slope}
                  onChange={(e) => setSlope(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400 font-sans">
                Queries Open-Meteo REST API for real-time 1h rate, 24h sum, 72h antecedent, and root-zone soil moisture.
              </span>
              <button
                onClick={() => handleRunEvaluation()}
                disabled={isLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center gap-2 shadow-sm transition-colors"
              >
                <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                <span>{isLoading ? 'Querying Live Telemetry...' : 'Inspect Live Model'}</span>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-red-950/70 border border-red-800 rounded-lg text-red-300 flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Real-Time Live Results */}
          {result && (
            <div className="space-y-4 animate-fadeIn">
              {/* Top Overall Result Banner */}
              <div className="p-4 bg-[#0e1526] border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                    Site: {result.location_name} • ({result.latitude.toFixed(4)}°N, {result.longitude.toFixed(4)}°E)
                  </div>
                  <div className="text-lg font-bold text-white mt-0.5 flex items-center gap-2">
                    <span>Overall Hazard Score: {result.risk_assessment.overall_risk_score} / 100</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        result.risk_assessment.risk_category === 'CRITICAL'
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : result.risk_assessment.risk_category === 'HIGH'
                          ? 'bg-orange-950 text-orange-300 border border-orange-800'
                          : result.risk_assessment.risk_category === 'MODERATE'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {result.risk_assessment.risk_category}
                    </span>
                  </div>
                </div>

                <div className="text-right text-[10px] text-slate-400">
                  <div>Timestamp: {new Date(result.evaluation_timestamp).toLocaleTimeString()}</div>
                  <div className="text-emerald-400 font-bold">{result.live_telemetry.source}</div>
                </div>
              </div>

              {/* Three Pillars: Live Telemetry, Geotechnical Mechanics, Machine Learning */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. Live Weather */}
                <div className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase text-[10px]">
                    <CloudRain size={13} />
                    <span>1. Real-Time Atmospheric Feed</span>
                  </div>
                  <div className="space-y-1 text-slate-300 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Rainfall Intensity (1h):</span>
                      <span className="font-bold">{result.live_telemetry.intensity_1h_mm} mm/h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">24h Accumulation:</span>
                      <span className="font-bold">{result.live_telemetry.accum_24h_mm} mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">72h Antecedent Deluge:</span>
                      <span className="font-bold">{result.live_telemetry.antecedent_72h_mm} mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Soil Moisture Ratio:</span>
                      <span className="font-bold">{(result.live_telemetry.soil_moisture_ratio * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Surface Temperature:</span>
                      <span className="font-bold">{result.live_telemetry.temperature_c}°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Relative Humidity:</span>
                      <span className="font-bold">{result.live_telemetry.relative_humidity_pct}%</span>
                    </div>
                  </div>
                </div>

                {/* 2. Geotechnical Physics */}
                <div className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase text-[10px]">
                    <Activity size={13} />
                    <span>2. Limit-Equilibrium Fs Mechanics</span>
                  </div>
                  <div className="space-y-1 text-slate-300 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Factor of Safety (Fs):</span>
                      <span
                        className={`font-bold ${
                          result.physics_geotechnical.factor_of_safety < 1.0
                            ? 'text-red-400'
                            : result.physics_geotechnical.factor_of_safety < 1.3
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {result.physics_geotechnical.factor_of_safety.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Slope Equilibrium State:</span>
                      <span className="font-bold text-[10px]">{result.physics_geotechnical.stability_status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Driving Shear Stress (\tau_d):</span>
                      <span className="font-bold">{result.physics_geotechnical.driving_stress_shear_kpa} kPa</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Resisting Shear Strength (\tau_f):</span>
                      <span className="font-bold">{result.physics_geotechnical.resisting_strength_shear_kpa} kPa</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Pore Water Pressure (u):</span>
                      <span className="font-bold">{result.physics_geotechnical.pore_water_pressure_u_kpa} kPa</span>
                    </div>
                  </div>
                </div>

                {/* 3. Machine Learning */}
                <div className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-purple-400 font-bold uppercase text-[10px]">
                    <Cpu size={13} />
                    <span>3. Trained ML Ensemble Inference</span>
                  </div>
                  <div className="space-y-1 text-slate-300 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Model Pipeline:</span>
                      <span className="font-bold">{result.machine_learning.model_version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Initiation Probability:</span>
                      <span className="font-bold text-purple-300">
                        {(result.machine_learning.initiation_probability * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Model Confidence:</span>
                      <span className="font-bold text-emerald-400">
                        {(result.machine_learning.model_confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="pt-1 text-[10px] text-slate-400">
                      <span className="text-slate-300 font-semibold">Saabas Tree Feature Contributions:</span>
                      <div className="mt-1 space-y-0.5">
                        {result.machine_learning.top_contributing_factors.slice(0, 3).map((f: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-[9px]">
                            <span className="truncate">{f.factor_name || f.display_name}</span>
                            <span className="font-mono text-purple-300">
                              {f.impact_percentage ? `${f.impact_percentage}%` : `+${f.contribution?.toFixed(3)}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#0e1424] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-400" />
            <span>Open-Meteo REST Global API • Zero Hardcoded Data</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
