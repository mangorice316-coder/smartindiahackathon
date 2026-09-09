import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Sliders, RefreshCw, Radio, Save, ShieldAlert } from 'lucide-react';

interface SettingsViewProps {
  dataMode: 'DEMO' | 'REAL';
  onToggleMode: (mode: 'DEMO' | 'REAL') => Promise<void>;
  onResetDemo: () => Promise<void>;
  thresholds: any;
  onUpdateThresholds: (thresholds: Record<string, number>) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  dataMode,
  onToggleMode,
  onResetDemo,
  thresholds,
  onUpdateThresholds,
}) => {
  const [lowMax, setLowMax] = useState(thresholds?.LOW_MAX || 30.0);
  const [modMax, setModMax] = useState(thresholds?.MODERATE_MAX || 50.0);
  const [highMax, setHighMax] = useState(thresholds?.HIGH_MAX || 70.0);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveThresholds = async () => {
    setIsSaving(true);
    try {
      await onUpdateThresholds({
        LOW_MAX: Number(lowMax),
        MODERATE_MAX: Number(modMax),
        HIGH_MAX: Number(highMax),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      alert('Failed to update thresholds');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset demo database to clean calibrated initial state?')) return;
    setIsResetting(true);
    try {
      await onResetDemo();
      alert('Demo environment successfully re-seeded.');
    } catch (e) {
      alert('Failed to reset demo data');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Operating Mode Selector */}
      <Card
        title="Operational Mode & External Data Adapters"
        subtitle="Toggle between synthetic demonstration data and real live weather ingestion"
      >
        <div className="space-y-3 font-mono text-xs">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-900 border border-slate-800 rounded-lg flex-1">
              <input
                type="radio"
                name="dataMode"
                value="DEMO"
                checked={dataMode === 'DEMO'}
                onChange={() => onToggleMode('DEMO')}
                className="text-cyan-400 focus:ring-0"
              />
              <div>
                <span className="font-bold text-slate-100">DEMO MODE</span>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                  Pre-configured high-fidelity synthetic data for 5 Indian hotspots (Wayanad, Idukki, Chamoli, Shimla, Nilgiris).
                </p>
              </div>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-900 border border-slate-800 rounded-lg flex-1">
              <input
                type="radio"
                name="dataMode"
                value="REAL"
                checked={dataMode === 'REAL'}
                onChange={() => onToggleMode('REAL')}
                className="text-cyan-400 focus:ring-0"
              />
              <div>
                <span className="font-bold text-slate-100">REAL DATA MODE</span>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                  Connects to live Open-Meteo REST API for actual hourly precipitation and soil moisture readings.
                </p>
              </div>
            </label>
          </div>

          <div className="pt-2">
            <button
              onClick={handleReset}
              disabled={isResetting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors"
            >
              <RefreshCw size={13} className={isResetting ? 'animate-spin' : ''} />
              <span>{isResetting ? 'Resetting Database...' : 'Reset Demo Records'}</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Configurable Risk Categorization Thresholds */}
      <Card
        title="Configurable Risk Threshold Bounds (0 - 100 Scale)"
        subtitle="Calibrate operational decision categories according to local geotechnical basin guidelines"
      >
        <div className="space-y-4 font-mono text-xs">
          <div className="p-2.5 bg-slate-900/50 border border-slate-800 rounded text-[11px] text-slate-400 font-sans">
            Thresholds are user-configurable operational limits. Adjust bounds to reflect specific catchment slope sensitivities.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1 p-3 bg-slate-900/60 rounded border border-slate-800">
              <span className="text-[10px] text-emerald-400 uppercase font-bold">Low Risk Ceiling</span>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  min={10}
                  max={45}
                  value={lowMax}
                  onChange={(e) => setLowMax(Number(e.target.value))}
                  className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100 font-bold"
                />
                <span className="text-slate-500 text-[11px]">Default: 30</span>
              </div>
              <p className="text-[10px] text-slate-400 font-sans mt-1">Scores 0 to {lowMax} = LOW</p>
            </div>

            <div className="space-y-1 p-3 bg-slate-900/60 rounded border border-slate-800">
              <span className="text-[10px] text-amber-400 uppercase font-bold">Moderate Ceiling</span>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  min={35}
                  max={65}
                  value={modMax}
                  onChange={(e) => setModMax(Number(e.target.value))}
                  className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100 font-bold"
                />
                <span className="text-slate-500 text-[11px]">Default: 50</span>
              </div>
              <p className="text-[10px] text-slate-400 font-sans mt-1">Scores {lowMax + 1} to {modMax} = MODERATE</p>
            </div>

            <div className="space-y-1 p-3 bg-slate-900/60 rounded border border-slate-800">
              <span className="text-[10px] text-orange-400 uppercase font-bold">High Ceiling / Critical Threshold</span>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  min={55}
                  max={85}
                  value={highMax}
                  onChange={(e) => setHighMax(Number(e.target.value))}
                  className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100 font-bold"
                />
                <span className="text-slate-500 text-[11px]">Default: 70</span>
              </div>
              <p className="text-[10px] text-slate-400 font-sans mt-1">Scores &gt; {highMax} = CRITICAL</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {saveSuccess ? (
              <span className="text-emerald-400 text-xs">✓ Thresholds successfully calibrated and saved!</span>
            ) : <span />}

            <button
              onClick={handleSaveThresholds}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded text-xs transition-colors"
            >
              <Save size={13} />
              <span>{isSaving ? 'Saving...' : 'Apply Calibrated Thresholds'}</span>
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};
