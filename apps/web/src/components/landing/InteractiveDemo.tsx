import React, { useState } from 'react';
import { Play, CheckCircle2, Activity, Terminal } from 'lucide-react';

export const InteractiveDemo: React.FC = () => {
  const [activeScenario, setActiveScenario] = useState<'bus' | 'fall' | 'co2' | 'hotel'>('bus');
  const [running, setRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const scenarios = {
    bus: {
      title: 'School Bus #12: Child Entrapment Prevention',
      icon: '🚌',
      subtitle: 'Post-Trip Ignition Cutoff & Vital Radar Cabin Scan',
      steps: [
        {
          label: 'SENSE',
          text: 'Ignition turns OFF. Doors shut. Ceiling 60GHz mmWave radar initiates a 180s cabin frequency sweep.',
          payload: 'IGNITION_STATE: OFF · SWEEP_HZ: 60.25 GHz · DOPPLER_RES: 0.05 m/s · SAMPLES: 2048',
        },
        {
          label: 'UNDERSTAND',
          text: 'Micro-movement detected in Seat Row 6. Respiration waveform verified at 19 breaths/min. Human presence confirmed.',
          payload: 'TARGET: 1 HUMAN · CADENCE: 19 BPM · POSTURE: SLEEPING_PRONE · CONFIDENCE: 99.8%',
        },
        {
          label: 'DECIDE',
          text: 'Autonomous Life-Safety rule triggered: Vehicle marked as UNCLEARED with trapped occupant.',
          payload: 'RULE_TRIGGERED: RULE_BUS_OCCUPIED_POST_TRIP · URGENCY: CRITICAL_IMMEDIATE',
        },
        {
          label: 'ACT',
          text: 'Vehicle horn strobe initiates acoustic chirp; dispatch telemetry sent to central depot.',
          payload: 'ACTUATE: ONBOARD_HORN_CHIRP_PULSE · STATUS: ACTIVE · LATENCY: 22ms',
        },
        {
          label: 'ESCALATE',
          text: 'Escalation Tier 2 dispatched to Driver Marcus Hall & Transportation Dispatcher with 3-minute SLA.',
          payload: 'DISPATCH_SMS: SENT · APP_NOTIFICATION: BROADCAST · SLA_TIMER: 180s',
        },
      ],
    },
    fall: {
      title: 'Room 204: Private Bathroom Fall Assistance',
      icon: '🏥',
      subtitle: 'Steam-Proof Non-Optical Fall & Immobility Detection',
      steps: [
        {
          label: 'SENSE',
          text: 'Ceiling mmWave radar detects sudden vertical downward velocity vector (-1.9 m/s). Acoustic sensor logs 78 dBA spike.',
          payload: 'DOPPLER_VECTOR: -1.9 m/s [Z_AXIS] · SPL_DECIBEL: 78.4 dBA [PEAK] · DURATION: 0.3s',
        },
        {
          label: 'UNDERSTAND',
          text: 'Floor plane proximity confirmed. Occupant remains in stationary horizontal posture for 60 seconds.',
          payload: 'STATE: FLOOR_IMPACT_STATIONARY · ELEVATION: 0.1m · TIME_ON_FLOOR: 62s',
        },
        {
          label: 'DECIDE',
          text: 'Distress threshold exceeded. Patient is uninjured or incapacitated in private bathroom.',
          payload: 'RULE_EVAL: ASSISTANCE_INDICATION_CONFIRMED · FALSE_POSITIVE_PROB: 0.4%',
        },
        {
          label: 'ACT',
          text: 'Autonomous magnetic door latch disengages to allow entry; floor nightlights illuminate.',
          payload: 'ACTUATE: MAG_DOOR_UNLOCK_RELAY · LIGHTING: NIGHTPATH_100% · CONFIRMED: OK',
        },
        {
          label: 'ESCALATE',
          text: 'Urgent chime sounds at duty nurse station console with Room 204 context and floor map coordinates.',
          payload: 'ALERT_TARGET: NURSE_STATION_WING_2 · AUDIO_CHIME: DUAL_PULSE · ACK_WAIT: 45s',
        },
      ],
    },
    co2: {
      title: 'Classroom 8A: Cognitive Air Quality Regulation',
      icon: '🏫',
      subtitle: 'Photoacoustic NDIR Demand-Controlled Ventilation',
      steps: [
        {
          label: 'SENSE',
          text: 'Sensirion SCD40 sensor measures indoor CO₂ rising past 1,200 ppm, reaching 1,480 ppm during laboratory class.',
          payload: 'GAS_TYPE: CO2 · CONCENTRATION: 1480 PPM · TEMP: 22.8C · HUMIDITY: 46% RH',
        },
        {
          label: 'UNDERSTAND',
          text: 'Cross-referenced with room schedule and RF presence: 32 students actively occupying room.',
          payload: 'ROOM_STATE: OCCUPIED · STUDENT_DENSITY: 32 OCCUPANTS · AIR_QUALITY_INDEX: POOR',
        },
        {
          label: 'DECIDE',
          text: 'Air quality degradation rule evaluated: fresh air ventilation required to preserve cognitive alertness.',
          payload: 'SETPOINT_TARGET: < 1000 PPM · REQUIRED_CFM: +450 CFM FRESH_AIR',
        },
        {
          label: 'ACT',
          text: 'BACnet command dispatched to Variable Air Volume (VAV) damper: open fresh air intake to 100%.',
          payload: 'BACNET_COMMAND: WRITE_PROP (VAV_DAMPER_8A, POS_100) · ACK_RECEIVED: TRUE',
        },
        {
          label: 'ESCALATE',
          text: 'Autonomous action successful. No human operator alerted. CO₂ glides smoothly down to 850 ppm.',
          payload: 'RESOLUTION: AUTONOMOUS_STABILIZED · HUMAN_ESCALATION: UNNECESSARY (0 ALERTS)',
        },
      ],
    },
    hotel: {
      title: 'Suite 301: Autonomous Eco-Setback Energy Savings',
      icon: '🏨',
      subtitle: 'Keycard-Free Micro-Motion Occupancy Verification',
      steps: [
        {
          label: 'SENSE',
          text: 'Door magnetic contact reports departure. mmWave radar scans room for 20 minutes with zero occupant returns.',
          payload: 'DOOR_EVENT: OPEN_CLOSE · TIME_ELAPSED: 20 MINS · DOPPLER_REFLECTIONS: 0',
        },
        {
          label: 'UNDERSTAND',
          text: 'Confirmed empty. Deep breathing cadence filter rules out sleeping occupants.',
          payload: 'STATE: VACANT_VERIFIED · BREATHING_PULSE: NONE · ACCURACY: 99.9%',
        },
        {
          label: 'DECIDE',
          text: 'Hospitality ESG Policy: transition room from Comfort Mode to Eco-Setback Mode.',
          payload: 'POLICY: ESG_ENERGY_SAVER · SETBACK_TEMP: +2.5C DELTA · LIGHT_OFF: ENABLED',
        },
        {
          label: 'ACT',
          text: 'Thermostat modulated to 24°C; non-essential ambient lighting zones powered off.',
          payload: 'RELAY_ACTUATE: THERMOSTAT_SET_24C · DALI_LIGHTING_OFF · CURRENT_DRAW: -62%',
        },
        {
          label: 'ESCALATE',
          text: 'Autonomous efficiency milestone logged. Digital twin records 1.4 kWh energy saved per departure.',
          payload: 'ENERGY_SAVED: 1.42 KWH · ESG_CREDIT_LOGGED · STATUS: COMPLETE',
        },
      ],
    },
  };

  const current = scenarios[activeScenario];

  const handleStartRun = () => {
    setRunning(true);
    setStepIndex(0);

    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      if (step < 5) {
        setStepIndex(step);
      } else {
        clearInterval(interval);
        setRunning(false);
      }
    }, 1400);
  };

  return (
    <section id="simulation" className="py-24 relative bg-[#02040a] border-b border-cyan-500/15 overflow-hidden">
      {/* Background cyber radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-cyan-500/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-400 font-mono text-[11px] uppercase tracking-widest mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>Interactive Autonomous Testbed</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight uppercase">
            Experience The <span className="gradient-text-cyan">Autonomous Loop Live</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-4 leading-relaxed font-light">
            Select a physical event and watch the pipeline sense the signal, evaluate the policy, actuate physical hardware, and determine whether escalation is warranted.
          </p>
        </div>

        {/* Scenario Switcher Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto mb-10">
          {(
            [
              { id: 'bus', label: 'School Bus #12', icon: '🚌' },
              { id: 'fall', label: 'Hospital Fall', icon: '🏥' },
              { id: 'co2', label: 'Classroom CO₂', icon: '🏫' },
              { id: 'hotel', label: 'Hotel Setback', icon: '🏨' },
            ] as const
          ).map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setActiveScenario(s.id);
                setStepIndex(0);
                setRunning(false);
              }}
              className={`p-3.5 rounded-lg text-xs font-mono font-bold border transition-all flex items-center justify-center gap-2 select-none ${
                activeScenario === s.id
                  ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.4)]'
                  : 'bg-[#060e1d]/80 text-slate-400 border-cyan-500/15 hover:border-cyan-500/40 hover:text-cyan-300'
              }`}
            >
              <span className="text-base">{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Simulation Control Card */}
        <div className="glass-card hud-bracket p-6 sm:p-10 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-cyan-500/20">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{current.icon}</span>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
                  {current.title}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-mono">{current.subtitle}</p>
            </div>

            <button
              onClick={handleStartRun}
              disabled={running}
              className="btn-cyan-glow btn-chamfer px-6 py-2.5 font-mono font-bold text-xs uppercase flex items-center gap-2 text-black cursor-pointer disabled:opacity-50"
            >
              {running ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>Executing Loop...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-black" />
                  <span>Execute Simulation</span>
                </>
              )}
            </button>
          </div>

          {/* 5-Step Pipeline Progress Flow */}
          <div className="my-10 grid grid-cols-5 gap-2 sm:gap-4 text-center relative">
            {/* Background connection bar */}
            <div className="absolute top-4 sm:top-5 left-10 right-10 h-[2px] bg-cyan-500/20 z-0" />

            {current.steps.map((st, i) => {
              const isPastOrCurrent = i <= stepIndex;
              const isCurrent = i === stepIndex;

              return (
                <div key={st.label} className="relative z-10">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 mx-auto rounded-lg font-mono font-bold text-xs sm:text-sm transition-all flex items-center justify-center border ${
                      isCurrent && running
                        ? 'bg-cyan-500 text-black border-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.8)] scale-110 animate-pulse'
                        : isPastOrCurrent
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                        : 'bg-[#030814] text-slate-600 border-cyan-500/15'
                    }`}
                  >
                    {isPastOrCurrent && !isCurrent ? (
                      <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span
                    className={`block mt-2.5 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider ${
                      isPastOrCurrent ? 'text-cyan-400' : 'text-slate-600'
                    }`}
                  >
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Active Step Real-time Payload Display */}
          {(() => {
            const currentStep = current.steps[stepIndex] ?? current.steps[0]!;
            return (
              <div className="rounded-xl bg-[#030712] border border-cyan-500/25 p-5 sm:p-6 relative">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-cyan-500/15 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <span className="text-cyan-300 font-bold uppercase">
                      ACTIVE STATE: STEP {stepIndex + 1} OF 5 ({currentStep.label})
                    </span>
                  </div>
                  <span className="text-[11px] text-cyan-400/80">
                    MQTT TOPIC: <code className="text-cyan-300">sentinel/{activeScenario}/event</code>
                  </span>
                </div>

                <p className="text-sm sm:text-base text-slate-200 font-medium leading-relaxed font-sans">
                  {currentStep.text}
                </p>

                <div className="mt-4 p-3 rounded-lg bg-[#010307] border border-cyan-500/20 font-mono text-xs text-cyan-300 overflow-x-auto">
                  <span className="text-slate-500 text-[10px] block mb-1 uppercase tracking-widest">
                    Decoded ESP32 Edge Ingestion Record:
                  </span>
                  <code>{currentStep.payload}</code>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </section>
  );
};
