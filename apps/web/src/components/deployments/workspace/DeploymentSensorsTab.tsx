// ─────────────────────────────────────────────
// SENTINEL Web — Deployment Sensors Tab
// Hardware sensor roster, pin assignments, and driver configs
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import {
  Radio,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import type { Deployment, SelectedSensorConfig } from '@sentinel/types';

interface SensorsTabProps {
  deployment: Deployment;
  onUpdateDeployment?: () => void;
}

export const DeploymentSensorsTab: React.FC<SensorsTabProps> = ({ deployment }) => {
  const sensors = deployment.hardwareConfig?.sensors || [];
  const [selectedSensor, setSelectedSensor] = useState<SelectedSensorConfig | null>(
    sensors[0] || null
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-[#172033]">Configured Sensors</h3>
          <p className="text-xs text-slate-500">
            {sensors.length} sensor modules active for this {deployment.useCaseName} deployment
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sensor List Cards */}
        <div className="md:col-span-2 space-y-3">
          {sensors.length === 0 ? (
            <div className="bg-white border border-[#DCE3EC] rounded-xl p-8 text-center text-xs text-slate-500">
              No sensors configured. Update your deployment to assign hardware modules.
            </div>
          ) : (
            sensors.map((sensor, idx) => {
              const isSelected = selectedSensor?.model === sensor.model;
              return (
                <div
                  key={`${sensor.sensorType}-${idx}`}
                  onClick={() => setSelectedSensor(sensor)}
                  className={`bg-white border rounded-xl p-4 cursor-pointer transition-all shadow-sm ${
                    isSelected
                      ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/20'
                      : 'border-[#DCE3EC] hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                        <Radio className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-[#172033]">
                          {sensor.model || sensor.sensorType}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {sensor.sensorType} • {sensor.category}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                        {sensor.interfaceType}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Pins:{' '}
                        {sensor.sensorType === 'ULTRASONIC' && sensor.assignedPins?.length >= 2
                          ? `TRIG: ${sensor.assignedPins[0]}, ECHO: ${sensor.assignedPins[1]}`
                          : sensor.sensorType === 'ULTRASONIC' && sensor.assignedPins?.length === 1
                          ? `TRIG: ${sensor.assignedPins[0]}, ECHO: 18`
                          : sensor.assignedPins?.length > 0
                          ? sensor.assignedPins.join(', ')
                          : 'Default Bus'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Sensor Pin & Driver Inspector */}
        <div className="bg-white border border-[#DCE3EC] rounded-xl p-5 shadow-sm space-y-4 h-fit">
          <div className="flex items-center gap-2 border-b border-[#DCE3EC] pb-3">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-semibold text-[#172033]">Module Specification</h4>
          </div>

          {selectedSensor ? (
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-500">Hardware Model</span>
                <p className="text-sm font-semibold text-[#172033] mt-0.5">
                  {selectedSensor.model || selectedSensor.sensorType}
                </p>
              </div>

              <div>
                <span className="text-slate-500">Manufacturer</span>
                <p className="font-medium text-[#172033] mt-0.5">
                  {selectedSensor.manufacturer || 'Standard Microelectronics'}
                </p>
              </div>

              <div>
                <span className="text-slate-500">Bus Interface</span>
                <p className="font-medium text-blue-600 mt-0.5">{selectedSensor.interfaceType}</p>
              </div>

              <div>
                <span className="text-slate-500">GPIO Pin Assignments</span>
                <p className="font-mono bg-slate-100 text-slate-800 px-2 py-1 rounded mt-1">
                  {selectedSensor.sensorType === 'ULTRASONIC' && selectedSensor.assignedPins?.length >= 2
                    ? `TRIG: GPIO ${selectedSensor.assignedPins[0]}, ECHO: GPIO ${selectedSensor.assignedPins[1]}`
                    : selectedSensor.sensorType === 'ULTRASONIC' && selectedSensor.assignedPins?.length === 1
                    ? `TRIG: GPIO ${selectedSensor.assignedPins[0]}, ECHO: GPIO 18`
                    : selectedSensor.assignedPins && selectedSensor.assignedPins.length > 0
                    ? selectedSensor.assignedPins.map((p) => `GPIO ${p}`).join(', ')
                    : selectedSensor.interfaceType === 'I2C'
                    ? 'I2C (SDA=21, SCL=22 / D2, D1)'
                    : 'System Default Pin'}
                </p>
              </div>

              <div>
                <span className="text-slate-500">Sampling Interval</span>
                <p className="font-medium text-[#172033] mt-0.5">
                  {selectedSensor.samplingIntervalMs || 5000} ms
                </p>
              </div>

              <div className="pt-2 border-t border-[#DCE3EC]">
                <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>C++ Driver embedded in standalone sketch</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500">Select a sensor to inspect hardware specs.</div>
          )}
        </div>
      </div>
    </div>
  );
};
