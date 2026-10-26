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
    <nav className="fixed top-0 sm:top-3 inset-x-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-cyan-500/20 transition-all select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[4.75rem] sm:min-h-[5.25rem] py-2 sm:py-0 flex items-center justify-between gap-3">
        {/* ── Brand Logo with Diamond Embellishment ── */}
        <Link to="/" className="flex items-center gap-3 sm:gap-3.5 group shrink-0">
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center shrink-0">
            {/* GuardianEye Diamond border */}
            <div className="absolute inset-0 border border-cyan-400 rotate-45 group-hover:scale-105 group-hover:border-cyan-300 transition-all bg-cyan-950/40 shadow-sm shadow-cyan-400/20" />
            <Shield className="w-5 h-5 text-cyan-400 relative z-10 group-hover:text-cyan-300 transition-colors" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg sm:text-xl tracking-tight text-white leading-none">
                SENTINEL
              </span>
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                PRO
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] font-mono tracking-widest text-slate-400 uppercase block mt-0.5">
              Autonomous Intelligence
            </span>
          </div>
        </Link>

        {/* ── Desktop Navigation Links ── */}
        <div className="hidden lg:flex items-center gap-6 xl:gap-8 text-xs font-mono tracking-wider uppercase text-slate-300">
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
        <div className="hidden sm:flex items-center gap-3 shrink-0">
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
        <div className="flex sm:hidden items-center gap-2 shrink-0">
          <ThemeSwitcher />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-300 hover:text-cyan-400 rounded-lg border border-slate-800 bg-slate-900/80 min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-cyan-400" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        <div className="hidden sm:flex lg:hidden items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-300 hover:text-cyan-400 rounded-lg border border-slate-800 bg-slate-900/80 min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-cyan-400" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile Dropdown Menu Drawer ── */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-5 sm:px-6 pt-4 pb-6 bg-slate-950/98 backdrop-blur-2xl border-b border-cyan-500/25 space-y-3 font-mono text-sm max-h-[calc(100vh-5.5rem)] overflow-y-auto overscroll-contain shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-cyan-500/15">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">NAVIGATION MENU</span>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800"
              aria-label="Close navigation menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <a
            href="#pipeline"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-slate-200 hover:text-cyan-400 hover:bg-slate-900/80 rounded-lg transition-colors"
          >
            PERCEPTION
          </a>
          <a
            href="#radar-demo"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-slate-200 hover:text-cyan-400 hover:bg-slate-900/80 rounded-lg transition-colors"
          >
            RADAR SCOPE
          </a>
          <a
            href="#sensors"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-slate-200 hover:text-cyan-400 hover:bg-slate-900/80 rounded-lg transition-colors"
          >
            SENSOR FLEET
          </a>
          <a
            href="#industries"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-slate-200 hover:text-cyan-400 hover:bg-slate-900/80 rounded-lg transition-colors"
          >
            INDUSTRIES
          </a>
          <a
            href="#privacy"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-slate-200 hover:text-cyan-400 hover:bg-slate-900/80 rounded-lg transition-colors"
          >
            PRIVACY PARADIGM
          </a>
          <a
            href="#simulation"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-slate-200 hover:text-cyan-400 hover:bg-slate-900/80 rounded-lg transition-colors"
          >
            LIVE SANDBOX
          </a>

          {/* Theme switch row - clean, responsive, no overflow */}
          <div className="pt-3 pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-cyan-500/15">
            <span className="text-xs font-mono font-bold text-slate-400">COLOR THEME</span>
            <ThemeSwitcher showLabels={false} />
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
