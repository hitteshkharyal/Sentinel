// ─────────────────────────────────────────────
// SENTINEL Web — Deployment Live Testing & Sign-Off Tab
// Guided 5-step hardware verification, live telemetry stream, and activation
// ─────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Play,
  ShieldCheck,
  Radio,
  Clock,
} from 'lucide-react';
import type { Deployment, HardwareTestScorecard } from '@sentinel/types';
import { useDeployment } from '../../../context/DeploymentContext';

interface LiveTestingTabProps {
  deployment: Deployment;
  onActivated?: () => void;
}

export const DeploymentLiveTestingTab: React.FC<LiveTestingTabProps> = ({
  deployment,
  onActivated,
}) => {
  const { startHardwareTest, fetchHardwareTestStatus, signOffHardwareTest } = useDeployment();
  const [scorecard, setScorecard] = useState<HardwareTestScorecard | null>(null);
  const [testing, setTesting] = useState(false);
  const [signOffNotes, setSignOffNotes] = useState('');
  const [signingOff, setSigningOff] = useState(false);

  useEffect(() => {
    let mounted = true;
    const pollStatus = () => {
      fetchHardwareTestStatus(deployment.id)
        .then((sc) => {
          if (mounted && sc) setScorecard(sc);
        })
        .catch(() => {});
    };

    pollStatus();
    // Poll every 3 seconds for real-time live telemetry stream
    const timer = setInterval(pollStatus, 3000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [deployment.id, fetchHardwareTestStatus]);

  const handleRunVerification = async (simulate = false) => {
    setTesting(true);
    try {
      const res = await startHardwareTest(deployment.id, simulate);
      setScorecard(res);
    } catch (err: unknown) {
      alert((err as Error).message || 'Verification test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleSignOff = async () => {
    if (!scorecard?.sessionId) {
      alert('Run hardware verification before signing off readiness.');
      return;
    }
    setSigningOff(true);
    try {
      await signOffHardwareTest(deployment.id, scorecard.sessionId, signOffNotes);
      if (onActivated) onActivated();
      alert('Deployment activated successfully!');
    } catch (err: unknown) {
      alert((err as Error).message || 'Sign-off failed');
    } finally {
      setSigningOff(false);
    }
  };

  const checks = scorecard?.checks || {
    deviceConnection: 'PENDING',
    mqttConnection: 'PENDING',
    sensorValidation: 'PENDING',
    telemetryReception: 'PENDING',
    eventDetection: 'PENDING',
    automationTrigger: 'PENDING',
    alertDelivery: 'PENDING',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-[#172033]">Live Hardware Testing & Readiness</h3>
          <p className="text-xs text-slate-500">
            Validate that your ESP32/ESP8266 is actively transmitting and reading sensor values
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleRunVerification(false)}
            disabled={testing}
            className="text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <Play className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Verifying Hardware...' : 'Run Live Diagnostic Check'}
          </button>
          <button
            onClick={() => handleRunVerification(true)}
            disabled={testing}
            className="text-xs font-medium border border-[#DCE3EC] bg-white text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-lg transition-colors"
            title="Simulate hardware data for pre-deployment testing"
          >
            Simulate Readings
          </button>
        </div>
      </div>

      {/* 5-Step Guided Verification Checklist */}
      <div className="bg-white border border-[#DCE3EC] rounded-xl p-6 shadow-sm">
        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-4">
          5-Point Deployment Verification
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="p-3 rounded-lg border border-[#DCE3EC] bg-[#F8FAFC]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-500">Step 1</span>
              {deployment.latestFirmwareVersion ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Clock className="w-4 h-4 text-amber-500" />
              )}
            </div>
            <p className="text-xs font-semibold text-[#172033]">Firmware Flashed</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {deployment.latestFirmwareVersion ? 'Build Ready' : 'Pending upload'}
            </p>
          </div>

          <div className="p-3 rounded-lg border border-[#DCE3EC] bg-[#F8FAFC]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-500">Step 2</span>
              {checks.deviceConnection === 'PASS' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Clock className="w-4 h-4 text-amber-500" />
              )}
            </div>
            <p className="text-xs font-semibold text-[#172033]">Node Connected</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {checks.deviceConnection === 'PASS' ? 'WiFi Online' : 'Awaiting ping'}
            </p>
          </div>

          <div className="p-3 rounded-lg border border-[#DCE3EC] bg-[#F8FAFC]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-500">Step 3</span>
              {checks.sensorValidation === 'PASS' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Clock className="w-4 h-4 text-amber-500" />
              )}
            </div>
            <p className="text-xs font-semibold text-[#172033]">Sensor Health</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {checks.sensorValidation === 'PASS' ? 'Sensors Validated' : 'Awaiting signals'}
            </p>
          </div>

          <div className="p-3 rounded-lg border border-[#DCE3EC] bg-[#F8FAFC]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-500">Step 4</span>
              {checks.telemetryReception === 'PASS' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Clock className="w-4 h-4 text-amber-500" />
              )}
            </div>
            <p className="text-xs font-semibold text-[#172033]">Data Ingestion</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {checks.telemetryReception === 'PASS' ? 'Streams Active' : 'Waiting stream'}
            </p>
          </div>

          <div className="p-3 rounded-lg border border-[#DCE3EC] bg-[#F8FAFC]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-500">Step 5</span>
              {deployment.isReadinessApproved ? (
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              ) : (
                <Clock className="w-4 h-4 text-amber-500" />
              )}
            </div>
            <p className="text-xs font-semibold text-[#172033]">Readiness Approved</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {deployment.isReadinessApproved ? 'Fully Active' : 'Sign-off pending'}
            </p>
          </div>
        </div>
      </div>

      {/* Live Sensor Readings Table */}
      <div className="bg-white border border-[#DCE3EC] rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-[#DCE3EC] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-semibold text-[#172033]">Live Sensor Telemetry Readings</h4>
          </div>
          {scorecard?.testedAt && (
            <span className="text-[11px] text-slate-500">
              Last Sampled: {new Date(scorecard.testedAt).toLocaleTimeString()}
            </span>
          )}
        </div>

        {scorecard?.sensorReadings && scorecard.sensorReadings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#DCE3EC] text-slate-500 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3 font-medium">Sensor Channel</th>
                  <th className="px-5 py-3 font-medium">Value</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE3EC]">
                {scorecard.sensorReadings.map((reading, idx) => {
                  let formattedValue = typeof reading.value === 'object'
                    ? JSON.stringify(reading.value)
                    : String(reading.value);

                  if (reading.sensorType === 'ULTRASONIC') {
                    const num = Number(reading.value);
                    if (num === -1 || num <= 0) {
                      formattedValue = 'Standby / Out of Range (>450cm)';
                    } else {
                      formattedValue = `${num} cm`;
                    }
                  } else if (reading.sensorType === 'PIR') {
                    if (typeof reading.value === 'boolean') {
                      formattedValue = reading.value ? 'Motion Detected (Occupied)' : 'Clear (No Motion)';
                    } else if (reading.value === 1 || reading.value === '1') {
                      formattedValue = 'Motion Detected (Occupied)';
                    } else if (reading.value === 0 || reading.value === '0') {
                      formattedValue = 'Clear (No Motion)';
                    }
                  } else if (reading.unit && reading.unit !== 'None' && reading.value !== 'N/A') {
                    formattedValue = `${formattedValue} ${reading.unit}`;
                  }

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-medium text-[#172033]">
                        {reading.sensorType}
                      </td>
                      <td className="px-5 py-3 font-mono text-[#2563EB] font-bold">
                        {formattedValue}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            reading.status === 'WORKING'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {reading.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-500 text-[11px]">
                        {reading.isSimulated ? (
                          <span className="text-amber-600 font-medium">Simulated Test</span>
                        ) : (
                          <span className="text-emerald-600 font-medium">Live Hardware</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500">
            No live data recorded yet. Click &quot;Run Live Diagnostic Check&quot; above once your device is plugged in and transmitting.
          </div>
        )}
      </div>

      {/* Final Sign-Off & Activation Card */}
      <div className="bg-white border border-[#DCE3EC] rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h4 className="text-sm font-semibold text-[#172033]">Installer Sign-Off & Activation</h4>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Once all checks pass, sign off to transition this site deployment into production monitoring mode.
        </p>

        <div className="space-y-3">
          <textarea
            value={signOffNotes}
            onChange={(e) => setSignOffNotes(e.target.value)}
            placeholder="Add optional notes (e.g., 'Device installed on ceiling mount in Room 302, WiFi RSSI -58 dBm, tested PIR and BME280 ok')."
            className="w-full text-xs p-3 border border-[#DCE3EC] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={2}
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Current state: <strong className="text-[#172033]">{deployment.status}</strong>
            </span>
            <button
              onClick={handleSignOff}
              disabled={signingOff || !scorecard}
              className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-6 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              {signingOff ? 'Activating Deployment...' : 'Sign Off & Activate Site'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
