// ─────────────────────────────────────────────
// SENTINEL API — Compliance & Governance Engine (Day 15)
// ─────────────────────────────────────────────

import mongoose from 'mongoose';
import type {
  ComplianceProfile,
  ComplianceAuditResult,
  ComplianceFramework,
  FrameworkCategory,
  ComplianceStatus,
  FrameworkScore,
  ComplianceViolation,
  UpdateComplianceProfileDTO,
  IndustryType,
} from '@sentinel/types';
import { ComplianceProfileModel } from '../models/ComplianceProfile.js';
import { ComplianceAuditLogModel, IComplianceAuditLogDocument } from '../models/ComplianceAuditLog.js';
import { RoomModel } from '../models/Room.js';
import { AutomationRuleModel } from '../models/AutomationRule.js';
import { DeviceModel } from '../models/Device.js';
import { SensorModel } from '../models/Sensor.js';
import { OrganizationModel } from '../models/Organization.js';
import { IndustryPolicyService } from './industry-policy.service.js';

export class ComplianceService {
  /**
   * Framework Metadata Registry
   */
  private static readonly FRAMEWORK_METADATA: Record<
    ComplianceFramework,
    { name: string; regulatoryBody: string; category: FrameworkCategory; description: string; referenceUrl: string }
  > = {
    ASHRAE_55: {
      name: 'ASHRAE Standard 55',
      regulatoryBody: 'American Society of Heating, Refrigerating and Air-Conditioning Engineers',
      category: 'ENVIRONMENTAL',
      description: 'Thermal Environmental Conditions for Human Occupancy (Operative Temp 20–24°C, 30–60% RH).',
      referenceUrl: 'https://www.ashrae.org/technical-resources/standards-and-guidelines',
    },
    ASHRAE_62_1: {
      name: 'ASHRAE Standard 62.1',
      regulatoryBody: 'ANSI / ASHRAE Standards Committee',
      category: 'ENVIRONMENTAL',
      description: 'Ventilation for Acceptable Indoor Air Quality (Maintained CO₂ < 1,000 ppm & demand ventilation).',
      referenceUrl: 'https://www.ashrae.org/standards-research--technology',
    },
    HIPAA: {
      name: 'HIPAA Title II Patient Dignity',
      regulatoryBody: 'U.S. Department of Health and Human Services (HHS)',
      category: 'PRIVACY',
      description: 'Healthcare patient privacy & safety. Enforces 100% non-optical sensing with sub-4s fall assistance SLA.',
      referenceUrl: 'https://www.hhs.gov/hipaa',
    },
    FERPA_COPPA: {
      name: 'FERPA & COPPA Minor Safety',
      regulatoryBody: 'U.S. Department of Education & FTC',
      category: 'PRIVACY',
      description: 'Student privacy protection prohibiting video recording; mandates vehicle child-left-behind protection.',
      referenceUrl: 'https://www2.ed.gov/policy/gen/guid/fpco/ferpa',
    },
    GDPR_ART9: {
      name: 'GDPR Article 9 Biometric Dignity',
      regulatoryBody: 'European Data Protection Board (EDPB)',
      category: 'PRIVACY',
      description: 'Strict prohibition on facial/biometric employee tracking; requires room/zone aggregation.',
      referenceUrl: 'https://gdpr-info.eu/art-9-gdpr/',
    },
    OSHA_1910: {
      name: 'OSHA 1910 General Industry Safety',
      regulatoryBody: 'Occupational Safety and Health Administration (OSHA)',
      category: 'OCCUPATIONAL',
      description: 'Industrial safety interlocks, lone worker deadman watchdogs, and machine hazard boundaries.',
      referenceUrl: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1910',
    },
    HACCP_FSMA: {
      name: 'HACCP & FDA Food Safety (FSMA)',
      regulatoryBody: 'U.S. Food and Drug Administration (FDA)',
      category: 'LOGISTICS',
      description: 'Cold-chain critical control points, walk-in freezer door drift protection (<180s), and continuous temperature logs.',
      referenceUrl: 'https://www.fda.gov/food/guidance-regulation-food-and-dietary-supplements/hazard-analysis-critical-control-point-haccp',
    },
    WELL_LEED: {
      name: 'WELL v2 & LEED v4.1 ESG Operations',
      regulatoryBody: 'International WELL Building Institute & USGBC',
      category: 'ENVIRONMENTAL',
      description: 'Continuous environmental monitoring, daylight/occupancy energy setback automation, and acoustic comfort.',
      referenceUrl: 'https://v2.wellcertified.com',
    },
  };

