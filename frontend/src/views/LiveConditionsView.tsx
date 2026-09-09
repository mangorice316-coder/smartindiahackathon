import React from 'react';
import { Card, StatCard } from '../components/common/Card';
import { CloudRain, Droplets, Thermometer, Wind, Activity } from 'lucide-react';
import { RiskAssessment, LocationSummary } from '../types';

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
  return (
    <div className="space-y-4">
      {/* Informational Banner */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <CloudRain size={16} className="text-cyan-400" />
          <span className="font-bold text-slate-200 uppercase">Atmospheric & Hydrological Telemetry</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400 font-sans">
            Tracking 24h daily saturation, 72h antecedent pore-pressure drivers, and volumetric soil moisture
          </span>
        </div>
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-cyan-300 border border-slate-700">
          SOURCE: {dataMode === 'REAL' ? 'OPEN-METEO REST API' : 'DEMO SENSOR ARRAY (WESTERN GHATS & HIMALAYAS)'}
        </span>
      </div>

      {/* Catchment Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map((loc) => {
          const ass = assessments.find((a) => a.location_id === loc.id);
          // Extract weather features from XAI factors or fallbacks
          const factors = ass?.explanation.top_factors || [];
          const rain24hFactor = factors.find((f) => f.factor_name === 'rainfall_accum_24h');
          const rain72hFactor = factors.find((f) => f.factor_name === 'rainfall_antecedent_72h');
          const moistureFactor = factors.find((f) => f.factor_name === 'soil_moisture_ratio');

          const rain24h = rain24hFactor ? Number(rain24hFactor.value) : 65.0;
          const rain72h = rain72hFactor ? Number(rain72hFactor.value) : 140.0;
          const moisture = moistureFactor ? Number(moistureFactor.value) : 0.65;

          const isHeavy = rain24h > 100.0;

          return (
            <Card
              key={loc.id}
              title={loc.name}
              subtitle={`${loc.district}, ${loc.state} (Elev: ${loc.elevation_m || 900}m)`}
              alertLevel={isHeavy ? 'critical' : rain24h > 50.0 ? 'warning' : 'none'}
            >
              <div className="space-y-3 font-mono text-xs">
                {/* Rainfall Gauges */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase">
                      <CloudRain size={12} className="text-cyan-400" />
                      <span>24h Accumulation</span>
                    </div>
                    <div className={`text-xl font-bold mt-1 ${isHeavy ? 'text-red-400' : 'text-slate-100'}`}>
                      {rain24h.toFixed(1)} <span className="text-xs text-slate-400 font-normal">mm</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase">
                      <Activity size={12} className="text-amber-400" />
                      <span>72h Antecedent</span>
                    </div>
                    <div className="text-xl font-bold mt-1 text-slate-100">
                      {rain72h.toFixed(1)} <span className="text-xs text-slate-400 font-normal">mm</span>
                    </div>
                  </div>
                </div>

                {/* Soil Moisture Saturation Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Droplets size={12} className="text-cyan-400" />
                      Soil Moisture Saturation
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
                    <span>Field Capacity</span>
                    <span>{moisture > 0.85 ? 'Critical Pore Pressure' : 'Normal Drainage'}</span>
                  </div>
                </div>

                {/* Empirical Threshold Alert */}
                <div className={`p-2 rounded text-[11px] font-sans ${
                  isHeavy ? 'bg-red-950/50 text-red-300 border border-red-800/40' : 'bg-slate-900 text-slate-400'
                }`}>
                  {isHeavy
                    ? '⚠️ Empirical rainfall threshold breached: High likelihood of debris flow or shallow planar slip.'
                    : '✓ Within safe hydrological tolerance limits under current vegetation root cover.'}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
