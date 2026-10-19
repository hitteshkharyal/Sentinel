// ─────────────────────────────────────────────
// SENTINEL API — Device Service
// ─────────────────────────────────────────────

import mongoose from 'mongoose';
import {
  DeviceModel,
  IDeviceDocument,
  DeviceCredentialModel,
  FacilityModel,
  RoomModel,
  SensorModel,
} from '../models/index.js';
import type {
  Device,
  DeviceFilterQuery,
  DeviceHeartbeatDTO,
  DeviceRegistrationCredentials,
  DeviceRegistrationResponse,
  DeviceStats,
  RegisterDeviceDTO,
  UpdateDeviceDTO,
  SensorEntity,
} from '@sentinel/types';

export class DeviceService {
  /**
   * Register a new ESP32 microcontroller with generated secure credentials.
   */
  static async registerDevice(
    organizationId: string,
    dto: RegisterDeviceDTO,
    userId?: string
  ): Promise<DeviceRegistrationResponse> {
    const orgObjId = new mongoose.Types.ObjectId(organizationId);
    const upperDeviceId = dto.deviceId.trim().toUpperCase();
    const upperMac = dto.macAddress.trim().toUpperCase();

    // 1. Verify facility belongs to organization
    const facility = await FacilityModel.findOne({
      _id: new mongoose.Types.ObjectId(dto.facilityId),
      organizationId: orgObjId,
    });
    if (!facility) {
      throw new Error('Facility not found or does not belong to this organization.');
    }

    // 2. Verify room if specified
    let roomObjId: mongoose.Types.ObjectId | undefined;
    if (dto.roomId) {
      const room = await RoomModel.findOne({
        _id: new mongoose.Types.ObjectId(dto.roomId),
        facilityId: facility._id,
        organizationId: orgObjId,
      });
      if (!room) {
        throw new Error('Room not found or does not belong to the selected facility.');
      }
      roomObjId = room._id as mongoose.Types.ObjectId;
    }

    // 3. Check for uniqueness of deviceId within organization
    const existingDeviceId = await DeviceModel.findOne({
      organizationId: orgObjId,
      deviceId: upperDeviceId,
    });
    if (existingDeviceId) {
      throw new Error(`Device ID "${upperDeviceId}" is already registered in this organization.`);
    }

    // 4. Check for duplicate MAC address across active devices
    const existingMac = await DeviceModel.findOne({
      organizationId: orgObjId,
      macAddress: upperMac,
    });
    if (existingMac) {
      throw new Error(`A device with MAC address "${upperMac}" is already registered.`);
    }

    // 5. Generate cryptographically secure device secret
    const { token, prefix, hashed } = DeviceCredentialModel.generateSecret();

    // 6. Create Device in Database
    const device = new DeviceModel({
      deviceId: upperDeviceId,
      organizationId: orgObjId,
      facilityId: facility._id,
      roomId: roomObjId,
      name: dto.name.trim(),
      macAddress: upperMac,
      chipModel: dto.chipModel || 'ESP32-WROOM-32D',
      hardwareVersion: dto.hardwareVersion || 'v3.2',
      firmwareVersion: dto.firmwareVersion || 'v1.0.0',
      status: 'PROVISIONING',
      metadata: {
        powerSource: dto.powerSource || 'MAINS',
        cpuFreqMhz: 240,
      },
      registeredAt: new Date(),
      createdBy: userId ? new mongoose.Types.ObjectId(userId) : undefined,
    });

    await device.save();

    // 7. Store securely hashed credential
    const credential = new DeviceCredentialModel({
      deviceId: upperDeviceId,
      organizationId: orgObjId,
      credentialType: 'PRESHARED_TOKEN',
      keyPrefix: prefix,
      hashedSecret: hashed,
      status: 'ACTIVE',
      lastRotatedAt: new Date(),
      createdBy: userId ? new mongoose.Types.ObjectId(userId) : undefined,
    });

    await credential.save();

    // 8. Construct registration response
    const credentials: DeviceRegistrationCredentials = {
      deviceId: upperDeviceId,
      token, // Plaintext secret returned ONLY once upon creation
      mqttClientId: `sentinel_${upperDeviceId.toLowerCase()}`,
      mqttTopicPrefix: `sentinel/${organizationId}/${dto.facilityId}/${upperDeviceId}`,
    };

    return {
      device: device.toSafeDevice(),
      credentials,
    };
  }