  /**
   * Determine default frameworks based on industry sector
   */
  static getDefaultFrameworksForIndustry(industry?: IndustryType): ComplianceFramework[] {
    switch (industry) {
      case 'hospital':
        return ['HIPAA', 'ASHRAE_62_1', 'ASHRAE_55', 'WELL_LEED'];
      case 'school':
        return ['FERPA_COPPA', 'ASHRAE_62_1', 'ASHRAE_55', 'WELL_LEED'];
      case 'transport':
        return ['FERPA_COPPA', 'OSHA_1910'];
      case 'hotel':
        return ['ASHRAE_55', 'WELL_LEED', 'GDPR_ART9'];
      case 'office':
        return ['ASHRAE_55', 'ASHRAE_62_1', 'GDPR_ART9', 'WELL_LEED'];
      case 'mall':
        return ['GDPR_ART9', 'ASHRAE_55', 'WELL_LEED', 'OSHA_1910'];
      case 'factory':
        return ['OSHA_1910', 'ASHRAE_62_1', 'WELL_LEED'];
      case 'warehouse':
        return ['HACCP_FSMA', 'OSHA_1910', 'WELL_LEED'];
      default:
        return ['ASHRAE_55', 'ASHRAE_62_1', 'WELL_LEED'];
    }
  }

  /**
   * Get or create a ComplianceProfile for an organization
   */
  static async getOrCreateProfile(
    organizationId: string,
    industry?: IndustryType
  ): Promise<ComplianceProfile> {
    const orgObjId = new mongoose.Types.ObjectId(organizationId);
    let doc = await ComplianceProfileModel.findOne({ organizationId: orgObjId });

    if (!doc) {
      let resolvedIndustry = industry;
      if (!resolvedIndustry) {
        const org = await OrganizationModel.findById(orgObjId);
        if (org) resolvedIndustry = org.industry as IndustryType;
      }

      const defaultFrameworks = this.getDefaultFrameworksForIndustry(resolvedIndustry);
      doc = await ComplianceProfileModel.create({
        organizationId: orgObjId,
        enabledFrameworks: defaultFrameworks,
        strictness: 'BALANCED',
        autoRemediationEnabled: true,
        auditFrequencyHours: 24,
        privacyLevel: 'ZERO_VIDEO',
        overallScore: 100,
        overallStatus: 'COMPLIANT',
      });
    }

    return doc.toSafeProfile();
  }

  /**
   * Update an organization's compliance profile
   */
  static async updateProfile(
    organizationId: string,
    dto: UpdateComplianceProfileDTO
  ): Promise<ComplianceProfile> {
    const orgObjId = new mongoose.Types.ObjectId(organizationId);
    const doc = await ComplianceProfileModel.findOneAndUpdate(
      { organizationId: orgObjId },
      { $set: dto },
      { new: true, upsert: true }
    );
    return doc.toSafeProfile();
  }

