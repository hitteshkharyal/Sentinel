import React, { useState } from 'react';
import {
  Radio,
  Cpu,
  Sliders,
  Zap,
  BellRing,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Wind,
  Lightbulb,
  Heart,
} from 'lucide-react';
import { Badge } from '../ui/Badge';

export const PipelineFlow: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0);

  const steps = [
    {
      step: '01',
      title: 'Sense',
      subtitle: 'Raw Physical Signals',
      icon: <Radio className="w-6 h-6 text-sentinel-600" />,
      color: 'border-sentinel-300 bg-sentinel-50/50',
      badge: 'Edge Ingestion',
      badgeVariant: 'primary' as const,
      hardware: ['60GHz mmWave Radar', 'Photoacoustic NDIR CO₂', 'Acoustic SPL Sensor', 'PIR Pyroelectric'],
      description:
        'Continuous ambient RF waveforms, micro-vibrations, sound pressure decibels, and gas ppm captured locally without optical lenses or camera sensors.',
      payloadExample: '{"type": "mmwave", "doppler_hz": 42.1, "breathing_bpm": 18, "co2_ppm": 1420}',
    },
    {
      step: '02',
      title: 'Understand',
      subtitle: 'Edge Sensor Fusion',
      icon: <Cpu className="w-6 h-6 text-purple-600" />,
      color: 'border-purple-300 bg-purple-50/50',
      badge: 'Spatial State Machine',
      badgeVariant: 'info' as const,
      hardware: ['ESP32 Dual-Core Filter', 'Doppler FFT Spectral Analysis', 'Occupancy Confidence Fusion'],
      description:
        'Distinguishes true human presence from drapery oscillations, ceiling fan noise, or pets. Normal sleep is verified and never misclassified as an alert.',
      payloadExample: '{"state": "OCCUPIED_STATIONARY", "confidence": 0.992, "privacy_hash": "a4f8...b9"}',
    },
    {
      step: '03',
      title: 'Decide',
      subtitle: 'Autonomous Policy Evaluation',
      icon: <Sliders className="w-6 h-6 text-emerald-600" />,
      color: 'border-emerald-300 bg-emerald-50/50',
      badge: '<15ms Engine',
      badgeVariant: 'success' as const,
      hardware: ['Multi-condition Rules', 'Time-of-Day Profiles', 'Facility Safety Thresholds'],
      description:
        'Evaluates environmental comfort limits, occupancy schedules, and risk tiers instantly at the edge and central broker.',
      payloadExample: '{"rule_id": "rule_co2_fresh_air", "action": "SET_DAMPER_100", "urgency": "AUTO"}',
    },
    {
      step: '04',
      title: 'Act',
      subtitle: 'Instant Physical Automation',
      icon: <Zap className="w-6 h-6 text-amber-600" />,
      color: 'border-amber-300 bg-amber-50/50',
      badge: 'Zero Human Delay',
      badgeVariant: 'warning' as const,
      hardware: ['BACnet / Modbus HVAC', 'DALI / 0-10V Lighting', 'Dry Contact Solenoids'],
      description:
        'Immediate mechanical response: fresh air ventilation cycles on, unoccupied room thermostats set back, lighting scenes adjust automatically.',
      payloadExample: '{"actuator": "damper_vav_08", "target_pct": 100, "status": "EXEC_CONFIRMED"}',
    },
    {
      step: '05',
      title: 'Escalate',
      subtitle: 'Only When Unresolved',
      icon: <BellRing className="w-6 h-6 text-rose-600" />,
      color: 'border-rose-300 bg-rose-50/50',
      badge: 'Responsible Alerting',
      badgeVariant: 'danger' as const,
      hardware: ['Multi-tier SLA Dispatch', 'Browser Audio Beacons', 'Responsible-person Routing'],
      description:
        'Zero alert fatigue. Operators are only pinged when autonomous physical actions cannot resolve the condition or life safety requires intervention.',
      payloadExample: '{"alert": "BUS_TRAPPED_PASSENGER", "sla_seconds": 180, "target": "DISPATCH_LEAD"}',
    },
  ];

  return (
    <section id="pipeline" className="py-20 lg:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sentinel-100 text-sentinel-800 text-xs font-bold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-4 h-4 text-sentinel-600" />
            <span>The SENTINEL Operational Paradigm</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Sense → Understand → Decide → Act
          </h2>
          <p className="text-base sm:text-lg text-slate-600 mt-4 leading-relaxed">
            SENTINEL does not just plot lines on graphs. It autonomously transforms raw physical RF pulses into intelligent mechanical decisions — escalating to humans only when necessary.
          </p>
        </div>

        {/* Five-Stage Interactive Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 relative">
          {steps.map((item, index) => {
            const isSelected = activeStep === index;
            return (
              <div
                key={item.step}
                onClick={() => setActiveStep(index)}
                className={`rounded-2xl border p-5 cursor-pointer transition-all duration-200 relative group flex flex-col justify-between ${
                  isSelected
                    ? 'bg-white border-sentinel-500 shadow-lg shadow-sentinel-500/10 scale-[1.02]'
                    : 'bg-white/80 border-slate-200/90 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-slate-300 font-mono group-hover:text-sentinel-500 transition-colors">
                      {item.step}
                    </span>
                    <Badge variant={item.badgeVariant} size="sm">
                      {item.badge}
                    </Badge>
                  </div>

                  <div className="mb-3">{item.icon}</div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">{item.title}</h3>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">{item.subtitle}</p>

                  <p className="text-xs text-slate-600 mt-3 leading-relaxed line-clamp-3">
                    {item.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-sentinel-600">
                  <span>Inspect telemetry</span>
                  <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'translate-x-1' : ''}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Stage Detail Inspector */}
        {(() => {
          const currentStep = steps[activeStep] ?? steps[0]!;
          return (
            <div className="mt-8 rounded-3xl bg-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center gap-3">
                    <Badge variant={currentStep.badgeVariant} size="md">
                      Stage {currentStep.step} · {currentStep.title}
                    </Badge>
                    <span className="text-sm text-slate-400 font-mono">
                      {currentStep.subtitle}
                    </span>
                  </div>

                  <h4 className="text-xl font-bold tracking-tight text-white">
                    {currentStep.description}
                  </h4>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {currentStep.hardware.map((tech) => (
                      <span
                        key={tech}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Simulated JSON Payload */}
                <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800/90 font-mono text-xs">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
                    <span>Edge Payload Sample</span>
                    <span className="text-emerald-400">Validated Schema</span>
                  </div>
                  <pre className="text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {currentStep.payloadExample}
                  </pre>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Triple Product Outcome Banner: Safety + Comfort + Efficiency */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <h5 className="font-bold text-slate-900 text-sm">Life Safety Guaranteed</h5>
              <p className="text-xs text-slate-500 mt-0.5">
                Zero students trapped on school buses · Bathroom fall detection without cameras.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <Wind className="w-6 h-6" />
            </div>
            <div>
              <h5 className="font-bold text-slate-900 text-sm">Occupant Comfort & Air</h5>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated fresh air ventilation when CO₂ rises · Hotel room auto-climatization.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Lightbulb className="w-6 h-6" />
            </div>
            <div>
              <h5 className="font-bold text-slate-900 text-sm">Autonomous Energy Savings</h5>
              <p className="text-xs text-slate-500 mt-0.5">
                Eco-setback temperature ramps & lighting sleep modes when rooms are vacant.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
