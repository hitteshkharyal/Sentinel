import React, { useState } from 'react';
import {
  Hotel,
  Stethoscope,
  GraduationCap,
  Bus,
  Building,
  ShoppingBag,
  Factory,
  Warehouse,
  CheckCircle2,
  Zap,
  Shield,
  ArrowRight,
} from 'lucide-react';

export const IndustryShowcase: React.FC = () => {
  const [selectedIndustry, setSelectedIndustry] = useState<string>('transport');

  const industries = [
    {
      id: 'transport',
      name: 'School Transport',
      code: 'SEC_TRANS_01',
      icon: <Bus className="w-4 h-4" />,
      tagline: 'Zero Children Left Behind in Parked Vehicles',
      challenge:
        'Tragic heatstroke incidents occur when sleeping students are accidentally left inside buses after drivers park and depart.',
      sensors: ['Ceiling mmWave 60GHz Vital Radar', 'Ignition Sense Circuit', 'Door Reed Switch Relay'],
      decision:
        'When ignition switches OFF and bus doors close, the 60GHz mmWave radar executes a 180-second full-cabin sweep for micro-breathing cadence (12-25 bpm).',
      actuation:
        'If presence detected: immediately triggers the vehicle horn beacon, flashes hazard strobes, and dispatches Level 2 telemetry to driver and district depot.',
      privacyAdvantage:
        '100% compliant with student privacy laws. Zero optical recordings of children are captured or transmitted.',
      stat: '100% ELIMINATION',
      statLabel: 'of post-trip child abandonment risk',
    },
    {
      id: 'hospitals',
      name: 'Hospitals & Care',
      code: 'SEC_MED_02',
      icon: <Stethoscope className="w-4 h-4" />,
      tagline: 'Private Patient Fall Detection in Bathrooms',
      challenge:
        'Over 70% of hospital falls happen in private bathrooms or showers where cameras cannot be placed due to patient dignity laws.',
      sensors: ['Ceiling 60GHz Fall Radar', 'Acoustic SPL Sensor', 'Door Latch Relay'],
      decision:
        'Distinguishes standing/sitting postures from sudden vertical floor impacts. Flags stationary immobility lasting >60 seconds.',
      actuation:
        'Unlocks bathroom magnetic emergency latch, illuminates floor guidance path, and buzzes duty nurse pager console within 4 seconds.',
      privacyAdvantage:
        'Full HIPAA compliance. Zero video recording — operates safely in hot steam, total darkness, and private dressing zones.',
      stat: '4 SECONDS',
      statLabel: 'nurse dispatch latency on bathroom falls',
    },
    {
      id: 'schools',
      name: 'Schools & Campuses',
      code: 'SEC_EDU_03',
      icon: <GraduationCap className="w-4 h-4" />,
      tagline: 'Cognitive Air Quality & Classroom Automation',
      challenge:
        'High CO₂ levels above 1,200 ppm in classrooms cause drowsiness, headaches, and a 15% reduction in cognitive test scores.',
      sensors: ['Sensirion SCD40 Photoacoustic CO₂', 'Room PIR Sensor', 'Ambient Lux Array'],
      decision:
        'Continuous NDIR monitoring correlates student count with fresh air ventilation requirements in real time.',
      actuation:
        'Modulates HVAC motorized fresh-air dampers to 100% intake when CO₂ crosses 1,000 ppm. Auto-switches lighting off when empty.',
      privacyAdvantage:
        'Protects student minors. No camera facial analytics — occupancy determined purely by RF and carbon dioxide signatures.',
      stat: '980 PPM',
      statLabel: 'maximum maintained classroom CO₂ level',
    },
    {
      id: 'hotels',
      name: 'Hotels & Resorts',
      code: 'SEC_HOSP_04',
      icon: <Hotel className="w-4 h-4" />,
      tagline: 'Frictionless Guest Comfort & Eco-Setback',
      challenge:
        'Traditional keycard slots fail when guests leave cards in place. HVAC runs at maximum blast in empty guest rooms, wasting thousands.',
      sensors: ['60GHz Micro-movement Radar', 'Entry Contact Switch', 'Thermostat Modbus Relay'],
      decision:
        'Detects genuine guest presence (even while sleeping soundly) without disturbing guests with false occupancy timeouts.',
      actuation:
        'When guest departs for >20 mins, thermostat shifts to eco-setback (+2°C in summer, -2°C in winter) and lighting shuts off.',
      privacyAdvantage:
        'Absolute guest confidentiality. Zero cameras inside hotel rooms; eliminates keycard bypass hacks completely.',
      stat: '34% CUT',
      statLabel: 'in unoccupied guest room HVAC draw',
    },
    {
      id: 'offices',
      name: 'Corporate Offices',
      code: 'SEC_CORP_05',
      icon: <Building className="w-4 h-4" />,
      tagline: 'Dynamic Hot-Desking & Demand Ventilation',
      challenge:
        'Hybrid work creates empty floors being heated and cooled for ghost occupants, driving up commercial lease utility overhead.',
      sensors: ['Desk-Level mmWave Radar', 'Zone CO₂ NDIR', 'Acoustic Sound Floor'],
      decision:
        'Aggregates real-time seat density across open-plan floors without invading employee biometric privacy.',
      actuation:
        'Directs facilities management to consolidate occupied zones, automatically throttling HVAC in dormant wings.',
      privacyAdvantage:
        'No employee tracking or webcam monitoring. Respects worker privacy while delivering true digital twin insights.',
      stat: '28% SAVED',
      statLabel: 'in corporate facility operating expenses',
    },
    {
      id: 'malls',
      name: 'Shopping Malls',
      code: 'SEC_RETL_06',
      icon: <ShoppingBag className="w-4 h-4" />,
      tagline: 'Foot-Traffic Density & Egress Safety',
      challenge:
        'Sudden atrium overcrowding strains air quality and creates exit bottleneck hazards during peak holiday hours.',
      sensors: ['Multi-Zone Spatial Radar', 'CO₂ / TVOC Arrays', 'Emergency Exit Sensors'],
      decision:
        'Measures velocity vectors and spatial density thresholds near escalator exits and food courts.',
      actuation:
        'Scales central chiller intake dampers and alerts security team to relieve corridor congestion before bottlenecks occur.',
      privacyAdvantage:
        'Complies fully with consumer GDPR Article 9. No facial recognition or demographic profiling.',
      stat: '<50 MS',
      statLabel: 'crowd density surge response time',
    },
    {
      id: 'factories',
      name: 'Industrial Plants',
      code: 'SEC_IND_07',
      icon: <Factory className="w-4 h-4" />,
      tagline: 'Thermal Hazard Perimeter & Lone Worker Safety',
      challenge:
        'Workers entering high-temperature machinery perimeters or suffering heat exhaustion in isolated maintenance cells.',
      sensors: ['Thermal Array Sensor', 'Doppler Speed Radar', 'Vibration Monitor'],
      decision:
        'Monitors safety boundary lines and detects motionless operators in hazardous acoustic machinery zones.',
      actuation:
        'Instantly cuts hazardous power feeds via dry-contact interlocks and sounds emergency strobe alarms.',
      privacyAdvantage:
        'Ruggedized non-optical sensing functions in dense steam, smoke, oil mist, and dusty environments where lenses fail.',
      stat: '0 TRIPS',
      statLabel: 'false alarm rate in harsh steam environments',
    },
    {
      id: 'warehouses',
      name: 'Cold-Storage Logistics',
      code: 'SEC_LOG_08',
      icon: <Warehouse className="w-4 h-4" />,
      tagline: 'Freezer Door Drift & Forklift Motion Paths',
      challenge:
        'Commercial freezer doors left ajar cause millions in spoiled pharmaceuticals and food inventory alongside frost damage.',
      sensors: ['Sub-Zero Contact Switch', 'Thermal Gradient Array', 'Pathway Radar'],
      decision:
        'Tracks dock door open durations beyond 180 seconds and detects forklift movement along staging aisles.',
      actuation:
        'Illuminates high-bay LED pathways as forklifts approach; sounds dock alarm if walk-in freezer door remains unlatched.',
      privacyAdvantage:
        'Zero optical lens fogging in -25°C environments; ultra-reliable radar RF penetration.',
      stat: '$140K SAVED',
      statLabel: 'average inventory loss avoided per distribution center',
    },
  ];

  const current = industries.find((i) => i.id === selectedIndustry) ?? industries[0]!;

  return (
    <section id="industries" className="py-24 relative bg-[#02040a] border-y border-cyan-500/15 overflow-hidden">
      {/* Background cyber radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-400 font-mono text-[11px] uppercase tracking-widest mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>Multi-Sector Autonomous Governance</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight uppercase">
            Tailored Automation Across <span className="gradient-text-cyan">8 Sectors</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-4 leading-relaxed font-light">
            Every physical industry has unique privacy boundaries, life-safety obligations, and HVAC dynamics. SENTINEL adapts its autonomous policy engine without mounting a single optical camera.
          </p>
        </div>

        {/* Industry Pill Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 justify-start lg:justify-center scrollbar-none">
          {industries.map((ind) => (
            <button
              key={ind.id}
              onClick={() => setSelectedIndustry(ind.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-xs font-mono font-semibold transition-all whitespace-nowrap select-none border ${
                selectedIndustry === ind.id
                  ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.4)] font-bold scale-[1.02]'
                  : 'bg-[#060e1d]/80 text-slate-400 border-cyan-500/15 hover:border-cyan-500/40 hover:text-cyan-300 hover:bg-[#09152b]'
              }`}
            >
              <span className={selectedIndustry === ind.id ? 'text-black' : 'text-cyan-400'}>
                {ind.icon}
              </span>
              <span>{ind.name}</span>
            </button>
          ))}
        </div>

        {/* Active Industry Deep-Dive Card */}
        <div className="glass-card hud-bracket p-6 sm:p-10 lg:p-12 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Solution & Breakdown */}
            <div className="lg:col-span-8 space-y-6">
              <div>
                <div className="flex items-center gap-3 text-cyan-400 font-mono text-xs uppercase tracking-wider mb-2">
                  <span className="px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/30 text-[10px]">
                    {current.code}
                  </span>
                  <span>{'// TARGET USE CASE'}</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {current.tagline}
                </h3>
                <p className="text-sm sm:text-base text-slate-400 mt-2 leading-relaxed font-light">
                  {current.challenge}
                </p>
              </div>

              {/* 2 Step Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-[#030814]/80 border border-cyan-500/20 backdrop-blur-md">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
                      Sensors Ingested
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">INPUT</span>
                  </div>
                  <ul className="space-y-2 text-xs font-mono text-slate-300">
                    {current.sensors.map((s) => (
                      <li key={s} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 backdrop-blur-md">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">
                      Autonomous Actuation
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400/70">ACTUATE</span>
                  </div>
                  <p className="text-xs text-slate-300 font-mono leading-relaxed">
                    {current.actuation}
                  </p>
                </div>
              </div>

              {/* Privacy Guarantee Box */}
              <div className="p-4 rounded-xl bg-[#040e21]/70 border border-cyan-500/25 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
                    Privacy-Preserving Telemetry Guarantee
                  </h5>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed font-light">
                    {current.privacyAdvantage}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Key Metric & CTA */}
            <div className="lg:col-span-4 flex flex-col justify-between h-full p-6 sm:p-8 rounded-xl bg-gradient-to-b from-[#09152b] to-[#030814] border border-cyan-500/30 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-400 font-semibold">
                    Field Telemetry Metric
                  </span>
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                </div>
                <div className="text-3xl sm:text-4xl font-mono font-black text-cyan-300 tracking-tight">
                  {current.stat}
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed font-light">
                  {current.statLabel}
                </p>
              </div>

              <div className="pt-6 border-t border-cyan-500/20 mt-8 space-y-4">
                <div className="text-xs text-slate-300 flex items-center gap-2 font-mono">
                  <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Hardware Profile: READY</span>
                </div>
                <a
                  href="/dashboard"
                  className="btn-cyan-glow btn-chamfer w-full py-3 px-4 font-mono font-bold text-xs uppercase flex items-center justify-between text-black"
                >
                  <span>Deploy {current.name} Policy</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
