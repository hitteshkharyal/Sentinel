// ─────────────────────────────────────────────
// SENTINEL Web — 4-Step Installer Deployment Wizard
// ─────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  CreateDeploymentDTO,
  DeploymentHardwareConfig,
  DeploymentTemplate,
  IndustryType,
  SelectedActuatorConfig,
  SelectedSensorConfig,
  ChipModel,
  HardwareValidationResult,
  SensorInterface,
  SensorCategory,
} from '@sentinel/types';
import {
  Building2,
  Heart,
  GraduationCap,
  Bus,
  Briefcase,
  ShoppingBag,
  Factory,
  Warehouse,
  SquareStack,
  Building,
  Cpu,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Check,
  Layers,
} from 'lucide-react';
import { useDeployment } from '../../context/DeploymentContext';
import { useFacility } from '../../context/FacilityContext';
import { PinMappingVisualizer } from './PinMappingVisualizer';

interface IndustryOption {
  id: IndustryType;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const INDUSTRIES: IndustryOption[] = [
  {
    id: 'hotel',
    title: 'Hotel',
    description: 'Guest room presence, ventilation, abnormal activity & water leakage.',
    icon: <Building2 className="w-6 h-6 text-blue-400" />,
  },
  {
    id: 'hospital',
    title: 'Hospital',
    description: 'Patient room stasis, bed-exit assistance, sound spikes & nurse alerts.',
    icon: <Heart className="w-6 h-6 text-red-400" />,
  },
  {
    id: 'school',
    title: 'School',
    description: 'Classroom CO2 & IAQ, overcapacity, after-hours presence & energy optimization.',
    icon: <GraduationCap className="w-6 h-6 text-amber-400" />,
  },
  {
    id: 'school_bus',
    title: 'School Bus',
    description: 'Child-left-behind anti-abandonment, GPS coordinates, cabin heat warning.',
    icon: <Bus className="w-6 h-6 text-yellow-400" />,
  },
  {
    id: 'office',
    title: 'Office',
    description: 'Meeting room utilization, desk occupancy, HVAC setback & ghost booking release.',
    icon: <Briefcase className="w-6 h-6 text-indigo-400" />,
  },
  {
    id: 'mall',
    title: 'Mall & Commercial',
    description: 'Foot-traffic density, atrium airflow, perimeter motion & emergency sound.',
    icon: <ShoppingBag className="w-6 h-6 text-purple-400" />,
  },
  {
    id: 'factory',
    title: 'Factory',
    description: 'Machinery vibration, current load, toxic gas & safety interlock shutoffs.',
    icon: <Factory className="w-6 h-6 text-orange-400" />,
  },
  {
    id: 'warehouse',
    title: 'Warehouse',
    description: 'Perimeter intrusion, cold-storage climate excursion & dock roll-up doors.',
    icon: <Warehouse className="w-6 h-6 text-emerald-400" />,
  },
  {
    id: 'parking',
    title: 'Parking',
    description: 'Overhead bay ultrasonic occupancy, LED guidance & unauthorized parking.',
    icon: <SquareStack className="w-6 h-6 text-cyan-400" />,
  },
  {
    id: 'public_facility',
    title: 'Public Facility',
    description: 'Restroom stall turnover, air quality odor index & plumbing flood alerts.',
    icon: <Building className="w-6 h-6 text-teal-400" />,
  },
  {
    id: 'custom',
    title: 'Custom Environment',
    description: 'Mix and match any sensor array, custom automation rules and actuators.',
    icon: <Cpu className="w-6 h-6 text-primary" />,
  },
];

export const DeploymentWizard: React.FC = () => {
  const navigate = useNavigate();
  const { templates, fetchTemplates, validateHardware, createDeployment, isLoading } =
    useDeployment();
  const { facilities, rooms } = useFacility();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType>('hotel');
  const [selectedTemplate, setSelectedTemplate] = useState<DeploymentTemplate | null>(null);

  // Step 3 Hardware Configuration State
  const [deploymentName, setDeploymentName] = useState<string>('');
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [chipModel, setChipModel] = useState<ChipModel>('ESP32-WROOM-32D');

  const [sensors, setSensors] = useState<SelectedSensorConfig[]>([]);
  const [actuators, setActuators] = useState<SelectedActuatorConfig[]>([
    {
      actuatorType: 'STATUS_LED',
      model: 'ONBOARD_LED',
      assignedPin: 2,
      activeLevel: 'HIGH',
    },
  ]);

  const [validationResult, setValidationResult] = useState<HardwareValidationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch templates when industry changes
  useEffect(() => {
    fetchTemplates(selectedIndustry).then((tpls) => {
      if (tpls.length > 0) {
        const match = tpls.find((t) => t.industry === selectedIndustry) || tpls[0];
        if (match) applyTemplate(match);
      }
    });
  }, [selectedIndustry, fetchTemplates]);

  // Set default facility if available
  useEffect(() => {
    if (facilities.length > 0 && !selectedFacilityId) {
      setSelectedFacilityId(facilities[0]!.id);
    }
  }, [facilities, selectedFacilityId]);

  const applyTemplate = (tpl: DeploymentTemplate) => {
    setSelectedTemplate(tpl);
    setDeploymentName(`${tpl.name} - Unit 1`);

    // Map template recommended sensors to default pins
    const defaultSensors: SelectedSensorConfig[] = tpl.recommendedSensors.map((rs) => {
      let defaultPins = [4];
      let iface: SensorInterface = 'GPIO';
      let category: SensorCategory = 'PRESENCE_MOTION';

      if (rs.sensorType === 'MMWAVE') {
        defaultPins = [16, 17];
        iface = 'UART';
        category = 'PRESENCE_MOTION';
      } else if (rs.sensorType === 'CO2') {
        defaultPins = [21, 22];
        iface = 'I2C';
        category = 'ENVIRONMENTAL';
      } else if (rs.sensorType === 'TEMPERATURE' || rs.sensorType === 'HUMIDITY') {
        defaultPins = [21, 22];
        iface = 'I2C';
        category = 'ENVIRONMENTAL';
      } else if (rs.sensorType === 'PRESSURE') {
        defaultPins = [21, 22];
        iface = 'I2C';
        category = 'ENVIRONMENTAL';
      } else if (rs.sensorType === 'LIGHT') {
        defaultPins = [21, 22];
        iface = 'I2C';
        category = 'ENVIRONMENTAL';
      } else if (rs.sensorType === 'PIR') {
        defaultPins = [13];
        iface = 'GPIO';
        category = 'PRESENCE_MOTION';
      } else if (rs.sensorType === 'DOOR_MAGNETIC') {
        defaultPins = [14];
        iface = 'GPIO';
        category = 'SECURITY';
      } else if (rs.sensorType === 'SOUND_LEVEL') {
        defaultPins = [34];
        iface = 'ADC';
        category = 'ACOUSTIC';
      } else if (rs.sensorType === 'VIBRATION') {
        defaultPins = [25];
        iface = 'GPIO';
        category = 'INDUSTRIAL';
      } else if (rs.sensorType === 'CURRENT') {
        defaultPins = [35];
        iface = 'ADC';
        category = 'ELECTRICAL';
      } else if (rs.sensorType === 'GPS') {
        defaultPins = [16, 17];
        iface = 'UART';
        category = 'LOCATION';
      }

      return {
        sensorType: rs.sensorType,
        model: rs.model,
        manufacturer: 'Sentinel Certified',
        category,
        interfaceType: iface,
        assignedPins: defaultPins,
        samplingIntervalMs: 5000,
        isMandatory: rs.mandatory,
      };
    });

    setSensors(defaultSensors);

    // Map template actuators
    const defaultActuators: SelectedActuatorConfig[] = tpl.recommendedActuators.map((ra) => ({
      actuatorType: ra.actuatorType,
      model: ra.model,
      assignedPin: ra.actuatorType === 'RELAY' ? 27 : ra.actuatorType === 'BUZZER' ? 15 : 2,
      activeLevel: 'HIGH',
    }));

    if (!defaultActuators.some((a) => a.actuatorType === 'STATUS_LED')) {
      defaultActuators.push({
        actuatorType: 'STATUS_LED',
        model: 'ONBOARD_LED',
        assignedPin: 2,
        activeLevel: 'HIGH',
      });
    }

    setActuators(defaultActuators);
  };

  // Run hardware pre-flight validation
  const runValidation = async () => {
    const hwConfig: DeploymentHardwareConfig = {
      chipModel,
      boardName: chipModel === 'ESP32-S3-WROOM-1' ? 'ESP32-S3 DevKit' : 'ESP32-WROOM DevKit v1',
      operatingVoltage: '3.3V',
      powerSource: 'MAINS',
      sensors,
      actuators,
      i2cBus: {
        sdaPin: 21,
        sclPin: 22,
        frequencyHz: 100000,
      },
      uart2: {
        rxPin: 16,
        txPin: 17,
        baudRate: 115200,
      },
    };

    const res = await validateHardware(hwConfig);
    setValidationResult(res);
    return res.valid;
  };

  // Proceed handler
  const handleNext = async () => {
    setErrorMsg(null);
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (!selectedTemplate) {
        setErrorMsg('Please select a deployment template or use case.');
        return;
      }
      await runValidation();
      setStep(3);
    } else if (step === 3) {
      const isValid = await runValidation();
      if (!isValid) {
        setErrorMsg('Please resolve all pin conflicts before proceeding to review.');
        return;
      }
      setStep(4);
    } else if (step === 4) {
      if (!deploymentName.trim()) {
        setErrorMsg('Please provide a deployment name.');
        return;
      }
      if (!selectedFacilityId) {
        setErrorMsg('Please select a target facility.');
        return;
      }

      const dto: CreateDeploymentDTO = {
        name: deploymentName.trim(),
        facilityId: selectedFacilityId,
        roomId: selectedRoomId || undefined,
        industry: selectedIndustry,
        useCaseId: selectedTemplate?.useCaseId || 'custom',
        useCaseName: selectedTemplate?.useCaseName || 'Custom Configuration',
        hardwareConfig: {
          chipModel,
          boardName: chipModel === 'ESP32-S3-WROOM-1' ? 'ESP32-S3 DevKit' : 'ESP32-WROOM DevKit v1',
          operatingVoltage: '3.3V',
          powerSource: 'MAINS',
          sensors,
          actuators,
          i2cBus: {
            sdaPin: 21,
            sclPin: 22,
            frequencyHz: 100000,
          },
          uart2: {
            rxPin: 16,
            txPin: 17,
            baudRate: 115200,
          },
        },
      };

      try {
        const created = await createDeployment(dto);
        navigate(`/deployments/${created.id}`);
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : String(err));
      }
    }
  };

  const handleBack = () => {
    setErrorMsg(null);
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
    }
  };

  return (
    <div className="space-y-6">
      {/* Multi-Step Guided Progress Indicator */}
      <div className="bg-surface rounded-xl border border-border p-4 shadow-sm">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {[
            { num: 1, label: 'Select Industry' },
            { num: 2, label: 'Choose Use Case' },
            { num: 3, label: 'Hardware Matrix' },
            { num: 4, label: 'Review & Deploy' },
          ].map((st) => (
            <div key={st.num} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                  step === st.num
                    ? 'bg-primary text-white ring-4 ring-primary/20'
                    : step > st.num
                    ? 'bg-emerald-500 text-white'
                    : 'bg-surface-hover text-text-muted border border-border'
                }`}
              >
                {step > st.num ? <Check className="w-4 h-4" /> : st.num}
              </div>
              <span
                className={`text-xs font-semibold hidden sm:inline ${
                  step === st.num ? 'text-text-primary' : 'text-text-muted'
                }`}
              >
                {st.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: SELECT INDUSTRY */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Step 1 — Select Target Industry</h2>
            <p className="text-xs text-text-secondary">
              Choose the operational domain. The wizard will load pre-certified sensor suites, compliance frameworks, and event rules.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {INDUSTRIES.map((ind) => (
              <button
                key={ind.id}
                onClick={() => setSelectedIndustry(ind.id)}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between space-y-3 ${
                  selectedIndustry === ind.id
                    ? 'bg-primary/5 border-primary ring-2 ring-primary/20 shadow-sm'
                    : 'bg-surface border-border hover:border-primary/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-lg bg-surface-hover border border-border">
                    {ind.icon}
                  </div>
                  {selectedIndustry === ind.id && (
                    <span className="p-1 rounded-full bg-primary text-white">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary text-sm">{ind.title}</h4>
                  <p className="text-xs text-text-secondary mt-1">{ind.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: SELECT USE CASE & TEMPLATE */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Step 2 — Select Sector Use Case</h2>
            <p className="text-xs text-text-secondary">
              Certified templates specifically calibrated for <strong>{selectedIndustry.toUpperCase()}</strong> environments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates
              .filter((t) => t.industry === selectedIndustry || t.industry === 'custom')
              .map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => applyTemplate(tpl)}
                  className={`p-5 rounded-xl border cursor-pointer transition-all space-y-4 ${
                    selectedTemplate?.id === tpl.id
                      ? 'bg-primary/5 border-primary ring-2 ring-primary/20 shadow-sm'
                      : 'bg-surface border-border hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-text-primary text-base">{tpl.name}</h4>
                      <p className="text-xs text-text-secondary mt-1">{tpl.description}</p>
                    </div>
                    {selectedTemplate?.id === tpl.id && (
                      <span className="p-1 rounded-full bg-primary text-white shrink-0">
                        <Check className="w-4 h-4" />
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border">
                    <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                      Required Sensor Suite:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {tpl.recommendedSensors.map((s, idx) => (
                        <span
                          key={idx}
                          className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                            s.mandatory
                              ? 'bg-primary/10 text-primary border-primary/20 font-semibold'
                              : 'bg-surface-hover text-text-secondary border-border'
                          }`}
                        >
                          {s.sensorType} ({s.model}) {s.mandatory && '*'}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-text-muted pt-2 border-t border-border">
                    <span>Board: {tpl.recommendedChipModel}</span>
                    <span>{tpl.defaultRuleNames.length} Automation Rules Included</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* STEP 3: DYNAMIC HARDWARE CONFIGURATION & PIN MAPPING */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Step 3 — Hardware Pinout & Peripherals</h2>
            <p className="text-xs text-text-secondary">
              Review and adjust GPIO pin assignments. Sentinel continuously verifies pin conflicts, ADC2 Wi-Fi compatibility, and voltage limits.
            </p>
          </div>

          {/* Board Selector */}
          <div className="bg-surface rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Cpu className="w-5 h-5 text-primary" />
              <div>
                <h4 className="font-semibold text-text-primary text-sm">Target ESP32 Board</h4>
                <p className="text-xs text-text-secondary">Select physical silicon model for compilation</p>
              </div>
            </div>
            <select
              value={chipModel}
              onChange={(e) => setChipModel(e.target.value as ChipModel)}
              className="bg-surface-hover border border-border rounded-lg px-3 py-2 text-xs font-semibold text-text-primary focus:border-primary outline-none"
            >
              <option value="ESP32-WROOM-32D">ESP32-WROOM-32D (Standard 38-Pin DevKit)</option>
              <option value="ESP32-S3-WROOM-1">ESP32-S3-WROOM-1 (Dual-Core AI + USB OTG)</option>
            </select>
          </div>

          {/* Active Sensors Table */}
          <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-text-primary text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" /> Configured Sensors ({sensors.length})
              </h3>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-hover border-b border-border text-text-secondary uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Model</th>
                    <th className="py-2.5 px-3">Interface</th>
                    <th className="py-2.5 px-3">Assigned GPIO</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sensors.map((s, idx) => (
                    <tr key={idx} className="hover:bg-surface-hover">
                      <td className="py-2.5 px-3 font-semibold text-text-primary">{s.sensorType}</td>
                      <td className="py-2.5 px-3 text-text-secondary">{s.model}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-primary/10 text-primary border border-primary/20">
                          {s.interfaceType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1 font-mono">
                          {s.assignedPins.map((p, pIdx) => (
                            <input
                              key={pIdx}
                              type="number"
                              value={p}
                              onChange={(e) => {
                                const newP = parseInt(e.target.value, 10) || 0;
                                setSensors((prev) =>
                                  prev.map((item, i) => {
                                    if (i !== idx) return item;
                                    const nextPins = [...item.assignedPins];
                                    nextPins[pIdx] = newP;
                                    return { ...item, assignedPins: nextPins };
                                  })
                                );
                              }}
                              className="w-14 rounded bg-surface border border-border px-1.5 py-0.5 text-center text-xs font-mono text-text-primary"
                            />
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${s.isMandatory ? 'text-primary font-bold' : 'text-text-muted'}`}>
                          {s.isMandatory ? 'Required' : 'Optional'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {!s.isMandatory && (
                          <button
                            onClick={() => setSensors((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-red-400 hover:text-red-300 p-1"
                            title="Remove sensor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Embedded Pin Mapping & Conflict Visualizer */}
          <PinMappingVisualizer
            hardwareConfig={{
              chipModel,
              boardName: chipModel,
              operatingVoltage: '3.3V',
              powerSource: 'MAINS',
              sensors,
              actuators,
              i2cBus: { sdaPin: 21, sclPin: 22, frequencyHz: 100000 },
              uart2: { rxPin: 16, txPin: 17, baudRate: 115200 },
            }}
            validationResult={validationResult}
          />
        </div>
      )}

      {/* STEP 4: REVIEW & DEPLOY */}
      {step === 4 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Step 4 — Review Deployment Summary</h2>
            <p className="text-xs text-text-secondary">
              Confirm installation parameters, assign target facility & room, and submit for dynamic firmware generation.
            </p>
          </div>

          {/* Name and Location Config */}
          <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
            <h3 className="font-semibold text-text-primary text-sm">Deployment Identity & Placement</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-text-secondary font-medium">Deployment Name</label>
                <input
                  type="text"
                  value={deploymentName}
                  onChange={(e) => setDeploymentName(e.target.value)}
                  placeholder="e.g., Executive Suite 402 Occupancy"
                  className="mt-1 w-full rounded-lg bg-surface-hover border border-border p-2.5 text-text-primary focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="text-text-secondary font-medium">Target Facility</label>
                <select
                  value={selectedFacilityId}
                  onChange={(e) => setSelectedFacilityId(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-surface-hover border border-border p-2.5 text-text-primary focus:border-primary outline-none"
                >
                  {facilities.map((fac) => (
                    <option key={fac.id} value={fac.id}>
                      {fac.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-text-secondary font-medium">Target Room / Zone (Optional)</label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-surface-hover border border-border p-2.5 text-text-primary focus:border-primary outline-none"
                >
                  <option value="">Unassigned Zone</option>
                  {rooms.map((rm) => (
                    <option key={rm.id} value={rm.id}>
                      {rm.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Complete Specification Card */}
          <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
            <h3 className="font-semibold text-text-primary text-sm">Deployment Specification</h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-surface-hover border border-border">
                <span className="text-text-muted">Industry:</span>
                <p className="font-semibold text-text-primary uppercase mt-0.5">{selectedIndustry}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-hover border border-border">
                <span className="text-text-muted">Use Case:</span>
                <p className="font-semibold text-text-primary truncate mt-0.5">{selectedTemplate?.useCaseName}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-hover border border-border">
                <span className="text-text-muted">Board:</span>
                <p className="font-mono font-semibold text-text-primary mt-0.5">{chipModel}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-hover border border-border">
                <span className="text-text-muted">Est. Current:</span>
                <p className="font-mono font-semibold text-emerald-400 mt-0.5">
                  {validationResult?.totalPowerEstMa || 220} mA
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-border space-y-2 text-xs">
              <span className="font-medium text-text-secondary">Sensor Array:</span>
              <div className="flex flex-wrap gap-2">
                {sensors.map((s, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 font-medium"
                  >
                    {s.sensorType} ({s.model}) [GPIO {s.assignedPins.join(',')}]
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-border space-y-2 text-xs">
              <span className="font-medium text-text-secondary">Actuators:</span>
              <div className="flex flex-wrap gap-2">
                {actuators.map((a, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium"
                  >
                    {a.actuatorType} ({a.model}) [GPIO {a.assignedPin}]
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        {step > 1 ? (
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-hover border border-border text-text-primary rounded-lg text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        ) : (
          <div />
        )}

        <button
          onClick={handleNext}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
        >
          {step === 4 ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              {isLoading ? 'Creating Deployment...' : 'Create Deployment & Generate'}
            </>
          ) : (
            <>
              Next Step <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
