// ─────────────────────────────────────────────
// SENTINEL API — Deployment Template Service
// ─────────────────────────────────────────────

import type { DeploymentTemplate, IndustryType } from '@sentinel/types';

export const DEPLOYMENT_TEMPLATES: DeploymentTemplate[] = [
  {
    id: 'tpl-hotel-occupancy',
    name: 'Hotel Guest Privacy & Energy Automation',
    industry: 'hotel',
    useCaseId: 'room_occupancy_privacy',
    useCaseName: 'Hotel Guest Room Occupancy & Energy Setback',
    description:
      'High-reliability guest presence detection using millimeter-wave radar and PIR without optical imagery. Automatically modulates HVAC and lighting while guaranteeing zero privacy intrusion.',
    recommendedChipModel: 'ESP32-WROOM-32D',
    recommendedSensors: [
      {
        sensorType: 'MMWAVE',
        model: 'LD2410C',
        reason: 'Detects stationary sleeping guests via thoracic micro-motion breathing.',
        mandatory: true,
      },
      {
        sensorType: 'PIR',
        model: 'EKMC1601111',
        reason: 'Rapid macro-motion trigger upon entering room.',
        mandatory: true,
      },
      {
        sensorType: 'DOOR_MAGNETIC',
        model: 'MC-38',
        reason: 'Tracks room entry/exit transitions for occupancy state-machine resets.',
        mandatory: true,
      },
      {
        sensorType: 'CO2',
        model: 'SCD40',
        reason: 'Monitors guest ventilation air quality and verifies presence.',
        mandatory: false,
      },
      {
        sensorType: 'TEMPERATURE',
        model: 'SHT31-D',
        reason: 'Precision ambient temperature monitoring for HVAC setback verification.',
        mandatory: false,
      },
      {
        sensorType: 'WATER_LEAK',
        model: 'WL-01',
        reason: 'Bathroom and mini-bar flood detection to prevent property damage.',
        mandatory: false,
      },
    ],
    recommendedActuators: [
      {
        actuatorType: 'RELAY',
        model: 'SRD-05VDC-SL-C',
        reason: 'HVAC thermostat enable/disable and power circuit control.',
      },
      {
        actuatorType: 'STATUS_LED',
        model: 'ONBOARD_LED',
        reason: 'Technician provisioning and connectivity feedback indicator.',
      },
    ],
    defaultRuleNames: [
      'Hotel Energy Setback on Vacancy',
      'Door Transition Fusion Reset',
      'Bathroom Water Leak Emergency Alert',
    ],
    complianceFrameworks: ['GDPR Article 9 Privacy Preserved', 'ASHRAE 62.1 Ventilation'],
    icon: 'BuildingOfficeIcon',
  },
  {
    id: 'tpl-hospital-patient-safety',
    name: 'Hospital Room Inactivity & Fall Prevention',
    industry: 'hospital',
    useCaseId: 'patient_safety_monitoring',
    useCaseName: 'Patient Bed-Exit Assistance & Prolonged Inactivity',
    description:
      'Continuous, non-contact clinical room monitoring. Detects unexpected bed-exits, prolonged floor immobility, and respiratory pauses without cameras or wearables.',
    recommendedChipModel: 'ESP32-WROOM-32D',
    recommendedSensors: [
      {
        sensorType: 'MMWAVE',
        model: 'LD2410C',
        reason: 'Zero-contact respiratory movement and room presence tracking.',
        mandatory: true,
      },
      {
        sensorType: 'PIR',
        model: 'EKMC1601111',
        reason: 'Instantaneous transit detection when patient leaves bed perimeter.',
        mandatory: true,
      },
      {
        sensorType: 'PRESSURE',
        model: 'FSR-406',
        reason: 'Bed mat / mattress pressure trigger for instantaneous unassisted bed-exit warning.',
        mandatory: true,
      },
      {
        sensorType: 'SOUND_LEVEL',
        model: 'MAX4466',
        reason: 'Acoustic spike detection for distress calls or physical thuds/falls.',
        mandatory: false,
      },
      {
        sensorType: 'TEMPERATURE',
        model: 'SHT31-D',
        reason: 'Clinical environmental control for patient thermoregulation.',
        mandatory: false,
      },
    ],
    recommendedActuators: [
      {
        actuatorType: 'BUZZER',
        model: 'KY-006',
        reason: 'Local nurse audible notification during acute fall alert.',
      },
      {
        actuatorType: 'STATUS_LED',
        model: 'ONBOARD_LED',
        reason: 'Nurse station visual status beacon.',
      },
    ],
    defaultRuleNames: [
      'Hospital Bed-Exit Fall Alert',
      'Prolonged Immobility / Stasis Indication',
      'Acoustic Distress Spike Alert',
    ],
    complianceFrameworks: ['HIPAA Compliant (No Visual/PII)', 'Joint Commission Patient Safety Goal'],
    icon: 'HeartIcon',
  },
  {
    id: 'tpl-school-classroom-iaq',
    name: 'School Classroom IAQ & Ventilation Safeguard',
    industry: 'school',
    useCaseId: 'classroom_iaq_occupancy',
    useCaseName: 'Classroom CO2 & Overcapacity Monitoring',
    description:
      'Continuous indoor air quality (IAQ) and cognitive readiness monitoring. Ensures CO2 levels remain below statutory cognitive decline thresholds and detects after-hours presence.',
    recommendedChipModel: 'ESP32-WROOM-32D',
    recommendedSensors: [
      {
        sensorType: 'CO2',
        model: 'SCD40',
        reason: 'Photoacoustic NDIR CO2 sensor for classroom ventilation assessment.',
        mandatory: true,
      },
      {
        sensorType: 'TEMPERATURE',
        model: 'SHT31-D',
        reason: 'Classroom thermal comfort index tracking.',
        mandatory: true,
      },
      {
        sensorType: 'HUMIDITY',
        model: 'SHT31-D',
        reason: 'Respiratory infection transmission risk mitigation (40-60% target).',
        mandatory: true,
      },
      {
        sensorType: 'PIR',
        model: 'EKMC1601111',
        reason: 'Occupancy validation and after-hours trespass detection.',
        mandatory: true,
      },
      {
        sensorType: 'LIGHT',
        model: 'BH1750',
        reason: 'Daylight harvesting illumination monitoring.',
        mandatory: false,
      },
    ],
    recommendedActuators: [
      {
        actuatorType: 'RELAY',
        model: 'SRD-05VDC-SL-C',
        reason: 'Damper actuator or ventilation exhaust fan interlock.',
      },
      {
        actuatorType: 'STATUS_LED',
        model: 'ONBOARD_LED',
        reason: 'Classroom IAQ green/yellow/red comfort status.',
      },
    ],
    defaultRuleNames: [
      'Classroom CO2 Exceedance Ventilation Boost',
      'After-Hours Unauthorized Motion Trigger',
      'Thermal Comfort Violation Notice',
    ],
    complianceFrameworks: ['ASHRAE 62.1-2022', 'WELL Building Standard v2'],
    icon: 'AcademicCapIcon',
  },
  {
    id: 'tpl-schoolbus-safety',
    name: 'School Bus Anti-Abandonment & Safety Monitor',
    industry: 'school_bus',
    useCaseId: 'child_left_behind_protection',
    useCaseName: 'School Bus Child-Left-Behind Anti-Abandonment',
    description:
      'Autonomous passenger presence verification after vehicle shutdown. Fuses 24GHz radar breathing detection, PIR motion, door magnetic cycling, GPS location, and thermal monitoring to eliminate child abandonment.',
    recommendedChipModel: 'ESP32-WROOM-32D',
    recommendedSensors: [
      {
        sensorType: 'MMWAVE',
        model: 'LD2410C',
        reason: 'Detects sleeping child breathing motion between bus seat backs.',
        mandatory: true,
      },
      {
        sensorType: 'PIR',
        model: 'EKMC1601111',
        reason: 'Covers main central aisle for passenger movement.',
        mandatory: true,
      },
      {
        sensorType: 'DOOR_MAGNETIC',
        model: 'MC-38',
        reason: 'Tracks passenger entry/exit door open/close sequence.',
        mandatory: true,
      },
      {
        sensorType: 'GPS',
        model: 'NEO-6M',
        reason: 'Live vehicle coordinate tracking during emergency alerts.',
        mandatory: true,
      },
      {
        sensorType: 'TEMPERATURE',
        model: 'SHT31-D',
        reason: 'Internal vehicle cabin heatstroke warning (detects dangerous thermal spikes).',
        mandatory: true,
      },
    ],
    recommendedActuators: [
      {
        actuatorType: 'BUZZER',
        model: 'KY-006',
        reason: 'Onboard high-decibel local alert.',
      },
      {
        actuatorType: 'RELAY',
        model: 'SRD-05VDC-SL-C',
        reason: 'Vehicle external horn or emergency hazard light relay trigger.',
      },
      {
        actuatorType: 'STATUS_LED',
        model: 'ONBOARD_LED',
        reason: 'Driver dashboard inspection cleared indicator.',
      },
    ],
    defaultRuleNames: [
      'Bus Engine Off Abandonment Check',
      'Cabin Heatstroke Threat Emergency Alarm',
      'Door Cycled Uninspected Departure Warning',
    ],
    complianceFrameworks: ['Federal Motor Vehicle Safety Standards (FMVSS)', 'Child Safety Act'],
    icon: 'TruckIcon',
  },
  {
    id: 'tpl-office-workspace',
    name: 'Smart Office Workspace & Meeting Room Optimization',
    industry: 'office',
    useCaseId: 'office_space_utilization',
    useCaseName: 'Meeting Room Utilization & Energy Management',
    description:
      'Real-time meeting room occupancy sensing and automated ghost-booking release. Optimizes HVAC and lighting based on actual headcount and desk utilization.',
    recommendedChipModel: 'ESP32-WROOM-32D',
    recommendedSensors: [
      {
        sensorType: 'MMWAVE',
        model: 'LD2410C',
        reason: 'Detects desk workers typing or sitting stationary.',
        mandatory: true,
      },
      {
        sensorType: 'PIR',
        model: 'EKMC1601111',
        reason: 'Instant room entry light trigger.',
        mandatory: true,
      },
      {
        sensorType: 'CO2',
        model: 'SCD40',
        reason: 'Monitors conference room stale air and cognitive fatigue.',
        mandatory: false,
      },
      {
        sensorType: 'LIGHT',
        model: 'BH1750',
        reason: 'Automated daylight harvesting lighting regulation.',
        mandatory: false,
      },
    ],
    recommendedActuators: [
      {
        actuatorType: 'RELAY',
        model: 'SRD-05VDC-SL-C',
        reason: 'Lighting and HVAC relay control.',
      },
      {
        actuatorType: 'STATUS_LED',
        model: 'ONBOARD_LED',
        reason: 'Meeting room availability exterior display.',
      },
    ],
    defaultRuleNames: [
      'Ghost Meeting Room Auto-Release',
      'HVAC Energy Setback on Empty Room',
      'High CO2 Ventilation Request',
    ],
    complianceFrameworks: ['LEED v4.1 Energy & Atmosphere', 'BREEAM Health and Wellbeing'],
    icon: 'BriefcaseIcon',
  },
  {
    id: 'tpl-mall-crowd',
    name: 'Commercial Mall Crowd Density & Climate Zone',
    industry: 'mall',
    useCaseId: 'mall_crowd_and_safety',
    useCaseName: 'Zone Occupancy & Crowd Density Tracking',
    description:
      'Privacy-preserving foot-traffic density monitoring across concourses, atriums, and dining areas. Controls ventilation and detects emergency crowding conditions.',
    recommendedChipModel: 'ESP32-WROOM-32D',
    recommendedSensors: [
      {
        sensorType: 'MMWAVE',
        model: 'LD2410C',
        reason: 'Micro-motion target tracking for density estimation.',
        mandatory: true,
      },
      {
        sensorType: 'PIR',
        model: 'EKMC1601111',
        reason: 'Perimeter corridor movement monitoring.',
        mandatory: true,
      },
      {
        sensorType: 'CO2',
        model: 'SCD40',
        reason: 'Atrium fresh air circulation control.',
        mandatory: true,
      },
      {
        sensorType: 'SOUND_LEVEL',
        model: 'MAX4466',
        reason: 'Noise level monitoring and emergency disturbance detection.',
        mandatory: false,
      },
    ],
    recommendedActuators: [
      {
        actuatorType: 'RELAY',
        model: 'SRD-05VDC-SL-C',
        reason: 'HVAC booster fan control.',
      },
      {
        actuatorType: 'STATUS_LED',
        model: 'ONBOARD_LED',
        reason: 'Zone maintenance status beacon.',
      },
    ],
    defaultRuleNames: [
      'Crowd Density Surge Ventilation Boost',
      'Acoustic Anomaly Detection',
      'After-Hours Mall Perimeter Breach',
    ],
    complianceFrameworks: ['NFPA 101 Life Safety Code', 'Local Fire Marshall Occupancy Limits'],
    icon: 'ShoppingBagIcon',
  },
  {
    id: 'tpl-factory-machinery',
    name: 'Industrial Machinery Vibration & Climate Safeguard',
    industry: 'factory',
    useCaseId: 'machinery_predictive_monitoring',
    useCaseName: 'Equipment Vibration & Environmental Safety',
    description:
      'Continuous vibration, current draw, and toxic gas monitoring on critical industrial motors, pumps, and manufacturing cells. Enables predictive maintenance and immediate safety shutoffs.',
    recommendedChipModel: 'ESP32-WROOM-32D',
    recommendedSensors: [
      {
        sensorType: 'VIBRATION',
        model: 'SW-420',
        reason: 'High-frequency mechanical vibration anomaly detector for bearing wear.',
        mandatory: true,
      },
      {
        sensorType: 'CURRENT',
        model: 'SCT-013-000',
        reason: 'Non-invasive AC current clamp for motor load and stall monitoring.',
        mandatory: true,
      },
      {
        sensorType: 'TEMPERATURE',
        model: 'SHT31-D',
        reason: 'Motor casing and enclosure thermal tracking.',
        mandatory: true,
      },
      {
        sensorType: 'GAS',
        model: 'MQ-2',
        reason: 'Combustible gas and vapor leak detection in production bays.',
        mandatory: false,
      },
      {
        sensorType: 'SMOKE',
        model: 'MQ-2',
        reason: 'Early electrical fault smoke emission detection.',
        mandatory: false,
      },
    ],
    recommendedActuators: [
      {
        actuatorType: 'RELAY',
        model: 'SRD-05VDC-SL-C',
        reason: 'Emergency machine interlock cutoff relay.',
      },
      {
        actuatorType: 'BUZZER',
        model: 'KY-006',
        reason: 'Factory floor acoustic siren.',
      },
    ],
    defaultRuleNames: [
      'Machinery Excessive Vibration Warning',
      'Motor Current Spike Overload Trip',
      'Hazardous Gas Threshold Interlock',
    ],
    complianceFrameworks: ['ISO 10816 Vibration Severity', 'OSHA 1910 Industrial Safety'],
    icon: 'WrenchScrewdriverIcon',
  },
  {
    id: 'tpl-warehouse-perimeter',
    name: 'Warehouse Cold-Chain & Perimeter Security',
    industry: 'warehouse',
    useCaseId: 'cold_chain_and_perimeter',
    useCaseName: 'Cold-Storage Climate & Perimeter Security',
    description:
      'Dual-function warehouse telemetry. Monitors temperature and humidity critical thresholds in storage aisles and detects unauthorized door breaches during non-shift hours.',
    recommendedChipModel: 'ESP32-WROOM-32D',
    recommendedSensors: [
      {
        sensorType: 'TEMPERATURE',
        model: 'SHT31-D',
        reason: 'High-precision temperature monitoring for perishable goods.',
        mandatory: true,
      },
      {
        sensorType: 'HUMIDITY',
        model: 'SHT31-D',
        reason: 'Condensation and mold mitigation.',
        mandatory: true,
      },
      {
        sensorType: 'DOOR_MAGNETIC',
        model: 'MC-38',
        reason: 'Loading dock and cold-store roll-up door open/close tracking.',
        mandatory: true,
      },
      {
        sensorType: 'PIR',
        model: 'EKMC1601111',
        reason: 'Aisle motion detection and security verification.',
        mandatory: true,
      },
      {
        sensorType: 'FLAME',
        model: 'YG1006',
        reason: 'Rapid infrared flame optical sensor for high-bay fire prevention.',
        mandatory: false,
      },
    ],
    recommendedActuators: [
      {
        actuatorType: 'BUZZER',
        model: 'KY-006',
        reason: 'Loading dock door-left-open buzzer.',
      },
      {
        actuatorType: 'STATUS_LED',
        model: 'ONBOARD_LED',
        reason: 'Aisle health beacon.',
      },
    ],
    defaultRuleNames: [
      'Cold Chain Excursion Critical Alert',
      'Loading Dock Door Propped Open Warning',
      'After-Hours Warehouse Intrusion Alarm',
    ],
    complianceFrameworks: ['FDA 21 CFR Part 11 Good Storage Practice', 'EN 12830 Cold Chain'],
    icon: 'ArchiveBoxIcon',
  },
  {
    id: 'tpl-parking-bay',
    name: 'Smart Parking Bay Occupancy & Guidance',
    industry: 'parking',
    useCaseId: 'parking_bay_monitoring',
    useCaseName: 'Vehicle Bay Presence & Availability',
    description:
      'Accurate overhead vehicle detection using ultrasonic distance sensing and optical guidance. Relays real-time availability to digital signage and parking guidance systems.',
    recommendedChipModel: 'ESP32-WROOM-32D',
    recommendedSensors: [
      {
        sensorType: 'ULTRASONIC',
        model: 'HC-SR04P',
        reason: '3.3V-compatible ultrasonic bay distance measurement for vehicle presence.',
        mandatory: true,
      },
      {
        sensorType: 'PIR',
        model: 'EKMC1601111',
        reason: 'Pedestrian motion detection in parking aisles for security lighting.',
        mandatory: false,
      },
      {
        sensorType: 'LIGHT',
        model: 'BH1750',
        reason: 'Garage ramp lux measurement for dynamic lighting control.',
        mandatory: false,
      },
    ],
    recommendedActuators: [
      {
        actuatorType: 'STATUS_LED',
        model: 'RGB_NEOPIXEL',
        reason: 'Red/Green/Blue overhead bay vacancy indicator.',
      },
      {
        actuatorType: 'RELAY',
        model: 'SRD-05VDC-SL-C',
        reason: 'Aisle lighting automation relay.',
      },
    ],
    defaultRuleNames: [
      'Vehicle Bay State Transition (Vacant <-> Occupied)',
      'Reserved Bay Unauthorized Parking Alert',
      'Energy-Saving Lighting Automation on Inactivity',
    ],
    complianceFrameworks: ['ADA Parking Guidelines', 'Green Garage Energy Efficiency'],
    icon: 'Square3Stack3DIcon',
  },
  {
    id: 'tpl-public-facility',
    name: 'Public Facility Sanitation & Occupancy',
    industry: 'public_facility',
    useCaseId: 'public_facility_hygiene',
    useCaseName: 'Restroom Hygiene & Stall Occupancy',
    description:
      'Autonomous occupancy counter and sanitation monitoring for public transit hubs, stadiums, and civic buildings. Tracks stall turnover and detects plumbing water leaks.',
    recommendedChipModel: 'ESP32-WROOM-32D',
    recommendedSensors: [
      {
        sensorType: 'DOOR_MAGNETIC',
        model: 'MC-38',
        reason: 'Stall door lock/unlock sensor for occupancy tracking.',
        mandatory: true,
      },
      {
        sensorType: 'PIR',
        model: 'EKMC1601111',
        reason: 'Total restroom footfall counting.',
        mandatory: true,
      },
      {
        sensorType: 'WATER_LEAK',
        model: 'WL-01',
        reason: 'Floor water pooling detection to prevent slip hazards.',
        mandatory: true,
      },
      {
        sensorType: 'GAS',
        model: 'MQ-135',
        reason: 'Air quality and odor index monitoring for dynamic cleaning dispatch.',
        mandatory: false,
      },
    ],
    recommendedActuators: [
      {
        actuatorType: 'RELAY',
        model: 'SRD-05VDC-SL-C',
        reason: 'Ventilation exhaust fan boost.',
      },
      {
        actuatorType: 'STATUS_LED',
        model: 'ONBOARD_LED',
        reason: 'Janitorial service requested indicator.',
      },
    ],
    defaultRuleNames: [
      'Water Leak Flood Alarm',
      'Janitorial Dispatch on Footfall Count Exceeded',
      'Stall Prolonged Lock Safety Check',
    ],
    complianceFrameworks: ['OSHA Sanitation Standard', 'Public Health Code Standards'],
    icon: 'BuildingStorefrontIcon',
  },
  {
    id: 'tpl-custom',
    name: 'Custom Multi-Sensor Deployment',
    industry: 'custom',
    useCaseId: 'custom_iot_architecture',
    useCaseName: 'Custom Hardware Architecture',
    description:
      'Fully customizable deployment template. Select any combination of supported environmental, motion, industrial, or security sensors and actuators with automated pin conflict checking.',
    recommendedChipModel: 'ESP32-WROOM-32D',
    recommendedSensors: [],
    recommendedActuators: [
      {
        actuatorType: 'STATUS_LED',
        model: 'ONBOARD_LED',
        reason: 'Hardware heartbeat and provisioning status.',
      },
    ],
    defaultRuleNames: ['Custom Heartbeat Rule'],
    complianceFrameworks: ['Custom Policy Framework'],
    icon: 'CpuChipIcon',
  },
];

export class DeploymentTemplateService {
  /**
   * Return all system deployment templates.
   */
  static getAllTemplates(): DeploymentTemplate[] {
    return [...DEPLOYMENT_TEMPLATES];
  }

  /**
   * Filter templates by industry.
   */
  static getTemplatesByIndustry(industry: IndustryType): DeploymentTemplate[] {
    // If industry is custom, return custom template, otherwise match industry or custom
    return DEPLOYMENT_TEMPLATES.filter(
      (tpl) => tpl.industry === industry || tpl.industry === 'custom'
    );
  }

  /**
   * Retrieve a specific template by its ID.
   */
  static getTemplateById(templateId: string): DeploymentTemplate | undefined {
    return DEPLOYMENT_TEMPLATES.find((tpl) => tpl.id === templateId);
  }
}

