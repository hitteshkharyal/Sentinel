// ─────────────────────────────────────────────
// @sentinel/types — Deployment Center & Dynamic Firmware Generator
// ─────────────────────────────────────────────

import type { IndustryType } from './organization.js';
import type { ChipModel, SensorInterface, SensorType } from './device.js';
import type { SensorCategory } from './sensor.js';

export type DeploymentStatus =
  | 'DRAFT'
  | 'CONFIGURED'
  | 'FIRMWARE_GENERATED'
  | 'PROVISIONING'
  | 'TESTING'
  | 'ACTIVE'
  | 'FAILED'
  | 'ARCHIVED';

export type DeploymentRole =
  | 'SUPERVISOR'
  | 'TECHNICIAN'
  | 'OPERATOR'
  | 'SECURITY'
  | 'VIEWER'
  | 'INSTALLER';

export type BoardType =
  | 'ESP32_DEV'
  | 'ESP32_DEVKIT'
  | 'ESP8266_NODEMCU'
  | 'ESP8266_WEMOS_D1';

export interface DeploymentTeamMember {
  userId?: string;
  email: string;
  displayName?: string;
  role: DeploymentRole;
  assignedAt: string;
  assignedBy: string;
  status: 'ACTIVE' | 'INVITED' | 'REMOVED';
}

export interface SingleFileFirmwareConfig {
  boardType: BoardType;
  wifiSsid: string;
  wifiPassword?: string;
  serverUrl: string;
  telemetryIntervalMs?: number;
  deviceId?: string;
  apiKey?: string;
}

export interface SingleFileFirmwareResult {
  filename: string;
  content: string;
  boardType: BoardType;
  requiredLibraries: string[];
  installGuide: string;
  generatedAt: string;
  sensorsCount: number;
  pinSummary: { sensor: string; pins: string; interfaceType: string }[];
}

export interface DeviceApiKeyInfo {
  deviceId: string;
  deploymentId: string;
  keyPrefix: string;
  maskedKey: string;
  fullKey?: string;
  status: 'ACTIVE' | 'REVOKED';
  createdAt: string;
  lastUsedAt?: string;
}

export interface SensorDataPayload {
  deviceId?: string;
  sensors: Record<string, number | boolean | string | Record<string, unknown>>;
  timestamp?: string;
}

export type HardwareCompatibilitySeverity = 'ERROR' | 'WARNING' | 'INFO';

export interface PinAssignment {
  sensorType: SensorType;
  sensorModel: string;
  interfaceType: SensorInterface;
  gpioPins: {
    pinNumber: number;
    pinFunction: 'SDA' | 'SCL' | 'DIGITAL_IN' | 'DIGITAL_OUT' | 'ANALOG_IN' | 'UART_RX' | 'UART_TX' | 'PWM';
    requiredVoltage: '3.3V' | '5V';
  }[];
}

export interface PinConflict {
  pinNumber: number;
  conflictingSensors: string[];
  reason: string;
}

export interface HardwareValidationIssue {
  severity: HardwareCompatibilitySeverity;
  code: string;
  message: string;
  suggestedAction?: string;
}

export interface HardwareValidationResult {
  valid: boolean;
  conflicts: PinConflict[];
  issues: HardwareValidationIssue[];
  totalPowerEstMa: number;
  requiredInterfaces: SensorInterface[];
}

export interface SelectedSensorConfig {
  sensorType: SensorType;
  model: string;
  manufacturer: string;
  category: SensorCategory;
  interfaceType: SensorInterface;
  assignedPins: number[];
  i2cAddress?: string;
  samplingIntervalMs: number;
  isMandatory: boolean;
  requiredAmplifierModule?: string;
  isolatedInterfaceRequired?: boolean;
}

export interface SelectedActuatorConfig {
  actuatorType: 'RELAY' | 'BUZZER' | 'STATUS_LED' | 'SERVO' | 'MOTOR';
  model: string;
  assignedPin: number;
  activeLevel: 'HIGH' | 'LOW';
}

