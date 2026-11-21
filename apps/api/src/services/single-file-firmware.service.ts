// ─────────────────────────────────────────────
// SENTINEL API — Single-File Firmware Generator Service
// Generates standalone sentinel_firmware.ino for ESP32 & ESP8266
// ─────────────────────────────────────────────

import type {
  BoardType,
  Deployment,
  SelectedSensorConfig,
  SingleFileFirmwareConfig,
  SingleFileFirmwareResult,
} from '@sentinel/types';

interface SensorDriverTemplate {
  sensorTypes: string[];
  libraries: string[];
  includes: string[];
  pinDefinitions: (board: BoardType, sensor: SelectedSensorConfig, index: number) => string;
  globals: (sensor: SelectedSensorConfig, index: number) => string;
  setupCode: (sensor: SelectedSensorConfig, index: number) => string;
  readCode: (sensor: SelectedSensorConfig, index: number) => string;
}

const SENSOR_TEMPLATES: Record<string, SensorDriverTemplate> = {
  // ── PIR Motion Sensor ──
  PIR: {
    sensorTypes: ['PIR', 'MOTION', 'PRESENCE'],
    libraries: [],
    includes: [],
    pinDefinitions: (board, sensor, index) => {
      const pin = sensor.assignedPins?.[0] ?? (board.startsWith('ESP8266') ? 14 : 13); // D5 or GPIO13
      return `#define PIN_PIR_${index} ${pin} // ${sensor.model || 'PIR Motion Sensor'}`;
    },
    globals: (_sensor, index) => `bool lastPirState_${index} = false;`,
    setupCode: (_sensor, index) => `  pinMode(PIN_PIR_${index}, INPUT);
  Serial.println("[PIR] Initialized on pin " + String(PIN_PIR_${index}));`,
    readCode: (sensor, index) => `  int pirVal_${index} = digitalRead(PIN_PIR_${index});
  sensors["${sensor.model?.toLowerCase() || 'motion'}"] = (pirVal_${index} == HIGH);
  sensors["presence_detected"] = (pirVal_${index} == HIGH);`,
  },

  // ── Magnetic Door Sensor ──
  DOOR_MAGNETIC: {
    sensorTypes: ['DOOR_MAGNETIC', 'CONTACT', 'DOOR'],
    libraries: [],
    includes: [],
    pinDefinitions: (board, sensor, index) => {
      const pin = sensor.assignedPins?.[0] ?? (board.startsWith('ESP8266') ? 12 : 27); // D6 or GPIO27
      return `#define PIN_DOOR_${index} ${pin} // Magnetic Reed Switch`;
    },
    globals: () => '',
    setupCode: (_sensor, index) => `  pinMode(PIN_DOOR_${index}, INPUT_PULLUP);
  Serial.println("[DOOR] Initialized on pin " + String(PIN_DOOR_${index}));`,
    readCode: (sensor, index) => `  int doorVal_${index} = digitalRead(PIN_DOOR_${index});
  sensors["${sensor.model?.toLowerCase() || 'door_open'}"] = (doorVal_${index} == HIGH);`,
  },

  // ── BME280 / BMP280 (I2C) ──
  BME280: {
    sensorTypes: ['BME280', 'BMP280', 'TEMPERATURE_HUMIDITY_PRESSURE'],
    libraries: ['Adafruit BME280 Library', 'Adafruit Unified Sensor'],
    includes: ['#include <Wire.h>', '#include <Adafruit_Sensor.h>', '#include <Adafruit_BME280.h>'],
    pinDefinitions: (_board, _sensor, _index) => `// BME280 uses default I2C pins (SDA, SCL)`,
    globals: (_sensor, index) => `Adafruit_BME280 bme_${index};
bool bmeReady_${index} = false;`,
    setupCode: (_sensor, index) => `  if (bme_${index}.begin(0x76) || bme_${index}.begin(0x77)) {
    bmeReady_${index} = true;
    Serial.println("[BME280] Connected at I2C address 0x76/0x77");
  } else {
    Serial.println("[BME280] Warning: Sensor not found on I2C bus!");
  }`,
    readCode: (_sensor, index) => `  if (bmeReady_${index}) {
    float temp = bme_${index}.readTemperature();
    float hum = bme_${index}.readHumidity();
    float pres = bme_${index}.readPressure() / 100.0F;
    if (!isnan(temp)) sensors["temperature"] = round(temp * 10.0) / 10.0;
    if (!isnan(hum)) sensors["humidity"] = round(hum * 10.0) / 10.0;
    if (!isnan(pres)) sensors["pressure"] = round(pres * 10.0) / 10.0;
  }`,
  },

  // ── SHT31 (I2C) ──
  SHT31: {
    sensorTypes: ['SHT31', 'SHT30', 'SHT35'],
    libraries: ['Adafruit SHT31 Library'],
    includes: ['#include <Wire.h>', '#include <Adafruit_SHT31.h>'],
    pinDefinitions: (_board, _sensor, _index) => `// SHT31 uses default I2C pins (SDA, SCL)`,
    globals: (_sensor, index) => `Adafruit_SHT31 sht31_${index} = Adafruit_SHT31();
bool shtReady_${index} = false;`,
    setupCode: (_sensor, index) => `  if (sht31_${index}.begin(0x44)) {
    shtReady_${index} = true;
    Serial.println("[SHT31] Connected at I2C address 0x44");
  } else {
    Serial.println("[SHT31] Warning: Sensor not detected at 0x44!");
  }`,
    readCode: (_sensor, index) => `  if (shtReady_${index}) {
    float t = sht31_${index}.readTemperature();
    float h = sht31_${index}.readHumidity();
    if (!isnan(t)) sensors["temperature"] = round(t * 10.0) / 10.0;
    if (!isnan(h)) sensors["humidity"] = round(h * 10.0) / 10.0;
  }`,
  },

  // ── DHT11 / DHT22 (Digital 1-Wire) ──
  DHT: {
    sensorTypes: ['DHT11', 'DHT22', 'AM2302', 'DHT-11', 'DHT-22', 'DHT', 'TEMPERATURE_HUMIDITY'],
    libraries: ['DHT sensor library by Adafruit', 'Adafruit Unified Sensor'],
    includes: ['#include <DHT.h>'],
    pinDefinitions: (board, sensor, index) => {
      const pin = sensor.assignedPins?.[0] ?? (board.startsWith('ESP8266') ? 14 : 4); // D5 or GPIO4
      const dhtType = sensor.model?.toUpperCase().includes('22') ? 'DHT22' : 'DHT11';
      return `#define PIN_DHT_${index} ${pin} // ${sensor.model || 'DHT11'}
#define DHTTYPE_${index} ${dhtType}`;
    },
    globals: (_sensor, index) => `DHT dht_${index}(PIN_DHT_${index}, DHTTYPE_${index});`,
    setupCode: (_sensor, index) => `  dht_${index}.begin();
  Serial.println("[DHT] Initialized on pin " + String(PIN_DHT_${index}));`,
    readCode: (sensor, index) => {
      const keyPrefix = (sensor.model || 'dht11').toLowerCase().replace(/[^a-z0-9]/g, '');
      return `  float dhtT_${index} = dht_${index}.readTemperature();
  float dhtH_${index} = dht_${index}.readHumidity();
  if (!isnan(dhtT_${index})) {
    sensors["temperature"] = round(dhtT_${index} * 10.0) / 10.0;
    sensors["${keyPrefix}_temp"] = round(dhtT_${index} * 10.0) / 10.0;
  }
  if (!isnan(dhtH_${index})) {
    sensors["humidity"] = round(dhtH_${index} * 10.0) / 10.0;
    sensors["${keyPrefix}_hum"] = round(dhtH_${index} * 10.0) / 10.0;
  }`;
    },
  },

  // ── SCD41 CO2 (I2C) ──
  SCD41: {
    sensorTypes: ['SCD40', 'SCD41', 'CO2_NDIR'],
    libraries: ['Sensirion I2C SCD4x'],
    includes: ['#include <Wire.h>', '#include <SensirionI2CScd4x.h>'],
    pinDefinitions: (_board, _sensor, _index) => `// SCD41 uses default I2C pins (SDA, SCL)`,
    globals: (_sensor, index) => `SensirionI2CScd4x scd4x_${index};
bool scdReady_${index} = false;`,
    setupCode: (_sensor, index) => `  scd4x_${index}.begin(Wire);
  uint16_t scdError = scd4x_${index}.startPeriodicMeasurement();
  if (scdError == 0) {
    scdReady_${index} = true;
    Serial.println("[SCD41] Periodic measurement started");
  } else {
    Serial.println("[SCD41] Error starting measurement: " + String(scdError));
  }`,
    readCode: (_sensor, index) => `  if (scdReady_${index}) {
    uint16_t co2 = 0;
    float scdTemp = 0.0f, scdHum = 0.0f;
    bool isDataReady = false;
    scd4x_${index}.getDataReadyFlag(isDataReady);
    if (isDataReady) {
      scd4x_${index}.readMeasurement(co2, scdTemp, scdHum);
      if (co2 > 0) sensors["co2"] = co2;
      sensors["temperature"] = round(scdTemp * 10.0) / 10.0;
      sensors["humidity"] = round(scdHum * 10.0) / 10.0;
    }
  }`,
  },

  // ── BH1750 Ambient Light (I2C) ──
  BH1750: {
    sensorTypes: ['BH1750', 'LIGHT_LUX', 'LIGHT'],
    libraries: ['BH1750 by Christopher Laws'],
    includes: ['#include <Wire.h>', '#include <BH1750.h>'],
    pinDefinitions: (_board, _sensor, _index) => `// BH1750 uses default I2C pins (SDA, SCL)`,
    globals: (_sensor, index) => `BH1750 lightMeter_${index};
bool bhReady_${index} = false;`,
    setupCode: (_sensor, index) => `  if (lightMeter_${index}.begin(BH1750::CONTINUOUS_HIGH_RES_MODE)) {
    bhReady_${index} = true;
    Serial.println("[BH1750] Initialized in High-Res mode");
  } else {
    Serial.println("[BH1750] Warning: Light sensor not detected!");
  }`,
    readCode: (_sensor, index) => `  if (bhReady_${index}) {
    float lux = lightMeter_${index}.readLightLevel();
    if (lux >= 0) sensors["ambient_light"] = round(lux * 10.0) / 10.0;
  }`,
  },

  // ── MQ-2 / MQ-3 / MQ-4 / MQ-5 / MQ-6 / MQ-7 / MQ-8 / MQ-9 / MQ-135 Gas / Smoke (Analog ADC) ──
  MQ_GAS: {
    sensorTypes: [
      'MQ2', 'MQ3', 'MQ4', 'MQ5', 'MQ6', 'MQ7', 'MQ8', 'MQ9', 'MQ135',
      'MQ-2', 'MQ-3', 'MQ-4', 'MQ-5', 'MQ-6', 'MQ-7', 'MQ-8', 'MQ-9', 'MQ-135',
      'GAS', 'SMOKE', 'AIR_QUALITY', 'ALCOHOL', 'METHANE', 'CO', 'HYDROGEN', 'BUTANE', 'LPG',
    ],
    libraries: [],
    includes: [],
    pinDefinitions: (board, sensor, index) => {
      // Default to GPIO 34 (ADC1_CH6 - input only, WiFi safe) on ESP32, A0 on ESP8266
      const pin = sensor.assignedPins?.[0] ?? (board.startsWith('ESP8266') ? 0 : 34);
      return `#define PIN_GAS_${index} ${pin} // Analog Gas/Smoke sensor (${sensor.model || 'MQ Series'})`;
    },
    globals: () => '',
    setupCode: (_sensor, index) => `  // Analog pin PIN_GAS_${index} configured as analog input
  Serial.println("[GAS] Configured on analog pin " + String(PIN_GAS_${index}));`,
    readCode: (sensor, index) => {
      const model = (sensor.model || sensor.sensorType || 'mq2').toLowerCase().replace(/[^a-z0-9]/g, '');
      let alertField = 'gas_detected';
      if (model.includes('mq2') || model.includes('smoke')) alertField = 'smoke_detected';
      else if (model.includes('mq3') || model.includes('alcohol')) alertField = 'alcohol_detected';
      else if (model.includes('mq4') || model.includes('methane')) alertField = 'methane_detected';
      else if (model.includes('mq5') || model.includes('lpg')) alertField = 'lpg_detected';
      else if (model.includes('mq6') || model.includes('butane')) alertField = 'butane_detected';
      else if (model.includes('mq7') || model.includes('co')) alertField = 'co_detected';
      else if (model.includes('mq8') || model.includes('hydrogen')) alertField = 'hydrogen_detected';
      else if (model.includes('mq9')) alertField = 'flammable_gas_alert';
      else if (model.includes('mq135') || model.includes('air')) alertField = 'air_quality_alert';

      return `  int rawGas_${index} = analogRead(PIN_GAS_${index});
  sensors["${model}"] = rawGas_${index};
  sensors["${alertField}"] = (rawGas_${index} > 1200);`;
    },
  },

  // ── Water Leak Sensor (Digital/Analog) ──
  WATER_LEAK: {
    sensorTypes: ['WATER_LEAK', 'WATER', 'LEAK', 'RAIN'],
    libraries: [],
    includes: [],
    pinDefinitions: (board, sensor, index) => {
      const pin = sensor.assignedPins?.[0] ?? (board.startsWith('ESP8266') ? 13 : 25); // D7 or GPIO25
      return `#define PIN_WATER_${index} ${pin} // Water Leak Probe`;
    },
    globals: () => '',
    setupCode: (_sensor, index) => `  pinMode(PIN_WATER_${index}, INPUT);
  Serial.println("[WATER] Initialized on pin " + String(PIN_WATER_${index}));`,
    readCode: (sensor, index) => `  int waterVal_${index} = digitalRead(PIN_WATER_${index});
  // Active LOW or HIGH depending on sensor board
  sensors["${sensor.model?.toLowerCase() || 'water_leak'}"] = (waterVal_${index} == LOW);`,
  },

  // ── Relay / Actuator (Digital Output) ──
  RELAY: {
    sensorTypes: ['RELAY', 'ACTUATOR', 'SWITCH'],
    libraries: [],
    includes: [],
    pinDefinitions: (board, sensor, index) => {
      const pin = sensor.assignedPins?.[0] ?? (board.startsWith('ESP8266') ? 15 : 18); // D8 or GPIO18
      return `#define PIN_RELAY_${index} ${pin} // Relay Control Output`;
    },
    globals: (_sensor, index) => `bool relayState_${index} = false;`,
    setupCode: (_sensor, index) => `  pinMode(PIN_RELAY_${index}, OUTPUT);
  digitalWrite(PIN_RELAY_${index}, LOW);
  Serial.println("[RELAY] Initialized on pin " + String(PIN_RELAY_${index}));`,
    readCode: (_sensor, index) => `  sensors["relay_${index}_state"] = relayState_${index};`,
  },

  // ── Ultrasonic Distance Sensor (HC-SR04 / HC-SR04P / JSN-SR04T) ──
  ULTRASONIC: {
    sensorTypes: ['ULTRASONIC', 'HC-SR04', 'HC-SR04P', 'JSN-SR04T', 'DISTANCE', 'SONAR'],
    libraries: [],
    includes: [],
    pinDefinitions: (board, sensor, index) => {
      const isEsp8266 = board.startsWith('ESP8266');
      // TRIG defaults: GPIO5 (ESP32) or D1/GPIO5 (ESP8266)
      // ECHO defaults: GPIO18 (ESP32) or D2/GPIO4 (ESP8266)
      // If user had assigned 1 pin (e.g. pin 4 or 5), use that as TRIG, and fallback ECHO to 18 (or 4 on ESP8266)
      const trigPin = sensor.assignedPins?.[0] ?? (isEsp8266 ? 5 : 5);
      const echoPin = sensor.assignedPins?.[1] ?? (sensor.assignedPins?.[0] === 18 ? 5 : (isEsp8266 ? 4 : 18));
      return `#define PIN_TRIG_${index} ${trigPin} // ${sensor.model || 'Ultrasonic'} Trigger (Output)
#define PIN_ECHO_${index} ${echoPin} // ${sensor.model || 'Ultrasonic'} Echo (Input)`;
    },
    globals: (_sensor, index) => `// Read ultrasonic distance in centimeters with diagnostic feedback
float readUltrasonicCm_${index}() {
  for (int attempt = 0; attempt < 2; attempt++) {
    // Ensure clean LOW before triggering
    digitalWrite(PIN_TRIG_${index}, LOW);
    delayMicroseconds(4);
    digitalWrite(PIN_TRIG_${index}, HIGH);
    delayMicroseconds(10);
    digitalWrite(PIN_TRIG_${index}, LOW);

    // pulseIn measures duration of ECHO HIGH pulse (50ms timeout ~8m max range)
    unsigned long duration = pulseIn(PIN_ECHO_${index}, HIGH, 50000UL);
    if (duration > 0) {
      float dist = (duration * 0.0343) / 2.0;
      if (dist >= 2.0 && dist <= 450.0) {
        Serial.println("[ULTRASONIC] Echo detected: " + String(dist, 1) + " cm (pulse " + String(duration) + " us)");
        return dist;
      }
    }
    delay(10);
  }
  Serial.println("[ULTRASONIC] No echo pulse (returned -1). Check: 1) VCC to 5V/VIN, 2) TRIG=GPIO" + String(PIN_TRIG_${index}) + ", 3) ECHO=GPIO" + String(PIN_ECHO_${index}));
  return -1.0;
}`,
    setupCode: (_sensor, index) => `  pinMode(PIN_TRIG_${index}, OUTPUT);
  pinMode(PIN_ECHO_${index}, INPUT);
  digitalWrite(PIN_TRIG_${index}, LOW);
  delay(20);
  Serial.println("[ULTRASONIC] Initialized on TRIG=GPIO" + String(PIN_TRIG_${index}) + ", ECHO=GPIO" + String(PIN_ECHO_${index}) + " (Requires 5V VCC)");`,
    readCode: (sensor, index) => `  float dist_${index} = readUltrasonicCm_${index}();
  if (dist_${index} > 0) {
    float roundedDist = round(dist_${index} * 10.0) / 10.0;
    sensors["${sensor.model?.toLowerCase() || 'ultrasonic'}"] = roundedDist;
    sensors["ultrasonic"] = roundedDist;
    sensors["distance_cm"] = roundedDist;
    // Parking stall vehicle presence threshold: distance < 180cm indicates vehicle present
    bool bayOccupied = (dist_${index} < 180.0);
    sensors["presence_detected"] = bayOccupied;
    sensors["bay_occupied"] = bayOccupied;
  } else {
    sensors["${sensor.model?.toLowerCase() || 'ultrasonic'}"] = -1;
    sensors["ultrasonic"] = -1;
    sensors["distance_cm"] = -1;
  }`,
  },
};

