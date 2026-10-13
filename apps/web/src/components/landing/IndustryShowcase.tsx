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
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export const IndustryShowcase: React.FC = () => {
  const [selectedIndustry, setSelectedIndustry] = useState<string>('transport');

  const industries = [
    {
      id: 'transport',
      name: 'School Transport',
      icon: <Bus className="w-5 h-5" />,
      tagline: 'Zero Children Left Behind in Parked Vehicles',
      challenge:
        'Tragic heatstroke incidents occur when sleeping students are accidentally left inside buses after drivers park and depart.',
      sensors: ['Ceiling mmWave 60GHz Vital Radar', 'Ignition Sense', 'Door Reed Switch'],
      decision:
        'When ignition is switched OFF and bus doors close, the 60GHz mmWave radar executes a 180-second full-cabin sweep for micro-breathing cadence (12-25 bpm).',
      actuation:
        'If presence is detected: immediately triggers the vehicle horn beacon, flashes hazard strobes, and dispatches Level 2 alerts to the driver and district depot.',
      privacyAdvantage:
        '100% compliant with student privacy laws. No optical recordings of children are captured or transmitted.',
      stat: '100% Elimination',
      statLabel: 'of post-trip child abandonment risk',
    },
    {
      id: 'hospitals',
      name: 'Hospitals & Care',
      icon: <Stethoscope className="w-5 h-5" />,
      tagline: 'Private Patient Fall Detection in Bathrooms',
      challenge:
        'Over 70% of hospital falls happen in private bathrooms or showers where cameras cannot be placed due to patient dignity laws.',
      sensors: ['Ceiling 60GHz Fall Radar', 'Acoustic SPL Sensor', 'Door Latch Relay'],
      decision:
        'Distinguishes standing/sitting postures from sudden vertical floor impacts. Flags stationary immobility lasting >60 seconds.',
      actuation:
        'Unlocks bathroom magnetic emergency latch, illuminates floor guidance path, and buzzes duty nurse pager station within 4 seconds.',
      privacyAdvantage:
        'Full HIPAA compliance. Zero video recording — operates safely in hot steam, total darkness, and private dressing zones.',
      stat: '4 Seconds',
      statLabel: 'nurse dispatch latency on bathroom falls',
    },
    {
      id: 'schools',
      name: 'Schools & Campuses',
      icon: <GraduationCap className="w-5 h-5" />,
      tagline: 'Cognitive Air Quality & Classroom Automation',
      challenge:
        'High CO₂ levels above 1,200 ppm in classrooms cause drowsiness, headaches, and a 15% reduction in cognitive test scores.',
      sensors: ['Sensirion SCD40 Photoacoustic CO₂', 'Room PIR', 'Ambient Lux'],
      decision:
        'Continuous NDIR monitoring correlates student count with fresh air ventilation requirements in real time.',
      actuation:
        'Modulates HVAC motorized fresh-air dampers to 100% intake when CO₂ crosses 1,000 ppm. Auto-switches lighting off when empty.',
      privacyAdvantage:
        'Protects student minors. No camera facial analytics — occupancy determined purely by RF and carbon dioxide signatures.',
      stat: '980 ppm',
      statLabel: 'maximum maintained classroom CO₂ level',
    },
    {
      id: 'hotels',
      name: 'Hotels & Resorts',
      icon: <Hotel className="w-5 h-5" />,
      tagline: 'Frictionless Guest Comfort & Eco-Setback',
      challenge:
        'Traditional keycard slots fail when guests leave cards in place. HVAC runs at maximum blast in empty guest rooms, wasting thousands.',
      sensors: ['60GHz Micro-movement Radar', 'Entry Contact', 'Thermostat Relay'],
      decision:
        'Detects genuine guest presence (even while sleeping soundly) without disturbing guests with false occupancy timeouts.',
      actuation:
        'When guest departs for >20 mins, thermostat shifts to eco-setback (+2°C in summer, -2°C in winter) and lights switch off.',
      privacyAdvantage:
        'Absolute guest confidentiality. Zero cameras inside hotel rooms; eliminates keycard bypass hacks completely.',
      stat: '34% Energy Cut',
      statLabel: 'in unoccupied guest room HVAC draw',
    },
    {
      id: 'offices',
      name: 'Corporate Offices',
      icon: <Building className="w-5 h-5" />,
      tagline: 'Dynamic Hot-Desking & Demand Ventilation',
      challenge:
        'Hybrid work creates empty floors being heated and cooled for ghost occupants, driving up commercial lease utility overhead.',
      sensors: ['Desk-Level mmWave Radar', 'Zone CO₂', 'Acoustic Sound Floor'],
      decision:
        'Aggregates real-time seat density across open-plan floors without invading employee biometric privacy.',
      actuation:
        'Directs facilities management to consolidate occupied zones, automatically throttling HVAC in dormant wings.',
      privacyAdvantage:
        'No employee tracking or webcam monitoring. Respects worker privacy while delivering true digital twin insights.',
      stat: '28% Savings',
      statLabel: 'in corporate facility operating expenses',
    },
    {
      id: 'malls',
      name: 'Shopping Malls',
      icon: <ShoppingBag className="w-5 h-5" />,
      tagline: 'Foot-Traffic Density & Egress Safety',
      challenge:
        'Sudden atrium overcrowding strains air quality and creates exit bottleneck hazards during peak holiday hours.',
      sensors: ['Multi-Zone Spatial Radar', 'CO₂ / TVOC Arrays', 'Emergency Exits'],
      decision:
        'Measures velocity vectors and spatial density thresholds near escalator exits and food courts.',
      actuation:
        'Scales central chiller intake dampers and alerts security team to relieve corridor congestion before bottlenecks occur.',
      privacyAdvantage:
        'Complies fully with consumer GDPR Article 9. No facial recognition or demographic profiling.',
      stat: '<50ms',
      statLabel: 'crowd density surge response time',
    },
    {
      id: 'factories',
      name: 'Industrial Plants',
      icon: <Factory className="w-5 h-5" />,
      tagline: 'Thermal Hazard Perimeter & Lone Worker Safety',
      challenge:
        'Workers entering high-temperature machinery perimeters or suffering heat exhaustion in isolated maintenance cells.',
      sensors: ['Thermal Array Sensor', 'Doppler Speed Radar', 'Vibration Mon.'],
      decision:
        'Monitors safety boundary lines and detects motionless operators in hazardous acoustic machinery zones.',
      actuation:
        'Instantly cuts hazardous power feeds via dry-contact interlocks and sounds emergency strobe alarms.',
      privacyAdvantage:
        'Ruggedized non-optical sensing functions in dense steam, smoke, oil mist, and dusty environments where lenses fail.',
      stat: '0 False Trips',
      statLabel: 'in harsh industrial steam environments',
    },
    {
      id: 'warehouses',
      name: 'Cold-Storage Logistics',
      icon: <Warehouse className="w-5 h-5" />,
      tagline: 'Freezer Door Drift & Forklift Motion Paths',
      challenge:
        'Commercial freezer doors left ajar cause millions in spoiled pharmaceuticals and food inventory alongside frost damage.',
      sensors: ['Sub-Zero Contact Switch', 'Thermal Gradient', 'Pathway Radar'],
      decision:
        'Tracks dock door open durations beyond 180 seconds and detects forklift movement along staging aisles.',
      actuation:
        'Illuminates high-bay LED pathways as forklifts approach; sounds dock alarm if walk-in freezer door remains unlatched.',
      privacyAdvantage:
        'Zero optical lens fogging in -25°C environments; ultra-reliable radar RF penetration.',
      stat: '$140k Saved',
      statLabel: 'average inventory loss avoided per distribution center',
    },
  ];

  const current = industries.find((i) => i.id === selectedIndustry) ?? industries[0]!;

  return (
    <section id="industries" className="py-20 lg:py-28 bg-slate-50/75 border-y border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <Badge variant="primary" size="md" className="mb-3">
            Multi-Industry Autonomous Intelligence
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Tailored Automation Across 8 Sectors
          </h2>
          <p className="text-base sm:text-lg text-slate-600 mt-4 leading-relaxed">
            Every physical industry has unique privacy boundaries, life-safety obligations, and HVAC dynamics. SENTINEL adapts its autonomous policy engine to each environment.
          </p>
        </div>

        {/* Industry Pill Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 justify-start lg:justify-center scrollbar-none">
          {industries.map((ind) => (
            <button
              key={ind.id}
              onClick={() => setSelectedIndustry(ind.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap select-none ${
                selectedIndustry === ind.id
                  ? 'bg-sentinel-600 text-white shadow-md shadow-sentinel-600/25 scale-[1.02]'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <span className={selectedIndustry === ind.id ? 'text-white' : 'text-slate-400'}>
                {ind.icon}
              </span>
              <span>{ind.name}</span>
            </button>
          ))}
        </div>

        {/* Active Industry Deep-Dive Card */}
        <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xl overflow-hidden animate-fade-in">
          <div className="p-6 sm:p-10 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Solution & Breakdown */}
              <div className="lg:col-span-8 space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-sentinel-600 font-bold text-xs uppercase tracking-wider mb-1">
                    <span>Target Use Case</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {current.tagline}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed">
                    {current.challenge}
                  </p>
                </div>

                {/* 3 Step Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                      Sensors Ingested
                    </span>
                    <ul className="space-y-1.5 text-xs font-medium text-slate-800">
                      {current.sensors.map((s) => (
                        <li key={s} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-sentinel-600 shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/70">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block mb-2">
                      Autonomous Actuation
                    </span>
                    <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                      {current.actuation}
                    </p>
                  </div>
                </div>

                {/* Privacy Guarantee Box */}
                <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/70 flex items-start gap-3">
                  <Shield className="w-5 h-5 text-sentinel-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-sentinel-950 uppercase tracking-wider">
                      Privacy-Preserving Architecture
                    </h5>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                      {current.privacyAdvantage}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Key Metric & CTA */}
              <div className="lg:col-span-4 flex flex-col justify-between h-full p-6 sm:p-8 rounded-2xl bg-slate-900 text-white shadow-md">
                <div>
                  <span className="text-xs uppercase font-mono tracking-wider text-emerald-400 font-semibold block mb-2">
                    Verified Field Metric
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    {current.stat}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {current.statLabel}
                  </p>
                </div>

                <div className="pt-8 border-t border-slate-800 mt-8 space-y-3">
                  <div className="text-xs text-slate-300 flex items-center gap-2 font-mono">
                    <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Hardware Profile Ready</span>
                  </div>
                  <Button
                    variant="primary"
                    className="w-full text-xs justify-between"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    <span>Deploy {current.name} Policy</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
