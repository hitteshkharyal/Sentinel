// ─────────────────────────────────────────────
// SENTINEL Web — 60GHz mmWave Radar HUD Scope
// GuardianEye Aesthetic with Cyber Reticles & Live Doppler Point Cloud
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import { ShieldCheck, Crosshair, Radio } from 'lucide-react';
import { Badge } from '../ui/Badge';

export const RadarAnimation: React.FC = () => {
  const [scenario, setScenario] = useState<'normal' | 'fall' | 'empty'>('normal');

  return (
    <div className="hud-bracket relative w-full max-w-lg mx-auto bg-slate-950/90 rounded-2xl p-6 sm:p-7 text-white shadow-2xl border border-cyan-500/25 overflow-hidden select-none backdrop-blur-xl">
      {/* Ambient Radial Glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header HUD */}
      <div className="relative z-10 flex items-center justify-between pb-3.5 border-b border-cyan-500/20">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5" />
              60GHz mmWave Spatial Radar Scope
            </h4>
            <p className="text-[10px] text-slate-400 font-mono">
              SECTOR-A // NON-OPTICAL POINT CLOUD // ZERO CAMERAS
            </p>
          </div>
        </div>

        <Badge
          variant={scenario === 'fall' ? 'danger' : scenario === 'empty' ? 'neutral' : 'success'}
          size="sm"
          dot
          pulsing={scenario === 'fall'}
          className="font-mono text-[10px] uppercase"
        >
          {scenario === 'fall' ? 'Distress Incursion' : scenario === 'empty' ? 'Zero Targets' : 'Target Acquired'}
        </Badge>
      </div>

      {/* Radar Scope Visual Canvas */}
      <div className="relative my-6 aspect-square max-w-[320px] mx-auto rounded-full border border-cyan-500/30 bg-slate-950/90 flex items-center justify-center overflow-hidden shadow-inner shadow-cyan-950/40">
        {/* Concentric distance rings */}
        <div className="absolute w-[85%] h-[85%] rounded-full border border-cyan-500/20" />
        <div className="absolute w-[60%] h-[60%] rounded-full border border-cyan-500/20" />
        <div className="absolute w-[35%] h-[35%] rounded-full border border-cyan-500/20" />
        <div className="absolute w-2 h-2 rounded-full bg-cyan-400 z-10 shadow-lg shadow-cyan-400/80" />

        {/* Crosshair azimuth axes */}
        <div className="absolute inset-x-0 h-[1px] bg-cyan-500/20" />
        <div className="absolute inset-y-0 w-[1px] bg-cyan-500/20" />

        {/* Range distance markings */}
        <span className="absolute top-[8%] text-[9px] font-mono text-cyan-400/70">10.0m</span>
        <span className="absolute top-[21%] text-[9px] font-mono text-cyan-400/70">6.0m</span>
        <span className="absolute top-[33%] text-[9px] font-mono text-cyan-400/70">3.0m</span>

        {/* Azimuth Angle Marks */}
        <span className="absolute top-1 text-[8px] font-mono text-slate-600">0°</span>
        <span className="absolute right-2 text-[8px] font-mono text-slate-600">90°</span>
        <span className="absolute bottom-1 text-[8px] font-mono text-slate-600">180°</span>
        <span className="absolute left-2 text-[8px] font-mono text-slate-600">270°</span>

        {/* Rotating Radar Sweep Conic Gradient */}
        <div className="absolute inset-0 radar-sweep-effect rounded-full pointer-events-none" />

        {/* Radar Point Target: Dynamic based on scenario */}
        {scenario === 'normal' && (
          <div className="absolute top-[38%] left-[58%] z-20 flex flex-col items-center animate-fade-in">
            <div className="relative">
              <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-md shadow-cyan-400/80 animate-ping-slow" />
              <div className="absolute inset-0 w-3.5 h-3.5 rounded-full bg-cyan-400 border border-white" />
            </div>
            <div className="mt-1 px-2 py-0.5 rounded bg-slate-950/90 border border-cyan-500/50 text-[9px] font-mono text-cyan-300 whitespace-nowrap shadow-xs">
              TARGET_01 [STATIONARY · 18 bpm]
            </div>
          </div>
        )}

        {scenario === 'fall' && (
          <div className="absolute bottom-[28%] left-[44%] z-20 flex flex-col items-center animate-bounce">
            <div className="relative">
              <div className="w-4 h-4 rounded-full bg-rose-500 shadow-lg shadow-rose-500 animate-ping" />
              <div className="absolute inset-0 w-4 h-4 rounded-full bg-rose-600 border border-white" />
            </div>
            <div className="mt-1 px-2 py-0.5 rounded bg-rose-950/90 border border-rose-500 text-[9px] font-mono font-bold text-rose-200 whitespace-nowrap shadow-md">
              🚨 RAPID TRAJECTORY DROP (-1.8 m/s)
            </div>
          </div>
        )}

        {scenario === 'empty' && (
          <div className="absolute z-20 text-center animate-fade-in">
            <span className="text-[11px] font-mono text-slate-500">ZERO DOPPLER SHIFT // 0 PTS</span>
          </div>
        )}
      </div>

      {/* Live Metrics Telemetry HUD */}
      <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-950/80 border border-cyan-500/20 text-center text-xs font-mono">
        <div>
          <span className="block text-[10px] text-slate-400">Doppler Velocity</span>
          <span className="font-semibold text-slate-200">
            {scenario === 'normal' ? '0.04 m/s' : scenario === 'fall' ? '-1.82 m/s ↓' : '0.00 m/s'}
          </span>
        </div>
        <div>
          <span className="block text-[10px] text-slate-400">Vital Respiration</span>
          <span className="font-semibold text-cyan-400">
            {scenario === 'normal' ? '18 breaths/m' : scenario === 'fall' ? 'Atypical (26 bpm)' : 'None'}
          </span>
        </div>
        <div>
          <span className="block text-[10px] text-slate-400">Privacy Mode</span>
          <span className="font-semibold text-emerald-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> 100% Blind
          </span>
        </div>
      </div>

      {/* Interactive Scenario Buttons */}
      <div className="mt-4 pt-3 border-t border-cyan-500/15 flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase font-mono text-slate-400 flex items-center gap-1">
          <Crosshair className="w-3 h-3 text-cyan-400" />
          Test Injection:
        </span>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setScenario('normal')}
            className={`px-2.5 py-1 rounded text-xs font-mono transition-all cursor-pointer ${
              scenario === 'normal'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-xs shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            Occupied
          </button>
          <button
            type="button"
            onClick={() => setScenario('fall')}
            className={`px-2.5 py-1 rounded text-xs font-mono transition-all cursor-pointer ${
              scenario === 'fall'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500 shadow-xs shadow-rose-500/20'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            Fall Distress
          </button>
          <button
            type="button"
            onClick={() => setScenario('empty')}
            className={`px-2.5 py-1 rounded text-xs font-mono transition-all cursor-pointer ${
              scenario === 'empty'
                ? 'bg-slate-800 text-slate-200 border border-slate-700'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            Empty Zone
          </button>
        </div>
      </div>
    </div>
  );
};
