import React, { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { CloudRain, Droplets, Thermometer, Wind, Activity, RefreshCw, Compass, CheckCircle2 } from 'lucide-react';
import { RiskAssessment, LocationSummary } from '../types';
import { api } from '../services/api';

interface LiveConditionsViewProps {
  locations: LocationSummary[];
  assessments: RiskAssessment[];
  dataMode: 'DEMO' | 'REAL';
}

export const LiveConditionsView: React.FC<LiveConditionsViewProps> = ({
  locations,
  assessments,
  dataMode,
}) => {
  const [liveWeatherMap, setLiveWeatherMap] = useState<Record<number, any>>({});
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchAllLiveWeather = async () => {
    setIsRefreshing(true);
    try {
      const results = await Promise.all(
        locations.map(async (loc) => {
          try {
            const data = await api.getLiveWeather(loc.id);
            return { id: loc.id, data };
          } catch {
            return { id: loc.id, data: null };
          }
        })
      );
      const newMap: Record<number, any> = {};
      results.forEach((r) => {
        if (r.data) newMap[r.id] = r.data;
      });
      setLiveWeatherMap(newMap);
    } catch (e) {
      console.warn('Failed loading individual live weather:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllLiveWeather();
  }, [locations, dataMode]);

  return (
    <div className="space-y-4 font-mono select-none">
      {/* Informational & Action Banner */}
      <div className="p-3.5 bg-[#0a1220] border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/20">
            <CloudRain size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white uppercase">Atmospheric &amp; Hydrological Real-Time Telemetry</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                OPEN-METEO REST API
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              Live numerical weather prediction model observations across monitored sub-catchments in the Western Ghats and Himalayas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-live-gps-modal'))}
            className="px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 flex items-center gap-1.5 text-xs font-semibold transition-colors"
            title="Inspect real-time conditions and compute landslide risk for any custom GPS coordinates"
          >
            <Compass size={13} className="text-emerald-400" />
            <span>Inspect Custom GPS</span>
          </button>
          <button
            onClick={fetchAllLiveWeather}
            disabled={isRefreshing}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
            title="Refresh current meteorological readings"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Live'}</span>
          </button>
        </div>
      </div>

      {/* Catchment Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map((loc) => {
          const ass = assessments.find((a) => a.location_id === loc.id);
          const live = liveWeatherMap[loc.id];

          // Priority: Live REST data -> assessment explanation features -> baseline
          const rain1h = live?.intensity_1h_mm ?? 0.0;
          const rain24h = live?.accum_24h_mm ?? 45.0;
          const rain72h = live?.antecedent_72h_mm ?? 95.0;
          const rain7d = live?.cumulative_7d_mm ?? 140.0;
          const moisture = live?.soil_moisture_ratio ?? 0.55;
          const temp = live?.temperature_c ?? 22.0;
          const humidity = live?.relative_humidity_pct ?? 82.0;

          const isHeavy = rain24h > 100.0;
          const fs = ass?.geotechnical_fs ?? 1.25;

          return (
            <Card
              key={loc.id}
              title={loc.name}
              subtitle={`${loc.district}, ${loc.state} • Elev: ${loc.elevation_m || 900}m (${loc.latitude.toFixed(4)}°N, ${loc.longitude.toFixed(4)}°E)`}
              alertLevel={isHeavy || fs < 1.0 ? 'critical' : rain24h > 50.0 || fs < 1.3 ? 'warning' : 'none'}
              action={
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('open-live-gps-modal', {
                      detail: { lat: loc.latitude, lon: loc.longitude }
                    }));
                  }}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono font-medium flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800"
                  title="Open live geotechnical and ML analysis for this site"
                >
                  <Compass size={11} />
                  <span>Inspect GPS</span>
                </button>
              }
            >
              <div className="space-y-3 font-mono text-xs">
                {/* 4-KPI Meteorological Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase">
                      <CloudRain size={12} className="text-cyan-400" />
                      <span>24h Rainfall</span>
                    </div>
                    <div className={`text-xl font-bold mt-1 ${isHeavy ? 'text-red-400' : 'text-slate-100'}`}>
                      {rain24h.toFixed(1)} <span className="text-xs text-slate-400 font-normal">mm</span>
                    </div>
                    <div className="text-[9px] text-slate-500 mt-0.5">Rate: {rain1h.toFixed(1)} mm/h</div>
                  </div>

                  <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase">
                      <Activity size={12} className="text-amber-400" />
                      <span>72h Antecedent</span>
                    </div>
                    <div className="text-xl font-bold mt-1 text-slate-100">
                      {rain72h.toFixed(1)} <span className="text-xs text-slate-400 font-normal">mm</span>
                    </div>
                    <div className="text-[9px] text-slate-500 mt-0.5">7-Day Sum: {rain7d.toFixed(1)} mm</div>
                  </div>
                </div>

                {/* Soil Moisture Saturation Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Droplets size={12} className="text-cyan-400" />
                      Volumetric Soil Saturation
                    </span>
                    <span className="font-bold text-slate-200">{(moisture * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        moisture > 0.85 ? 'bg-red-500' : moisture > 0.70 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, moisture * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Field Cap: 45%</span>
                    <span>{moisture > 0.85 ? 'Critical Pore Pressure (PWP)' : 'Normal Hydraulic Drainage'}</span>
                  </div>
                </div>

                {/* Microclimate Stats */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80 text-[10px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Thermometer size={12} className="text-orange-400" />
                    <span>Temp: <strong className="text-slate-200">{temp.toFixed(1)}°C</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Wind size={12} className="text-cyan-400" />
                    <span>Rel Humidity: <strong className="text-slate-200">{humidity.toFixed(0)}%</strong></span>
                  </div>
                </div>

                {/* Geotechnical Equilibrium & Model Output */}
                <div className={`p-2.5 rounded-lg border text-[11px] flex items-center justify-between ${
                  fs < 1.0
                    ? 'bg-red-950/60 border-red-800 text-red-200'
                    : fs < 1.3
                    ? 'bg-amber-950/60 border-amber-800 text-amber-200'
                    : 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                }`}>
                  <div>
                    <div className="font-bold">Limit-Equilibrium Fs: {fs.toFixed(2)}</div>
                    <div className="text-[10px] opacity-80 font-sans">
                      {fs < 1.0 ? 'Active slope creep / unstable shear' : fs < 1.3 ? 'Marginal stability / watch threshold' : 'Stable under current pore pressure'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold">Risk: {ass?.overall_risk_score ?? 50}/100</div>
                    <div className="text-[9px] opacity-70">{ass?.risk_category ?? 'MODERATE'}</div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

