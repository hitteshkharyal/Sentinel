// ─────────────────────────────────────────────
// SENTINEL Web — Hardware & Dashboard Testing Center
// ─────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import type { Deployment, HardwareTestScorecard } from '@sentinel/types';
import {
  CheckCircle2,
  XCircle,
  Clock,
  RotateCw,
  ShieldCheck,
  Radio,
  Activity,
} from 'lucide-react';
import { useDeployment } from '../../context/DeploymentContext';

interface HardwareTestDashboardProps {
  deployment: Deployment;
  onSignedOff?: () => void;
}

export const HardwareTestDashboard: React.FC<HardwareTestDashboardProps> = ({
  deployment,
  onSignedOff,
}) => {
  const { startHardwareTest, fetchHardwareTestStatus, signOffHardwareTest } = useDeployment();
  const [scorecard, setScorecard] = useState<HardwareTestScorecard | null>(null);
  const [simulate, setSimulate] = useState<boolean>(true);
  const [testing, setTesting] = useState<boolean>(false);
  const [signingOff, setSigningOff] = useState<boolean>(false);
  const [signOffNotes, setSignOffNotes] = useState<string>('');
  const [showSignOffModal, setShowSignOffModal] = useState<boolean>(false);

  useEffect(() => {
    fetchHardwareTestStatus(deployment.id).then((sc) => {
      if (sc) setScorecard(sc);
    });
  }, [deployment.id, fetchHardwareTestStatus]);

  const handleRunDiagnostics = async () => {
    setTesting(true);
    try {
      const res = await startHardwareTest(deployment.id, simulate);
      setScorecard(res);
    } finally {
      setTesting(false);
    }
  };

  const handleSignOff = async () => {
    if (!scorecard) return;
    setSigningOff(true);
    try {
      const res = await signOffHardwareTest(
        deployment.id,
        scorecard.sessionId,
        signOffNotes || 'Readiness sign-off completed by authorized installer.'
      );
      setScorecard(res);
      setShowSignOffModal(false);
      onSignedOff?.();
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

  const renderCheckIcon = (status: 'PASS' | 'FAIL' | 'PENDING') => {
    if (status === 'PASS') {
      return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    }
    if (status === 'FAIL') {
      return <XCircle className="w-5 h-5 text-red-400" />;
    }
    return <Clock className="w-5 h-5 text-text-muted" />;
  };

  const checkItems = [
    {
      key: 'deviceConnection',
      label: '1. ESP32 Hardware Connection',
      desc: 'Verifies board is powered and transmitting silicon heartbeats.',
      status: checks.deviceConnection,
    },
    {
      key: 'mqttConnection',
      label: '2. MQTT Broker Authentication',
      desc: 'Validates zero-trust TLS credentials and broker handshake.',
      status: checks.mqttConnection,
    },
    {
      key: 'sensorValidation',
      label: '3. Sensor Array Validation',
      desc: 'Ensures all configured HAL sensors respond within physical tolerance.',
      status: checks.sensorValidation,
    },
    {
      key: 'telemetryReception',
      label: '4. Telemetry Stream Ingestion',
      desc: 'Validates JSON telemetry packet parsing and database storage.',
      status: checks.telemetryReception,
    },
    {
      key: 'eventDetection',
      label: '5. Sensor Fusion & Policy Rules',
      desc: 'Evaluates state transitions against industry policy packs.',
      status: checks.eventDetection,
    },
    {
      key: 'automationTrigger',
      label: '6. Automation Action Firing',
      desc: 'Checks actuator relays, setbacks, and local indicators.',
      status: checks.automationTrigger,
    },
    {
      key: 'alertDelivery',
      label: '7. Alert & Escalation Delivery',
      desc: 'Verifies notifications reach authorized security & facility staff.',
      status: checks.alertDelivery,
    },
  ];

  const allPassed =
    scorecard &&
    Object.values(checks).every((c) => c === 'PASS');

  return (
    <div className="bg-surface rounded-xl border border-border p-6 space-y-6 shadow-sm">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-text-primary text-base">
                Hardware & Pipeline Diagnostic Scorecard
              </h3>
              {scorecard?.readinessSignOff && (
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> READY FOR PRODUCTION
                </span>
              )}
            </div>
            <p className="text-xs text-text-secondary">
              Deployment: <span className="text-text-primary font-medium">{deployment.name}</span> • Target Node: <span className="font-mono text-text-primary">{deployment.deviceId || 'Bench Simulator'}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Simulation Toggle */}
          <label className="flex items-center gap-2 cursor-pointer bg-surface-hover px-3 py-1.5 rounded-lg border border-border text-xs">
            <span className="text-text-secondary font-medium">Virtual Simulator:</span>
            <input
              type="checkbox"
              checked={simulate}
              onChange={(e) => setSimulate(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
            />
            <span className={`text-[11px] font-semibold ${simulate ? 'text-primary' : 'text-text-muted'}`}>
              {simulate ? 'ON' : 'OFF'}
            </span>
          </label>

          <button
            onClick={handleRunDiagnostics}
            disabled={testing}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            <RotateCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Running Diagnostics...' : 'Run Diagnostics'}
          </button>

          {allPassed && !scorecard?.readinessSignOff && (
            <button
              onClick={() => setShowSignOffModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              Sign Off Deployment
            </button>
          )}
        </div>
      </div>

      {/* 7 Diagnostic Checks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {checkItems.map((chk) => (
          <div
            key={chk.key}
            className={`p-3.5 rounded-xl border transition-all ${
              chk.status === 'PASS'
                ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                : chk.status === 'FAIL'
                ? 'bg-red-500/5 border-red-500/20 text-red-400'
                : 'bg-surface-hover border-border text-text-secondary'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-xs text-text-primary">
                {chk.label}
              </span>
              {renderCheckIcon(chk.status)}
            </div>
            <p className="text-[11px] text-text-secondary line-clamp-2">
              {chk.desc}
            </p>
            <div className="mt-2 text-[11px] font-mono font-bold uppercase">
              STATUS: {chk.status}
            </div>
          </div>
        ))}
      </div>

      {/* Live Telemetry Sensor Table */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-text-primary text-sm flex items-center gap-2">
            <Radio className="w-4 h-4 text-primary" /> Live Sensor Telemetry Stream
          </h4>
          <span className="text-xs text-text-muted">
            {scorecard?.sensorReadings.length || 0} active sensor channels
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-hover border-b border-border text-text-secondary uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Sensor Type</th>
                <th className="py-2.5 px-4 font-semibold">Current Value</th>
                <th className="py-2.5 px-4 font-semibold">Unit</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 px-4 font-semibold">Data Source</th>
                <th className="py-2.5 px-4 font-semibold">Last Ingested</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {scorecard?.sensorReadings.length ? (
                scorecard.sensorReadings.map((r, i) => (
                  <tr key={i} className="hover:bg-surface-hover transition-colors">
                    <td className="py-2.5 px-4 font-medium text-text-primary">
                      {r.sensorType}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-text-primary">
                      {typeof r.value === 'object' ? JSON.stringify(r.value) : String(r.value)}
                    </td>
                    <td className="py-2.5 px-4 text-text-secondary">{r.unit || '—'}</td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          r.status === 'WORKING'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          r.isSimulated
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {r.isSimulated ? 'Simulated Bench' : 'Physical ESP32'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-text-muted font-mono text-[11px]">
                      {new Date(r.lastReceivedAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-text-muted">
                    No active diagnostic readings. Click <strong>Run Diagnostics</strong> above to test hardware channels.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Readiness Sign-Off Modal */}
      {showSignOffModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-semibold text-text-primary text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Production Readiness Sign-Off
              </h3>
              <button
                onClick={() => setShowSignOffModal(false)}
                className="text-text-muted hover:text-text-primary text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-text-secondary">
              All 7 diagnostic checks have passed. Submitting this sign-off marks the deployment as <strong>ACTIVE</strong> in the Sentinel fleet and enables live automated alarms.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">
                Installer / Inspector Notes:
              </label>
              <textarea
                value={signOffNotes}
                onChange={(e) => setSignOffNotes(e.target.value)}
                placeholder="e.g., Physical sensor array bench-tested; mmWave radar calibrated for 2m radius; relay setback verified."
                rows={3}
                className="w-full rounded-lg bg-surface-hover border border-border p-2.5 text-xs text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSignOffModal(false)}
                className="px-4 py-2 bg-surface-hover hover:bg-border text-text-primary rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOff}
                disabled={signingOff}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                {signingOff ? 'Submitting...' : 'Confirm Sign-Off'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
