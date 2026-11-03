// ─────────────────────────────────────────────
// SENTINEL API — Dynamic Firmware Generator Service
// ─────────────────────────────────────────────

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import mongoose from 'mongoose';
import {
  DeploymentModel,
  FirmwareBuildModel,
} from '../models/index.js';
import type {
  FirmwareBuildArtifact,
  FirmwareManifest,
  ChipModel,
} from '@sentinel/types';

// Pre-computed CRC32 table for pure Node.js PKZIP generation
function buildCrcTable(): Uint32Array {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = (c >>> 0);
  }
  return table;
}
const CRC_TABLE = buildCrcTable();

function computeCrc32(buf: Buffer): number {
  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i]!;
    const tableVal = CRC_TABLE[(crc ^ byte) & 0xff]!;
    crc = (crc >>> 8) ^ tableVal;
  }
  return (crc ^ -1) >>> 0;
}

export interface ZipFileEntry {
  path: string;
  content: string | Buffer;
}

/**
 * Creates a standard DEFLATE-compressed PKZip archive buffer in pure Node.js without third-party dependencies.
 */
export function buildZipArchive(files: ZipFileEntry[]): Buffer {
  const localHeaders: Buffer[] = [];
  const centralHeaders: Buffer[] = [];
  let offset = 0;

  for (const f of files) {
    const nameBuf = Buffer.from(f.path.replace(/\\/g, '/'), 'utf8');
    const contentBuf = Buffer.isBuffer(f.content)
      ? f.content
      : Buffer.from(f.content, 'utf8');
    const compressed = zlib.deflateRawSync(contentBuf);
    const crc = computeCrc32(contentBuf);

    // Local Header (30 bytes)
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); // Local file header signature
    lh.writeUInt16LE(20, 4); // Version needed to extract (2.0)
    lh.writeUInt16LE(0, 6); // General purpose bit flag
    lh.writeUInt16LE(8, 8); // Compression method: Deflate
    lh.writeUInt16LE(0, 10); // File last mod time
    lh.writeUInt16LE(0, 12); // File last mod date
    lh.writeUInt32LE(crc, 14); // CRC-32
    lh.writeUInt32LE(compressed.length, 18); // Compressed size
    lh.writeUInt32LE(contentBuf.length, 22); // Uncompressed size
    lh.writeUInt16LE(nameBuf.length, 26); // File name length
    lh.writeUInt16LE(0, 28); // Extra field length

    localHeaders.push(lh, nameBuf, compressed);

    // Central Directory Header (46 bytes)
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0); // Central directory file header signature
    ch.writeUInt16LE(20, 4); // Version made by
    ch.writeUInt16LE(20, 6); // Version needed to extract
    ch.writeUInt16LE(0, 8); // General purpose bit flag
    ch.writeUInt16LE(8, 10); // Compression method: Deflate
    ch.writeUInt16LE(0, 12); // File last mod time
    ch.writeUInt16LE(0, 14); // File last mod date
    ch.writeUInt32LE(crc, 16); // CRC-32
    ch.writeUInt32LE(compressed.length, 20); // Compressed size
    ch.writeUInt32LE(contentBuf.length, 24); // Uncompressed size
    ch.writeUInt16LE(nameBuf.length, 28); // File name length
    ch.writeUInt16LE(0, 30); // Extra field length
    ch.writeUInt16LE(0, 32); // File comment length
    ch.writeUInt16LE(0, 34); // Disk number where file starts
    ch.writeUInt16LE(0, 36); // Internal file attributes
    ch.writeUInt32LE(0x81a40000, 38); // External file attributes (-rw-r--r--)
    ch.writeUInt32LE(offset, 42); // Relative offset of local file header

    centralHeaders.push(ch, nameBuf);
    offset += lh.length + nameBuf.length + compressed.length;
  }

  const centralDirSize = centralHeaders.reduce((acc, b) => acc + b.length, 0);

  // End of Central Directory Record (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // EOCD signature
  eocd.writeUInt16LE(0, 4); // Number of this disk
  eocd.writeUInt16LE(0, 6); // Disk where central directory starts
  eocd.writeUInt16LE(files.length, 8); // Number of central directory records on this disk
  eocd.writeUInt16LE(files.length, 10); // Total number of central directory records
  eocd.writeUInt32LE(centralDirSize, 12); // Size of central directory
  eocd.writeUInt32LE(offset, 16); // Offset of start of central directory
  eocd.writeUInt16LE(0, 20); // Comment length

  return Buffer.concat([...localHeaders, ...centralHeaders, eocd]);
}

