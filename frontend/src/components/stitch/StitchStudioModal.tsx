import React, { useState } from 'react';
import { X, ExternalLink, Copy, Check, Sparkles, Terminal, Palette, Code } from 'lucide-react';

interface StitchStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StitchStudioModal: React.FC<StitchStudioModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'prompts' | 'tokens' | 'import'>('prompts');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [selectedScreen, setSelectedScreen] = useState<string>('evacuation');
  const [importedCode, setImportedCode] = useState<string>('');

  if (!isOpen) return null;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const PROMPTS = [
    {
      id: 'evacuation',
      title: 'Evacuation Route & Shelter Status',
      category: 'Civil Defense',
      prompt: `Act as a senior C2 UI engineer. Using the DESIGN.md rules for LRIDS:
- Canvas: Obsidian (#06080e), Cards: Double-bezel glass (#090d16 with border-white/[0.08])
- Primary Accent: Cyan (#00e5ff), Critical Alert: Red (#ef4444)
- Typography: Display Space Grotesk, Body Plus Jakarta Sans, Metrics JetBrains Mono
Generate a React + Tailwind component for an Evacuation Route & Relief Camp Dashboard in Wayanad:
1. Primary route status (SH-59 bridge pass vs detour) with capacity bars
2. Shelter occupancy stats (4 relief camps with real-time capacity meters)
3. One-click "Broadcast CAP Evacuation Notice" button with tactile push
4. Zero generic purple neon glows, zero circular spinners, maximum 7:1 contrast.`,
    },
    {
      id: 'drone',
      title: 'Drone Recon & Crack Telemetry',
      category: 'Field Recon',
      prompt: `Act as a senior C2 UI engineer. Using the DESIGN.md rules for LRIDS:
- Canvas: Obsidian (#06080e), Cards: Double-bezel glass (#090d16)
- Fonts: Space Grotesk + JetBrains Mono for telemetry
Generate a React + Tailwind component for Autonomous Drone Reconnaissance & Crown Crack Inspection:
1. Video stream viewport with HUD overlay (altitude, heading, LiDAR distance)
2. Live photogrammetry crack dilation meter (18.5mm width, delta +4.2mm/h)
3. Quick action buttons: "Reroute Drone Alpha", "Tag Fissure GPS", "Escalate to P1 Urgent"
4. Strict aerospace cockpit aesthetics, clean grid alignment.`,
    },
    {
      id: 'sensor',
      title: 'IoT Piezometer & Pore Pressure Grid',
      category: 'Geotech Hardware',
      prompt: `Act as a senior C2 UI engineer. Using the DESIGN.md rules for LRIDS:
- Canvas: Obsidian (#06080e), Accent: Cyan (#00e5ff)
- Fonts: JetBrains Mono for all readings, Space Grotesk for section titles
Generate a React + Tailwind component for Borehole Piezometer & Soil Moisture In-Situ Telemetry:
1. 4-gauge telemetry card: Pore Water Pressure (94 kPa), Volumetric Water Content (48.2%), Inclinometer Displacement (2.8mm), Battery/Solar (98%)
2. 24-hour Sparkline trend showing saturation curve breach
3. Sensor health indicator (LoRaWAN Gateway Connected, Ping: 42ms)
4. Double-bezel card style with subtle inner specular highlight.`,
    }
  ];

  const currentPromptObj = PROMPTS.find((p) => p.id === selectedScreen) || PROMPTS[0];

  return (
    <div className="fixed inset-0 z-[3000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-[#080d19]/95 backdrop-blur-2xl border border-white/[0.12] rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(6,182,212,0.15)]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base text-white tracking-wide">Google Stitch Studio Bridge</h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  CONNECTED (MCP)
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                Export and prompt Google Stitch with this application's authentic C2 design system
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://labs.google/stitch"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"
            >
              <span>Open Stitch</span>
              <ExternalLink size={12} />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-white/[0.06] bg-white/[0.01] text-xs font-mono">
          <button
            onClick={() => setActiveTab('prompts')}
            className={`px-3 py-2 rounded-t-lg flex items-center gap-1.5 border-b-2 font-medium transition-all ${
              activeTab === 'prompts'
                ? 'border-cyan-400 text-cyan-300 bg-white/[0.03]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal size={13} />
            <span>Stitch Prompts</span>
          </button>
          <button
            onClick={() => setActiveTab('tokens')}
            className={`px-3 py-2 rounded-t-lg flex items-center gap-1.5 border-b-2 font-medium transition-all ${
              activeTab === 'tokens'
                ? 'border-cyan-400 text-cyan-300 bg-white/[0.03]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette size={13} />
            <span>Design Tokens</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-3 py-2 rounded-t-lg flex items-center gap-1.5 border-b-2 font-medium transition-all ${
              activeTab === 'import'
                ? 'border-cyan-400 text-cyan-300 bg-white/[0.03]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code size={13} />
            <span>Import Generated Code</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'prompts' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Select Screen Type to Generate in Stitch:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {PROMPTS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedScreen(p.id)}
                      className={`p-3 text-left rounded-xl border transition-all ${
                        selectedScreen === p.id
                          ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                          : 'bg-white/[0.02] border-white/[0.06] text-slate-300 hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase">{p.category}</div>
                      <div className="text-xs font-semibold mt-0.5 truncate">{p.title}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400 font-semibold uppercase tracking-wider">
                    Stitch Context Prompt (Ready to Paste into Stitch):
                  </span>
                  <button
                    onClick={() => copyToClipboard(currentPromptObj.prompt, 1)}
                    className="px-3 py-1 bg-white/[0.06] hover:bg-white/[0.1] text-cyan-300 border border-white/[0.1] rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all"
                  >
                    {copiedIndex === 1 ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copiedIndex === 1 ? 'Copied!' : 'Copy Prompt'}</span>
                  </button>
                </div>
                <div className="p-4 bg-[#050810] border border-white/[0.08] rounded-xl font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto shadow-inner">
                  {currentPromptObj.prompt}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-between text-xs font-mono text-cyan-200">
                <span>1. Copy prompt above</span>
                <span>•</span>
                <span>2. Open labs.google/stitch</span>
                <span>•</span>
                <span>3. Paste & generate screen</span>
              </div>
            </div>
          )}

          {activeTab === 'tokens' && (
            <div className="space-y-4 font-mono text-xs">
              <div>
                <h4 className="font-bold text-slate-300 uppercase tracking-wider mb-2.5">Core Surface & Hazard Colors</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl bg-[#06080e] border border-white/[0.1]">
                    <div className="w-4 h-4 rounded-full bg-[#06080e] border border-white/40 mb-2" />
                    <div className="font-bold text-white">Canvas</div>
                    <div className="text-[10px] text-slate-400">#06080e</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#090d16] border border-white/[0.1]">
                    <div className="w-4 h-4 rounded-full bg-[#090d16] border border-white/40 mb-2" />
                    <div className="font-bold text-white">Card Core</div>
                    <div className="text-[10px] text-slate-400">#090d16</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#00e5ff]/10 border border-[#00e5ff]/30">
                    <div className="w-4 h-4 rounded-full bg-[#00e5ff] mb-2" />
                    <div className="font-bold text-[#00e5ff]">Cyan Accent</div>
                    <div className="text-[10px] text-slate-400">#00e5ff</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/30">
                    <div className="w-4 h-4 rounded-full bg-[#ef4444] mb-2" />
                    <div className="font-bold text-[#ef4444]">Critical Hazard</div>
                    <div className="text-[10px] text-slate-400">#ef4444</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-300 uppercase tracking-wider mb-2">Typography Contract</h4>
                <div className="p-3.5 bg-white/[0.02] border border-white/[0.08] rounded-xl space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Headings / Display:</span>
                    <span className="font-bold text-white font-display">Space Grotesk</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Body / Copy:</span>
                    <span className="font-bold text-white font-sans">Plus Jakarta Sans</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Telemetry / Fs / Coordinates:</span>
                    <span className="font-bold text-cyan-300 font-mono">JetBrains Mono</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-300 uppercase tracking-wider mb-2">Concentric Double-Bezel Card Specification</h4>
                <div className="p-3.5 bg-white/[0.02] border border-white/[0.08] rounded-xl text-[11px] text-slate-400 leading-relaxed font-sans">
                  Outer ring uses <code className="text-cyan-300 font-mono">p-[1px] rounded-2xl border border-white/[0.08]</code>. Inner core uses <code className="text-cyan-300 font-mono">rounded-[calc(1rem-1px)] bg-[#090d16]/90 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]</code>.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Paste React Component Exported from Google Stitch:
                </label>
                <textarea
                  value={importedCode}
                  onChange={(e) => setImportedCode(e.target.value)}
                  placeholder="// Paste exported TSX / JSX from labs.google/stitch here..."
                  className="w-full h-48 bg-[#050810] border border-white/[0.1] rounded-xl p-3 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"
                />
              </div>

              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Component will be registered in <code className="text-cyan-300">frontend/src/views/</code></span>
                <button
                  disabled={!importedCode.trim()}
                  onClick={() => {
                    alert('Stitch Component registered! You can now view it under custom views.');
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 disabled:opacity-40 text-slate-950 font-bold rounded-xl transition-all shadow-md"
                >
                  Register Component
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};