// ─────────────────────────────────────────────
// SENTINEL API — Industry Policy Service (Day 15)
// ─────────────────────────────────────────────

import type {
  IndustryType,
  ComplianceFramework,
  IndustryPolicyTemplate,
  PolicyPack,
  PolicyPackApplicationResult,
  ApplyPolicyPackDTO,
} from '@sentinel/types';
import { AutomationService } from './automation.service.js';
import { AutomationRuleModel } from '../models/AutomationRule.js';

export class IndustryPolicyService {
  /**
   * Complete Registry of 24 Industry Policy Templates across 8 Core Sectors
   * (3 high-impact enterprise policies per sector, strictly adhering to privacy-preserving principles)
   */
  private static readonly POLICY_TEMPLATES: IndustryPolicyTemplate[] = [
    // ════════════════════════════════════════════════════════════════
    // 1. School Transport (SEC_TRANS)
    // ════════════════════════════════════════════════════════════════
    {
      id: 'template_trans_01',
      industry: 'transport',
      code: 'SEC_TRANS_01',
      name: 'Zero Child Left Behind Post-Trip Egress Sweep',
      description:
        'Engages vehicle horn relay, flashes hazard beacons, and alerts dispatch when breathing cadence or presence is detected inside a parked bus after driver departs.',
      category: 'SAFETY',
      frameworks: ['FERPA_COPPA', 'OSHA_1910'],
      triggerEventType: 'PERSON_LEFT_BEHIND',
      defaultConditions: [{ field: 'confidence', operator: 'gte', value: 85 }],
      defaultActions: [
        { type: 'RELAY', simulated: true, params: { relayPin: 12, state: true } },
        { type: 'BUZZER', simulated: true, params: { durationMs: 5000 } },
        { type: 'CREATE_ALERT', simulated: true, params: { severity: 'CRITICAL', title: 'Child Left Behind in Vehicle' } },
        { type: 'SEND_NOTIFICATION', simulated: true, params: { priority: 'URGENT', role: 'SECURITY' } },
      ],
      cooldownMs: 30000,
      priority: 'CRITICAL',
      privacyPreservingNote: '100% compliant with student privacy. Uses 60GHz mmWave micro-movement radar; zero optical cameras.',
    },
    {
      id: 'template_trans_02',
      industry: 'transport',
      code: 'SEC_TRANS_02',
      name: 'Post-Trip Bus Door Sealed Vital Sweep',
      description:
        'Initiates a 180-second high-sensitivity cabin sweep when bus doors are latched following route completion.',
      category: 'SAFETY',
      frameworks: ['FERPA_COPPA'],
      triggerEventType: 'PROLONGED_INACTIVITY',
      defaultConditions: [{ field: 'confidence', operator: 'gte', value: 80 }],
      defaultActions: [
        { type: 'CREATE_ALERT', simulated: true, params: { severity: 'WARNING', title: 'Post-Trip Sweep Verification' } },
        { type: 'SEND_NOTIFICATION', simulated: true, params: { priority: 'HIGH', role: 'OPERATOR' } },
      ],
      cooldownMs: 60000,
      priority: 'HIGH',
      privacyPreservingNote: 'Non-optical radar telemetry only; verifies empty seats by RF reflection.',
    },
    {
      id: 'template_trans_03',
      industry: 'transport',
      code: 'SEC_TRANS_03',
      name: 'Parked Cabin Heat Excursion Ventilation Interlock',
      description:
        'Activates roof emergency exhaust fans and alerts operations when interior cabin temperature exceeds 35°C in idle vehicle.',
      category: 'SAFETY',
      frameworks: ['OSHA_1910', 'FERPA_COPPA'],
      triggerEventType: 'HIGH_TEMPERATURE',
      defaultConditions: [{ field: 'inputSignals.temperature', operator: 'gte', value: 35 }],
      defaultActions: [
        { type: 'VENTILATION_INCREASE', simulated: true, params: { speed: 'boost' } },
        { type: 'CREATE_ALERT', simulated: true, params: { severity: 'CRITICAL', title: 'Bus Cabin Dangerous Temperature Excursion' } },
      ],
      cooldownMs: 120000,
      priority: 'CRITICAL',
      privacyPreservingNote: 'Measures barometric temperature telemetry without collecting passenger metadata.',
    },

    // ════════════════════════════════════════════════════════════════
    // 2. Hospitals & Elder Care (SEC_MED)
    // ════════════════════════════════════════════════════════════════
    {
      id: 'template_med_01',
      industry: 'hospital',
      code: 'SEC_MED_01',
      name: 'Private Bathroom Fall & Immobility Emergency Response',
      description:
        'Unlocks bathroom magnetic emergency latch, illuminates low-glare floor path, and buzzes duty nurse pager console within 4s upon fall indication.',
      category: 'SAFETY',
      frameworks: ['HIPAA', 'WELL_LEED'],
      triggerEventType: 'ASSISTANCE_INDICATION',
      defaultConditions: [{ field: 'confidence', operator: 'gte', value: 75 }],
      defaultActions: [
        { type: 'RELAY', simulated: true, params: { relayPin: 4, action: 'UNLOCK_MAGNETIC_LATCH' } },
        { type: 'LIGHT_ON', simulated: true, params: { brightness: 60, colorTemp: 2700 } },
        { type: 'CREATE_ALERT', simulated: true, params: { severity: 'CRITICAL', title: 'Patient Fall Detected in Private Bathroom' } },
        { type: 'ESCALATE_ALERT', simulated: true, params: { targetRole: 'NURSE_STATION', timeoutSeconds: 4 } },
      ],
      cooldownMs: 15000,
      priority: 'CRITICAL',
      privacyPreservingNote: 'Full HIPAA Title II compliance. Operates in steam, darkness, and private showers with zero video or optical sensors.',
    },
    {
      id: 'template_med_02',
      industry: 'hospital',
      code: 'SEC_MED_02',
      name: 'Negative Pressure Airborne Infection Isolation Guard',
      description:
        'Boosts exhaust blowers and sounds isolation console alarm when differential pressure between anteroom and patient room drops below safe threshold.',
      category: 'COMPLIANCE',
      frameworks: ['ASHRAE_62_1', 'HIPAA'],
      triggerEventType: 'ENVIRONMENTAL_ANOMALY',
      defaultConditions: [{ field: 'inputSignals.pressureDrop', operator: 'gt', value: 2.5 }],
      defaultActions: [
        { type: 'VENTILATION_INCREASE', simulated: true, params: { speed: 'boost' } },
        { type: 'CREATE_ALERT', simulated: true, params: { severity: 'HIGH', title: 'Airborne Isolation Negative Pressure Breached' } },
      ],
      cooldownMs: 60000,
      priority: 'HIGH',
      privacyPreservingNote: 'Precision differential pressure barometry; no patient tracking required.',
    },
    {
      id: 'template_med_03',
      industry: 'hospital',
      code: 'SEC_MED_03',
      name: 'Post-Surgical Patient Bed-Exit Night Assist',
      description:
        'Activates gentle floor guidance amber pathway lights when elderly patient sits up at bedside during darkness hours to prevent disorientation.',
      category: 'SAFETY',
      frameworks: ['HIPAA', 'WELL_LEED'],
      triggerEventType: 'ROOM_OCCUPIED',
      defaultConditions: [
        { field: 'confidence', operator: 'gte', value: 80 },
        { field: 'inputSignals.ambientLightLux', operator: 'lte', value: 10 },
      ],
      defaultActions: [
        { type: 'LIGHT_ON', simulated: true, params: { color: 'amber', brightness: 25 } },
      ],
      cooldownMs: 30000,
      priority: 'STANDARD',
      privacyPreservingNote: 'mmWave velocity vector telemetry only; no camera imagery.',
    },

    // ════════════════════════════════════════════════════════════════
    // 3. Schools & Campuses (SEC_EDU)
    // ════════════════════════════════════════════════════════════════
    {
      id: 'template_edu_01',
      industry: 'school',
      code: 'SEC_EDU_01',
      name: 'Classroom Cognitive Air Quality & Fresh Air Damper Boost',
      description:
        'Opens motorized fresh air HVAC dampers to 100% when classroom CO₂ exceeds 1,000 ppm to preserve cognitive test performance and student focus.',
      category: 'COMFORT',
      frameworks: ['ASHRAE_62_1', 'WELL_LEED'],
      triggerEventType: 'HIGH_CO2',
      defaultConditions: [{ field: 'inputSignals.co2Ppm', operator: 'gte', value: 1000 }],
      defaultActions: [
        { type: 'VENTILATION_INCREASE', simulated: true, params: { speed: 'boost', damperPercentage: 100 } },
        { type: 'CREATE_ALERT', simulated: true, params: { severity: 'LOW', title: 'Classroom CO₂ Fresh Air Ventilation Boost' } },
      ],
      cooldownMs: 120000,
      priority: 'HIGH',
      privacyPreservingNote: 'Photoacoustic Sensirion SCD40 CO₂ telemetry protects student minors without cameras.',
    },
    {
      id: 'template_edu_02',
      industry: 'school',
      code: 'SEC_EDU_02',
      name: 'Unoccupied Classroom Energy Conservation Setback',
      description:
        'Transfers classroom HVAC to ECO setpoint and extinguishes overhead lighting when students and faculty clear the space for >10 minutes.',
      category: 'ENERGY',
      frameworks: ['ASHRAE_55', 'WELL_LEED'],
      triggerEventType: 'ROOM_VACANT',
      defaultConditions: [{ field: 'confidence', operator: 'gte', value: 85 }],
      defaultActions: [
        { type: 'HVAC_ECO', simulated: true },
        { type: 'LIGHT_OFF', simulated: true },
      ],
      cooldownMs: 60000,
      priority: 'STANDARD',
      privacyPreservingNote: 'Pure radar RF reflection and PIR motion; zero facial recognition.',
    },
    {
      id: 'template_edu_03',
      industry: 'school',
      code: 'SEC_EDU_03',
      name: 'Exam Hall & Study Library Decibel Disturbance Guard',
      description:
        'Notifies exam proctor or floor librarian if sustained acoustic noise level exceeds 70 dBA in designated quiet study zones.',
      category: 'COMFORT',
      frameworks: ['WELL_LEED'],
      triggerEventType: 'ABNORMAL_ACTIVITY',
      defaultConditions: [{ field: 'inputSignals.soundDb', operator: 'gte', value: 70 }],
      defaultActions: [
        { type: 'CREATE_ALERT', simulated: true, params: { severity: 'LOW', title: 'Library Study Quiet Zone Noise Excursion' } },
        { type: 'SEND_NOTIFICATION', simulated: true, params: { role: 'OPERATOR' } },
      ],
      cooldownMs: 180000,
      priority: 'STANDARD',
      privacyPreservingNote: 'Peak SPL decibel sound pressure only; does not record audio bytes or speech.',
    },

    // ════════════════════════════════════════════════════════════════
    // 4. Hotels & Hospitality (SEC_HOSP)
    // ════════════════════════════════════════════════════════════════
    {
      id: 'template_hosp_01',
      industry: 'hotel',
      code: 'SEC_HOSP_01',
      name: 'Frictionless Guest Room Eco-Setback On Departure',
      description:
        'Shifts HVAC thermostat to Eco-Setback (+2°C in summer, -2°C in winter) and powers down lighting 20 minutes after guest vacates room.',
      category: 'ENERGY',
      frameworks: ['ASHRAE_55', 'WELL_LEED'],
      triggerEventType: 'ROOM_VACANT',
      defaultConditions: [{ field: 'confidence', operator: 'gte', value: 90 }],
      defaultActions: [
        { type: 'HVAC_ECO', simulated: true },
        { type: 'LIGHT_OFF', simulated: true },
      ],
      cooldownMs: 120000,
      priority: 'HIGH',
      privacyPreservingNote: 'Absolute guest confidentiality. Zero cameras inside private suites; eliminates keycard bypass hacks.',
    },
    {
      id: 'template_hosp_02',
      industry: 'hotel',
      code: 'SEC_HOSP_02',
      name: 'Silent Night Micro-Climate Comfort Mode',
      description:
        'Restores HVAC setpoint to optimal thermal comfort (21.5°C) with low fan acoustics when guest is resting in the suite.',
      category: 'COMFORT',
      frameworks: ['ASHRAE_55'],
      triggerEventType: 'ROOM_OCCUPIED',
      defaultConditions: [{ field: 'confidence', operator: 'gte', value: 80 }],
      defaultActions: [
        { type: 'HVAC_COMFORT', simulated: true },
      ],
      cooldownMs: 60000,
      priority: 'STANDARD',
      privacyPreservingNote: 'mmWave micro-movement detects sleeping breathing cadence without video.',
    },
    {
      id: 'template_hosp_03',
      industry: 'hotel',
      code: 'SEC_HOSP_03',
      name: 'Real-Time Housekeeping Dispatch on Guest Departure',
      description:
        'Queues room for housekeeping turnover as soon as guest departs after morning checkout hours.',
      category: 'COMPLIANCE',
      frameworks: ['GDPR_ART9'],
      triggerEventType: 'ROOM_VACANT',
      defaultConditions: [{ field: 'confidence', operator: 'gte', value: 95 }],
      defaultActions: [
        { type: 'SEND_NOTIFICATION', simulated: true, params: { role: 'OPERATOR', message: 'Room ready for housekeeping inspection' } },
      ],
      cooldownMs: 300000,
      priority: 'STANDARD',
      privacyPreservingNote: 'Anonymous binary occupancy state; no guest identification.',
    },

    // ════════════════════════════════════════════════════════════════
    // 5. Corporate Offices (SEC_CORP)
    // ════════════════════════════════════════════════════════════════
    {
      id: 'template_corp_01',
      industry: 'office',
      code: 'SEC_CORP_01',
      name: 'Dynamic Hot-Desk Wing VAV Throttling',
      description:
        'Throttles variable air volume (VAV) ventilation dampers in dormant office wings when seat occupancy drops below 10%.',
      category: 'ENERGY',
      frameworks: ['ASHRAE_55', 'WELL_LEED'],
      triggerEventType: 'ROOM_VACANT',
      defaultConditions: [{ field: 'confidence', operator: 'gte', value: 85 }],
      defaultActions: [
        { type: 'HVAC_ECO', simulated: true },
        { type: 'LIGHT_OFF', simulated: true },
      ],
      cooldownMs: 180000,
      priority: 'HIGH',
      privacyPreservingNote: 'Respects worker dignity under GDPR Art 9; desk-level presence is anonymous and unlinked to worker identity.',
    },
    {
      id: 'template_corp_02',
      industry: 'office',
      code: 'SEC_CORP_02',
      name: 'Boardroom Overcapacity Demand Ventilation',
      description:
        'Boosts air exchange to maximum CFM when high seat density in conference rooms causes rapid CO₂ buildup.',
      category: 'COMFORT',
      frameworks: ['ASHRAE_62_1', 'WELL_LEED'],
      triggerEventType: 'HIGH_CO2',
      defaultConditions: [{ field: 'inputSignals.co2Ppm', operator: 'gte', value: 1100 }],
      defaultActions: [
        { type: 'VENTILATION_INCREASE', simulated: true, params: { speed: 'boost' } },
        { type: 'CREATE_ALERT', simulated: true, params: { severity: 'LOW', title: 'Conference Room CO₂ Demand Ventilation' } },
      ],
      cooldownMs: 60000,
      priority: 'HIGH',
      privacyPreservingNote: 'Aggregated room-level metrics only; zero webcam or screen monitoring.',
    },
    {
      id: 'template_corp_03',
      industry: 'office',
      code: 'SEC_CORP_03',
      name: 'After-Hours Intrusion & Perimeter Motion Alert',
      description:
        'Alerts security operations and illuminates corridor when motion is detected in corporate wings during lockdown hours.',
      category: 'SECURITY',
      frameworks: ['GDPR_ART9', 'OSHA_1910'],
      triggerEventType: 'AFTER_HOURS_PRESENCE',
      defaultConditions: [{ field: 'confidence', operator: 'gte', value: 85 }],
      defaultActions: [
        { type: 'LIGHT_ON', simulated: true, params: { brightness: 100 } },
        { type: 'CREATE_ALERT', simulated: true, params: { severity: 'HIGH', title: 'After-Hours Presence Detected' } },
        { type: 'SEND_NOTIFICATION', simulated: true, params: { priority: 'URGENT', role: 'SECURITY' } },
      ],
      cooldownMs: 30000,
      priority: 'HIGH',
      privacyPreservingNote: 'Detects presence through thermal PIR and RF radar without biometric recognition.',
    },

    // ════════════════════════════════════════════════════════════════
    // 6. Shopping Malls & Retail (SEC_RETL)
    // ════════════════════════════════════════════════════════════════
    {
      id: 'template_retl_01',
      industry: 'mall',
      code: 'SEC_RETL_01',
      name: 'Atrium & Escalator Egress Bottleneck Surge Relief',
      description:
        'Alerts floor security team and expands fresh air intake dampers during peak foot-traffic density surges near escalators and exits.',
      category: 'SAFETY',
      frameworks: ['GDPR_ART9', 'OSHA_1910'],
      triggerEventType: 'OVERCAPACITY',
      defaultConditions: [{ field: 'confidence', operator: 'gte', value: 80 }],
      defaultActions: [
        { type: 'VENTILATION_INCREASE', simulated: true, params: { speed: 'boost' } },
        { type: 'CREATE_ALERT', simulated: true, params: { severity: 'HIGH', title: 'Atrium Egress Density Surge' } },
        { type: 'SEND_NOTIFICATION', simulated: true, params: { role: 'SECURITY' } },
      ],
      cooldownMs: 60000,
      priority: 'HIGH',
      privacyPreservingNote: 'Complies with GDPR Article 9. No facial cameras or demographic profiling; spatial crowd density only.',
    },
    {
      id: 'template_retl_02',
      industry: 'mall',
      code: 'SEC_RETL_02',
      name: 'Atrium Thermal Stratification Air Destratification',
      description:
        'Engages high-volume low-speed (HVLS) fans when vertical thermal gradient between floor and skylight roof exceeds 4°C.',
      category: 'COMFORT',
      frameworks: ['ASHRAE_55', 'WELL_LEED'],
      triggerEventType: 'ENVIRONMENTAL_ANOMALY',
      defaultConditions: [{ field: 'confidence', operator: 'gte', value: 75 }],
      defaultActions: [
        { type: 'VENTILATION_INCREASE', simulated: true, params: { speed: 'normal' } },
      ],
      cooldownMs: 120000,
      priority: 'STANDARD',
      privacyPreservingNote: 'Barometric and temperature sensor arrays.',
    },
    {
      id: 'template_retl_03',
      industry: 'mall',
      code: 'SEC_RETL_03',
      name: 'Storefront Night Egress & Energy Lockdown',
      description:
        'Sets mall wing to overnight ECO setbacks and dims accent architectural lights after retail closing hours.',
      category: 'ENERGY',
      frameworks: ['WELL_LEED'],
      triggerEventType: 'ROOM_VACANT',
      defaultConditions: [{ field: 'confidence', operator: 'gte', value: 90 }],
      defaultActions: [
        { type: 'HVAC_ECO', simulated: true },
        { type: 'LIGHT_OFF', simulated: true },
      ],
      cooldownMs: 300000,
      priority: 'STANDARD',
      privacyPreservingNote: 'Spatial radar presence verification.',
    },

    // ════════════════════════════════════════════════════════════════
    // 7. Industrial Plants & Manufacturing (SEC_IND)
    // ════════════════════════════════════════════════════════════════
    {
      id: 'template_ind_01',
      industry: 'factory',
      code: 'SEC_IND_01',
      name: 'Heavy Machinery Thermal & Safety Perimeter Interlock',
      description:
        'Instantly trips machine emergency relay interlock and sounds strobe siren when unauthorized operator crosses dangerous safety perimeter.',
      category: 'SAFETY',
      frameworks: ['OSHA_1910'],
      triggerEventType: 'ABNORMAL_ACTIVITY',
      defaultConditions: [{ field: 'confidence', operator: 'gte', value: 85 }],
      defaultActions: [
        { type: 'RELAY', simulated: true, params: { relayPin: 16, state: false, action: 'TRIP_MACHINE_INTERLOCK' } },
        { type: 'BUZZER', simulated: true, params: { durationMs: 10000 } },
        { type: 'CREATE_ALERT', simulated: true, params: { severity: 'CRITICAL', title: 'Machine Guard Perimeter Breach' } },
        { type: 'SEND_NOTIFICATION', simulated: true, params: { priority: 'URGENT', role: 'SECURITY' } },
      ],
      cooldownMs: 10000,
      priority: 'CRITICAL',
      privacyPreservingNote: 'Ruggedized Doppler speed radar and thermal arrays function in dense smoke, steam, and oil mist without optical lenses.',
    },
    {
      id: 'template_ind_02',
      industry: 'factory',
      code: 'SEC_IND_02',
      name: 'Lone Worker Hazardous Immobility Deadman Watchdog',
      description:
        'Sounds safety siren and alerts shift supervisor when motionless worker is detected in isolated chemical or machinery bay for >90s.',
      category: 'SAFETY',
      frameworks: ['OSHA_1910'],
      triggerEventType: 'PROLONGED_INACTIVITY',
      defaultConditions: [{ field: 'confidence', operator: 'gte', value: 80 }],
      defaultActions: [
        { type: 'CREATE_ALERT', simulated: true, params: { severity: 'CRITICAL', title: 'Lone Worker Immobility Alarm' } },
        { type: 'ESCALATE_ALERT', simulated: true, params: { targetRole: 'SAFETY_SUPERVISOR', timeoutSeconds: 30 } },
      ],
      cooldownMs: 30000,
      priority: 'CRITICAL',
      privacyPreservingNote: '60GHz micro-movement radar extracts vital status without camera recording.',
    },
    {
      id: 'template_ind_03',
      industry: 'factory',
      code: 'SEC_IND_03',
      name: 'Industrial Paint & Chemical Bay Emergency Scrubber',
      description:
        'Engages explosion-proof emergency exhaust scrubbers and evacuates air when VOC or chemical vapor thresholds are breached.',
      category: 'SAFETY',
      frameworks: ['OSHA_1910', 'ASHRAE_62_1'],
      triggerEventType: 'ENVIRONMENTAL_ANOMALY',
      defaultConditions: [{ field: 'confidence', operator: 'gte', value: 80 }],
      defaultActions: [
        { type: 'VENTILATION_INCREASE', simulated: true, params: { speed: 'boost' } },
        { type: 'CREATE_ALERT', simulated: true, params: { severity: 'HIGH', title: 'Industrial Chemical Air Hazard Scrubber Active' } },
      ],
      cooldownMs: 60000,
      priority: 'HIGH',
      privacyPreservingNote: 'Electrochemical and NDIR gas telemetry.',
    },

    // ════════════════════════════════════════════════════════════════
    // 8. Cold-Storage Logistics & Warehouses (SEC_LOG)
    // ════════════════════════════════════════════════════════════════
    {
      id: 'template_log_01',
      industry: 'warehouse',
      code: 'SEC_LOG_01',
      name: 'Sub-Zero Walk-In Freezer Door Drift Safeguard',
      description:
        'Flashes high-visibility dock beacon, sounds warning buzzer, and engages compressor boost when commercial freezer door remains ajar >180s.',
      category: 'SAFETY',
      frameworks: ['HACCP_FSMA', 'OSHA_1910'],
      triggerEventType: 'ENVIRONMENTAL_ANOMALY',
      defaultConditions: [{ field: 'confidence', operator: 'gte', value: 80 }],
      defaultActions: [
        { type: 'RELAY', simulated: true, params: { relayPin: 8, state: true, action: 'FLASH_DOCK_BEACON' } },
        { type: 'BUZZER', simulated: true, params: { durationMs: 4000 } },
        { type: 'CREATE_ALERT', simulated: true, params: { severity: 'HIGH', title: 'Cold Storage Freezer Door Left Ajar' } },
      ],
      cooldownMs: 45000,
      priority: 'HIGH',
      privacyPreservingNote: 'Magnetic reed door contact switches and thermal gradient probes protect food/pharma inventory.',
    },
    {
      id: 'template_log_02',
      industry: 'warehouse',
      code: 'SEC_LOG_02',
      name: 'Forklift Aisle Intelligent High-Bay Lighting',
      description:
        'Illuminates high-bay LED banks along pallet staging aisles ahead of moving forklifts and dims when aisle clears.',
      category: 'ENERGY',
      frameworks: ['OSHA_1910', 'WELL_LEED'],
      triggerEventType: 'ROOM_OCCUPIED',
      defaultConditions: [{ field: 'confidence', operator: 'gte', value: 75 }],
      defaultActions: [
        { type: 'LIGHT_ON', simulated: true, params: { brightness: 100 } },
      ],
      cooldownMs: 30000,
      priority: 'STANDARD',
      privacyPreservingNote: 'Doppler pathway radar tracks vehicle velocity without recording worker faces.',
    },
    {
      id: 'template_log_03',
      industry: 'warehouse',
      code: 'SEC_LOG_03',
      name: 'Cold-Chain Pharmaceutical Thermal Excursion Interlock',
      description:
        'Alerts refrigeration technician immediately and boosts backup chillers if freezer temperature drifts above -18°C or cooler exceeds 6°C.',
      category: 'COMPLIANCE',
      frameworks: ['HACCP_FSMA'],
      triggerEventType: 'HIGH_TEMPERATURE',
      defaultConditions: [{ field: 'inputSignals.temperature', operator: 'gte', value: -18 }],
      defaultActions: [
        { type: 'VENTILATION_INCREASE', simulated: true, params: { speed: 'boost' } },
        { type: 'CREATE_ALERT', simulated: true, params: { severity: 'CRITICAL', title: 'Cold-Chain Thermal Excursion Detected' } },
        { type: 'ESCALATE_ALERT', simulated: true, params: { targetRole: 'TECHNICIAN', timeoutSeconds: 60 } },
      ],
      cooldownMs: 60000,
      priority: 'CRITICAL',
      privacyPreservingNote: 'Calibrated SHT31 and PT100 temperature RTDs with continuous audit trail.',
    },
  ];