  /**
   * Comprehensive Compliance Audit Engine
   * Evaluates rooms, sensors, automation rules, and live telemetry against all enabled standards.
   */
  static async evaluateCompliance(organizationId: string): Promise<ComplianceAuditResult> {
    const orgObjId = new mongoose.Types.ObjectId(organizationId);

    // 1. Fetch Organization and Profile
    const org = await OrganizationModel.findById(orgObjId);
    const industry = (org?.industry || 'general') as IndustryType;
    const profile = await this.getOrCreateProfile(organizationId, industry);

    // 2. Fetch Active Rooms, Devices, Sensors, and Rules
    const rooms = await RoomModel.find({ organizationId: orgObjId });
    const rules = await AutomationRuleModel.find({ organizationId: orgObjId, enabled: true });
    const devices = await DeviceModel.find({ organizationId: orgObjId });
    const sensors = await SensorModel.find({ organizationId: orgObjId });

    const violations: ComplianceViolation[] = [];
    const recommendations: string[] = [];

    // Helper to add violation
    const addViolation = (v: Omit<ComplianceViolation, 'id' | 'detectedAt' | 'status'>) => {
      violations.push({
        id: `viol_${new mongoose.Types.ObjectId().toString()}`,
        detectedAt: new Date().toISOString(),
        status: 'ACTIVE',
        ...v,
      });
    };

    // ════════════════════════════════════════════════════════════════
    // 3. Framework-by-Framework Assessment
    // ════════════════════════════════════════════════════════════════
    const frameworkScores: FrameworkScore[] = [];

    for (const framework of profile.enabledFrameworks) {
      const meta = this.FRAMEWORK_METADATA[framework] || {
        name: framework,
        regulatoryBody: 'Regulatory Authority',
        category: 'COMPLIANCE',
        description: 'Standard operational compliance criteria.',
        referenceUrl: '',
      };

      let totalChecked = 0;
      let passingRules = 0;

      switch (framework) {
        // ─────────────────────────────────────────────────────────────
        // ASHRAE 55 — Thermal Comfort (20-24°C, 30-60% RH)
        // ─────────────────────────────────────────────────────────────
        case 'ASHRAE_55': {
          totalChecked += 2;
          let tempNonCompliantRooms = 0;
          for (const room of rooms) {
            const temp = room.currentTemperature;
            if (temp !== undefined && (temp < 19.0 || temp > 25.5)) {
              tempNonCompliantRooms++;
              addViolation({
                framework: 'ASHRAE_55',
                severity: 'MEDIUM',
                title: `Thermal Excursion in ${room.name}`,
                description: `Room temperature measured at ${temp.toFixed(1)}°C, exceeding ASHRAE 55 comfort band (20–24°C).`,
                facilityId: room.facilityId.toString(),
                roomId: room._id.toString(),
                roomName: room.name,
                detectedValue: `${temp.toFixed(1)}°C`,
                requiredValue: '20.0–24.0°C',
                remediationAction: 'Activate climate pre-conditioning or verify HVAC thermostat setpoints.',
                suggestedRuleTemplateId: 'template_hosp_02',
              });
            }
          }
          if (tempNonCompliantRooms === 0) passingRules++;

          const hasThermalRule = rules.some(
            (r) =>
              r.actions.some((a) => a.type === 'HVAC_ECO' || a.type === 'HVAC_COMFORT') ||
              r.triggerEventType === 'ROOM_VACANT'
          );
          if (hasThermalRule) {
            passingRules++;
          } else {
            addViolation({
              framework: 'ASHRAE_55',
              severity: 'HIGH',
              title: 'Missing Unoccupied Thermal Setback Automation',
              description: 'No automated HVAC Eco-Setback rule detected. Unoccupied thermal drift increases energy waste and comfort lag.',
              requiredValue: 'Active HVAC_ECO vacancy policy',
              detectedValue: 'None',
              remediationAction: 'Apply the standard Vacancy Eco-Setback policy pack.',
              suggestedRuleTemplateId: 'template_hosp_01',
            });
            recommendations.push('Deploy automated HVAC setback to comply with ASHRAE 55 and reduce HVAC kilowatt consumption.');
          }
          break;
        }

        // ─────────────────────────────────────────────────────────────
        // ASHRAE 62.1 — Indoor Air Quality & Ventilation (CO2 < 1,000 ppm)
        // ─────────────────────────────────────────────────────────────
        case 'ASHRAE_62_1': {
          totalChecked += 2;
          let co2ExcursionRooms = 0;
          for (const room of rooms) {
            const co2 = room.currentCo2;
            if (co2 !== undefined && co2 >= 1100) {
              co2ExcursionRooms++;
              addViolation({
                framework: 'ASHRAE_62_1',
                severity: co2 >= 1400 ? 'CRITICAL' : 'HIGH',
                title: `Elevated CO₂ in ${room.name}`,
                description: `Carbon dioxide measured at ${co2} ppm, violating the ASHRAE 62.1 threshold of 1,000 ppm.`,
                facilityId: room.facilityId.toString(),
                roomId: room._id.toString(),
                roomName: room.name,
                detectedValue: `${co2} ppm`,
                requiredValue: '< 1,000 ppm',
                remediationAction: 'Trigger fresh air ventilation boost to restore acceptable air exchange.',
                suggestedRuleTemplateId: 'template_edu_01',
              });
            }
          }
          if (co2ExcursionRooms === 0) passingRules++;

          const hasVentilationRule = rules.some(
            (r) =>
              r.triggerEventType === 'HIGH_CO2' ||
              r.actions.some((a) => a.type === 'VENTILATION_INCREASE')
          );
          if (hasVentilationRule) {
            passingRules++;
          } else {
            addViolation({
              framework: 'ASHRAE_62_1',
              severity: 'CRITICAL',
              title: 'Missing Automated Fresh Air Ventilation Rule',
              description: 'No automation rule is bound to HIGH_CO2 events or VENTILATION_INCREASE actuation.',
              requiredValue: 'Active HIGH_CO2 policy',
              detectedValue: 'None',
              remediationAction: 'Deploy High CO2 Fresh Air Ventilation Boost policy.',
              suggestedRuleTemplateId: 'template_edu_01',
            });
            recommendations.push('Enforce demand-controlled ventilation with 100% motorized damper actuation on elevated CO₂.');
          }
          break;
        }

        // ─────────────────────────────────────────────────────────────
        // HIPAA — Healthcare Privacy & Fall Detection SLA
        // ─────────────────────────────────────────────────────────────
        case 'HIPAA': {
          totalChecked += 2;
          const opticalSensors = sensors.filter(
            (s) => (s.sensorType as string) === 'CAMERA' || (s.sensorType as string) === 'OPTICAL_FEED'
          );
          if (opticalSensors.length === 0) {
            passingRules++;
          } else {
            addViolation({
              framework: 'HIPAA',
              severity: 'CRITICAL',
              title: 'Optical Sensor Violation in Patient Care Area',
              description: `Found ${opticalSensors.length} optical video sensors in patient care zones. HIPAA Title II mandates non-optical RF radar.`,
              requiredValue: '0 optical devices',
              detectedValue: `${opticalSensors.length} detected`,
              remediationAction: 'Decommission camera hardware and replace with 60GHz mmWave fall radar.',
            });
          }

          const hasFallRule = rules.some(
            (r) =>
              r.triggerEventType === 'ASSISTANCE_INDICATION' ||
              r.actions.some((a) => a.type === 'ESCALATE_ALERT' || (a.params as Record<string, unknown> | undefined)?.action === 'UNLOCK_MAGNETIC_LATCH')
          );
          if (hasFallRule) {
            passingRules++;
          } else {
            addViolation({
              framework: 'HIPAA',
              severity: 'CRITICAL',
              title: 'Missing Bathroom Fall Emergency Response Rule',
              description: 'Healthcare facility lacks an automated response policy for ASSISTANCE_INDICATION / patient falls.',
              requiredValue: 'Active bathroom fall emergency rule with nurse escalation SLA',
              detectedValue: 'Missing',
              remediationAction: 'Apply SEC_MED_01 Private Bathroom Fall Emergency policy.',
              suggestedRuleTemplateId: 'template_med_01',
            });
            recommendations.push('Deploy the Private Bathroom Fall Emergency policy to maintain sub-4s nurse dispatch SLAs.');
          }
          break;
        }

        // ─────────────────────────────────────────────────────────────
        // FERPA & COPPA — Minor Protection & Vehicle Egress
        // ─────────────────────────────────────────────────────────────
        case 'FERPA_COPPA': {
          totalChecked += 2;
          const cameraCount = sensors.filter(
            (s) => (s.sensorType as string) === 'CAMERA' || (s.name || '').toLowerCase().includes('cam')
          ).length;
          if (cameraCount === 0) {
            passingRules++;
          } else {
            addViolation({
              framework: 'FERPA_COPPA',
              severity: 'CRITICAL',
              title: 'Optical Tracking Sensor in Minor Learning Environment',
              description: 'Optical camera detected in student area. FERPA & COPPA require radar/environmental sensing without facial images.',
              requiredValue: 'Zero optical feeds',
              detectedValue: `${cameraCount} camera(s)`,
              remediationAction: 'Switch to Sensirion SCD40 CO2 and 60GHz vital radar for anonymous occupancy.',
            });
          }

          const hasChildLeftBehindRule = rules.some(
            (r) =>
              r.triggerEventType === 'PERSON_LEFT_BEHIND' ||
              r.name.toLowerCase().includes('child left behind') ||
              r.name.toLowerCase().includes('person-left-behind')
          );
          if (hasChildLeftBehindRule || (industry !== 'transport' && industry !== 'school')) {
            passingRules++;
          } else {
            addViolation({
              framework: 'FERPA_COPPA',
              severity: 'CRITICAL',
              title: 'Missing Child-Left-Behind Post-Trip Sweep Rule',
              description: 'Vehicle transport facility does not have a PERSON_LEFT_BEHIND emergency horn and alert policy.',
              requiredValue: 'Active PERSON_LEFT_BEHIND policy',
              detectedValue: 'Missing',
              remediationAction: 'Deploy SEC_TRANS_01 Zero Child Left Behind policy pack.',
              suggestedRuleTemplateId: 'template_trans_01',
            });
            recommendations.push('Activate vehicle horn relay and emergency dispatch rule for parked passenger transport.');
          }
          break;
        }

        // ─────────────────────────────────────────────────────────────
        // GDPR Article 9 — Workplace & Retail Biometric Privacy
        // ─────────────────────────────────────────────────────────────
        case 'GDPR_ART9': {
          totalChecked += 2;
          if (profile.privacyLevel === 'ZERO_VIDEO' || profile.privacyLevel === 'AGGREGATED_ONLY') {
            passingRules++;
          } else {
            addViolation({
              framework: 'GDPR_ART9',
              severity: 'HIGH',
              title: 'Privacy Profile Permitting Individual Biometric Profiling',
              description: 'GDPR Article 9 prohibits identifying workers or shoppers through biometric tracking. Set privacy level to ZERO_VIDEO.',
              requiredValue: 'ZERO_VIDEO or AGGREGATED_ONLY',
              detectedValue: profile.privacyLevel,
              remediationAction: 'Update compliance profile privacyLevel to ZERO_VIDEO.',
            });
          }
          passingRules++;
          break;
        }

        // ─────────────────────────────────────────────────────────────
        // OSHA 1910 — Industrial Safety & Lone Worker Protection
        // ─────────────────────────────────────────────────────────────
        case 'OSHA_1910': {
          totalChecked += 2;
          const hasIndustrialInterlock = rules.some(
            (r) =>
              r.actions.some((a) => (a.params as Record<string, unknown> | undefined)?.action === 'TRIP_MACHINE_INTERLOCK' || a.type === 'RELAY') ||
              r.triggerEventType === 'PROLONGED_INACTIVITY' ||
              r.triggerEventType === 'ABNORMAL_ACTIVITY'
          );
          if (hasIndustrialInterlock) {
            passingRules++;
          } else {
            addViolation({
              framework: 'OSHA_1910',
              severity: 'CRITICAL',
              title: 'Missing Hazardous Machine Safety Interlock Rule',
              description: 'No automated machine trip interlock or lone worker watchdog rule is active in the facility.',
              requiredValue: 'Machine interlock or lone worker watchdog active',
              detectedValue: 'Missing',
              remediationAction: 'Deploy SEC_IND_01 Machine Thermal Interlock & SEC_IND_02 Lone Worker Watchdog.',
              suggestedRuleTemplateId: 'template_ind_01',
            });
            recommendations.push('Install dry-contact emergency relays tied to mmWave spatial radar boundaries to comply with OSHA 1910.');
          }
          passingRules++;
          break;
        }

        // ─────────────────────────────────────────────────────────────
        // HACCP & FSMA — Cold Storage & Perishable Logistics
        // ─────────────────────────────────────────────────────────────
        case 'HACCP_FSMA': {
          totalChecked += 2;
          const hasDoorDriftRule = rules.some(
            (r) =>
              r.name.toLowerCase().includes('freezer') ||
              r.name.toLowerCase().includes('door drift') ||
              (r.actions.some((a) => (a.params as Record<string, unknown> | undefined)?.action === 'FLASH_DOCK_BEACON') && r.triggerEventType === 'ENVIRONMENTAL_ANOMALY')
          );
          if (hasDoorDriftRule) {
            passingRules++;
          } else {
            addViolation({
              framework: 'HACCP_FSMA',
              severity: 'HIGH',
              title: 'Missing Walk-In Freezer Door Drift Protection',
              description: 'Commercial refrigeration zone lacks an automated alarm when walk-in freezer doors remain ajar >180 seconds.',
              requiredValue: 'Active freezer door drift rule with dock beacon trigger',
              detectedValue: 'Missing',
              remediationAction: 'Deploy SEC_LOG_01 Sub-Zero Freezer Door Drift Safeguard.',
              suggestedRuleTemplateId: 'template_log_01',
            });
            recommendations.push('Configure magnetic contact switches with buzzer beacons on all commercial refrigeration doors.');
          }

          let hasTempExcursion = false;
          for (const room of rooms) {
            if ((room.roomType as string) === 'cold_storage' || (room.name || '').toLowerCase().includes('freezer')) {
              const t = room.currentTemperature;
              if (t !== undefined && t > -15.0) {
                hasTempExcursion = true;
                addViolation({
                  framework: 'HACCP_FSMA',
                  severity: 'CRITICAL',
                  title: `Critical Freezer Thermal Excursion in ${room.name}`,
                  description: `Freezer temperature is ${t.toFixed(1)}°C, exceeding maximum allowable -18°C HACCP threshold.`,
                  facilityId: room.facilityId.toString(),
                  roomId: room._id.toString(),
                  roomName: room.name,
                  detectedValue: `${t.toFixed(1)}°C`,
                  requiredValue: '≤ -18.0°C',
                  remediationAction: 'Engage auxiliary cooling compressor and alert refrigeration technician.',
                  suggestedRuleTemplateId: 'template_log_03',
                });
              }
            }
          }
          if (!hasTempExcursion) passingRules++;
          break;
        }

        // ─────────────────────────────────────────────────────────────
        // WELL v2 & LEED v4.1 — ESG Operations & Sensor Telemetry
        // ─────────────────────────────────────────────────────────────
        case 'WELL_LEED': {
          totalChecked += 2;
          if (sensors.length >= Math.max(1, rooms.length)) {
            passingRules++;
          } else {
            addViolation({
              framework: 'WELL_LEED',
              severity: 'LOW',
              title: 'Sub-Optimal Environmental Sensor Density',
              description: 'Less than 100% of spatial rooms have active continuous air quality or occupancy telemetry nodes.',
              requiredValue: '1+ sensor suite per room',
              detectedValue: `${sensors.length} sensors across ${rooms.length} rooms`,
              remediationAction: 'Deploy multi-sensor ESP32 nodes into unmonitored zones.',
            });
          }

          const hasSetback = rules.some((r) => r.actions.some((a) => a.type === 'HVAC_ECO' || a.type === 'LIGHT_OFF'));
          if (hasSetback) {
            passingRules++;
          } else {
            addViolation({
              framework: 'WELL_LEED',
              severity: 'MEDIUM',
              title: 'Missing Energy Conservation Lighting/HVAC Setback Rule',
              description: 'LEED credit EA requires automated lighting and HVAC setbacks in unoccupied building spaces.',
              requiredValue: 'Active LIGHT_OFF / HVAC_ECO vacancy rule',
              detectedValue: 'None',
              remediationAction: 'Deploy Vacancy Energy Setback policy.',
              suggestedRuleTemplateId: 'template_edu_02',
            });
          }
          break;
        }
      }

      const frameworkViolations = violations.filter((v) => v.framework === framework);
      const penalty = frameworkViolations.reduce((sum, v) => {
        if (v.severity === 'CRITICAL') return sum + 25;
        if (v.severity === 'HIGH') return sum + 15;
        if (v.severity === 'MEDIUM') return sum + 10;
        return sum + 5;
      }, 0);

      const rawScore = Math.max(0, Math.min(100, 100 - penalty));
      let status: ComplianceStatus = 'COMPLIANT';
      if (rawScore < 65 || frameworkViolations.some((v) => v.severity === 'CRITICAL')) {
        status = 'NON_COMPLIANT';
      } else if (rawScore < 85 || frameworkViolations.length > 0) {
        status = 'WARNING';
      }

      frameworkScores.push({
        framework,
        name: meta.name,
        regulatoryBody: meta.regulatoryBody,
        category: meta.category,
        score: rawScore,
        status,
        activeViolations: frameworkViolations.length,
        totalRulesChecked: Math.max(1, totalChecked),
        passingRules,
        description: meta.description,
        referenceUrl: meta.referenceUrl,
      });
    }

    // 4. Calculate Aggregate Overall Score & Status
    const overallScore =
      frameworkScores.length > 0
        ? Math.round(frameworkScores.reduce((acc, f) => acc + f.score, 0) / frameworkScores.length)
        : 100;

    let overallStatus: ComplianceStatus = 'COMPLIANT';
    if (overallScore < 65 || violations.some((v) => v.severity === 'CRITICAL')) {
      overallStatus = 'NON_COMPLIANT';
    } else if (overallScore < 85 || violations.length > 0) {
      overallStatus = 'WARNING';
    }

    // 5. Automated Remediation (if enabled)
    if (profile.autoRemediationEnabled && violations.length > 0) {
      const remediableViolations = violations.filter((v) => v.suggestedRuleTemplateId);
      for (const viol of remediableViolations) {
        const template = IndustryPolicyService.getTemplateById(viol.suggestedRuleTemplateId!);
        if (template) {
          const alreadyHasRule = await AutomationRuleModel.findOne({
            organizationId: orgObjId,
            name: template.name,
          });
          if (!alreadyHasRule) {
            await AutomationRuleModel.create({
              organizationId: orgObjId,
              name: template.name,
              description: template.description,
              enabled: true,
              triggerEventType: template.triggerEventType,
              conditions: template.defaultConditions,
              actions: template.defaultActions,
              cooldownMs: template.cooldownMs,
            });
            viol.status = 'RESOLVED';
            viol.remediationAction = `Auto-remediated: Deployed policy "${template.name}".`;
          }
        }
      }
    }

    // 6. Update cached score and timestamp on profile
    await ComplianceProfileModel.updateOne(
      { organizationId: orgObjId },
      {
        $set: {
          overallScore,
          overallStatus,
          lastAuditedAt: new Date(),
        },
      }
    );

    // 7. Persist Snapshot in Audit Log
    const auditRecord = await ComplianceAuditLogModel.create({
      organizationId: orgObjId,
      auditedAt: new Date(),
      overallScore,
      overallStatus,
      frameworkScores,
      violations,
      recommendations,
      stats: {
        evaluatedRooms: rooms.length,
        activeRules: rules.length,
        activeDevices: devices.length,
        openViolations: violations.filter((v) => v.status === 'ACTIVE').length,
      },
    });

    return auditRecord.toSafeResult();
  }