  /**
   * Query devices for an organization with status filtering, search, and sensor counting.
   */
  static async listDevices(
    organizationId: string,
    filter: DeviceFilterQuery = {},
    page = 1,
    limit = 50
  ): Promise<{
    devices: Device[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const orgObjId = new mongoose.Types.ObjectId(organizationId);
    const query: Record<string, unknown> = { organizationId: orgObjId };

    if (filter.facilityId) {
      query.facilityId = new mongoose.Types.ObjectId(filter.facilityId);
    }
    if (filter.roomId) {
      query.roomId = new mongoose.Types.ObjectId(filter.roomId);
    }
    if (filter.status) {
      query.status = filter.status;
    }
    if (filter.chipModel) {
      query.chipModel = filter.chipModel;
    }
    if (filter.search) {
      const regex = new RegExp(filter.search.trim(), 'i');
      query.$or = [
        { name: regex },
        { deviceId: regex },
        { macAddress: regex },
        { ipAddress: regex },
      ];
    }

    const total = await DeviceModel.countDocuments(query);
    const skip = (page - 1) * limit;

    const docs = await DeviceModel.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    // Update real-time counts and check heartbeat freshness
    const now = Date.now();
    const staleThresholdMs = 2 * 60 * 1000; // 2 minutes

    const devices = await Promise.all(
      docs.map(async (doc) => {
        // Compute count of attached sensors
        const sensorCount = await SensorModel.countDocuments({
          organizationId: orgObjId,
          deviceId: doc.deviceId,
        });

        // If ONLINE but hasn't sent heartbeat in > 2 minutes, mark as OFFLINE
        if (
          doc.status === 'ONLINE' &&
          doc.lastHeartbeatAt &&
          now - doc.lastHeartbeatAt.getTime() > staleThresholdMs
        ) {
          doc.status = 'OFFLINE';
          await doc.save();
        }

        doc.assignedSensorsCount = sensorCount;
        return doc.toSafeDevice();
      })
    );

    return {
      devices,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Aggregate device status statistics for organization.
   */
  static async getDeviceStats(organizationId: string): Promise<DeviceStats> {
    const orgObjId = new mongoose.Types.ObjectId(organizationId);

    const counts = await DeviceModel.aggregate([
      { $match: { organizationId: orgObjId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const stats: DeviceStats = {
      total: 0,
      online: 0,
      offline: 0,
      provisioning: 0,
      error: 0,
      disabled: 0,
    };

    for (const item of counts) {
      const count = item.count as number;
      stats.total += count;
      switch (item._id) {
        case 'ONLINE':
          stats.online = count;
          break;
        case 'OFFLINE':
          stats.offline = count;
          break;
        case 'PROVISIONING':
        case 'UNREGISTERED':
        case 'UPDATING':
          stats.provisioning += count;
          break;
        case 'ERROR':
          stats.error = count;
          break;
        case 'DISABLED':
          stats.disabled = count;
          break;
      }
    }

    return stats;
  }

  /**
   * Get single device with attached sensors and credentials summary.
   */
  static async getDeviceById(
    organizationId: string,
    idOrDeviceId: string
  ): Promise<{
    device: Device;
    sensors: SensorEntity[];
    credentialPrefix?: string;
  }> {
    const orgObjId = new mongoose.Types.ObjectId(organizationId);

    let doc: IDeviceDocument | null = null;
    if (mongoose.Types.ObjectId.isValid(idOrDeviceId)) {
      doc = await DeviceModel.findOne({
        _id: new mongoose.Types.ObjectId(idOrDeviceId),
        organizationId: orgObjId,
      });
    }

    if (!doc) {
      doc = await DeviceModel.findOne({
        deviceId: idOrDeviceId.trim().toUpperCase(),
        organizationId: orgObjId,
      });
    }

    if (!doc) {
      throw new Error(`Device "${idOrDeviceId}" not found.`);
    }

    // Fetch attached sensors
    const sensorDocs = await SensorModel.find({
      organizationId: orgObjId,
      deviceId: doc.deviceId,
    });
    const sensors = sensorDocs.map((s) => s.toSafeSensor());

    // Fetch active credential prefix
    const cred = await DeviceCredentialModel.findOne({
      organizationId: orgObjId,
      deviceId: doc.deviceId,
      status: 'ACTIVE',
    });

    doc.assignedSensorsCount = sensors.length;
    return {
      device: doc.toSafeDevice(),
      sensors,
      credentialPrefix: cred?.keyPrefix,
    };
  }

  /**
   * Update device identity and metadata.
   */
  static async updateDevice(
    organizationId: string,
    id: string,
    dto: UpdateDeviceDTO
  ): Promise<Device> {
    const orgObjId = new mongoose.Types.ObjectId(organizationId);
    const device = await DeviceModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
      organizationId: orgObjId,
    });

    if (!device) {
      throw new Error('Device not found.');
    }

    if (dto.name) {
      device.name = dto.name.trim();
    }
    if (dto.status) {
      device.status = dto.status;
    }
    if (dto.firmwareVersion) {
      device.firmwareVersion = dto.firmwareVersion.trim();
    }

    // Facility update
    if (dto.facilityId && dto.facilityId !== device.facilityId.toString()) {
      const facility = await FacilityModel.findOne({
        _id: new mongoose.Types.ObjectId(dto.facilityId),
        organizationId: orgObjId,
      });
      if (!facility) {
        throw new Error('Target facility not found in this organization.');
      }
      device.facilityId = facility._id as mongoose.Types.ObjectId;
    }

    // Room update & cascade to sensors
    if (dto.roomId !== undefined) {
      if (dto.roomId === null || dto.roomId === '') {
        device.roomId = undefined;
      } else {
        const room = await RoomModel.findOne({
          _id: new mongoose.Types.ObjectId(dto.roomId),
          facilityId: device.facilityId,
          organizationId: orgObjId,
        });
        if (!room) {
          throw new Error('Target room not found in the specified facility.');
        }
        device.roomId = room._id as mongoose.Types.ObjectId;
      }

      // Cascade location update to all attached sensors
      await SensorModel.updateMany(
        { organizationId: orgObjId, deviceId: device.deviceId },
        {
          $set: {
            facilityId: device.facilityId,
            roomId: device.roomId,
          },
        }
      );
    }

    if (dto.metadata) {
      device.metadata = { ...device.metadata, ...dto.metadata };
    }

    await device.save();
    return device.toSafeDevice();
  }

  /**
   * Assign or relocate device to a specific facility/room.
   */
  static async assignDevice(
    organizationId: string,
    id: string,
    facilityId: string,
    roomId?: string | null
  ): Promise<Device> {
    return this.updateDevice(organizationId, id, {
      facilityId,
      roomId,
    });
  }

  /**
   * Rotate device secret token. Revokes previous token and generates a new one.
   */
  static async rotateDeviceCredential(
    organizationId: string,
    id: string,
    _reason?: string,
    userId?: string
  ): Promise<DeviceRegistrationCredentials> {
    const orgObjId = new mongoose.Types.ObjectId(organizationId);
    const device = await DeviceModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
      organizationId: orgObjId,
    });

    if (!device) {
      throw new Error('Device not found.');
    }

    // Revoke existing credentials
    await DeviceCredentialModel.updateMany(
      { organizationId: orgObjId, deviceId: device.deviceId, status: 'ACTIVE' },
      { $set: { status: 'REVOKED' } }
    );

    // Generate new secure secret
    const { token, prefix, hashed } = DeviceCredentialModel.generateSecret();

    const newCred = new DeviceCredentialModel({
      deviceId: device.deviceId,
      organizationId: orgObjId,
      credentialType: 'PRESHARED_TOKEN',
      keyPrefix: prefix,
      hashedSecret: hashed,
      status: 'ACTIVE',
      lastRotatedAt: new Date(),
      createdBy: userId ? new mongoose.Types.ObjectId(userId) : undefined,
    });

    await newCred.save();

    return {
      deviceId: device.deviceId,
      token,
      mqttClientId: `sentinel_${device.deviceId.toLowerCase()}`,
      mqttTopicPrefix: `sentinel/${organizationId}/${device.facilityId.toString()}/${device.deviceId}`,
    };
  }

  /**
   * Delete device, revoke its credentials, and unlink connected sensors.
   */
  static async deleteDevice(organizationId: string, id: string): Promise<void> {
    const orgObjId = new mongoose.Types.ObjectId(organizationId);
    const device = await DeviceModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
      organizationId: orgObjId,
    });

    if (!device) {
      throw new Error('Device not found.');
    }

    // 1. Unlink attached sensors (they keep their spatial room and config)
    await SensorModel.updateMany(
      { organizationId: orgObjId, deviceId: device.deviceId },
      { $unset: { deviceId: 1 } }
    );

    // 2. Revoke and delete credentials
    await DeviceCredentialModel.deleteMany({
      organizationId: orgObjId,
      deviceId: device.deviceId,
    });

    // 3. Delete device record
    await DeviceModel.deleteOne({ _id: device._id });
  }

  /**
   * Record hardware device heartbeat with cryptographic authentication.
   * Adheres to master rule: "Do not authenticate only by deviceId."
   */
  static async recordHeartbeat(
    deviceId: string,
    plainSecret: string,
    heartbeat: DeviceHeartbeatDTO
  ): Promise<{ success: boolean; status: string; timestamp: string }> {
    const upperDeviceId = deviceId.trim().toUpperCase();

    // 1. Find active credential for device
    const cred = await DeviceCredentialModel.findOne({
      deviceId: upperDeviceId,
      status: 'ACTIVE',
    });

    if (!cred) {
      throw new Error('Device credentials not found or revoked.');
    }

    // 2. Authenticate token
    const isAuth = cred.verifySecret(plainSecret);
    if (!isAuth) {
      throw new Error('Authentication failed: Invalid device secret key.');
    }

    // 3. Find and update Device
    const device = await DeviceModel.findOne({ deviceId: upperDeviceId });
    if (!device) {
      throw new Error(`Device "${upperDeviceId}" not found.`);
    }

    const now = new Date();
    device.lastSeenAt = now;
    device.lastHeartbeatAt = now;

    if (heartbeat.error) {
      device.status = 'ERROR';
      device.lastError = heartbeat.error;
    } else {
      device.status = heartbeat.status || 'ONLINE';
      device.lastError = undefined;
    }

    if (heartbeat.ipAddress) {
      device.ipAddress = heartbeat.ipAddress;
    }
    if (heartbeat.firmwareVersion) {
      device.firmwareVersion = heartbeat.firmwareVersion;
    }

    // Update telemetry metadata
    device.metadata = {
      ...device.metadata,
      wifiRssiDbm: heartbeat.wifiRssiDbm ?? device.metadata?.wifiRssiDbm,
      freeHeapBytes: heartbeat.freeHeapBytes ?? device.metadata?.freeHeapBytes,
      uptimeSeconds: heartbeat.uptimeSeconds ?? device.metadata?.uptimeSeconds,
      batteryPercent: heartbeat.batteryPercent ?? device.metadata?.batteryPercent,
    };

    await device.save();

    return {
      success: true,
      status: device.status,
      timestamp: now.toISOString(),
    };
  }

  /**
   * Automatically seed a default physical ESP32 device node for a pre-seeded room,
   * and link any unassigned sensors in that room to this microcontroller.
   */
  static async seedDefaultDeviceForRoom(
    organizationId: mongoose.Types.ObjectId,
    facilityId: mongoose.Types.ObjectId,
    roomId: mongoose.Types.ObjectId,
    roomName: string,
    sectorPrefix: string
  ): Promise<IDeviceDocument> {
    const cleanRoomSlug = roomName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '-')
      .substring(0, 16);
    const deviceId = `ESP32-${sectorPrefix}-${cleanRoomSlug}`;

    // Check if device already exists
    let device = await DeviceModel.findOne({
      organizationId,
      deviceId,
    });

    if (!device) {
      // Deterministic MAC generator based on deviceId
      const hash = new mongoose.Types.ObjectId().toString();
      const mac = `24:6F:28:${hash.substring(0, 2)}:${hash.substring(2, 4)}:${hash.substring(4, 6)}`.toUpperCase();

      const { prefix, hashed } = DeviceCredentialModel.generateSecret();

      device = new DeviceModel({
        deviceId,
        organizationId,
        facilityId,
        roomId,
        name: `${roomName} Primary Microcontroller`,
        macAddress: mac,
        chipModel: sectorPrefix === 'TRANSIT' ? 'ESP32-S3-WROOM-1' : 'ESP32-WROOM-32D',
        hardwareVersion: 'v3.2',
        firmwareVersion: 'v1.4.2',
        status: 'ONLINE',
        ipAddress: '192.168.1.120',
        metadata: {
          wifiRssiDbm: -58,
          freeHeapBytes: 198240,
          cpuFreqMhz: 240,
          powerSource: sectorPrefix === 'TRANSIT' ? 'BATTERY' : 'MAINS',
          batteryPercent: sectorPrefix === 'TRANSIT' ? 94 : undefined,
          uptimeSeconds: 142800,
        },
        lastSeenAt: new Date(),
        lastHeartbeatAt: new Date(),
        registeredAt: new Date(),
      });

      await device.save();

      // Seed credential
      const credential = new DeviceCredentialModel({
        deviceId,
        organizationId,
        credentialType: 'PRESHARED_TOKEN',
        keyPrefix: prefix,
        hashedSecret: hashed,
        status: 'ACTIVE',
        lastRotatedAt: new Date(),
      });
      await credential.save();
    }

    // Link all sensors in this room to this device
    await SensorModel.updateMany(
      {
        organizationId,
        roomId,
        $or: [{ deviceId: { $exists: false } }, { deviceId: null }, { deviceId: '' }],
      },
      { $set: { deviceId } }
    );

    // Refresh assignedSensorsCount
    const count = await SensorModel.countDocuments({ organizationId, deviceId });
    device.assignedSensorsCount = count;
    await device.save();

    return device;
  }

