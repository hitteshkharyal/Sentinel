import React from 'react';
import { TacticalHudBar } from '../components/landing/TacticalHudBar';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { LandingHero } from '../components/landing/LandingHero';
import { PipelineFlow } from '../components/landing/PipelineFlow';
import { SensorFleetShowcase } from '../components/landing/SensorFleetShowcase';
import { IndustryShowcase } from '../components/landing/IndustryShowcase';
import { PrivacyComparison } from '../components/landing/PrivacyComparison';
import { InteractiveDemo } from '../components/landing/InteractiveDemo';
import { LandingFooter } from '../components/landing/LandingFooter';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#02040a] text-slate-100 cyber-grid-bg relative overflow-x-hidden selection:bg-cyan-500 selection:text-black font-sans">
      {/* ── Fixed Top Tactical Telemetry & Overlays ── */}
      <TacticalHudBar />

      {/* ── Fixed Main Navigation Bar ── */}
      <LandingNavbar />

      {/* ── Main Landing Experience ── */}
      <main className="relative z-10 pt-7">
        {/* 1. Hero with Live Radar Simulation HUD & Metrics */}
        <LandingHero />

        {/* 2. Sense → Understand → Decide → Act 6-Pillar Tactical Architecture */}
        <PipelineFlow />

        {/* 3. GuardianEye Hardware Fleet Inspection ("Our Cameras" style) */}
        <SensorFleetShowcase />

        {/* 4. Multi-Industry Showcase across all 8 sectors */}
        <IndustryShowcase />

        {/* 5. The Privacy Paradigm: Why Non-Optical Radar Trumps CCTV */}
        <PrivacyComparison />

        {/* 6. Live Interactive Sandbox Testbed */}
        <InteractiveDemo />
      </main>

      {/* ── Footer & Compliance Credits ── */}
      <LandingFooter />
    </div>
  );
};