  /**
   * Complete metadata for the 8 Industry Policy Packs
   */
  private static readonly POLICY_PACKS: Record<string, PolicyPack> = {
    transport: {
      industry: 'transport',
      industryName: 'School Transport & Fleet',
      tagline: 'Zero Children Left Behind in Parked Vehicles',
      code: 'PACK_TRANS_01',
      description:
        'Enterprise safety automation package for school buses, student vans, and district fleets. Eliminates post-trip vehicular child abandonment via 60GHz mmWave radar sweeps without optical recording.',
      primaryFrameworks: ['FERPA_COPPA', 'OSHA_1910'],
      templates: [],
      stat: '100% ELIMINATION',
      statLabel: 'of post-trip child abandonment risk',
    },
    hospital: {
      industry: 'hospital',
      industryName: 'Hospitals & Elder Care',
      tagline: 'Private Patient Fall Detection in Bathrooms',
      code: 'PACK_MED_02',
      description:
        'HIPAA-compliant healthcare safety package providing sub-4s nurse dispatch for bathroom falls, isolation room negative pressure guards, and bed-exit lighting assists with zero video cameras.',
      primaryFrameworks: ['HIPAA', 'ASHRAE_62_1', 'WELL_LEED'],
      templates: [],
      stat: '4 SECONDS',
      statLabel: 'nurse dispatch latency on bathroom falls',
    },
    school: {
      industry: 'school',
      industryName: 'Schools & Campuses',
      tagline: 'Cognitive Air Quality & Classroom Automation',
      code: 'PACK_EDU_03',
      description:
        'Indoor environmental optimization maintaining classroom CO₂ below 1,000 ppm, automatically modulating fresh air dampers, and enforcing after-hours energy setbacks.',
      primaryFrameworks: ['ASHRAE_62_1', 'FERPA_COPPA', 'WELL_LEED'],
      templates: [],
      stat: '980 PPM',
      statLabel: 'maximum maintained classroom CO₂ level',
    },
    hotel: {
      industry: 'hotel',
      industryName: 'Hotels & Resorts',
      tagline: 'Frictionless Guest Comfort & Eco-Setback',
      code: 'PACK_HOSP_04',
      description:
        'Hospitality energy efficiency and guest experience engine. Automatically enforces thermal setbacks upon guest departure while maintaining silent comfort modes when sleeping.',
      primaryFrameworks: ['ASHRAE_55', 'WELL_LEED', 'GDPR_ART9'],
      templates: [],
      stat: '34% CUT',
      statLabel: 'in unoccupied guest room HVAC draw',
    },
    office: {
      industry: 'office',
      industryName: 'Corporate Offices',
      tagline: 'Dynamic Hot-Desking & Demand Ventilation',
      code: 'PACK_CORP_05',
      description:
        'Commercial facility optimization. Dynamically throttles VAV air volume in low-occupancy wings and provides demand ventilation in high-density boardrooms without employee tracking.',
      primaryFrameworks: ['ASHRAE_55', 'ASHRAE_62_1', 'GDPR_ART9', 'WELL_LEED'],
      templates: [],
      stat: '28% SAVED',
      statLabel: 'in corporate facility operating expenses',
    },
    mall: {
      industry: 'mall',
      industryName: 'Shopping Malls & Retail',
      tagline: 'Foot-Traffic Density & Egress Safety',
      code: 'PACK_RETL_06',
      description:
        'Retail crowd management and comfort package. Relieves atrium and escalator bottleneck surges, prevents thermal stratification, and manages storefront closing energy shutdowns.',
      primaryFrameworks: ['GDPR_ART9', 'ASHRAE_55', 'WELL_LEED'],
      templates: [],
      stat: '<50 MS',
      statLabel: 'crowd density surge response time',
    },
    factory: {
      industry: 'factory',
      industryName: 'Industrial Plants & Manufacturing',
      tagline: 'Thermal Hazard Perimeter & Lone Worker Safety',
      code: 'PACK_IND_07',
      description:
        'OSHA 1910 industrial safety protection. Trips machinery emergency interlocks on safety boundary breaches, monitors lone workers, and activates hazardous chemical scrubbers.',
      primaryFrameworks: ['OSHA_1910', 'ASHRAE_62_1'],
      templates: [],
      stat: '0 TRIPS',
      statLabel: 'false alarm rate in harsh steam environments',
    },
    warehouse: {
      industry: 'warehouse',
      industryName: 'Cold-Storage Logistics',
      tagline: 'Freezer Door Drift & Forklift Motion Paths',
      code: 'PACK_LOG_08',
      description:
        'FSMA & HACCP compliant cold-chain protection. Detects walk-in freezer doors left ajar >180s, protects temperature-sensitive goods, and illuminates forklift paths on approach.',
      primaryFrameworks: ['HACCP_FSMA', 'OSHA_1910', 'WELL_LEED'],
      templates: [],
      stat: '180 SEC',
      statLabel: 'maximum freezer door ajar tolerance',
    },
  };

