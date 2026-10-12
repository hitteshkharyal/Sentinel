// ─────────────────────────────────────────────
// SENTINEL Web — Landing Page (Shell)
// ─────────────────────────────────────────────
// This is a minimal placeholder for Day 1.
// The full landing page design will be implemented in Day 2.

import { Shield } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex flex-col items-center justify-center px-6">
      {/* ── Logo ── */}
      <div className="flex items-center gap-3 mb-8 animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sentinel-500 to-sentinel-700 flex items-center justify-center shadow-lg shadow-sentinel-500/25">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-sentinel-950">
          SENTINEL
        </h1>
      </div>

      {/* ── Tagline ── */}
      <p className="text-xl text-sentinel-600 font-medium mb-4 animate-slide-up">
        Sense. Understand. Act.
      </p>
      <p className="text-base text-slate-500 max-w-lg text-center mb-12 animate-slide-up">
        Privacy-preserving autonomous intelligence for physical spaces.
      </p>

      {/* ── Status Card ── */}
      <div className="glass rounded-2xl p-8 max-w-md w-full shadow-xl shadow-slate-200/50 animate-slide-up">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse-subtle" />
          <span className="text-sm font-medium text-emerald-600">
            System Initializing
          </span>
        </div>
        <h2 className="text-lg font-semibold text-slate-800 mb-2">
          Day 1 — Architecture Complete
        </h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          Monorepo structure, TypeScript configuration, shared packages, API
          shell, and frontend shell are ready. Full landing page and UI system
          will be implemented in Day 2.
        </p>
      </div>

      {/* ── Footer ── */}
      <p className="mt-12 text-xs text-slate-400">
        SENTINEL v0.1.0 · Privacy-Preserving IoT Automation
      </p>
    </div>
  );
}