function matchSensorDriver(sensor: SelectedSensorConfig): SensorDriverTemplate | null {
  const modelUpper = (sensor.model || '').toUpperCase();
  const typeUpper = (sensor.sensorType || '').toUpperCase();

  for (const template of Object.values(SENSOR_TEMPLATES)) {
    for (const st of template.sensorTypes) {
      if (modelUpper.includes(st) || typeUpper.includes(st)) {
        return template;
      }
    }
  }

  // Fallback to generic GPIO or ADC if interface specified
  if (sensor.interfaceType === 'GPIO') {
    return SENSOR_TEMPLATES.PIR || null;
  }
  if (sensor.interfaceType === 'ADC') {
    return SENSOR_TEMPLATES.MQ_GAS || null;
  }
  return null;
}

export class SingleFileFirmwareGeneratorService {
  /**
   * Generates a single standalone sentinel_firmware.ino sketch
   * containing Wi-Fi configuration, device API key authentication,
   * modular sensor drivers, and HTTP POST telemetry with retry logic.
   */
  public static generateIno(
    deployment: Deployment,
    config: SingleFileFirmwareConfig
  ): SingleFileFirmwareResult {
    const {
      boardType = 'ESP32_DEV',
      wifiSsid,
      wifiPassword = '',
      serverUrl,
      telemetryIntervalMs = 2500,
      deviceId = deployment.deviceId || `sentinel_${deployment.id.substring(0, 8)}`,
      apiKey = 'YOUR_DEVICE_API_KEY_HERE',
    } = config;

    const selectedSensors: SelectedSensorConfig[] = deployment.hardwareConfig?.sensors || [];
    const isEsp32 = !boardType.startsWith('ESP8266');

    // Collect drivers and required libraries
    const librariesSet = new Set<string>(['ArduinoJson (v6.x or v7.x)']);
    const includesSet = new Set<string>();
    const pinDefsList: string[] = [];
    const globalsList: string[] = [];
    const setupCallsList: string[] = [];
    const readCallsList: string[] = [];
    const pinSummary: { sensor: string; pins: string; interfaceType: string }[] = [];

    // I2C Pins definition
    if (isEsp32) {
      pinDefsList.push('// Default ESP32 I2C pins\n#define I2C_SDA 21\n#define I2C_SCL 22');
    } else {
      pinDefsList.push('// Default ESP8266 I2C pins (NodeMCU / WeMos)\n#define I2C_SDA 4 // D2\n#define I2C_SCL 5 // D1');
    }

    let hasI2C = false;

    selectedSensors.forEach((sensor: SelectedSensorConfig, idx: number) => {
      const driver = matchSensorDriver(sensor);
      if (driver) {
        driver.libraries.forEach((lib) => librariesSet.add(lib));
        driver.includes.forEach((inc) => {
          includesSet.add(inc);
          if (inc.includes('Wire.h')) hasI2C = true;
        });

        const pinDef = driver.pinDefinitions(boardType, sensor, idx);
        if (pinDef) pinDefsList.push(pinDef);

        const glob = driver.globals(sensor, idx);
        if (glob) globalsList.push(glob);

        const setup = driver.setupCode(sensor, idx);
        if (setup) setupCallsList.push(setup);

        const read = driver.readCode(sensor, idx);
        if (read) readCallsList.push(read);

        let pinsDesc: string;
        if (sensor.sensorType === 'ULTRASONIC' || (sensor.model || '').toUpperCase().includes('SR04')) {
          const trigPin = sensor.assignedPins?.[0] ?? (isEsp32 ? 5 : 5);
          const echoPin = sensor.assignedPins?.[1] ?? (isEsp32 ? 18 : 4);
          pinsDesc = `TRIG: GPIO${trigPin}, ECHO: GPIO${echoPin}`;
        } else if (sensor.assignedPins && sensor.assignedPins.length > 0) {
          pinsDesc = sensor.assignedPins.map((p: number) => `GPIO${p}`).join(', ');
        } else {
          pinsDesc = sensor.interfaceType === 'I2C' ? 'SDA/SCL' : 'Default Pin';
        }

        pinSummary.push({
          sensor: sensor.model || sensor.sensorType,
          pins: pinsDesc,
          interfaceType: sensor.interfaceType,
        });
      } else {
        // Fallback placeholder
        pinSummary.push({
          sensor: sensor.model || sensor.sensorType,
          pins: 'Auto-mapped',
          interfaceType: sensor.interfaceType,
        });
      }
    });

    const timestamp = new Date().toISOString();
    const sanitizedServerUrl = serverUrl.replace(/\/+$/, '');
    const endpointPath = '/api/v1/sensors/data';

    // Construct the complete standalone .ino file
    const inoContent = `/* ====================================================================
 * SENTINEL — Privacy-Preserving Autonomous Sensor Intelligence
 * STANDALONE FIRMWARE SKETCH
 * ====================================================================
 * Deployment:  ${deployment.name} (${deployment.id})
 * Industry:    ${deployment.industry}
 * Use Case:    ${deployment.useCaseName}
 * Target Board: ${boardType}
 * Generated:   ${timestamp}
 * ====================================================================
 * INSTRUCTIONS:
 * 1. Open this file in Arduino IDE.
 * 2. Select Board: ${isEsp32 ? 'Tools > Board > ESP32 Arduino > ESP32 Dev Module' : 'Tools > Board > ESP8266 Boards > NodeMCU 1.0 (ESP-12E)'}
 * 3. Install required libraries listed below via Library Manager.
 * 4. Connect board via USB, choose the correct COM port, and click Upload.
 * ==================================================================== */

// ================= USER CONFIGURATION =================
const char* WIFI_SSID     = "${wifiSsid.replace(/"/g, '\\"')}";
const char* WIFI_PASSWORD = "${wifiPassword.replace(/"/g, '\\"')}";

// SENTINEL Ingestion Endpoint
const char* SERVER_URL    = "${sanitizedServerUrl}${endpointPath}";
const char* DEVICE_ID     = "${deviceId}";
const char* API_KEY       = "${apiKey}";

// Telemetry interval in milliseconds
const unsigned long TELEMETRY_INTERVAL_MS = ${telemetryIntervalMs}UL;

// ================= BOARD ARCHITECTURE HEADERS =================
#if defined(ESP32)
  #include <WiFi.h>
  #include <HTTPClient.h>
#elif defined(ESP8266)
  #include <ESP8266WiFi.h>
  #include <ESP8266HTTPClient.h>
  #include <WiFiClient.h>
#else
  #error "Selected board is not an ESP32 or ESP8266. Please choose a compatible architecture."
#endif

#include <ArduinoJson.h>
${Array.from(includesSet).join('\n')}

// ================= HARDWARE PIN DEFINITIONS =================
${pinDefsList.join('\n')}

// ================= SENSOR GLOBALS & INSTANCES =================
${globalsList.join('\n')}

// Timing & state tracking
unsigned long lastTelemetryTime = 0;
unsigned long wifiRetryCount = 0;
bool wifiConnected = false;

// ================= WIFI INITIALIZATION =================
void connectWiFi() {
  Serial.println();
  Serial.print("[WiFi] Connecting to: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long startAttempt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < 15000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println();
    Serial.println("[WiFi] CONNECTED!");
    Serial.print("[WiFi] IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("[WiFi] Signal RSSI: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    wifiConnected = false;
    Serial.println();
    Serial.println("[WiFi] Connection timeout. Will retry in background.");
  }
}

// ================= SENSOR SETUP =================
void setupSensors() {
  Serial.println("[Sensors] Initializing configured hardware drivers...");
${hasI2C ? `  Wire.begin(${isEsp32 ? 'I2C_SDA, I2C_SCL' : ''});
  delay(100);\n` : ''}${setupCallsList.map(s => `  ${s}`).join('\n\n')}
  Serial.println("[Sensors] Initialization complete.");
}

// ================= HTTP TELEMETRY INGESTION =================
void sendTelemetryPayload(const String& payload) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] WiFi not connected, attempting quick reconnect...");
    WiFi.reconnect();
    unsigned long reconnectWait = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - reconnectWait < 3000) {
      delay(200);
    }
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("[HTTP] Skip transmission — WiFi offline.");
      return;
    }
  }

  Serial.println("[HTTP] Dispatching telemetry payload to SENTINEL...");
  Serial.println(payload);

#if defined(ESP32)
  HTTPClient http;
  http.begin(SERVER_URL);
#elif defined(ESP8266)
  WiFiClient client;
  HTTPClient http;
  http.begin(client, SERVER_URL);
#endif

  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-API-Key", API_KEY);
  http.setTimeout(7000);

  int httpCode = http.POST(payload);

  if (httpCode > 0) {
    Serial.print("[HTTP] Response code: ");
    Serial.println(httpCode);
    if (httpCode == HTTP_CODE_OK || httpCode == 201) {
      String response = http.getString();
      Serial.println("[HTTP] Ingestion verified: " + response);
    } else {
      String response = http.getString();
      Serial.println("[HTTP] Server returned error: " + response);
    }
  } else {
    Serial.print("[HTTP] POST failed, error: ");
    Serial.println(http.errorToString(httpCode).c_str());
  }

  http.end();
}

// ================= TELEMETRY BUILD & DISPATCH =================
void collectAndPublish() {
  // Use StaticJsonDocument or JsonDocument depending on ArduinoJson version
#if ARDUINOJSON_VERSION_MAJOR >= 7
  JsonDocument doc;
#else
  StaticJsonDocument<1024> doc;
#endif

  doc["deviceId"] = DEVICE_ID;
  doc["timestamp"] = millis();

  JsonObject sensors = doc.createNestedObject("sensors");

  // Read data from active hardware sensors
${readCallsList.map(r => `  ${r}`).join('\n\n')}

  // Add system diagnostics
  sensors["rssi"] = WiFi.RSSI();
  sensors["uptime_sec"] = millis() / 1000;

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  sendTelemetryPayload(jsonPayload);
}

// ================= ARDUINO SETUP =================
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("==================================================");
  Serial.println(" SENTINEL SENSOR AGENT ONLINE");
  Serial.println(" Board:    ${boardType}");
  Serial.println(" Device:   " + String(DEVICE_ID));
  Serial.println(" Firmware: v1.0.0-standalone");
  Serial.println("==================================================");

  // Initialize sensors
  setupSensors();

  // Connect to WiFi
  connectWiFi();

  // Send initial startup telemetry immediately
  if (WiFi.status() == WL_CONNECTED) {
    collectAndPublish();
    lastTelemetryTime = millis();
  }
}

// ================= MAIN LOOP =================
void loop() {
  unsigned long now = millis();

  // Check WiFi health periodically
  if (WiFi.status() != WL_CONNECTED) {
    if (now - wifiRetryCount > 10000) {
      wifiRetryCount = now;
      Serial.println("[WiFi] Lost connection, reconnecting...");
      WiFi.reconnect();
    }
  }

  // Periodic telemetry interval
  if (now - lastTelemetryTime >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryTime = now;
    collectAndPublish();
  }

  delay(10); // Yield to background WiFi stack
}
`;

    const libraries = Array.from(librariesSet);
    const installGuide = `# Arduino IDE Flashing Guide

## 1. Prerequisites
- Arduino IDE (v2.0 or higher recommended)
- USB Data Cable

## 2. Board Support Package
${isEsp32
  ? `- Go to File > Preferences > Additional Boards Manager URLs:
  https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
- Go to Tools > Board > Boards Manager, search "esp32" and install "esp32 by Espressif Systems".
- Select Tools > Board > ESP32 Arduino > ESP32 Dev Module.`
  : `- Go to File > Preferences > Additional Boards Manager URLs:
  http://arduino.esp8266.com/stable/package_esp8266com_index.json
- Go to Tools > Board > Boards Manager, search "esp8266" and install "esp8266 by ESP8266 Community".
- Select Tools > Board > ESP8266 Boards > NodeMCU 1.0 (ESP-12E).`}

## 3. Required Libraries
Install the following via Tools > Manage Libraries (Ctrl+Shift+I):
${libraries.map(lib => `- **${lib}**`).join('\n')}

## 4. Flash Firmware
1. Connect your ${boardType} to the computer via USB.
2. Select the appropriate Port in Tools > Port.
3. Verify and Upload (Ctrl+U).
4. Open Tools > Serial Monitor at 115200 baud to see live diagnostics.
`;

    return {
      filename: 'sentinel_firmware.ino',
      content: inoContent,
      boardType,
      requiredLibraries: libraries,
      installGuide,
      generatedAt: timestamp,
      sensorsCount: selectedSensors.length,
      pinSummary,
    };
  }
}
