// ─────────────────────────────────────────────
// SENTINEL Web — Dispatch MQTT Device Command Modal
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import {
  Terminal,
  Send,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Bell,
  Clock,
  Cpu,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useTelemetry } from '../../context/TelemetryContext';
import { useDevice } from '../../context/DeviceContext';
import { useOrganization } from '../../context/OrganizationContext';
import type { DeviceCommandResponse } from '@sentinel/types';

interface SendCommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedDeviceId?: string;
}

export const SendCommandModal: React.FC<SendCommandModalProps> = ({
  isOpen,
  onClose,
  preselectedDeviceId,
}) => {
  const { sendCommand } = useTelemetry();
  const { devices } = useDevice();
  const { currentOrganization } = useOrganization();

  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(
    preselectedDeviceId || (devices[0]?.deviceId ?? '')
  );
  const [command, setCommand] = useState<string>('REQUEST_STATUS');
  const [intervalMs, setIntervalMs] = useState<number>(5000);
  const [actuatorAction, setActuatorAction] = useState<string>('BUZZER_BEEP');
  const [customParams, setCustomParams] = useState<string>('{}');

  const [isSending, setIsSending] = useState<boolean>(false);
  const [response, setResponse] = useState<DeviceCommandResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedDeviceObj = devices.find((d) => d.deviceId === selectedDeviceId);

  const handleSend = async () => {
    if (!selectedDeviceId) {
      setErrorMessage('Please select a target device.');
      return;
    }

    setIsSending(true);
    setErrorMessage(null);
    setResponse(null);

    let params: Record<string, unknown> = {};

    if (command === 'SET_INTERVAL') {
      params = { intervalMs };
    } else if (command === 'TRIGGER_ACTUATOR') {
      params = { action: actuatorAction, durationMs: 1500 };
    } else if (command === 'CALIBRATE') {
      try {
        params = JSON.parse(customParams);
      } catch {
        setErrorMessage('Invalid JSON parameters for CALIBRATE command.');
        setIsSending(false);
        return;
      }
    }

    try {
      const res = await sendCommand({
        deviceId: selectedDeviceId,
        command,
        params,
      });
      setResponse(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to publish MQTT command';
      setErrorMessage(msg);
    } finally {
      setIsSending(false);
    }
  };

  const topicPreview = currentOrganization && selectedDeviceObj
    ? `sentinel/${currentOrganization.id}/${selectedDeviceObj.facilityId}/${selectedDeviceId}/command`
    : `sentinel/{orgId}/{facilityId}/${selectedDeviceId || '{deviceId}'}/command`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 flex items-center justify-center">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Dispatch MQTT Device Command
            </h3>
            <p className="text-xs text-slate-500">
              Transmit low-latency cloud control payloads across the embedded Aedes MQTT broker.
            </p>
          </div>
        </div>
      }
      maxWidth="lg"
    >
      <div className="space-y-4 py-2 text-xs">
        {/* Device Picker */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Target ESP32 Microcontroller
          </label>
          {devices.length > 0 ? (
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 focus:ring-1 focus:ring-sentinel-500 focus:outline-none"
            >
              {devices.map((d) => (
                <option key={d.id} value={d.deviceId}>
                  {d.deviceId} — {d.name} ({d.status})
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              placeholder="e.g. ESP32-ICU-001"
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 font-mono"
            />
          )}
        </div>

        {/* MQTT Channel Preview */}
        <div className="p-2.5 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto">
          <span className="text-slate-400 block mb-0.5">MQTT Target Topic:</span>
          <span className="text-emerald-400">{topicPreview}</span>
        </div>

        {/* Command Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Control Command
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: 'REQUEST_STATUS', label: 'Request Status', icon: RefreshCw },
              { id: 'SET_INTERVAL', label: 'Set Rate (ms)', icon: Clock },
              { id: 'TRIGGER_ACTUATOR', label: 'Trigger Relay', icon: Bell },
              { id: 'CALIBRATE', label: 'Calibrate Offsets', icon: Sliders },
              { id: 'REBOOT', label: 'Reboot Device', icon: Cpu },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCommand(c.id)}
                  className={`p-2.5 rounded-lg border flex flex-col items-center justify-center gap-1.5 text-center transition-all ${
                    command === c.id
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-semibold ring-1 ring-indigo-500'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4 text-slate-600" />
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Command Parameter Form */}
        {command === 'SET_INTERVAL' && (
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5">
            <label className="block text-xs font-medium text-slate-700">
              Reporting Interval (milliseconds)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="500"
                max="60000"
                step="500"
                value={intervalMs}
                onChange={(e) => setIntervalMs(parseInt(e.target.value, 10))}
                className="w-32 rounded-lg border border-slate-300 px-3 py-1.5 bg-white"
              />
              <span className="text-slate-500 text-[11px]">
                ({(intervalMs / 1000).toFixed(1)} seconds per packet)
              </span>
            </div>
          </div>
        )}

        {command === 'TRIGGER_ACTUATOR' && (
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5">
            <label className="block text-xs font-medium text-slate-700">Actuator Action</label>
            <select
              value={actuatorAction}
              onChange={(e) => setActuatorAction(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 bg-white"
            >
              <option value="BUZZER_BEEP">Onboard Alert Buzzer (Single Beep)</option>
              <option value="BUZZER_PULSE">Buzzer Pulsing Alarm (Continuous)</option>
              <option value="RELAY_LOCK_ENGAGE">Electronic Door Lock (Engage)</option>
              <option value="RELAY_LOCK_RELEASE">Electronic Door Lock (Release)</option>
              <option value="LED_BEACON_STROBE">Status LED Beacon (Strobe)</option>
            </select>
          </div>
        )}

        {command === 'CALIBRATE' && (
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5">
            <label className="block text-xs font-medium text-slate-700">
              Calibration Parameters (JSON)
            </label>
            <textarea
              rows={3}
              value={customParams}
              onChange={(e) => setCustomParams(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 font-mono text-xs bg-white"
              placeholder='{ "sensorType": "temperature", "offset": 0.5 }'
            />
          </div>
        )}

        {/* Errors & Response Badges */}
        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {response && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 space-y-1 text-emerald-900">
            <div className="flex items-center justify-between font-semibold">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Dispatched over MQTT Broker
              </span>
              <Badge variant="success" size="sm">
                {response.status}
              </Badge>
            </div>
            <div className="text-[11px] text-emerald-800 font-mono">
              Command ID: {response.commandId} | Target: {response.deviceId}
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSending}>
            Close
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSend}
            isLoading={isSending}
            leftIcon={<Send className="w-3.5 h-3.5" />}
          >
            Dispatch MQTT Command
          </Button>
        </div>
      </div>
    </Modal>
  );
};
