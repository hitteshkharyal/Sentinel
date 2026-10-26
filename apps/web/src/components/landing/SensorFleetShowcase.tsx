// ─────────────────────────────────────────────
// SENTINEL Web — Sensor Fleet Showcase
// Modeled directly after GuardianEye "Our Cameras" section
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import { Radio, Wind, Activity, Zap, Check, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SensorFleetShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);

  const products = [
    {
      id: 'SE-R60 PRO',
      category: '60GHz SPATIAL MMWAVE',
      name: 'Spatial Radar Node',
      tagline: 'Discreet. Omnipresent. Zero Optical Cameras.',
      description:
        'The SE-R60 PRO mmWave radar node blends seamlessly into acoustic ceilings while delivering uncompromising spatial tracking. Detects stationary micro-breathing up to 10m away with zero camera lenses.',
      icon: <Radio className="w-8 h-8 text-cyan-400" />,
      specs: [
        { label: 'Frequency Band', value: '60 GHz FMCW' },
        { label: 'Detection Range', value: '10m (120° FOV)' },
        { label: 'Target Tracking', value: '8 Simultaneous' },
        { label: 'Micro-Motion', value: 'Chest-Wall Breathing' },
        { label: 'Privacy Standard', value: '100% Non-Optical' },
        { label: 'Operating Temp', value: '-20°C to +65°C' },
        { label: 'Protocol', value: 'MQTT / BACnet IP' },
        { label: 'Enclosure Rating', value: 'IP65 Industrial' },
      ],
    },
    {
      id: 'SE-AQM ULTRA',
      category: 'DUAL-BEAM NDIR',
      name: 'Environmental & Gas Hub',
      tagline: 'Continuous Air Quality & Thermal Intelligence.',
      description:
        'Purpose-built for commercial buildings and healthcare facilities. Features dual-channel NDIR carbon dioxide sensing, temperature, relative humidity, and acoustic sound decibel monitoring.',
      icon: <Wind className="w-8 h-8 text-cyan-400" />,
      specs: [
        { label: 'CO₂ Range', value: '400 - 5,000 ppm' },
        { label: 'CO₂ Accuracy', value: '±30 ppm ±3%' },
        { label: 'Acoustic Range', value: '30 - 110 dBA' },
        { label: 'Response Time', value: '<1.0 Second' },
        { label: 'Calibration', value: 'Auto-Baseline (ABC)' },
        { label: 'Standards', value: 'ASHRAE 55 & 62.1' },
        { label: 'Power Supply', value: 'PoE / 24V AC/DC' },
        { label: 'Calibration Drift', value: '<1% per year' },
      ],
    },
    {
      id: 'SE-PIR900 DUAL',
      category: 'QUAD-ELEMENT PIR',
      name: 'Perimeter Micro-Motion',
      tagline: 'Instantaneous Wake. Zero Standby Drain.',
      description:
        'Ultra-low-power peripheral trigger that instantaneously wakes surrounding mmWave radar arrays upon initial zone boundary crossing. Engineered for 10-year autonomous battery operation.',
      icon: <Activity className="w-8 h-8 text-cyan-400" />,
      specs: [
        { label: 'Coverage Area', value: '360° Ceiling (12m Ø)' },
        { label: 'Battery Lifespan', value: '10 Years Sealed' },
        { label: 'Standby Current', value: '<4.5 µA Ultra-Low' },
        { label: 'Detection Zones', value: '64 High-Density' },
        { label: 'Pet Immunity', value: 'Up to 25 kg' },
        { label: 'Wireless Mesh', value: 'ESP-NOW / Zigbee 3.0' },
        { label: 'Wake-Up Time', value: '<15 milliseconds' },
        { label: 'Mounting Style', value: 'Flush & Surface' },
      ],
    },
    {
      id: 'SE-ACT240 RELAY',
      category: 'SMART BACNET / RELAY',
      name: 'Edge Automation Contactor',
      tagline: 'Instantaneous Control. Fail-Safe Reliability.',
      description:
        'Heavy-duty autonomous actuator that interfaces directly with commercial HVAC compressors, VAV damper boxes, and lighting panels, executing setback policies under 8 milliseconds.',
      icon: <Zap className="w-8 h-8 text-cyan-400" />,
      specs: [
        { label: 'Contact Rating', value: 'Dual 16A @ 277V AC' },
        { label: 'Switching Speed', value: '<8.0 Milliseconds' },
        { label: 'Fieldbus Protocol', value: 'BACnet MS/TP, Modbus' },
        { label: 'Fail-Safe Mode', value: 'Hardware Bypass Relay' },
        { label: 'Isolation Voltage', value: '4.0 kV Dielectric' },
        { label: 'Watchdog', value: 'Internal Auto-Recovery' },
        { label: 'Form Factor', value: 'Standard DIN-Rail' },
        { label: 'Certifications', value: 'UL 916, CE, RoHS' },
      ],
    },
  ];

  const current = products[activeTab] ?? products[0]!;

  return (
    <section id="sensors" className="relative py-24 bg-[#02040a] cyber-grid-bg text-white border-t border-cyan-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-cyan-400 px-3 py-1 rounded bg-cyan-950/60 border border-cyan-500/30">
            HARDWARE PRODUCT LINE
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mt-4">
            Our <span className="gradient-text-cyan">Sensor Fleet</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-3 font-normal leading-relaxed">
            Industrial edge hardware custom-designed for 100% optical-free spatial perception, environmental health surveillance, and autonomous electrical actuation.
          </p>
        </div>

        {/* Product Selector Tabs */}
        <div className="flex items-center justify-center gap-2 mb-10 overflow-x-auto pb-2">
          {products.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setActiveTab(idx)}
              className={`px-4 py-2 rounded-xl text-xs font-mono tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                activeTab === idx
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/25 border border-cyan-400'
                  : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {p.id}
            </button>
          ))}
        </div>

        {/* Main Product Inspection Card (GuardianEye Style) */}
        <div className="hud-bracket glass-card p-6 sm:p-10 rounded-3xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Visual HUD Canvas with Targeting Reticle */}
            <div className="lg:col-span-5 relative flex items-center justify-center p-8 bg-slate-950/80 rounded-2xl border border-cyan-500/20 aspect-square max-w-md mx-auto">
              {/* Concentric Targeting Circles */}
              <div className="absolute w-[80%] h-[80%] rounded-full border border-cyan-500/20 border-dashed animate-spin" style={{ animationDuration: '40s' }} />
              <div className="absolute w-[60%] h-[60%] rounded-full border border-cyan-500/30" />
              <div className="absolute w-[40%] h-[40%] rounded-full border border-cyan-500/40 bg-cyan-500/5" />

              {/* HUD Crosshairs */}
              <div className="absolute inset-x-8 h-[1px] bg-cyan-500/25" />
              <div className="absolute inset-y-8 w-[1px] bg-cyan-500/25" />

              {/* Product Embellishment Icon */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 rounded-2xl bg-cyan-950/80 border-2 border-cyan-400 flex items-center justify-center shadow-2xl shadow-cyan-500/40">
                  {current.icon}
                </div>
                <span className="mt-4 text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
                  {current.id}
                </span>
                <span className="text-[10px] font-mono text-slate-500">OPTICAL-FREE HARDWARE</span>
              </div>

              {/* Corner Spec Annotations */}
              <div className="absolute top-3 left-3 text-[9px] font-mono text-slate-500 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800">
                STATUS: CERTIFIED
              </div>
              <div className="absolute bottom-3 right-3 text-[9px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                100% PRIVATE
              </div>
            </div>

            {/* Product Specifications & Details */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <span className="text-xs font-mono font-bold tracking-widest uppercase text-cyan-400">
                  {current.category}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
                  {current.name}
                </h3>
                <p className="text-sm font-mono text-slate-300 italic mt-1">
                  &ldquo;{current.tagline}&rdquo;
                </p>
                <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                  {current.description}
                </p>
              </div>

              {/* Technical Specifications Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {current.specs.map((sp) => (
                  <div
                    key={sp.label}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-cyan-500/30 transition-all flex items-center justify-between min-w-0 gap-2"
                  >
                    <span className="text-xs font-mono text-slate-400 truncate">{sp.label}</span>
                    <span className="text-xs font-mono font-bold text-cyan-400 shrink-0 text-right">{sp.value}</span>
                  </div>
                ))}
              </div>

              {/* Product CTA Actions */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
                <Link to="/sensors" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto btn-chamfer btn-cyan-glow py-3 px-6 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer">
                    <span>VIEW SENSOR CATALOG</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>

                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Immediate Enterprise Availability</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
