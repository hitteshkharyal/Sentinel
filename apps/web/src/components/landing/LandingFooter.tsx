import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowUp } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-950 text-white border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800/80">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sentinel-600 flex items-center justify-center text-white">
                <Shield className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight">SENTINEL</span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Privacy-Preserving Autonomous Sensor Intelligence & Automation Platform.
              Sense → Understand → Decide → Act → Escalate only when necessary.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Platform Core Online · Zero Optical Cameras</span>
            </div>
          </div>

          {/* Architecture Links */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Platform Architecture
            </h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a href="#pipeline" className="hover:text-white transition-colors">
                  Sense → Act Loop
                </a>
              </li>
              <li>
                <a href="#radar-demo" className="hover:text-white transition-colors">
                  60GHz mmWave Radar
                </a>
              </li>
              <li>
                <a href="#privacy" className="hover:text-white transition-colors">
                  Privacy Paradigm
                </a>
              </li>
              <li>
                <a href="#simulation" className="hover:text-white transition-colors">
                  Hardware Testbed
                </a>
              </li>
              <li>
                <Link to="/dashboard" className="text-sentinel-400 hover:text-sentinel-300 font-semibold">
                  Operations Console →
                </Link>
              </li>
            </ul>
          </div>

          {/* Industry Solutions */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Industry Policies
            </h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a href="#industries" className="hover:text-white transition-colors">
                  Transport (School Bus 12)
                </a>
              </li>
              <li>
                <a href="#industries" className="hover:text-white transition-colors">
                  Hospitals (Bathroom Fall)
                </a>
              </li>
              <li>
                <a href="#industries" className="hover:text-white transition-colors">
                  Schools (Classroom 8A CO₂)
                </a>
              </li>
              <li>
                <a href="#industries" className="hover:text-white transition-colors">
                  Hotels (Eco-Setback 301)
                </a>
              </li>
              <li>
                <a href="#industries" className="hover:text-white transition-colors">
                  Factories & Cold Storage
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} SENTINEL Platform. All rights reserved. Built for Privacy-First Autonomy.</p>

          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};
