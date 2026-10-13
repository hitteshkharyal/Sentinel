import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Badge } from '../ui/Badge';

export const RadarAnimation: React.FC = () => {
  const [scenario, setScenario] = useState<'normal' | 'fall' | 'empty'>('normal');

  return (
    <div className="relative w-full max-w-lg mx-auto bg-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-slate-800 overflow-hidden select-none">
      {/* Background ambient radar glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-sentinel-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header HUD */}
      <div className="relative z-10 flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              60GHz mmWave Spatial Radar
            </h4>
            <p className="text-[10px] text-slate-400 font-mono">
              Zero Optical Cameras · RF Point Cloud Only
            </p>
          </div>
        </div>

        <Badge
          variant={scenario === 'fall' ? 'danger' : scenario === 'empty' ? 'neutral' : 'success'}
          size="sm"
          dot
          pulsing={scenario === 'fall'}
        >
          {scenario === 'fall' ? 'Fall Detected' : scenario === 'empty' ? 'Zone Vacant' : 'Occupant Verified'}
        </Badge>
      </div>

      {/* Radar Scope Visual Canvas */}
      <div className="relative my-6 aspect-square max-w-[340px] mx-auto rounded-full border border-slate-800 bg-slate-900/90 flex items-center justify-center overflow-hidden shadow-inner">
        {/* Concentric distance rings */}
        <div className="absolute w-[85%] h-[85%] rounded-full border border-slate-800/70" />
        <div className="absolute w-[60%] h-[60%] rounded-full border border-slate-800/70" />
        <div className="absolute w-[35%] h-[35%] rounded-full border border-slate-800/70" />
        <div className="absolute w-2 h-2 rounded-full bg-sentinel-400 z-10 shadow-lg shadow-sentinel-400" />

        {/* Crosshair azimuth axes */}
        <div className="absolute inset-x-0 h-[1px] bg-slate-800/60" />
        <div className="absolute inset-y-0 w-[1px] bg-slate-800/60" />

        {/* Range distance markings */}
        <span className="absolute top-[8%] text-[9px] font-mono text-slate-400">4.0m</span>
        <span className="absolute top-[21%] text-[9px] font-mono text-slate-400">2.5m</span>
        <span className="absolute top-[33%] text-[9px] font-mono text-slate-400">1.2m</span>

        {/* Rotating Radar Sweep Conic Gradient */}
        <div className="absolute inset-0 radar-sweep-effect rounded-full pointer-events-none" />

        {/* Radar Point Target: Dynamic based on scenario */}
        {scenario === 'normal' && (
          <div className="absolute top-[38%] left-[58%] z-20 flex flex-col items-center animate-fade-in">
            <div className="relative">
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-md shadow-emerald-400/80 animate-ping-slow" />
              <div className="absolute inset-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white" />
            </div>
            <div className="mt-1 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-[9px] font-mono text-emerald-300 whitespace-nowrap shadow-xs">
              Person 1 (Sitting · 18 bpm)
            </div>
          </div>
        )}

        {scenario === 'fall' && (
          <div className="absolute bottom-[28%] left-[44%] z-20 flex flex-col items-center animate-bounce">
            <div className="relative">
              <div className="w-4 h-4 rounded-full bg-rose-500 shadow-lg shadow-rose-500 animate-ping" />
              <div className="absolute inset-0 w-4 h-4 rounded-full bg-rose-600 border-2 border-white" />
            </div>
            <div className="mt-1 px-2 py-0.5 rounded bg-rose-950/90 border border-rose-500 text-[9px] font-mono font-bold text-rose-200 whitespace-nowrap shadow-md">
              🚨 Horizontal Impact (Floor Zero)
            </div>
          </div>
        )}

        {scenario === 'empty' && (
          <div className="absolute z-20 text-center animate-fade-in">
            <span className="text-[11px] font-mono text-slate-400">No Doppler Shift (0 Pts)</span>
          </div>
        )}
      </div>

      {/* Live Metrics Telemetry HUD */}
      <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center text-xs font-mono">
        <div>
          <span className="block text-[10px] text-slate-400">Doppler Velocity</span>
          <span className="font-semibold text-slate-200">
            {scenario === 'normal' ? '0.04 m/s' : scenario === 'fall' ? '-1.82 m/s ↓' : '0.00 m/s'}
          </span>
        </div>
        <div>
          <span className="block text-[10px] text-slate-400">Vital Respiration</span>
          <span className="font-semibold text-emerald-400">
            {scenario === 'normal' ? '18 breaths/m' : scenario === 'fall' ? 'Atypical (26 bpm)' : 'None'}
          </span>
        </div>
        <div>
          <span className="block text-[10px] text-slate-400">Privacy Status</span>
          <span className="font-semibold text-cyan-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> 100% Blind
          </span>
        </div>
      </div>

      {/* Interactive Scenario Buttons */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase font-mono text-slate-400">Simulate State:</span>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setScenario('normal')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
              scenario === 'normal'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                : 'text-slate-400 hover:text-white bg-slate-900'
            }`}
          >
            Occupied
          </button>
          <button
            type="button"
            onClick={() => setScenario('fall')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
              scenario === 'fall'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                : 'text-slate-400 hover:text-white bg-slate-900'
            }`}
          >
            Fall Distress
          </button>
          <button
            type="button"
            onClick={() => setScenario('empty')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
              scenario === 'empty'
                ? 'bg-slate-700 text-slate-200 border border-slate-600'
                : 'text-slate-400 hover:text-white bg-slate-900'
            }`}
          >
            Empty Room
          </button>
        </div>
      </div>
    </div>
  );
};
