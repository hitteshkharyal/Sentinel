// ─────────────────────────────────────────────
// SENTINEL Web — 
// ─────────────────────────────────────────────

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Activity, Cpu } from 'lucide-react';
import { RadarAnimation } from './RadarAnimation';

export const LandingHero: React.FC = () => {
  return (
    <section className="relative pt-44 pb-20 lg:pt-48 lg:pb-32 overflow-hidden cyber-grid-bg bg-[#02040a]">
      {/* Ambient Neon Cyan Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-20 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* ── Left Column: Headline & Value Proposition ── */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Tactical Sector Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-cyan-950/60 text-cyan-300 text-xs font-mono font-semibold tracking-wider border border-cyan-500/30 shadow-xs shadow-cyan-500/10 max-w-full">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
              <span className="truncate">{'SECTOR_A // ZERO-OPTICAL PRIVACY PERIMETER'}</span>
            </div>

            {/* Core Master Prompt Headline (GuardianEye Style) */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.06]">
              See Everything.{' '}
              <span className="gradient-text-cyan block mt-1">Without Cameras.</span>
            </h1>

            {/* Core Subtitle */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              An autonomous spatial intelligence ecosystem that thinks, learns, and actuates in real time. Fuses 60GHz mmWave radar, NDIR air quality, and thermal acoustic telemetry into instant physical actions — zero video recordings, zero facial recognition, zero blind spots.
            </p>

            {/* Tactical Advantages Checklist */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs sm:text-sm font-mono text-slate-300">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>100% Camera-Free</span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Sub-12ms Edge BACnet</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Sub-Millimeter Vitals</span>
              </div>
            </div>

            {/* CTA Actions */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link to="/dashboard" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto btn-chamfer btn-cyan-glow py-3.5 px-7 text-xs sm:text-sm font-mono font-bold tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer">
                  <span>ENTER COMMAND CONSOLE</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>

              <a href="#sensors" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto btn-chamfer btn-cyan-outline py-3.5 px-7 text-xs sm:text-sm font-mono tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer">
                  <span>EXPLORE SENSOR FLEET</span>
                </button>
              </a>
            </div>

            {/* Trust Badges */}
            <div className="pt-2 text-xs font-mono text-slate-400 flex items-center justify-center lg:justify-start gap-3">
              <span>COMPLIANCE:</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">HIPAA</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">GDPR</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">ISO 27001</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">NDAA</span>
            </div>
          </div>

          {/* ── Right Column: Interactive 60GHz mmWave Radar Canvas ── */}
          <div className="lg:col-span-5 relative">
            <RadarAnimation />
          </div>
        </div>

        {/* ── High-Impact Metrics Ribbon (GuardianEye Stat Bar) ── */}
        <div className="mt-16 pt-8 border-t border-cyan-500/20 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          <div className="hud-bracket p-3.5 sm:p-4 rounded-xl bg-slate-950/70 border border-cyan-500/20 backdrop-blur-md min-w-0 overflow-hidden flex flex-col justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block truncate">Decision Latency</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-cyan-400 tracking-tight">&lt;12</span>
              <span className="text-xs font-mono text-cyan-300 font-bold">ms</span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-1 line-clamp-1 sm:line-clamp-none">Edge BACnet & relay actuation</p>
          </div>

          <div className="hud-bracket p-3.5 sm:p-4 rounded-xl bg-slate-950/70 border border-cyan-500/20 backdrop-blur-md min-w-0 overflow-hidden flex flex-col justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block truncate">Fleet Uptime</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">99.9</span>
              <span className="text-xs font-mono text-cyan-400 font-bold">%</span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-1 line-clamp-1 sm:line-clamp-none">Industrial watchdog reconnect</p>
          </div>

          <div className="hud-bracket p-3.5 sm:p-4 rounded-xl bg-slate-950/70 border border-cyan-500/20 backdrop-blur-md min-w-0 overflow-hidden flex flex-col justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block truncate">Optical Lenses</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-cyan-400 tracking-tight">0</span>
              <span className="text-xs font-mono text-slate-400 font-bold">Lenses</span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-1 line-clamp-1 sm:line-clamp-none">100% Zero-Knowledge privacy</p>
          </div>

          <div className="hud-bracket p-3.5 sm:p-4 rounded-xl bg-slate-950/70 border border-cyan-500/20 backdrop-blur-md min-w-0 overflow-hidden flex flex-col justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block truncate">Energy Saved</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">38</span>
              <span className="text-xs font-mono text-emerald-400 font-bold">% Avg</span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-1 line-clamp-1 sm:line-clamp-none">Autonomous setback verified</p>
          </div>
        </div>
      </div>
    </section>
  );
};
