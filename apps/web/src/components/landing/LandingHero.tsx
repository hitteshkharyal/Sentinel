import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Lock, Radio, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { RadarAnimation } from './RadarAnimation';

export const LandingHero: React.FC = () => {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden radial-grid-bg">
      {/* Decorative ambient gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-sentinel-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-20 right-10 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* ── Left Column: Headline & Value Proposition ── */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Mission Category Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sentinel-100/90 text-sentinel-800 text-xs font-bold uppercase tracking-wider border border-sentinel-200/80 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-sentinel-600 animate-pulse" />
              <span>Autonomous IoT Without Optical Cameras</span>
            </div>

            {/* Core Master Prompt Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-950 leading-[1.08]">
              Sense.{' '}
              <span className="text-sentinel-600 block sm:inline">Understand.</span>{' '}
              <span className="gradient-text-sentinel block">Act.</span>
            </h1>

            {/* Core Master Prompt Subtitle */}
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Privacy-preserving autonomous intelligence for physical spaces. Converts raw radio frequency and environmental signals into context-aware events, instant physical actuations, and responsible-person alerts.
            </p>

            {/* Key Advantages Checklist */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs sm:text-sm font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% Optical-Camera Free</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Edge BACnet / Relays</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Responsible Human Escalation</span>
              </div>
            </div>

            {/* CTA Actions */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
              <Link to="/dashboard" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="primary"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="w-full sm:w-auto shadow-lg shadow-sentinel-600/25 text-sm sm:text-base font-bold py-3.5 px-6"
                >
                  Get Started — Enter Console
                </Button>
              </Link>

              <a href="#radar-demo" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  leftIcon={<Radio className="w-4 h-4 text-sentinel-600" />}
                  className="w-full sm:w-auto text-sm sm:text-base font-semibold py-3.5 px-6"
                >
                  Explore Radar Perception
                </Button>
              </a>
            </div>

            {/* Trust and Compliance Endorsement */}
            <div className="pt-4 flex items-center justify-center lg:justify-start gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Lock className="w-3.5 h-3.5 text-sentinel-600" />
                Zero biometric facial data stored
              </span>
              <span>·</span>
              <span className="font-mono text-slate-500">HIPAA & GDPR Art. 9 Ready</span>
            </div>
          </div>

          {/* ── Right Column: Interactive Radar Perception Unit ── */}
          <div id="radar-demo" className="lg:col-span-5 relative">
            <RadarAnimation />
          </div>
        </div>

        {/* ── Key Metrics Bar ── */}
        <div className="mt-16 lg:mt-24 pt-8 border-t border-slate-200/80 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">0</div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Cameras Required
            </p>
            <p className="text-[11px] text-slate-400">100% Anonymous Perception</p>
          </div>

          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-sentinel-600 tracking-tight">&lt;15ms</div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Decision Loop Latency
            </p>
            <p className="text-[11px] text-slate-400">Deterministic Edge Rule Engine</p>
          </div>

          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">99.4%</div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              False Alarm Reduction
            </p>
            <p className="text-[11px] text-slate-400">Normal Sleep Filtered Correctly</p>
          </div>

          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-emerald-600 tracking-tight">100%</div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Actuator Automation
            </p>
            <p className="text-[11px] text-slate-400">Direct HVAC, DALI & Relay Control</p>
          </div>
        </div>
      </div>
    </section>
  );
};