export class FirmwareGeneratorService {
  /**
   * Resolve existing firmware source root directory across runtime environments.
   */
  private static findFirmwareSourceRoot(): string | null {
    const candidates = [
      path.resolve(process.cwd(), 'firmware/esp32'),
      path.resolve(process.cwd(), '../../firmware/esp32'),
      path.resolve(process.cwd(), '../firmware/esp32'),
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        return c;
      }
    }
    return null;
  }

  /**
   * Safely read a firmware source file or provide fallback.
   */
  private static readFirmwareFile(relativePath: string): string {
    const root = this.findFirmwareSourceRoot();
    if (root) {
      const fullPath = path.join(root, relativePath);
      if (fs.existsSync(fullPath)) {
        return fs.readFileSync(fullPath, 'utf8');
      }
    }
    return '';
  }

  /**
   * Generate customized PlatformIO project for a deployment.
   */
  static async generateFirmware(
    organizationId: string,
    deploymentId: string,
    userId: string,
    requestedVersion: string = '1.0.0'
  ): Promise<FirmwareBuildArtifact> {
    const orgObjId = new mongoose.Types.ObjectId(organizationId);
    const deployObjId = new mongoose.Types.ObjectId(deploymentId);

    const deployment = await DeploymentModel.findOne({
      _id: deployObjId,
      organizationId: orgObjId,
    });

    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found.`);
    }

    const hw = deployment.hardwareConfig;
    const deviceId = deployment.deviceId || 'ESP32-SENTINEL-NODE';
    const facilityId = deployment.facilityId.toString();
    const roomId = deployment.roomId ? deployment.roomId.toString() : 'unassigned';

    // 1. Resolve Driver Dependencies
    const selectedSensorTypes = new Set(hw.sensors.map((s) => s.sensorType));
    const selectedActuators = new Set(hw.actuators.map((a) => a.actuatorType));

    const includedDrivers: string[] = ['hal_master.cpp'];
    const excludedDrivers: string[] = [];
    const libDeps: string[] = [
      'knolleary/PubSubClient@^2.8',
      'bblanchon/ArduinoJson@^7.0.4',
    ];

    // Evaluate each HAL driver module
    if (selectedSensorTypes.has('PIR')) {
      includedDrivers.push('hal_pir.cpp');
    } else {
      excludedDrivers.push('hal_pir.cpp');
    }

    if (selectedSensorTypes.has('MMWAVE')) {
      includedDrivers.push('hal_mmwave.cpp');
    } else {
      excludedDrivers.push('hal_mmwave.cpp');
    }

    if (selectedSensorTypes.has('DOOR_MAGNETIC')) {
      includedDrivers.push('hal_door.cpp');
    } else {
      excludedDrivers.push('hal_door.cpp');
    }

    if (selectedSensorTypes.has('CO2')) {
      includedDrivers.push('hal_co2.cpp');
      libDeps.push('sensirion/Sensirion I2C SCD4x@^0.4.0');
    } else {
      excludedDrivers.push('hal_co2.cpp');
    }

    if (
      selectedSensorTypes.has('TEMPERATURE') ||
      selectedSensorTypes.has('HUMIDITY')
    ) {
      includedDrivers.push('hal_temp_humidity.cpp');
      libDeps.push('adafruit/Adafruit SHT31 Library@^2.2.2');
    } else {
      excludedDrivers.push('hal_temp_humidity.cpp');
    }

    if (selectedSensorTypes.has('PRESSURE')) {
      includedDrivers.push('hal_pressure.cpp');
      libDeps.push('adafruit/Adafruit BMP280 Library@^2.6.8');
    } else {
      excludedDrivers.push('hal_pressure.cpp');
    }

    if (selectedSensorTypes.has('LIGHT')) {
      includedDrivers.push('hal_light.cpp');
      libDeps.push('claws/BH1750@^1.3.0');
    } else {
      excludedDrivers.push('hal_light.cpp');
    }

    if (selectedSensorTypes.has('SOUND_LEVEL')) {
      includedDrivers.push('hal_sound.cpp');
    } else {
      excludedDrivers.push('hal_sound.cpp');
    }

    if (selectedActuators.has('RELAY')) {
      includedDrivers.push('hal_relay.cpp');
    } else {
      excludedDrivers.push('hal_relay.cpp');
    }

    // Always excluded non-selected special drivers
    if (!selectedSensorTypes.has('GPS')) excludedDrivers.push('hal_gps.cpp');
    if (!selectedSensorTypes.has('VIBRATION')) excludedDrivers.push('hal_vibration.cpp');
    if (!selectedSensorTypes.has('ULTRASONIC')) excludedDrivers.push('hal_ultrasonic.cpp');
    if (!selectedSensorTypes.has('CURRENT')) excludedDrivers.push('hal_current.cpp');
    if (!selectedSensorTypes.has('GAS')) excludedDrivers.push('hal_gas.cpp');
    if (!selectedSensorTypes.has('SMOKE')) excludedDrivers.push('hal_smoke.cpp');
    if (!selectedSensorTypes.has('FLAME')) excludedDrivers.push('hal_flame.cpp');

    // 2. Build Topic Conventions
    const mqttTopics = {
      telemetry: `sentinel/${organizationId}/${facilityId}/${deviceId}/telemetry`,
      status: `sentinel/${organizationId}/${facilityId}/${deviceId}/status`,
      command: `sentinel/${organizationId}/${facilityId}/${deviceId}/command`,
      config: `sentinel/${organizationId}/${facilityId}/${deviceId}/config`,
      ack: `sentinel/${organizationId}/${facilityId}/${deviceId}/ack`,
    };

    // 3. Assemble Dynamic Pin Mapping
    const pinMappings: Record<string, number> = {
      PIN_STATUS_LED: 2,
      PIN_I2C_SDA: hw.i2cBus?.sdaPin ?? 21,
      PIN_I2C_SCL: hw.i2cBus?.sclPin ?? 22,
    };

    const pirConfig = hw.sensors.find((s) => s.sensorType === 'PIR');
    if (pirConfig && pirConfig.assignedPins[0]) {
      pinMappings['PIN_PIR_MOTION'] = pirConfig.assignedPins[0];
    }

    const doorConfig = hw.sensors.find((s) => s.sensorType === 'DOOR_MAGNETIC');
    if (doorConfig && doorConfig.assignedPins[0]) {
      pinMappings['PIN_DOOR_REED'] = doorConfig.assignedPins[0];
    }

    const soundConfig = hw.sensors.find((s) => s.sensorType === 'SOUND_LEVEL');
    if (soundConfig && soundConfig.assignedPins[0]) {
      pinMappings['PIN_SOUND_ADC'] = soundConfig.assignedPins[0];
    }

    const lightConfig = hw.sensors.find((s) => s.sensorType === 'LIGHT');
    if (lightConfig && lightConfig.assignedPins[0]) {
      pinMappings['PIN_LIGHT_ADC'] = lightConfig.assignedPins[0];
    }

    if (hw.uart2) {
      pinMappings['PIN_UART2_RX'] = hw.uart2.rxPin;
      pinMappings['PIN_UART2_TX'] = hw.uart2.txPin;
    } else {
      pinMappings['PIN_UART2_RX'] = 16;
      pinMappings['PIN_UART2_TX'] = 17;
    }

    const relayConfig = hw.actuators.find((a) => a.actuatorType === 'RELAY');
    if (relayConfig) {
      pinMappings['PIN_ACTUATOR_RELAY'] = relayConfig.assignedPin;
    }

    // 4. Generate platformio.ini
    const platformioIni = `[platformio]
default_envs = esp32dev
src_dir = src
include_dir = include

[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
monitor_speed = 115200
upload_speed = 921600
build_flags =
    -D CORE_DEBUG_LEVEL=3
    -D ARDUINOJSON_ENABLE_STD_STRING=1
    -I include
lib_deps =
${libDeps.map((dep) => `    ${dep}`).join('\n')}
`;

    // 5. Generate include/sentinel_config.h
    const pinDefines = Object.entries(pinMappings)
      .map(([name, pin]) => `#define ${name.padEnd(28)} ${pin}`)
      .join('\n');

    const featureFlags = [
      selectedSensorTypes.has('PIR') ? '#define SENTINEL_ENABLE_PIR 1' : '/* #undef SENTINEL_ENABLE_PIR */',
      selectedSensorTypes.has('MMWAVE') ? '#define SENTINEL_ENABLE_MMWAVE 1' : '/* #undef SENTINEL_ENABLE_MMWAVE */',
      selectedSensorTypes.has('DOOR_MAGNETIC') ? '#define SENTINEL_ENABLE_DOOR 1' : '/* #undef SENTINEL_ENABLE_DOOR */',
      selectedSensorTypes.has('CO2') ? '#define SENTINEL_ENABLE_CO2 1' : '/* #undef SENTINEL_ENABLE_CO2 */',
      selectedSensorTypes.has('TEMPERATURE') || selectedSensorTypes.has('HUMIDITY')
        ? '#define SENTINEL_ENABLE_TEMP_HUMIDITY 1'
        : '/* #undef SENTINEL_ENABLE_TEMP_HUMIDITY */',
      selectedSensorTypes.has('PRESSURE') ? '#define SENTINEL_ENABLE_PRESSURE 1' : '/* #undef SENTINEL_ENABLE_PRESSURE */',
      selectedSensorTypes.has('LIGHT') ? '#define SENTINEL_ENABLE_LIGHT 1' : '/* #undef SENTINEL_ENABLE_LIGHT */',
      selectedSensorTypes.has('SOUND_LEVEL') ? '#define SENTINEL_ENABLE_SOUND 1' : '/* #undef SENTINEL_ENABLE_SOUND */',
      selectedActuators.has('RELAY') ? '#define SENTINEL_ENABLE_RELAY 1' : '/* #undef SENTINEL_ENABLE_RELAY */',
    ].join('\n');

    const sentinelConfigH = `/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SENTINEL DYNAMIC GENERATED FIRMWARE CONFIGURATION
 * ─────────────────────────────────────────────────────────────────────────────
 * Deployment:  ${deployment.name} (${deployment.useCaseName})
 * Generated:   ${new Date().toISOString()}
 * Chip Model:  ${hw.chipModel}
 * Notice:      NEVER hardcode passwords or production keys here.
 *              Provision credentials securely via NVS or Sentinel Provisioner.
 * ─────────────────────────────────────────────────────────────────────────────
 */

#ifndef SENTINEL_CONFIG_H
#define SENTINEL_CONFIG_H

#include <stdint.h>

// Deployment & Identity
#define SENTINEL_FW_VERSION           "${requestedVersion}"
#define SENTINEL_HW_VERSION           "v3.2"
#define SENTINEL_DEFAULT_CHIP_MODEL   "${hw.chipModel}"
#define SENTINEL_DEPLOYMENT_ID        "${deployment._id}"
#define DEFAULT_DEVICE_ID             "${deviceId}"
#define DEFAULT_ORGANIZATION_ID       "${organizationId}"
#define DEFAULT_FACILITY_ID           "${facilityId}"
#define DEFAULT_ROOM_ID               "${roomId}"

// Default Network & Broker Parameters (Can be overridden via NVS runtime config)
#define DEFAULT_WIFI_SSID             "Sentinel-Secure-IoT"
#define DEFAULT_WIFI_PASSWORD         ""
#define DEFAULT_MQTT_HOST             "192.168.1.100"
#define DEFAULT_MQTT_PORT             1883
#define DEFAULT_API_HOST              "192.168.1.100"
#define DEFAULT_API_PORT              4000

// Dynamic Hardware Pin Mappings
${pinDefines}

// I2C Bus Configuration
#define I2C_FREQUENCY_HZ              ${hw.i2cBus?.frequencyHz ?? 100000}
#define I2C_ADDR_SCD40                0x62
#define I2C_ADDR_SHT31                0x44
#define I2C_ADDR_BMP280               0x76
#define I2C_ADDR_BH1750               0x23

// UART2 Configuration
#define UART2_BAUD_RATE               ${hw.uart2?.baudRate ?? 115200}

// Active Feature Flags
${featureFlags}

// Operational Timings
#define DEFAULT_SAMPLING_INTERVAL_MS  5000
#define MIN_SAMPLING_INTERVAL_MS      1000
#define MAX_SAMPLING_INTERVAL_MS      60000
#define DEFAULT_HEARTBEAT_INTERVAL_MS 30000
#define WATCHDOG_TIMEOUT_SECONDS      15

// MQTT Topic Definitions
#define SENTINEL_TOPIC_TELEMETRY      "${mqttTopics.telemetry}"
#define SENTINEL_TOPIC_STATUS         "${mqttTopics.status}"
#define SENTINEL_TOPIC_COMMAND        "${mqttTopics.command}"
#define SENTINEL_TOPIC_CONFIG         "${mqttTopics.config}"
#define SENTINEL_TOPIC_ACK            "${mqttTopics.ack}"

#define MQTT_BUFFER_SIZE              2048
#define MQTT_TOPIC_MAX_LEN            160
#define JSON_DOC_BUFFER_SIZE          1536
#define SERIAL_DEBUG_BAUD             115200

#endif // SENTINEL_CONFIG_H
`;

    // 6. Generate Custom hal_master.cpp (only calling selected drivers)
    const halMasterCpp = `/**
 * Project Sentinel — Custom Generated HAL Master Orchestrator
 * Deployment: ${deployment.name}
 */

#include <Arduino.h>
#include <WiFi.h>
#include <esp_system.h>
#include <time.h>
#include "../../include/sentinel_hal.h"
#include "../../include/sentinel_config.h"

static bool s_master_initialized = false;
static uint32_t s_boot_millis = 0;

bool sentinel_hal_init_all(void) {
    s_boot_millis = millis();

#ifdef SENTINEL_ENABLE_RELAY
    hal_relay_init(PIN_ACTUATOR_RELAY, true);
#endif
#ifdef SENTINEL_ENABLE_DOOR
    hal_door_init(PIN_DOOR_REED);
#endif
#ifdef SENTINEL_ENABLE_PIR
    hal_pir_init(PIN_PIR_MOTION);
#endif
#ifdef SENTINEL_ENABLE_SOUND
    hal_sound_init(PIN_SOUND_ADC);
#endif
#ifdef SENTINEL_ENABLE_MMWAVE
    hal_mmwave_init(PIN_UART2_RX, PIN_UART2_TX, UART2_BAUD_RATE);
#endif
#ifdef SENTINEL_ENABLE_CO2
    hal_co2_init(PIN_I2C_SDA, PIN_I2C_SCL, I2C_ADDR_SCD40);
#endif
#ifdef SENTINEL_ENABLE_TEMP_HUMIDITY
    hal_temp_humidity_init(PIN_I2C_SDA, PIN_I2C_SCL, I2C_ADDR_SHT31);
#endif
#ifdef SENTINEL_ENABLE_PRESSURE
    hal_pressure_init(PIN_I2C_SDA, PIN_I2C_SCL, I2C_ADDR_BMP280);
#endif
#ifdef SENTINEL_ENABLE_LIGHT
    hal_light_init(PIN_I2C_SDA, PIN_I2C_SCL, I2C_ADDR_BH1750, PIN_LIGHT_ADC);
#endif

    pinMode(PIN_STATUS_LED, OUTPUT);
    digitalWrite(PIN_STATUS_LED, HIGH);
    delay(100);
    digitalWrite(PIN_STATUS_LED, LOW);

    s_master_initialized = true;
    return true;
}

bool sentinel_hal_get_device_info(hal_device_info_t* info) {
    if (!info) return false;
    memset(info, 0, sizeof(hal_device_info_t));
    strncpy(info->device_id, DEFAULT_DEVICE_ID, sizeof(info->device_id) - 1);
    strncpy(info->chip_model, SENTINEL_DEFAULT_CHIP_MODEL, sizeof(info->chip_model) - 1);
    strncpy(info->firmware_version, SENTINEL_FW_VERSION, sizeof(info->firmware_version) - 1);
    strncpy(info->hardware_version, SENTINEL_HW_VERSION, sizeof(info->hardware_version) - 1);

    String mac = WiFi.macAddress();
    strncpy(info->mac_address, mac.c_str(), sizeof(info->mac_address) - 1);

    if (WiFi.status() == WL_CONNECTED) {
        String ip = WiFi.localIP().toString();
        strncpy(info->ip_address, ip.c_str(), sizeof(info->ip_address) - 1);
        info->wifi_rssi_dbm = (int8_t)WiFi.RSSI();
        info->is_online = true;
    } else {
        strncpy(info->ip_address, "0.0.0.0", sizeof(info->ip_address) - 1);
        info->wifi_rssi_dbm = -100;
        info->is_online = false;
    }

    info->free_heap_bytes = esp_get_free_heap_size();
    info->min_free_heap_bytes = esp_get_minimum_free_heap_size();
    info->uptime_seconds = (millis() - s_boot_millis) / 1000;
    info->battery_percent = 100;
    return true;
}

bool sentinel_hal_read_all(sentinel_telemetry_packet_t* packet) {
    if (!s_master_initialized || !packet) return false;
    memset(packet, 0, sizeof(sentinel_telemetry_packet_t));
    packet->timestamp_ms = millis();

    time_t now;
    time(&now);
    struct tm timeinfo;
    if (gmtime_r(&now, &timeinfo) && timeinfo.tm_year > (2020 - 1900)) {
        strftime(packet->iso_timestamp, sizeof(packet->iso_timestamp), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
    } else {
        snprintf(packet->iso_timestamp, sizeof(packet->iso_timestamp), "UPTIME_%lu", (unsigned long)(packet->timestamp_ms / 1000));
    }

#ifdef SENTINEL_ENABLE_MMWAVE
    hal_mmwave_read(&packet->mmwave);
#endif
#ifdef SENTINEL_ENABLE_TEMP_HUMIDITY
    hal_temp_humidity_read(&packet->temp_humidity);
#endif
#ifdef SENTINEL_ENABLE_CO2
    hal_co2_read(&packet->co2);
#endif
#ifdef SENTINEL_ENABLE_SOUND
    hal_sound_read(&packet->sound);
#endif
#ifdef SENTINEL_ENABLE_DOOR
    hal_door_read(&packet->door);
#endif
#ifdef SENTINEL_ENABLE_PRESSURE
    hal_pressure_read(&packet->pressure);
#endif
#ifdef SENTINEL_ENABLE_LIGHT
    hal_light_read(&packet->light);
#endif
#ifdef SENTINEL_ENABLE_PIR
    hal_pir_read(&packet->pir);
#endif
#ifdef SENTINEL_ENABLE_RELAY
    hal_relay_get_state(&packet->relay);
#endif

    sentinel_hal_get_device_info(&packet->device_info);
    return true;
}
`;

    // 7. Load header files and shared components
    const sentinelHalH =
      this.readFirmwareFile('include/sentinel_hal.h') ||
      `// Sentinel HAL Header fallback\n#ifndef SENTINEL_HAL_H\n#define SENTINEL_HAL_H\n#endif\n`;
    const wifiManagerH =
      this.readFirmwareFile('include/wifi_manager.h') || '';
    const mqttManagerH =
      this.readFirmwareFile('include/mqtt_manager.h') || '';
    const mainCpp = this.readFirmwareFile('src/main.cpp') || '';
    const wifiManagerCpp = this.readFirmwareFile('src/wifi_manager.cpp') || '';
    const mqttManagerCpp = this.readFirmwareFile('src/mqtt_manager.cpp') || '';

    // 8. Assemble zip file entries
    const projectName = `sentinel-${deployment.industry.replace(/_/g, '-')}-${deployment._id.toString().substring(0, 8)}`;
    const zipEntries: ZipFileEntry[] = [
      { path: `${projectName}/platformio.ini`, content: platformioIni },
      { path: `${projectName}/include/config.h`, content: sentinelConfigH },
      { path: `${projectName}/include/sentinel_config.h`, content: sentinelConfigH },
      { path: `${projectName}/include/sentinel_hal.h`, content: sentinelHalH },
      { path: `${projectName}/include/wifi_manager.h`, content: wifiManagerH },
      { path: `${projectName}/include/mqtt_manager.h`, content: mqttManagerH },
      { path: `${projectName}/src/main.cpp`, content: mainCpp },
      { path: `${projectName}/src/wifi_manager.cpp`, content: wifiManagerCpp },
      { path: `${projectName}/src/mqtt_manager.cpp`, content: mqttManagerCpp },
      { path: `${projectName}/src/hal/hal_master.cpp`, content: halMasterCpp },
    ];

    // Include ONLY the selected HAL driver files
    for (const driverFile of includedDrivers) {
      if (driverFile === 'hal_master.cpp') continue;
      const driverContent = this.readFirmwareFile(`src/hal/${driverFile}`);
      if (driverContent) {
        zipEntries.push({
          path: `${projectName}/src/hal/${driverFile}`,
          content: driverContent,
        });
      }
    }

    // 9. Generate README.md
    const pinTable = Object.entries(pinMappings)
      .map(([name, pin]) => `| \`${name}\` | GPIO ${pin} | Standard 3.3V / Ground |`)
      .join('\n');

    const readmeMd = `# ${deployment.name} — Sentinel Custom Firmware Project

Generated for **Project Sentinel Deployment Center**
- **Industry:** ${deployment.industry.toUpperCase()}
- **Use Case:** ${deployment.useCaseName}
- **Board:** ${hw.chipModel}
- **Target Device ID:** \`${deviceId}\`
- **Firmware Version:** \`${requestedVersion}\`

---

## 1. Hardware Pinout Reference

| Signal / Peripheral | Assigned Pin | Wiring Notes |
| :--- | :--- | :--- |
${pinTable}

---

## 2. PlatformIO Compilation & Flashing

### Requirements
- VS Code with **PlatformIO IDE** extension installed, or PlatformIO CLI (\`pip install platformio\`).
- ESP32 connected via USB-C or Micro-USB cable.

### Build and Upload
\`\`\`bash
# 1. Compile firmware project
pio run

# 2. Upload to connected ESP32 board
pio run -t upload

# 3. Monitor Serial logs at 115200 baud
pio run -t monitor
\`\`\`

---

## 3. Post-Flash Provisioning
Zero hardcoded passwords or sensitive tokens are stored in this archive.
After uploading firmware, use the Sentinel **Device Provisioning Wizard** or run:

\`\`\`bash
# Web Serial or USB Serial Provisioning Command:
SENTINEL_PROVISION:org=${organizationId}:fac=${facilityId}:dev=${deviceId}
\`\`\`

---

## 4. MQTT Telemetry Topic Path
Telemetry reports publish to:
\`\`\`text
${mqttTopics.telemetry}
\`\`\`
`;

    zipEntries.push({
      path: `${projectName}/README.md`,
      content: readmeMd,
    });

    // 10. Generate firmware-manifest.json
    const manifestHasher = crypto.createHash('sha256');
    for (const e of zipEntries) {
      manifestHasher.update(e.path);
      manifestHasher.update(typeof e.content === 'string' ? e.content : e.content.toString('base64'));
    }
    const integrityHash = manifestHasher.digest('hex');

    const manifest: FirmwareManifest = {
      manifestVersion: '1.0.0',
      deploymentId: deployment._id.toString(),
      organizationId,
      facilityId,
      roomId,
      deviceId,
      chipModel: hw.chipModel as ChipModel,
      firmwareVersion: requestedVersion,
      generatedAt: new Date().toISOString(),
      generatedByUserId: userId,
      includedDrivers,
      excludedDrivers,
      pinMappings,
      mqttTopics,
      integrityHash,
    };

    zipEntries.push({
      path: `${projectName}/firmware-manifest.json`,
      content: JSON.stringify(manifest, null, 2),
    });

    // 11. Build PKZip binary buffer
    const zipBuffer = buildZipArchive(zipEntries);
    const base64Zip = zipBuffer.toString('base64');

    // 12. Save to FirmwareBuildModel
    const firmwareBuild = new FirmwareBuildModel({
      deploymentId: deployObjId,
      organizationId: orgObjId,
      version: requestedVersion,
      status: 'READY',
      manifest,
      sourceZipBase64: base64Zip,
      fileSizeBytes: zipBuffer.length,
      createdBy: new mongoose.Types.ObjectId(userId),
    });

    await firmwareBuild.save();

    // 13. Update deployment
    deployment.latestFirmwareBuildId = firmwareBuild._id as mongoose.Types.ObjectId;
    deployment.latestFirmwareVersion = requestedVersion;
    if (deployment.status === 'CONFIGURED' || deployment.status === 'DRAFT') {
      deployment.status = 'FIRMWARE_GENERATED';
    }
    await deployment.save();

    return firmwareBuild.toSafeArtifact();
  }

  /**
   * List all firmware artifacts built for a deployment.
   */
  static async getArtifactsForDeployment(
    organizationId: string,
    deploymentId: string
  ): Promise<FirmwareBuildArtifact[]> {
    const builds = await FirmwareBuildModel.find({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      deploymentId: new mongoose.Types.ObjectId(deploymentId),
    })
      .sort({ createdAt: -1 })
      .exec();

    return builds.map((b) => b.toSafeArtifact());
  }

  /**
   * Retrieve single firmware artifact by ID.
   */
  static async getArtifactById(
    organizationId: string,
    artifactId: string
  ): Promise<FirmwareBuildArtifact> {
    const build = await FirmwareBuildModel.findOne({
      _id: new mongoose.Types.ObjectId(artifactId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    }).exec();

    if (!build) {
      throw new Error(`Firmware build ${artifactId} not found.`);
    }

    return build.toSafeArtifact();
  }

  /**
   * Retrieve binary ZIP buffer for download.
   */
  static async getFirmwareZipBuffer(
    organizationId: string,
    artifactId: string
  ): Promise<{ buffer: Buffer; filename: string }> {
    const build = await FirmwareBuildModel.findOne({
      _id: new mongoose.Types.ObjectId(artifactId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    }).exec();

    if (!build || !build.sourceZipBase64) {
      throw new Error(`Firmware build ${artifactId} archive is not available.`);
    }

    const buffer = Buffer.from(build.sourceZipBase64, 'base64');
    const filename = `sentinel-firmware-${build.version}-${artifactId.substring(0, 8)}.zip`;

    return { buffer, filename };
  }
}
