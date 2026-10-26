// ─────────────────────────────────────────────
// SENTINEL Web — GuardianEye Theme Landing Navbar
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowRight, Menu, X, Lock, PhoneCall } from 'lucide-react';
import { ThemeSwitcher } from '../ui/ThemeSwitcher';

export const LandingNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-7 inset-x-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-cyan-500/20 transition-all select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* ── Brand Logo with Diamond Embellishment ── */}
        <Link to="/" className="flex items-center gap-3.5 group">
          <div className="relative w-10 h-10 flex items-center justify-center">
            {/* GuardianEye Diamond border */}
            <div className="absolute inset-0 border border-cyan-400 rotate-45 group-hover:scale-105 group-hover:border-cyan-300 transition-all bg-cyan-950/40 shadow-sm shadow-cyan-400/20" />
            <Shield className="w-5 h-5 text-cyan-400 relative z-10 group-hover:text-cyan-300 transition-colors" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl tracking-tight text-white leading-none">
                SENTINEL
              </span>
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                PRO
              </span>
            </div>
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase block mt-0.5">
              Autonomous Intelligence
            </span>
          </div>
        </Link>

        {/* ── Desktop Navigation Links ── */}
        <div className="hidden lg:flex items-center gap-8 text-xs font-mono tracking-wider uppercase text-slate-300">
          <a href="#pipeline" className="hover:text-cyan-400 transition-colors">
            Perception
          </a>
          <a href="#radar-demo" className="hover:text-cyan-400 transition-colors">
            Radar Scope
          </a>
          <a href="#sensors" className="hover:text-cyan-400 transition-colors">
            Sensor Fleet
          </a>
          <a href="#industries" className="hover:text-cyan-400 transition-colors">
            Industries
          </a>
          <a href="#privacy" className="hover:text-cyan-400 transition-colors">
            Privacy
          </a>
          <a href="#simulation" className="hover:text-cyan-400 transition-colors">
            Live Sandbox
          </a>
        </div>

        {/* ── CTA Buttons ── */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Tactical Multi-Theme Switcher (White, Green, Orange, Cyan) */}
          <ThemeSwitcher />

          <div className="hidden xl:flex items-center gap-1.5 text-xs font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <PhoneCall className="w-3 h-3 text-cyan-400" />
            <span className="hover:text-cyan-300 cursor-pointer">24/7 SUPPORT</span>
          </div>

          <div className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-400">
            <Lock className="w-3 h-3 text-cyan-400" />
            <span>NO CAMERAS</span>
          </div>

          <Link to="/dashboard">
            <button className="btn-chamfer btn-cyan-glow px-4 sm:px-5 py-2.5 text-xs font-mono tracking-wider uppercase flex items-center gap-2 cursor-pointer">
              <span>ENTER CONSOLE</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>

        {/* ── Mobile Hamburger & Quick Switcher ── */}
        <div className="flex sm:hidden items-center gap-2">
          <ThemeSwitcher />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-300 hover:text-cyan-400 rounded-lg border border-slate-800 bg-slate-900/80"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        <div className="hidden sm:flex lg:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-300 hover:text-cyan-400 rounded-lg border border-slate-800 bg-slate-900/80"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* ── Mobile Dropdown Menu ── */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-4 pt-3 pb-6 bg-slate-950/95 backdrop-blur-2xl border-b border-cyan-500/20 space-y-3 font-mono text-xs">
          <a
            href="#pipeline"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-slate-300 hover:text-cyan-400 hover:bg-slate-900 rounded"
          >
            PERCEPTION
          </a>
          <a
            href="#radar-demo"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-slate-300 hover:text-cyan-400 hover:bg-slate-900 rounded"
          >
            RADAR SCOPE
          </a>
          <a
            href="#sensors"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-slate-300 hover:text-cyan-400 hover:bg-slate-900 rounded"
          >
            SENSOR FLEET
          </a>
          <a
            href="#industries"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-slate-300 hover:text-cyan-400 hover:bg-slate-900 rounded"
          >
            INDUSTRIES
          </a>
          <a
            href="#privacy"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-slate-300 hover:text-cyan-400 hover:bg-slate-900 rounded"
          >
            PRIVACY PARADIGM
          </a>
          <a
            href="#simulation"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-slate-300 hover:text-cyan-400 hover:bg-slate-900 rounded"
          >
            LIVE SANDBOX
          </a>
          <div className="pt-2 flex items-center justify-between px-3 py-2 border-t border-slate-800">
            <span className="text-[11px] text-slate-400">ACTIVE THEME</span>
            <ThemeSwitcher showLabels={true} />
          </div>
          <div className="pt-2">
            <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="w-full block">
              <button className="w-full btn-chamfer btn-cyan-glow py-3 text-xs font-mono uppercase tracking-wider justify-center flex items-center gap-2">
                <span>ENTER CONSOLE</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};