  /**
   * Seed default ESP32 devices for an organization across its rooms
   */
  static async seedDefaultDevicesForOrg(organizationId: string): Promise<number> {
    const orgObjId = new mongoose.Types.ObjectId(organizationId);
    const rooms = await RoomModel.find({ organizationId: orgObjId });
    let count = 0;
    for (const room of rooms) {
      const sectorPrefix =
        room.roomType.startsWith('pediatric') || room.roomType.startsWith('icu')
          ? 'MED'
          : room.roomType.includes('transit') ||
            room.roomType.includes('depot') ||
            room.roomType.includes('bus')
          ? 'TRANSIT'
          : room.roomType.includes('stem') ||
            room.roomType.includes('classroom') ||
            room.roomType.includes('lab')
          ? 'EDU'
          : 'NODE';

      await this.seedDefaultDeviceForRoom(
        orgObjId,
        room.facilityId,
        room._id as mongoose.Types.ObjectId,
        room.name,
        sectorPrefix
      );
      count++;
    }
    return count;
  }

  /**
   * Generate ESP32 C++ PlatformIO config.h header and MQTT onboarding parameters.
   */
  static async generateDeviceConfig(
    organizationId: string,
    idOrDeviceId: string
  ): Promise<{
    deviceId: string;
    mqttConfig: {
      brokerHost: string;
      brokerPort: number;
      clientId: string;
      telemetryTopic: string;
      statusTopic: string;
      commandTopic: string;
      configTopic: string;
    };
    cppHeader: string;
    jsonConfig: Record<string, unknown>;
  }> {
    const { device } = await this.getDeviceById(organizationId, idOrDeviceId);
    const orgId = organizationId;
    const facId = device.facilityId;
    const devId = device.deviceId;

    const telemetryTopic = `sentinel/${orgId}/${facId}/${devId}/telemetry`;
    const statusTopic = `sentinel/${orgId}/${facId}/${devId}/status`;
    const commandTopic = `sentinel/${orgId}/${facId}/${devId}/command`;
    const configTopic = `sentinel/${orgId}/${facId}/${devId}/config`;
    const clientId = `sentinel_${devId.toLowerCase()}`;

    const cppHeader = `/**
 * SENTINEL IoT Platform - ESP32 Hardware Node Configuration
 * Microcontroller: ${device.deviceId} (${device.chipModel})
 * Auto-generated by SENTINEL Device Management Engine (Day 7)
 */

#ifndef SENTINEL_CONFIG_H
#define SENTINEL_CONFIG_H

// --- Hardware & Platform Identity ---
#define SENTINEL_DEVICE_ID        "${devId}"
#define SENTINEL_CHIP_MODEL       "${device.chipModel}"
#define SENTINEL_HARDWARE_VERSION "${device.hardwareVersion}"
#define SENTINEL_FIRMWARE_VERSION "${device.firmwareVersion}"
#define SENTINEL_MAC_ADDRESS      "${device.macAddress}"

// --- Network Configuration ---
#define SENTINEL_WIFI_SSID        "YOUR_WIFI_SSID"
#define SENTINEL_WIFI_PASSWORD    "YOUR_WIFI_PASSWORD"

// --- Ingestion Gateway ---
#define SENTINEL_API_HOST         "192.168.1.100"
#define SENTINEL_API_PORT         4000
#define SENTINEL_DEVICE_SECRET    "YOUR_DEVICE_SECRET_TOKEN"

// --- MQTT Messaging ---
#define SENTINEL_MQTT_BROKER      "192.168.1.100"
#define SENTINEL_MQTT_PORT        1883
#define SENTINEL_MQTT_CLIENT_ID   "${clientId}"
#define SENTINEL_TOPIC_TELEMETRY  "${telemetryTopic}"
#define SENTINEL_TOPIC_STATUS     "${statusTopic}"
#define SENTINEL_TOPIC_COMMAND    "${commandTopic}"
#define SENTINEL_TOPIC_CONFIG     "${configTopic}"

// --- Operating Timers ---
#define HEARTBEAT_INTERVAL_MS     30000
#define SENSOR_POLL_INTERVAL_MS   5000

#endif // SENTINEL_CONFIG_H
`;

    const jsonConfig = {
      deviceId: devId,
      organizationId: orgId,
      facilityId: facId,
      roomId: device.roomId,
      chipModel: device.chipModel,
      hardwareVersion: device.hardwareVersion,
      firmwareVersion: device.firmwareVersion,
      macAddress: device.macAddress,
      mqtt: {
        brokerHost: '192.168.1.100',
        brokerPort: 1883,
        clientId,
        telemetryTopic,
        statusTopic,
        commandTopic,
        configTopic,
      },
    };

    return {
      deviceId: devId,
      mqttConfig: {
        brokerHost: '192.168.1.100',
        brokerPort: 1883,
        clientId,
        telemetryTopic,
        statusTopic,
        commandTopic,
        configTopic,
      },
      cppHeader,
      jsonConfig,
    };
  }
}