export interface DeploymentHardwareConfig {
  chipModel: ChipModel;
  boardName: string;
  operatingVoltage: '3.3V' | '5V';
  powerSource: 'USB' | 'MAINS' | 'POE' | 'BATTERY';
  sensors: SelectedSensorConfig[];
  actuators: SelectedActuatorConfig[];
  i2cBus: {
    sdaPin: number;
    sclPin: number;
    frequencyHz: number;
  };
  uart2?: {
    rxPin: number;
    txPin: number;
    baudRate: number;
  };
}

export interface DeploymentTemplate {
  id: string;
  name: string;
  industry: IndustryType;
  useCaseId: string;
  useCaseName: string;
  description: string;
  recommendedChipModel: ChipModel;
  recommendedSensors: {
    sensorType: SensorType;
    model: string;
    reason: string;
    mandatory: boolean;
  }[];
  recommendedActuators: {
    actuatorType: 'RELAY' | 'BUZZER' | 'STATUS_LED' | 'SERVO' | 'MOTOR';
    model: string;
    reason: string;
  }[];
  defaultRuleNames: string[];
  complianceFrameworks: string[];
  icon: string;
}

export interface FirmwareManifest {
  manifestVersion: string;
  deploymentId: string;
  organizationId: string;
  facilityId: string;
  roomId?: string;
  deviceId: string;
  chipModel: ChipModel;
  firmwareVersion: string;
  generatedAt: string;
  generatedByUserId: string;
  includedDrivers: string[];
  excludedDrivers: string[];
  pinMappings: Record<string, unknown>;
  mqttTopics: {
    telemetry: string;
    status: string;
    command: string;
    config: string;
    ack: string;
  };
  integrityHash: string;
}

export interface FirmwareBuildArtifact {
  id: string;
  deploymentId: string;
  organizationId: string;
  version: string;
  status: 'PENDING' | 'BUILDING' | 'READY' | 'FAILED';
  manifest: FirmwareManifest;
  downloadUrl?: string;
  fileSizeBytes?: number;
  errorMessage?: string;
  createdAt: string;
}

export interface HardwareTestReading {
  sensorType: SensorType;
  status: 'WORKING' | 'WARNING' | 'ERROR' | 'NO_DATA';
  value: string | number | boolean | Record<string, unknown>;
  unit?: string;
  lastReceivedAt: string;
  isSimulated: boolean;
}

export interface HardwareTestScorecard {
  sessionId: string;
  deploymentId: string;
  deviceId: string;
  testedAt: string;
  overallResult: 'PASS' | 'FAIL' | 'IN_PROGRESS';
  checks: {
    deviceConnection: 'PASS' | 'FAIL' | 'PENDING';
    mqttConnection: 'PASS' | 'FAIL' | 'PENDING';
    sensorValidation: 'PASS' | 'FAIL' | 'PENDING';
    telemetryReception: 'PASS' | 'FAIL' | 'PENDING';
    eventDetection: 'PASS' | 'FAIL' | 'PENDING';
    automationTrigger: 'PASS' | 'FAIL' | 'PENDING';
    alertDelivery: 'PASS' | 'FAIL' | 'PENDING';
  };
  sensorReadings: HardwareTestReading[];
  readinessSignOff: boolean;
  notes?: string;
}

export interface Deployment {
  id: string;
  organizationId: string;
  facilityId: string;
  facilityName?: string;
  roomId?: string;
  roomName?: string;
  deviceId?: string;
  name: string;
  description?: string;
  industry: IndustryType;
  useCaseId: string;
  useCaseName: string;
  status: DeploymentStatus;
  hardwareConfig: DeploymentHardwareConfig;
  latestFirmwareBuildId?: string;
  latestFirmwareVersion?: string;
  activeTestSessionId?: string;
  isReadinessApproved: boolean;
  team?: DeploymentTeamMember[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeploymentDTO {
  name: string;
  description?: string;
  facilityId: string;
  roomId?: string;
  industry: IndustryType;
  useCaseId: string;
  useCaseName: string;
  hardwareConfig: DeploymentHardwareConfig;
  team?: { email: string; role: DeploymentRole }[];
}

export interface UpdateDeploymentDTO {
  name?: string;
  description?: string;
  facilityId?: string;
  roomId?: string;
  hardwareConfig?: DeploymentHardwareConfig;
  status?: DeploymentStatus;
  team?: { email: string; role: DeploymentRole }[];
}
