import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowRight, Menu, X, Lock } from 'lucide-react';
import { Button } from '../ui/Button';

export const LandingNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 inset-x-0 z-40 glass-navbar transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* ── Brand Logo ── */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sentinel-600 to-sentinel-800 flex items-center justify-center text-white shadow-lg shadow-sentinel-600/25 group-hover:scale-105 transition-transform">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 leading-none">
                SENTINEL
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sentinel-100 text-sentinel-700">
                v0.1
              </span>
            </div>
            <span className="text-xs text-slate-500 font-medium">Sense. Understand. Act.</span>
          </div>
        </Link>

        {/* ── Desktop Navigation Links ── */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#pipeline" className="hover:text-sentinel-600 transition-colors">
            Architecture
          </a>
          <a href="#radar-demo" className="hover:text-sentinel-600 transition-colors">
            Radar Perception
          </a>
          <a href="#industries" className="hover:text-sentinel-600 transition-colors">
            Industries
          </a>
          <a href="#privacy" className="hover:text-sentinel-600 transition-colors">
            Privacy Paradigm
          </a>
          <a href="#simulation" className="hover:text-sentinel-600 transition-colors">
            Live Sandbox
          </a>
        </div>

        {/* ── CTA Buttons ── */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/80 text-slate-600 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5 text-sentinel-600" />
            <span>100% Camera-Free</span>
          </div>
          <Link to="/dashboard">
            <Button
              variant="primary"
              size="md"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="shadow-md shadow-sentinel-600/20"
            >
              Enter Console
            </Button>
          </Link>
        </div>

        {/* ── Mobile Hamburger ── */}
        <div className="flex sm:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* ── Mobile Dropdown Menu ── */}
      {mobileMenuOpen && (
        <div className="sm:hidden px-4 pt-2 pb-6 bg-white/95 backdrop-blur-xl border-b border-slate-200 animate-slide-up space-y-3">
          <a
            href="#pipeline"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
          >
            Architecture
          </a>
          <a
            href="#radar-demo"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
          >
            Radar Perception
          </a>
          <a
            href="#industries"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
          >
            Industries
          </a>
          <a
            href="#privacy"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
          >
            Privacy Paradigm
          </a>
          <a
            href="#simulation"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
          >
            Live Sandbox
          </a>
          <div className="pt-2">
            <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="w-full block">
              <Button variant="primary" className="w-full justify-center">
                Enter Console
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};
