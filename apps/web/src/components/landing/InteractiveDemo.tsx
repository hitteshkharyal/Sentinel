import React, { useState } from 'react';
import { Play, CheckCircle2, Activity } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

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
          payload: 'IGNITION_STATE: OFF · SWEEP_HZ: 60.25 GHz · DOPPLER_RESOLUTION: 0.05 m/s',
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
    <section id="simulation" className="py-20 lg:py-28 bg-slate-900 text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <Badge variant="primary" size="md" className="mb-3 !bg-sentinel-500/20 !text-sentinel-300 !border-sentinel-500/40">
            Interactive Testbed
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Experience the Autonomous Loop Live
          </h2>
          <p className="text-base sm:text-lg text-slate-400 mt-4 leading-relaxed">
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
              className={`p-3.5 rounded-2xl text-xs sm:text-sm font-bold border transition-all flex items-center justify-center gap-2 ${
                activeScenario === s.id
                  ? 'bg-sentinel-600 text-white border-sentinel-400 shadow-lg shadow-sentinel-600/30'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
              }`}
            >
              <span className="text-lg">{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Simulation Control Card */}
        <div className="rounded-3xl bg-slate-950 border border-slate-800 p-6 sm:p-10 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{current.icon}</span>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {current.title}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">{current.subtitle}</p>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={handleStartRun}
              disabled={running}
              leftIcon={running ? <Activity className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              className="text-xs shadow-md shadow-sentinel-600/30"
            >
              {running ? 'Executing Pipeline...' : 'Run Simulation'}
            </Button>
          </div>

          {/* 5-Step Pipeline Progress Flow */}
          <div className="my-8 grid grid-cols-5 gap-2 sm:gap-4 text-center">
            {current.steps.map((st, i) => {
              const isPastOrCurrent = i <= stepIndex;
              const isCurrent = i === stepIndex;

              return (
                <div key={st.label} className="relative">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 mx-auto rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all ${
                      isCurrent && running
                        ? 'bg-sentinel-500 text-white ring-4 ring-sentinel-500/30 animate-pulse'
                        : isPastOrCurrent
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isPastOrCurrent && !isCurrent ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span
                    className={`block mt-2 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider ${
                      isPastOrCurrent ? 'text-white' : 'text-slate-500'
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
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-6 animate-fade-in">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant="primary" size="sm" className="!bg-sentinel-500/20 !text-sentinel-300">
                    Active State: Step {stepIndex + 1} of 5 ({currentStep.label})
                  </Badge>
                  <span className="text-[11px] font-mono text-emerald-400">
                    MQTT Topic: sentinel/{activeScenario}/event
                  </span>
                </div>

                <p className="text-sm sm:text-base text-slate-200 font-medium leading-relaxed mt-2">
                  {currentStep.text}
                </p>

                <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800/90 font-mono text-xs text-emerald-400 overflow-x-auto">
                  <span className="text-slate-500 text-[10px] block mb-1">Decoded ESP32 Edge Ingestion Record:</span>
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