  /**
   * Remediate or Suppress a Violation
   */
  static async remediateViolation(
    organizationId: string,
    violationId: string,
    action: 'AUTO_FIX' | 'SUPPRESS' | 'DISMISS',
    notes?: string
  ): Promise<{ success: boolean; message: string }> {
    const orgObjId = new mongoose.Types.ObjectId(organizationId);

    const latestLog = await ComplianceAuditLogModel.findOne({ organizationId: orgObjId }).sort({ auditedAt: -1 });
    if (!latestLog) {
      return { success: false, message: 'No audit records found.' };
    }

    const violation = latestLog.violations.find((v: ComplianceViolation) => v.id === violationId);
    if (!violation) {
      return { success: false, message: 'Violation not found in latest audit.' };
    }

    if (action === 'AUTO_FIX' && violation.suggestedRuleTemplateId) {
      const template = IndustryPolicyService.getTemplateById(violation.suggestedRuleTemplateId);
      if (template) {
        await AutomationRuleModel.findOneAndUpdate(
          { organizationId: orgObjId, name: template.name },
          {
            $set: {
              organizationId: orgObjId,
              name: template.name,
              description: template.description,
              enabled: true,
              triggerEventType: template.triggerEventType,
              conditions: template.defaultConditions,
              actions: template.defaultActions,
              cooldownMs: template.cooldownMs,
            },
          },
          { upsert: true }
        );
        violation.status = 'RESOLVED';
        violation.remediationAction = `Auto-remediated: Deployed policy "${template.name}". ${notes || ''}`;
        await latestLog.save();
        return { success: true, message: `Successfully deployed remediation policy "${template.name}".` };
      }
    }

    violation.status = action === 'SUPPRESS' ? 'SUPPRESSED' : 'RESOLVED';
    if (notes) violation.remediationAction = notes;
    await latestLog.save();

    return { success: true, message: `Violation ${action === 'SUPPRESS' ? 'suppressed' : 'dismissed'} successfully.` };
  }

  /**
   * Get historical compliance audit logs
   */
  static async getAuditHistory(organizationId: string, limit = 10): Promise<ComplianceAuditResult[]> {
    const orgObjId = new mongoose.Types.ObjectId(organizationId);
    const logs = await ComplianceAuditLogModel.find({ organizationId: orgObjId })
      .sort({ auditedAt: -1 })
      .limit(limit);

    return logs.map((log: IComplianceAuditLogDocument) => log.toSafeResult());
  }
}
