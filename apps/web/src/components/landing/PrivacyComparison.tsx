import React from 'react';
import { Lock, XCircle, CheckCircle2 } from 'lucide-react';

export const PrivacyComparison: React.FC = () => {
  const comparisons = [
    {
      capability: 'Hospital Bathrooms & Showers',
      camera: 'Strictly prohibited by HIPAA & patient dignity laws. Complete blind spot for 70% of patient falls.',
      sentinel: '100% compliant. Detects falls in dense steam and total pitch darkness without optical lenses.',
    },
    {
      capability: 'Hotel Guest Rooms & Suites',
      camera: 'Unacceptable violation of privacy; severe legal liability and permanent brand damage.',
      sentinel: 'Monitors micro-motion and energy setback without capturing facial or visual identity.',
    },
    {
      capability: 'Student Minors in Schools & Buses',
      camera: 'Facial recognition requires explicit parental consent and faces intense regulatory scrutiny.',
      sentinel: 'Zero images captured. Pure physical RF Doppler verification of occupant chest wall movement.',
    },
    {
      capability: 'Normal Sleep vs. Inactive Timeout',
      camera: 'PIR sensors shut lights off when a person sleeps still; cameras fail completely in the dark.',
      sentinel: '60GHz mmWave detects 0.2mm chest cage breathing cadence. Sleep never triggers a false timeout.',
    },
    {
      capability: 'Data Breach & Cyber Attack Risk',
      camera: 'Hacked video feeds expose intimate visual footage of occupants on the public dark web.',
      sentinel: 'Zero video feeds exist. Telemetry consists solely of numeric coordinates and gas ppm vectors.',
    },
    {
      capability: 'Bandwidth & Storage Overhead',
      camera: 'Gigabytes of video streams requiring expensive NVR servers and cloud upload pipelines.',
      sentinel: '40-byte MQTT packets per update. Runs effortlessly on low-power ESP32 edge microcontrollers.',
    },
  ];

  return (
    <section id="privacy" className="py-24 relative bg-[#02040a] border-b border-cyan-500/15 overflow-hidden">
      {/* Background ambient cyan glow */}
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-400 font-mono text-[11px] uppercase tracking-widest mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>The Privacy Paradigm</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight uppercase">
            Why Vision Cameras Fail <span className="gradient-text-cyan">Physical Automation</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-4 leading-relaxed font-light">
            True autonomous spaces cannot depend on invasive optical lenses. SENTINEL replaces vulnerable camera feeds with high-resolution millimeter-wave radar and acoustic energy.
          </p>
        </div>

        {/* Side-by-Side Comparison Matrix */}
        <div className="glass-card hud-bracket overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-cyan-500/20 bg-[#030814]/90 p-4 sm:p-6 text-sm font-bold text-white font-mono">
            <div className="md:col-span-4 uppercase tracking-wider text-xs text-slate-400">
              Operational Criteria
            </div>
            <div className="md:col-span-4 flex items-center gap-2 text-rose-400 uppercase tracking-wider text-xs mt-2 md:mt-0">
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Optical CCTV & Camera Feeds</span>
            </div>
            <div className="md:col-span-4 flex items-center gap-2 text-cyan-400 uppercase tracking-wider text-xs mt-2 md:mt-0">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>SENTINEL Non-Optical Radar</span>
            </div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-cyan-500/10">
            {comparisons.map((row) => (
              <div
                key={row.capability}
                className="grid grid-cols-1 md:grid-cols-12 p-4 sm:p-6 text-xs sm:text-sm hover:bg-cyan-950/20 transition-colors"
              >
                <div className="md:col-span-4 font-mono font-bold text-white flex items-center pr-4 mb-2 md:mb-0 min-w-0">
                  {row.capability}
                </div>
                <div className="md:col-span-4 text-slate-400 flex items-start gap-2.5 pr-4 mb-2 md:mb-0 leading-relaxed font-light min-w-0 break-words">
                  <XCircle className="w-4 h-4 text-rose-500/80 shrink-0 mt-0.5" />
                  <span className="min-w-0">{row.camera}</span>
                </div>
                <div className="md:col-span-4 text-cyan-300 font-mono flex items-start gap-2.5 leading-relaxed min-w-0 break-words">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span className="font-semibold text-cyan-200 min-w-0">{row.sentinel}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Compliance Bar */}
          <div className="p-6 bg-gradient-to-r from-[#030814] via-[#08152b] to-[#030814] border-t border-cyan-500/20 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                  Guaranteed Legal & HIPAA Compliance
                </h4>
                <p className="text-xs text-slate-400 mt-0.5 font-light">
                  Approved for installation in private patient suites, student bathrooms, and executive offices.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-3 py-1 rounded bg-[#030814] text-cyan-300 text-xs font-mono border border-cyan-500/30">
                GDPR Art. 9
              </span>
              <span className="px-3 py-1 rounded bg-[#030814] text-cyan-300 text-xs font-mono border border-cyan-500/30">
                HIPAA Safe
              </span>
              <span className="px-3 py-1 rounded bg-[#030814] text-cyan-300 text-xs font-mono border border-cyan-500/30">
                FERPA Compliant
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
