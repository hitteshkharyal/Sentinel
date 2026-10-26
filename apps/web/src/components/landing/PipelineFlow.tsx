// ─────────────────────────────────────────────
// SENTINEL Web — GuardianEye Theme Core Capability Matrix
// 6 Tactical Glassmorphic Cards with Corner Reticles & Stat Badges
// ─────────────────────────────────────────────

import React from 'react';
import { Radio, Wind, Cpu, Zap, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PipelineFlow: React.FC = () => {
  const capabilities = [
    {
      id: '01',
      title: '60GHz mmWave Spatial Radar',
      subtitle: 'Sub-Millimeter Non-Optical Precision',
      icon: <Radio className="w-5 h-5 text-cyan-400" />,
      description:
        'Continuous Doppler point-cloud sensing capable of tracking micro-motion, stationary chest-wall displacement, and occupant count without camera lenses or optical feeds.',
      stat: '0.0mm',
      statLabel: 'Detection Sensitivity',
    },
    {
      id: '02',
      title: 'NDIR Environmental & Air Quality',
      subtitle: 'Instant Indoor Hazard Detection',
      icon: <Wind className="w-5 h-5 text-cyan-400" />,
      description:
        'Continuous photoacoustic NDIR carbon dioxide, relative humidity, temperature, and acoustic sound-level surveillance identifying ventilation deficits and hazards before discomfort occurs.',
      stat: '<1s',
      statLabel: 'Sensor Response Time',
    },
    {
      id: '03',
      title: 'Bayesian Sensor Fusion Engine',
      subtitle: 'Zero-False-Positive Decision Logic',
      icon: <Cpu className="w-5 h-5 text-cyan-400" />,
      description:
        'Cross-correlates multi-sensor evidence across radar point clouds, PIR pyroelectrics, and thermal acoustics. Distinguishes normal stationary sleep from distress or vacant zones.',
      stat: '99.8%',
      statLabel: 'Classification Accuracy',
    },
    {
      id: '04',
      title: 'Autonomous Edge Actuation',
      subtitle: 'Direct BACnet & Relay Overrides',
      icon: <Zap className="w-5 h-5 text-cyan-400" />,
      description:
        'Executes deterministic room setbacks (HVAC_ECO, LIGHT_OFF) and ventilation boosts over industrial BACnet, Modbus, and dry-contact relays without cloud round-trip delay.',
      stat: '<12ms',
      statLabel: 'Actuation Latency',
    },
    {
      id: '05',
      title: 'Zero-Knowledge Privacy Paradigm',
      subtitle: 'Mathematical Point-Cloud Defense',
      icon: <Lock className="w-5 h-5 text-cyan-400" />,
      description:
        'Engineered to be physically blind to identity. Zero optical sensors, zero video recording, zero biometric storage. Fully compliant with HIPAA, GDPR, ISO 27001, and NDAA standards.',
      stat: '100%',
      statLabel: 'Camera-Free Architecture',
    },
    {
      id: '06',
      title: 'Predictive AI & ESG Digital Twin',
      subtitle: 'Forward Forecasting & Impact Tracking',
      icon: <Sparkles className="w-5 h-5 text-cyan-400" />,
      description:
        'Mass-balance CO₂ accumulation modeling, circadian occupancy surge forecasting, and automated ESG digital twins calculating verified kWh saved, cost reduction, and carbon offset.',
      stat: '24h',
      statLabel: 'Forward Predictive Horizon',
    },
  ];

  return (
    <section id="pipeline" className="relative py-24 bg-[#02040a] cyber-grid-bg text-white border-t border-cyan-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-cyan-400 px-3 py-1 rounded bg-cyan-950/60 border border-cyan-500/30">
            PERCEPTION & ACTUATION ECOSYSTEM
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mt-4">
            Intelligence That Thinks,{' '}
            <span className="gradient-text-cyan block sm:inline">Acts, and Protects.</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-3 font-normal leading-relaxed">
            A high-speed sensory intelligence platform engineered to sense physical environments, make autonomous decisions at the edge, and quantify real-world impact.
          </p>
        </div>

        {/* 6 GuardianEye Glassmorphism Cards with HUD Corner Reticles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((cap) => (
            <div
              key={cap.id}
              className="hud-bracket glass-card glass-card-hover p-6 rounded-2xl relative flex flex-col justify-between overflow-hidden group"
            >
              {/* Background Hover Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/15 transition-all pointer-events-none" />

              <div>
                {/* Card Header: Diamond Emblem + ID */}
                <div className="flex items-center justify-between mb-5">
                  <div className="relative w-9 h-9 flex items-center justify-center">
                    <div className="absolute inset-0 border border-cyan-400/80 rotate-45 bg-cyan-950/40 group-hover:border-cyan-300 transition-all shadow-sm shadow-cyan-400/20" />
                    <div className="relative z-10">{cap.icon}</div>
                  </div>

                  <span className="text-xs font-mono font-bold text-slate-500 group-hover:text-cyan-400 transition-colors">
                    {cap.id}
                  </span>
                </div>

                {/* Card Title & Subtitle */}
                <h3 className="text-base font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                  {cap.title}
                </h3>
                <span className="text-xs font-mono text-cyan-400 block mt-0.5 mb-3">
                  {cap.subtitle}
                </span>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  {cap.description}
                </p>
              </div>

              {/* Bottom Stat Badge */}
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-black font-mono text-cyan-400 tracking-tight">
                    {cap.stat}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">
                    {cap.statLabel}
                  </span>
                </div>

                <div className="w-2 h-2 rounded-full bg-cyan-400 opacity-60 group-hover:opacity-100 group-hover:animate-ping" />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Callout Bar */}
        <div className="mt-12 p-6 rounded-2xl bg-slate-950/80 border border-cyan-500/25 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-xl">
          <div className="flex items-center gap-3 text-xs font-mono text-slate-300">
            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
              SECURITY STANDARDS
            </span>
            <span className="hidden md:inline">ISO 27001 · SOC 2 TYPE II · HIPAA READY · NDAA COMPLIANT</span>
          </div>

          <Link to="/dashboard">
            <button className="btn-chamfer btn-cyan-glow py-2.5 px-6 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer">
              <span>EXPLORE PLATFORM ARCHITECTURE</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
};
