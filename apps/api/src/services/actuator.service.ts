// ─────────────────────────────────────────────
// SENTINEL API — Actuator Dispatch & Control Service
// ─────────────────────────────────────────────

import mongoose from 'mongoose';
import { RoomModel, DeviceModel, AlertModel } from '../models/index.js';
import { MqttService } from './mqtt.service.js';
import { AlertService } from './alert.service.js';
import type {
  AutomationAction,
  ExecutedAction,
  AutomationActionType,
  HvacState,
  AlertSeverity,
} from '@sentinel/types';

export class ActuatorService {
  /**
   * Execute an automation action against physical microcontrollers or simulated digital twins.
   */
  static async executeAction(
    action: AutomationAction,
    context: {
      organizationId: string;
      facilityId?: string;
      roomId?: string;
    }
  ): Promise<ExecutedAction> {
    const type: AutomationActionType = action.type;
    const isSimulated = action.simulated !== false;
    let feedback = 'Action completed successfully.';
    let success = true;
    let error: string | undefined;

    try {
      // ── 0. Alert & Escalation Actions ──
      if (type === 'CREATE_ALERT') {
        const severity = (action.params?.severity as AlertSeverity) || 'HIGH';
        const title = (action.params?.title as string) || 'Automated Policy Alert';
        const description = (action.params?.description as string) || 'Alert triggered by automation rule.';

        await AlertService.createAlert(context.organizationId, {
          facilityId: context.facilityId || '',
          roomId: context.roomId,
          title,
          description,
          severity,
          sensorEvidence: action.params || {},
        });
        feedback = `Incident alert "${title}" created via AlertEngine.`;
      } else if (type === 'ESCALATE_ALERT' && context.roomId) {
        const activeAlert = await AlertModel.findOne({
          organizationId: new mongoose.Types.ObjectId(context.organizationId),
          roomId: new mongoose.Types.ObjectId(context.roomId),
          status: { $in: ['CREATED', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS'] },
        });
        if (activeAlert) {
          await AlertService.escalateAlert(
            context.organizationId,
            activeAlert._id.toString(),
            undefined,
            'Automated policy escalation rule triggered.'
          );
          feedback = `Active incident escalated to Tier ${(activeAlert.escalationLevel || 0) + 1}.`;
        }
      }

      // ── 1. Digital Twin & HVAC State Automation ──
      if (context.roomId) {
        let newHvacState: HvacState | null = null;

        if (type === 'HVAC_ECO') newHvacState = 'ECO';
        else if (type === 'HVAC_COMFORT') newHvacState = 'COMFORT';
        else if (type === 'VENTILATION_INCREASE') newHvacState = 'VENTILATION_BOOST';
        else if (type === 'VENTILATION_NORMAL') newHvacState = 'COMFORT';

        if (newHvacState) {
          await RoomModel.updateOne(
            { _id: context.roomId },
            {
              $set: {
                hvacState: newHvacState,
                hvacIsSimulated: isSimulated,
              },
            }
          );
          feedback = `Digital Twin room HVAC state transitioned to "${newHvacState}".`;
        }
      }

      // ── 2. Edge Microcontroller & MQTT Command Dispatch ──
      // Locate attached device in target room or explicit targetDeviceId
      let targetDevice = null;
      if (action.targetDeviceId) {
        targetDevice = await DeviceModel.findOne({
          deviceId: action.targetDeviceId.trim().toUpperCase(),
          organizationId: context.organizationId,
        });
      } else if (context.roomId) {
        targetDevice = await DeviceModel.findOne({
          roomId: context.roomId,
          organizationId: context.organizationId,
          status: 'ONLINE',
        });
      }

      if (targetDevice && targetDevice.status === 'ONLINE') {
        let mqttCommand = 'TRIGGER_ACTUATOR';
        const mqttParams: Record<string, unknown> = {
          action: type,
          ...(action.params || {}),
        };

        if (type === 'LIGHT_ON') {
          mqttCommand = 'SET_LIGHT';
          mqttParams.state = true;
        } else if (type === 'LIGHT_OFF') {
          mqttCommand = 'SET_LIGHT';
          mqttParams.state = false;
        } else if (type === 'BUZZER') {
          mqttCommand = 'BEEP';
          mqttParams.durationMs = action.params?.durationMs ?? 3000;
        } else if (type === 'RELAY') {
          mqttCommand = 'SET_RELAY';
          mqttParams.pin = action.params?.relayPin ?? 12;
          mqttParams.state = action.params?.state ?? true;
        }

        try {
          const dispatched = await MqttService.publishCommand(
            targetDevice.organizationId.toString(),
            targetDevice.facilityId.toString(),
            targetDevice.deviceId,
            mqttCommand,
            mqttParams
          );
          if (dispatched) {
            feedback += ` MQTT command "${mqttCommand}" dispatched to edge device ${targetDevice.deviceId}.`;
          }
        } catch (mqttErr) {
          // If edge device offline or unconfirmed, keep simulated twin active
          console.warn(`[ActuatorService] MQTT command dispatch warning:`, mqttErr);
          feedback += ` (Edge command dispatch deferred: ${mqttErr instanceof Error ? mqttErr.message : 'transient'}).`;
        }
      } else {
        feedback += ` (Simulated execution: no physical edge node connected).`;
      }
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : 'Actuator execution failed';
    }

    return {
      type,
      simulated: isSimulated,
      success,
      error,
      params: action.params,
      feedback,
      executedAt: new Date().toISOString(),
    };
  }
}
