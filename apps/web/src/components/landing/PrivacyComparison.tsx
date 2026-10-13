import React from 'react';
import { Lock, XCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '../ui/Badge';

export const PrivacyComparison: React.FC = () => {
  const comparisons = [
    {
      capability: 'Hospital Bathrooms & Showers',
      camera: 'Strictly prohibited by HIPAA & patient dignity laws. Blind spot for 70% of falls.',
      sentinel: '100% compliant. Detects falls in steam and total darkness without optical lenses.',
    },
    {
      capability: 'Hotel Guest Rooms & Suites',
      camera: 'Unacceptable violation of privacy; severe legal liability and guest backlash.',
      sentinel: 'Monitors micro-motion and energy setback without capturing facial or visual identity.',
    },
    {
      capability: 'Student Minors in Schools & Buses',
      camera: 'Facial recognition requires parental consent and faces intense regulatory scrutiny.',
      sentinel: 'Zero images captured. Pure physical RF Doppler verification of occupant presence.',
    },
    {
      capability: 'Normal Sleep vs. Inactive Timeout',
      camera: 'PIR sensors shut lights off when a person sleeps still; cameras fail in the dark.',
      sentinel: '60GHz mmWave detects 0.2mm chest cage breathing cadence. Sleep never triggers a false timeout.',
    },
    {
      capability: 'Data Breach & Cyber Attack Risk',
      camera: 'Hacked video feeds expose intimate visual footage of occupants on the dark web.',
      sentinel: 'Zero video feeds exist. Telemetry consists solely of numeric coordinates and gas ppm.',
    },
    {
      capability: 'Bandwidth & Storage Overhead',
      camera: 'Gigabytes of video streams requiring expensive NVR servers and cloud upload pipelines.',
      sentinel: '40-byte MQTT packets per update. Runs effortlessly on low-power ESP32 edge chips.',
    },
  ];

  return (
    <section id="privacy" className="py-20 lg:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="primary" size="md" className="mb-3">
            The Privacy Paradigm
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Why Vision Cameras Fail Physical Automation
          </h2>
          <p className="text-base sm:text-lg text-slate-600 mt-4 leading-relaxed">
            True autonomous spaces cannot depend on invasive optical lenses. SENTINEL replaces cameras with high-resolution millimeter-wave radar and acoustic energy.
          </p>
        </div>

        {/* Side-by-Side Comparison Matrix */}
        <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-slate-200/80 bg-slate-50/75 p-4 sm:p-6 text-sm font-bold text-slate-900">
            <div className="md:col-span-4 uppercase tracking-wider text-xs text-slate-500">
              Operational Criteria
            </div>
            <div className="md:col-span-4 flex items-center gap-2 text-rose-700 uppercase tracking-wider text-xs mt-2 md:mt-0">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Optical CCTV & Camera Feeds</span>
            </div>
            <div className="md:col-span-4 flex items-center gap-2 text-sentinel-700 uppercase tracking-wider text-xs mt-2 md:mt-0">
              <CheckCircle2 className="w-4 h-4 text-sentinel-600 shrink-0" />
              <span>SENTINEL Privacy Radar</span>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {comparisons.map((row) => (
              <div
                key={row.capability}
                className="grid grid-cols-1 md:grid-cols-12 p-4 sm:p-6 text-xs sm:text-sm hover:bg-slate-50/50 transition-colors"
              >
                <div className="md:col-span-4 font-bold text-slate-900 flex items-center pr-4 mb-2 md:mb-0">
                  {row.capability}
                </div>
                <div className="md:col-span-4 text-slate-500 flex items-start gap-2.5 pr-4 mb-2 md:mb-0">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{row.camera}</span>
                </div>
                <div className="md:col-span-4 text-slate-800 font-medium flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed text-sentinel-950 font-semibold">
                    {row.sentinel}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Compliance Bar */}
          <div className="p-6 bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sentinel-600 flex items-center justify-center text-white shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold">Guaranteed Legal & HIPAA Compliance</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Approved for installation in private patient suites, student bathrooms, and executive offices.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700">
                GDPR Art. 9
              </span>
              <span className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700">
                HIPAA Safe
              </span>
              <span className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700">
                FERPA Compliant
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