  /**
   * Get all policy templates or filter by industry or framework
   */
  static getTemplates(filter?: { industry?: IndustryType; framework?: ComplianceFramework }): IndustryPolicyTemplate[] {
    let result = [...this.POLICY_TEMPLATES];
    if (filter?.industry) {
      result = result.filter((t) => t.industry === filter.industry);
    }
    if (filter?.framework) {
      result = result.filter((t) => t.frameworks.includes(filter.framework!));
    }
    return result;
  }

  /**
   * Get single template by ID
   */
  static getTemplateById(id: string): IndustryPolicyTemplate | undefined {
    return this.POLICY_TEMPLATES.find((t) => t.id === id);
  }

  /**
   * Get all policy packs populated with their templates
   */
  static getPolicyPacks(): PolicyPack[] {
    return Object.values(this.POLICY_PACKS).map((pack) => ({
      ...pack,
      templates: this.POLICY_TEMPLATES.filter((t) => t.industry === pack.industry),
    }));
  }

  /**
   * Get policy pack for a specific sector
   */
  static getPolicyPackForIndustry(industry: IndustryType): PolicyPack | null {
    const pack = this.POLICY_PACKS[industry];
    if (!pack) return null;
    return {
      ...pack,
      templates: this.POLICY_TEMPLATES.filter((t) => t.industry === industry),
    };
  }

