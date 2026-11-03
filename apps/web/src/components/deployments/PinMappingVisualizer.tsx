// ─────────────────────────────────────────────
// SENTINEL Web — ESP32 Pin Mapping & Conflict Visualizer
// ─────────────────────────────────────────────

import React from 'react';
import type {
  DeploymentHardwareConfig,
  HardwareValidationResult,
} from '@sentinel/types';
import { AlertCircle, CheckCircle2, Zap, AlertTriangle, Cpu } from 'lucide-react';

interface PinMappingVisualizerProps {
  hardwareConfig: DeploymentHardwareConfig;
  validationResult?: HardwareValidationResult | null;
  onPinChange?: (sensorIndex: number, pinIndex: number, newPin: number) => void;
}

export const PinMappingVisualizer: React.FC<PinMappingVisualizerProps> = ({
  hardwareConfig,
  validationResult,
}) => {
  const sda = hardwareConfig.i2cBus?.sdaPin ?? 21;
  const scl = hardwareConfig.i2cBus?.sclPin ?? 22;

  // Build map of pin -> users
  const pinUserMap: Record<number, { label: string; type: string; color: string }[]> = {};

  // Map I2C bus
  pinUserMap[sda] = [{ label: 'I2C SDA', type: 'I2C', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' }];
  pinUserMap[scl] = [{ label: 'I2C SCL', type: 'I2C', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' }];

  // Map sensors
  hardwareConfig.sensors.forEach((s) => {
    s.assignedPins.forEach((p) => {
      if (s.interfaceType === 'I2C' && (p === sda || p === scl)) {
        return; // Already marked as I2C bus
      }
      (pinUserMap[p] ??= []).push({
        label: `${s.sensorType} (${s.model})`,
        type: s.interfaceType,
        color:
          s.interfaceType === 'UART'
            ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
            : s.interfaceType === 'ADC'
            ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      });
    });
  });

  // Map actuators
  hardwareConfig.actuators.forEach((a) => {
    (pinUserMap[a.assignedPin] ??= []).push({
      label: `Actuator: ${a.actuatorType}`,
      type: 'OUTPUT',
      color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    });
  });

  // Conflicts lookup
  const conflictPins = new Set((validationResult?.conflicts || []).map((c) => c.pinNumber));
  const powerEst = validationResult?.totalPowerEstMa || 220;
  const powerPct = Math.min(Math.round((powerEst / 500) * 100), 100);

  return (
    <div className="bg-surface rounded-xl border border-border p-5 space-y-5">
      {/* Header & Power Draw Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary text-base">
              ESP32 Pinout & Power Matrix
            </h3>
            <p className="text-xs text-text-secondary">
              Board: <span className="font-mono text-text-primary">{hardwareConfig.chipModel}</span> • Bus: SDA={sda}, SCL={scl}
            </p>
          </div>
        </div>

        {/* Power estimation pill */}
        <div className="flex items-center gap-3 bg-surface-hover px-3.5 py-2 rounded-lg border border-border">
          <Zap className={`w-4 h-4 ${powerEst > 450 ? 'text-amber-400' : 'text-emerald-400'}`} />
          <div className="space-y-1">
            <div className="flex justify-between text-xs gap-3">
              <span className="text-text-secondary">Est. Current Draw:</span>
              <span className="font-semibold text-text-primary font-mono">{powerEst} mA</span>
            </div>
            <div className="w-32 bg-border rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  powerEst > 450 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${powerPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Conflicts and Warnings banner */}
      {validationResult && !validationResult.valid && (
        <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Pin Assignment Conflicts Detected</span>
          </div>
          <ul className="list-disc list-inside space-y-1 pl-1 text-red-200">
            {validationResult.conflicts.map((c, i) => (
              <li key={i}>{c.reason}</li>
            ))}
            {validationResult.issues
              .filter((iss) => iss.severity === 'ERROR')
              .map((iss, i) => (
                <li key={i}>{iss.message}</li>
              ))}
          </ul>
        </div>
      )}

      {/* Warnings (non-fatal) */}
      {validationResult?.issues.some((i) => i.severity === 'WARNING') && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-1">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Hardware Recommendations</span>
          </div>
          {validationResult.issues
            .filter((i) => i.severity === 'WARNING')
            .map((iss, i) => (
              <p key={i} className="pl-6 text-text-secondary">
                {iss.message} {iss.suggestedAction && `(${iss.suggestedAction})`}
              </p>
            ))}
        </div>
      )}

      {/* Interactive Pin Assignment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(pinUserMap).map(([pinStr, users]) => {
          const pin = parseInt(pinStr, 10);
          const hasConflict = conflictPins.has(pin);

          return (
            <div
              key={pin}
              className={`p-3 rounded-lg border text-xs transition-all ${
                hasConflict
                  ? 'bg-red-500/10 border-red-500/40 text-red-200 ring-1 ring-red-500/30'
                  : 'bg-surface-hover border-border text-text-secondary'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono font-bold text-text-primary">
                  GPIO {pin}
                </span>
                {hasConflict ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-red-400 bg-red-500/20 px-1.5 py-0.5 rounded">
                    <AlertCircle className="w-3 h-3" /> CONFLICT
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> Assigned
                  </span>
                )}
              </div>

              <div className="space-y-1">
                {users.map((u, i) => (
                  <div
                    key={i}
                    className={`px-2 py-1 rounded border text-[11px] font-medium truncate ${u.color}`}
                  >
                    {u.label}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
