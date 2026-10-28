# SENTINEL — Day 14 Engineering Report
## ESP32 Hardware Abstraction Layer (HAL), Embedded Firmware & Zero-Trust Protocol Engine

---

### Executive Summary

On **Day 14**, Project Sentinel implemented its **ESP32 Hardware Abstraction Layer (HAL)**, **C++ production firmware drivers**, **PlatformIO configuration**, and a **dual-target TypeScript virtual node engine**. This fulfills the requirements of **Master Prompt Section 29, 30, and Day 14**:

> *"Every sensor driver must implement the HAL lifecycle contract: `init`, `read`, `health`, `deinit`.*  
> *Zero-Trust rule: Do not authenticate devices by deviceId alone. Microcontrollers must provide username (deviceId) and password (pre-shared secret token `sent_dev_...`).*  
> *Actuators must maintain safe fail-secure states on initialization and shutdown.*  
> *Microcontroller firmware must support hardware watchdog protection, non-blocking Wi-Fi reconnection, and cloud command execution with acknowledgments."*

Day 14 provides Sentinel with physical silicon readiness (ESP32-WROOM-32D / ESP32-S3) while simultaneously enabling automated, deterministic virtual node testing and continuous integration without requiring physical hardware benches.

---

### Key Deliverables

| Layer | Component | Location | Description |
|---|---|---|---|
| **Firmware Config** | `sentinel_config.h` | [`firmware/esp32/include/sentinel_config.h`](file:///e:/Sentinel/firmware/esp32/include/sentinel_config.h) | Compile-time GPIO pin mappings, I2C bus frequencies, default timing intervals, buffer allocations, and fallback endpoints. |
| **HAL C++ Contract** | `sentinel_hal.h` | [`firmware/esp32/include/sentinel_hal.h`](file:///e:/Sentinel/firmware/esp32/include/sentinel_hal.h) | Master C++ header declaring typed sensor reading structs, device diagnostics, and lifecycle function prototypes for all 9 peripheral drivers. |
| **PIR Driver** | `hal_pir.cpp` | [`firmware/esp32/src/hal/hal_pir.cpp`](file:///e:/Sentinel/firmware/esp32/src/hal/hal_pir.cpp) | Digital GPIO driver with hardware edge-trigger interrupt (`IRAM_ATTR`), event counting, and contact debounce filter. |
| **mmWave Radar Driver** | `hal_mmwave.cpp` | [`firmware/esp32/src/hal/hal_mmwave.cpp`](file:///e:/Sentinel/firmware/esp32/src/hal/hal_mmwave.cpp) | UART2 driver parsing 60GHz FMCW radar frames (`0xAA 0xFF`), extracting presence, headcount, target distance, and micro-movement confidence. |
| **$\text{CO}_2$ Sensor Driver** | `hal_co2.cpp` | [`firmware/esp32/src/hal/hal_co2.cpp`](file:///e:/Sentinel/firmware/esp32/src/hal/hal_co2.cpp) | I2C driver for Sensirion SCD40/SCD41 photoacoustic $\text{CO}_2$ sensor with CRC-8 checksum verification and periodic measurement control. |
| **Temp & Humidity Driver** | `hal_temp_humidity.cpp` | [`firmware/esp32/src/hal/hal_temp_humidity.cpp`](file:///e:/Sentinel/firmware/esp32/src/hal/hal_temp_humidity.cpp) | I2C driver for Sensirion SHT31 with dual CRC-8 validation, $-40^\circ\text{C}$ to $85^\circ\text{C}$ temperature conversion, and RH calculation. |
| **Sound SPL Driver** | `hal_sound.cpp` | [`firmware/esp32/src/hal/hal_sound.cpp`](file:///e:/Sentinel/firmware/esp32/src/hal/hal_sound.cpp) | Analog ADC driver with 50ms peak-to-peak audio windowing and logarithmic decibel SPL transfer function. |
| **Door Reed Driver** | `hal_door.cpp` | [`firmware/esp32/src/hal/hal_door.cpp`](file:///e:/Sentinel/firmware/esp32/src/hal/hal_door.cpp) | Digital GPIO pull-up reed switch driver with 50ms anti-chatter debounce and transition counter. |
| **Cleanroom Pressure Driver** | `hal_pressure.cpp` | [`firmware/esp32/src/hal/hal_pressure.cpp`](file:///e:/Sentinel/firmware/esp32/src/hal/hal_pressure.cpp) | I2C driver for Bosch BMP280 with factory calibration readout and 64-bit integer compensation. |
| **Ambient Light Driver** | `hal_light.cpp` | [`firmware/esp32/src/hal/hal_light.cpp`](file:///e:/Sentinel/firmware/esp32/src/hal/hal_light.cpp) | I2C driver for Rohm BH1750 (lux output) with automatic ADC LDR fallback. |
| **Actuator Relay Driver** | `hal_relay.cpp` | [`firmware/esp32/src/hal/hal_relay.cpp`](file:///e:/Sentinel/firmware/esp32/src/hal/hal_relay.cpp) | Digital GPIO relay driver enforcing safe fail-secure (de-energized) state on boot, timed pulse trigger, and clean de-init. |
| **Master HAL Orchestrator** | `hal_master.cpp` | [`firmware/esp32/src/hal/hal_master.cpp`](file:///e:/Sentinel/firmware/esp32/src/hal/hal_master.cpp) | Coordinates all peripheral drivers, samples multi-sensor telemetry packets, and reads ESP32 memory/silicon diagnostics. |
| **Wi-Fi Manager** | `wifi_manager.cpp` | [`firmware/esp32/src/wifi_manager.cpp`](file:///e:/Sentinel/firmware/esp32/src/wifi_manager.cpp) | Non-blocking Wi-Fi lifecycle manager with exponential backoff reconnection, RSSI monitoring, and NTP UTC time synchronization. |
| **MQTT Protocol Client** | `mqtt_manager.cpp` | [`firmware/esp32/src/mqtt_manager.cpp`](file:///e:/Sentinel/firmware/esp32/src/mqtt_manager.cpp) | PubSubClient + ArduinoJson 7 MQTT client connecting with zero-trust token credentials, telemetry serialization, command execution, and ACK publishing. |
| **Production Main** | `main.cpp` | [`firmware/esp32/src/main.cpp`](file:///e:/Sentinel/firmware/esp32/src/main.cpp) | ESP32 entry point configuring hardware task watchdog timer (`esp_task_wdt`), dual sampling loops, and fallback HTTP REST heartbeat. |
| **PlatformIO Config** | `platformio.ini` | [`firmware/esp32/platformio.ini`](file:///e:/Sentinel/firmware/esp32/platformio.ini) | Dual-environment build configuration supporting ESP32-WROOM-32D and ESP32-S3 boards. |
| **TypeScript HAL Drivers** | `hal-drivers.ts` | [`firmware/hal/hal-drivers.ts`](file:///e:/Sentinel/firmware/hal/hal-drivers.ts) | Pure TypeScript implementations of all 9 HAL drivers for simulated benchmarking and automated testing. |
| **Virtual Device Node** | `virtual-device.ts` | [`firmware/hal/virtual-device.ts`](file:///e:/Sentinel/firmware/hal/virtual-device.ts) | Virtual ESP32 node engine executing full MQTT lifecycle, HAL sampling, command dispatch, and ACK return. |
| **Verification Test Suite** | `test-day14.mjs` | [`scratch/test-day14.mjs`](file:///e:/Sentinel/scratch/test-day14.mjs) | 6-suite verification harness validating HAL drivers, zero-trust token authentication, live telemetry ingestion, and cloud command round-trips. |

---

### System Architecture

```mermaid
graph TD
    subgraph ESP32 Physical Silicon / Virtual Node
        subgraph Hardware & Drivers - HAL
            PIR[hal_pir - GPIO 13]
            MMW[hal_mmwave - UART2 16/17]
            CO2[hal_co2 - I2C 0x62 SCD40]
            TH[hal_temp_humidity - I2C 0x44 SHT31]
            SND[hal_sound - ADC1_CH6 GPIO 34]
            DOR[hal_door - GPIO 14 Reed]
            PRS[hal_pressure - I2C 0x76 BMP280]
            LGT[hal_light - I2C 0x23 BH1750]
            RLY[hal_relay - GPIO 27 Fail-Secure]
        end

        HM[HAL Master Orchestrator]
        PIR & MMW & CO2 & TH & SND & DOR & PRS & LGT & RLY --> HM

        subgraph Core Firmware Engine
            WDT[esp_task_wdt 15s Watchdog]
            WM[WiFiManager with Backoff & NTP]
            MM[MQTTManager ArduinoJson 7]
            MAIN[Firmware Main Loop]
        end

        HM --> MAIN
        WDT --> MAIN
        WM --> MM
        MAIN --> MM
    end

    subgraph Zero-Trust MQTT Gateway - Aedes :1883
        AUTH{Token Auth Hook}
        ACL{Topic ACL Isolation}
        INGEST[Message Ingestion Listener]
    end

    MM -- "Connect: user=deviceId, pass=sent_dev_..." --> AUTH
    AUTH -- "Check bcrypt hash" --> CRED[(DeviceCredentialModel)]
    MM -- "Publish: sentinel/.../telemetry" --> ACL --> INGEST
    MM -- "Subscribe: sentinel/.../command" --> ACL

    subgraph Sentinel Cloud Platform
        TV[TelemetryValidator]
        INGEST --> TV
        TV --> TEL[(TelemetryModel)]
        TV --> TWIN[(Room & Device Digital Twin)]
        CS[Command Service] -- "Publish: sentinel/.../command" --> MM
        MM -- "Publish: sentinel/.../ack" --> CS
    end
```

---

### Peripheral HAL Driver Specifications

| Driver | Interface | Default Pinout | Physical IC | Primary Formula / Measurement Logic | Health Diagnostic Check | Fail-Safe State |
|---|---|---|---|---|---|---|
| **`hal_pir`** | GPIO Input | GPIO 13 | PIR Motion Module | Interrupt pulse edge count (`RISING`), 150ms debounce | Verified GPIO state | Passive (no motion) |
| **`hal_mmwave`** | UART2 | RX: 16, TX: 17 | 60GHz FMCW Radar | Frame header `0xAA 0xFF`, tail `0x55 0xCC`, 16-bit distance cm to m | Frame stream active within 4000ms | Unoccupied |
| **`hal_co2`** | I2C | SDA: 21, SCL: 22 (0x62) | Sensirion SCD40 | Read 0xEC05, CRC-8 polynomial $0x31$, 16-bit ppm | I2C ACK + CRC-8 validity | Stored baseline |
| **`hal_temp_humidity`** | I2C | SDA: 21, SCL: 22 (0x44) | Sensirion SHT31 | $T = -45 + 175 \cdot \frac{\text{raw}}{65535}$, $\text{RH} = 100 \cdot \frac{\text{raw}}{65535}$ | Dual CRC-8 checksum verification | Stored baseline |
| **`hal_sound`** | ADC1 | GPIO 34 (ADC1_CH6) | MAX4466 Electret Mic | 50ms window $V_{\text{p-p}}$, $\text{SPL} = 20\log_{10}\left(\frac{V_{\text{p-p}}}{0.001\text{V}}\right) + 10$ | Analog sample bounds $(0 \le \text{sample} < 4096)$ | Ambient floor (32 dB) |
| **`hal_door`** | GPIO Input | GPIO 14 (`INPUT_PULLUP`) | Magnetic Reed Switch | Magnet near = LOW (closed), magnet far = HIGH (open), 50ms debounce | Pin state within valid logic levels | Closed |
| **`hal_pressure`** | I2C | SDA: 21, SCL: 22 (0x76) | Bosch BMP280 | Chip ID `0x58`, 12 trimming registers, 64-bit integer formula | Chip ID verify + I2C ACK | Standard atm (1013.25 hPa) |
| **`hal_light`** | I2C / ADC | SDA: 21, SCL: 22 (0x23) | Rohm BH1750 / LDR | $\text{lux} = \frac{\text{raw}}{1.2}$ with ADC LDR exponential fallback | I2C ACK or valid ADC reading | 300 Lux indoor |
| **`hal_relay`** | GPIO Output | GPIO 27 | SPDT 10A Relay | Digital level: Active-HIGH, pulse duration support | Valid GPIO output state | **De-energized (FAIL-SECURE)** |

---

### Zero-Trust Device Protocol & Inbound Remote Commands

#### 1. Authentication Credentials
Every physical and simulated device connecting to Project Sentinel's embedded MQTT broker must provide:
- **`client.username`**: Unique Device ID (e.g. `ESP32-DAY14-HAL-01`).
- **`client.password`**: Cryptographic pre-shared secret token (`sent_dev_...`).

The broker validates the token by computing its bcrypt/argon hash against `DeviceCredentialModel`. Connections without valid tokens are immediately terminated with MQTT return code `0x04` (`Connection refused: Bad username or password`).

#### 2. Canonical Topic Hierarchy
All MQTT topics follow strict multi-tenant isolation:
- **Telemetry**: `sentinel/{orgId}/{facilityId}/{deviceId}/telemetry`
- **Device Status**: `sentinel/{orgId}/{facilityId}/{deviceId}/status`
- **Inbound Commands**: `sentinel/{orgId}/{facilityId}/{deviceId}/command`
- **Configuration Updates**: `sentinel/{orgId}/{facilityId}/{deviceId}/config`
- **Command Acknowledgments**: `sentinel/{orgId}/{facilityId}/{deviceId}/ack`

Devices attempting to publish or subscribe outside their authorized `{orgId}/{facilityId}/{deviceId}` hierarchy are blocked by topic authorization hooks.

#### 3. Command & Acknowledgment Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Cloud as Sentinel Cloud / Web Console
    participant Broker as Embedded Aedes Broker
    participant Node as ESP32 Firmware Node
    participant Relay as HAL Relay Actuator

    Cloud->>Broker: Publish to sentinel/.../command<br/>{"commandId": "cmd_01", "command": "TRIGGER_ACTUATOR", "params": {"energize": true}}
    Broker->>Node: Forward command packet
    Note over Node: Deserialize JSON via ArduinoJson 7
    Node->>Relay: hal_relay_set(true)
    Relay-->>Node: State: energized=true, count=1
    Node->>Broker: Publish to sentinel/.../ack<br/>{"commandId": "cmd_01", "deviceId": "...", "status": "ACKNOWLEDGED", "details": "Relay energized"}
    Broker->>Cloud: Forward execution acknowledgment
```

---

### Verification & Test Suite Execution

The Day 14 test suite in [`scratch/test-day14.mjs`](file:///e:/Sentinel/scratch/test-day14.mjs) was executed against the real MongoDB database and embedded Aedes MQTT broker. All 6 test suites passed:

```
╔════════════════════════════════════════════════════════════════╗
║   SENTINEL DAY 14: ESP32 HAL, FIRMWARE & ZERO-TRUST BROKER    ║
╚════════════════════════════════════════════════════════════════╝

--- 1. Testing Hardware Abstraction Layer (HAL) Sensor & Actuator Drivers ---
✅ [HAL] PIR Driver initialized. Reading: motion=false, healthy=true
✅ [HAL] PIR Motion Trigger verified: motion=true
✅ [HAL] mmWave Radar: presence=true, count=2, dist=1.85m, energy=82
✅ [HAL] SCD40 CO2 Driver: concentration=760 ppm (calibrated 750 + 10 = 760)
✅ [HAL] SHT31 Temp & RH Driver: temp=22.6°C, humidity=48.5%
✅ [HAL] Acoustic Sound Driver: SPL=54.2 dB, peakAdc=510
✅ [HAL] Magnetic Door Driver: state=closed, transitions=0
✅ [HAL] Door Open Event: state=open, transitions=1
✅ [HAL] BMP280 Barometric Cleanroom Pressure: 1012.45 hPa
✅ [HAL] BH1750 Ambient Light Driver: 420.5 Lux
✅ [HAL] Relay Actuator Safe Initial State: energized=false (FAIL-SECURE)
✅ [HAL] Relay Energized: energized=true, count=1
✅ [HAL] Relay Pulse Complete: returned to energized=false, count=3
Testing HAL fault injection and peripheral health monitoring...
✅ [HAL] Peripheral Fault Flagged: healthy=false, error="UART2 frame synchronization timeout (60GHz radar)"
✅ [HAL] All HAL sensor and actuator drivers de-initialized cleanly.

--- 2. Setting Up Test Device & Cryptographic Token ---
[Database] MongoDB connected successfully to mongodb://localhost:27017/sentinel
✅ Connected to MongoDB.
✅ Provisioned device "ESP32-DAY14-HAL-01". Secret: sent_dev_e953b55...
✅ Zero-Trust Credential stored and verified: keyPrefix=sent_dev_e953b5

--- 3. Testing Embedded Aedes MQTT Broker & Zero-Trust Auth ---
✅ Embedded Aedes MQTT Broker running on port 18884.
Testing authentication rejection with fraudulent token...
✅ Test 3A Passed: Rogue connection rejected as expected ("Connection refused: Bad username or password").

--- 4. Booting Virtual ESP32 Node & Publishing Multi-Sensor Telemetry ---
✅ Virtual ESP32 Node "ESP32-DAY14-HAL-01" started and connected to MQTT broker.
Publishing multi-sensor telemetry frame from Virtual Node...
✅ Telemetry Ingested & Validated Successfully:
   - PIR Motion: true
   - mmWave Presence: true, Occupants: 2, Dist: 1.8m
   - CO2: 820 ppm
   - Temperature: 22.8°C, Humidity: 51%
   - Sound Level: 56.4 dB
   - Door State: closed
   - Pressure: 1012.8 hPa
   - Light: 415 Lux
   - Device Metadata: RSSI=-56 dBm, Heap=198420 bytes, Uptime=0s
✅ Room Digital Twin Updated: Temp=22.8°C, CO2=820 ppm, Door=closed
✅ Device Status Verified: ONLINE, Last Seen: Wed Oct 28 2026 09:57:02 GMT+0530
--- 5. Testing Cloud Command Dispatch & Actuator ACK Round-Trip ---
✅ Received Firmware Execution Acknowledgment:
   - Command ID: cmd_a44bfcec839be56f
   - Status: ACKNOWLEDGED
   - Details: "Actuator relay energized"
✅ Virtual ESP32 Relay Actuator State: energized=true, count=1

--- 6. Testing Graceful Shutdown & Fail-Secure Deinit ---
✅ Safe Deinit Enforced: Relay Actuator successfully de-energized (energized=false).
✅ Test MQTT Broker stopped cleanly.

════════════════════════════════════════════════════════════════
  ALL 6 SUITES PASSED — DAY 14 ESP32 HAL & FIRMWARE VERIFIED    
════════════════════════════════════════════════════════════════
```

---

### Conclusion & Operational Status

With Day 14 complete:
1. **Physical Silicon Readiness**: The C++ PlatformIO firmware is ready for flashing onto physical ESP32 and ESP32-S3 boards with full peripheral driver support and hardware watchdog protection.
2. **Deterministic Software Simulation**: The virtual node engine in `firmware/hal/` provides the platform with automated test harness capabilities, allowing full continuous integration without physical microcontrollers.
3. **Fail-Secure Safety Architecture**: Actuator relays are strictly de-energized on startup and shutdown to prevent dangerous fail-open hazards in HVAC and access control systems.
4. **Zero-Trust Connectivity**: All device communication is bound to cryptographic tokens, preventing spoofing or cross-tenant topic snooping.

Project Sentinel is now prepared for **Day 15: Industry Policies & Compliance Profiles**.
