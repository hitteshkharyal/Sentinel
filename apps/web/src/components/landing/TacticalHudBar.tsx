// ─────────────────────────────────────────────
// SENTINEL Web — Tactical HUD Status Bar & Overlays
// GuardianEye Inspired Cybernetic Telemetry
// ─────────────────────────────────────────────

import React from 'react';
import { ShieldCheck, Wifi } from 'lucide-react';

export const TacticalHudBar: React.FC = () => {
  return (
    <>
      {/* ── Fixed Top Tactical Telemetry Strip ── */}
      <div className="fixed top-0 inset-x-0 z-50 h-7 bg-slate-950/90 border-b border-cyan-500/20 px-4 flex items-center justify-between text-[10px] font-mono tracking-widest text-slate-400 select-none backdrop-blur-md">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            {'SEC_PERIMETER // ONLINE'}
          </span>
          <span className="hidden sm:inline text-slate-500">|</span>
          <span className="hidden sm:inline">GPS: 28.6663° N 77.2941° E</span>
          <span className="hidden md:inline text-slate-500">|</span>
          <span className="hidden md:inline">NODE_MESH: 37 ACTIVE</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden lg:inline text-slate-500">ENCRYPTION: AES-256-GCM</span>
          <span className="hidden lg:inline text-slate-500">|</span>
          <span className="flex items-center gap-1 text-slate-300">
            <Wifi className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline">99.9% FLEET UPTIME</span>
          </span>
          <span className="flex items-center gap-1 text-rose-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            LIVE
          </span>
        </div>
      </div>

      {/* ── Fixed Floating Bottom-Right Tactical Indicator ── */}
      <div className="fixed bottom-4 right-4 z-40 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-cyan-500/30 backdrop-blur-md text-xs font-mono text-cyan-300 shadow-lg shadow-cyan-500/10">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-bold tracking-wider">SENTINEL AI ONLINE</span>
        <span className="text-slate-500">|</span>
        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
      </div>
    </>
  );
};