  /**
   * Apply an entire industry policy pack to an organization.
   * Instantiates production automation rules for the organization and ensures no duplicate rule names.
   */
  static async applyPolicyPack(
    organizationId: string,
    industry: IndustryType,
    options?: ApplyPolicyPackDTO
  ): Promise<PolicyPackApplicationResult> {
    const templates = this.POLICY_TEMPLATES.filter((t) => t.industry === industry);
    if (templates.length === 0) {
      return {
        organizationId,
        industry,
        appliedRules: [],
        skippedRulesCount: 0,
        status: 'PARTIAL',
        message: `No specialized policy pack found for industry '${industry}'.`,
      };
    }

    const appliedRules: Array<{ id: string; name: string; enabled: boolean }> = [];
    let skippedCount = 0;

    for (const t of templates) {
      // Check if a rule with this name already exists for this org
      const existing = await AutomationRuleModel.findOne({
        organizationId,
        name: t.name,
      });

      if (existing) {
        if (options?.overwriteExisting) {
          existing.description = t.description;
          existing.triggerEventType = t.triggerEventType;
          existing.conditions = t.defaultConditions;
          existing.actions = t.defaultActions;
          existing.cooldownMs = t.cooldownMs;
          existing.enabled = options.enableRulesImmediately ?? true;
          await existing.save();
          appliedRules.push({ id: existing._id.toString(), name: existing.name, enabled: existing.enabled });
        } else {
          skippedCount++;
        }
      } else {
        const created = await AutomationService.createRule(organizationId, {
          name: t.name,
          description: t.description,
          enabled: options?.enableRulesImmediately ?? true,
          triggerEventType: t.triggerEventType,
          conditions: t.defaultConditions,
          actions: t.defaultActions,
          cooldownMs: t.cooldownMs,
        });
        appliedRules.push({ id: created.id, name: created.name, enabled: created.enabled });
      }
    }

    return {
      organizationId,
      industry,
      appliedRules,
      skippedRulesCount: skippedCount,
      status: 'APPLIED',
      message: `Successfully deployed ${appliedRules.length} policies for ${industry} sector (${skippedCount} existing policies retained).`,
    };
  }
}
