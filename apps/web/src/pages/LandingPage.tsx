import React from 'react';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { LandingHero } from '../components/landing/LandingHero';
import { PipelineFlow } from '../components/landing/PipelineFlow';
import { IndustryShowcase } from '../components/landing/IndustryShowcase';
import { PrivacyComparison } from '../components/landing/PrivacyComparison';
import { InteractiveDemo } from '../components/landing/InteractiveDemo';
import { LandingFooter } from '../components/landing/LandingFooter';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-sentinel-500 selection:text-white">
      {/* ── Fixed Top Navigation ── */}
      <LandingNavbar />

      {/* ── Main Landing Experience ── */}
      <main>
        {/* 1. Hero with Live Radar Simulation HUD & Metrics */}
        <LandingHero />

        {/* 2. Sense → Understand → Decide → Act Pipeline & Triple Outcomes */}
        <PipelineFlow />

        {/* 3. Multi-Industry Showcase across all 8 sectors */}
        <IndustryShowcase />

        {/* 4. The Privacy Paradigm: Why Non-Optical Radar Trumps CCTV */}
        <PrivacyComparison />

        {/* 5. Live Interactive Sandbox Testbed */}
        <InteractiveDemo />
      </main>

      {/* ── Footer & Compliance Credits ── */}
      <LandingFooter />
    </div>
  );
};
