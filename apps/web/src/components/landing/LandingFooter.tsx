import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowUp } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#02040a] text-white border-t border-cyan-500/20 relative overflow-hidden">
      {/* Background cyber grid and subtle glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-40 bg-gradient-to-t from-cyan-500/5 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-cyan-500/15">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              {/* GuardianEye 45° Diamond Emblem */}
              <div className="relative w-9 h-9 flex items-center justify-center">
                <div className="absolute inset-0 bg-cyan-500/20 border border-cyan-400 rotate-45 rounded-sm shadow-[0_0_12px_rgba(0,240,255,0.4)]" />
                <Shield className="w-4 h-4 text-cyan-300 relative z-10" />
              </div>
              <span className="font-mono font-black text-xl tracking-wider text-white">
                SENTINEL<span className="text-cyan-400">.AI</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed font-light">
              Privacy-Preserving Autonomous Sensor Intelligence & Closed-Loop Actuation Platform.
              Sense → Understand → Decide → Act → Escalate only when necessary.
            </p>
            <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>{'PLATFORM CORE // ONLINE · ZERO OPTICAL CAMERAS'}</span>
            </div>
          </div>

          {/* Architecture Links */}
          <div className="space-y-3 font-mono">
            <h5 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              {'// ARCHITECTURE'}
            </h5>
            <ul className="space-y-2 text-xs text-slate-400 font-light">
              <li>
                <a href="#pipeline" className="hover:text-cyan-300 transition-colors">
                  Autonomous Sense → Act Loop
                </a>
              </li>
              <li>
                <a href="#fleet" className="hover:text-cyan-300 transition-colors">
                  Tactical Sensor Fleet
                </a>
              </li>
              <li>
                <a href="#radar-demo" className="hover:text-cyan-300 transition-colors">
                  60GHz mmWave Vital Radar
                </a>
              </li>
              <li>
                <a href="#privacy" className="hover:text-cyan-300 transition-colors">
                  Zero-Optical Privacy Paradigm
                </a>
              </li>
              <li>
                <a href="#simulation" className="hover:text-cyan-300 transition-colors">
                  Interactive Testbed
                </a>
              </li>
              <li>
                <Link to="/dashboard" className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 pt-1">
                  <span>Enter Operations Console</span>
                  <span>→</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Industry Solutions */}
          <div className="space-y-3 font-mono">
            <h5 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              {'// SECTOR POLICIES'}
            </h5>
            <ul className="space-y-2 text-xs text-slate-400 font-light">
              <li>
                <a href="#industries" className="hover:text-cyan-300 transition-colors">
                  School Transport (Bus #12)
                </a>
              </li>
              <li>
                <a href="#industries" className="hover:text-cyan-300 transition-colors">
                  Hospitals (Bathroom Fall Guard)
                </a>
              </li>
              <li>
                <a href="#industries" className="hover:text-cyan-300 transition-colors">
                  Schools (Classroom 8A CO₂)
                </a>
              </li>
              <li>
                <a href="#industries" className="hover:text-cyan-300 transition-colors">
                  Hotels (Eco-Setback 301)
                </a>
              </li>
              <li>
                <a href="#industries" className="hover:text-cyan-300 transition-colors">
                  Industrial Plants & Cold Storage
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <p>© {new Date().getFullYear()} SENTINEL PLATFORM. MIL-SPEC TELEMETRY · ALL RIGHTS RESERVED.</p>

          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors border border-cyan-500/30 px-3 py-1.5 rounded-md bg-[#030712] cursor-pointer"
          >
            <span>RETURN TO APEX</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};
