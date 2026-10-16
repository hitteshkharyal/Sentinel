# SENTINEL — Day 6 Completion Report

## ✅ Sensor Catalog & Hardware Configuration Phase Complete

---

## 1. Executive Summary & Capabilities Delivered

In **Day 6**, the complete **Sensor Catalog & Hardware Configuration** subsystem was engineered and verified across the full stack.

SENTINEL does not treat IoT sensors as arbitrary unstructured data streams. It enforces rigorous hardware specifications, physical electrical pin mappings, sampling frequencies, digital filter parameters, alert thresholds, and field calibration formulas across **all 18 sensor types** defined in Section 28 of the Master Prompt.

In strict alignment with the platform's core zero-surveillance guarantee, every sensor in the catalog operates with **zero cameras and zero acoustic audio surveillance streaming**, capturing physical telemetry (Doppler micro-motion radar point clouds, photoacoustic $\text{CO}_2$, acoustic energy decibels, temperature, humidity, magnetic contact, barometric pressure, VOC gases, and flame radiation).

---

## 2. Architecture & Modules Implemented

| Category | Component / Module | Description |
|---|---|---|
| **Data Contracts** | [`packages/types/src/sensor.ts`](file:///e:/Sentinel/packages/types/src/sensor.ts) | TypeScript definitions for `SensorCatalogItem`, `SensorEntity`, `SensorCategory` (5 classes), `SensorStatus` (5 states), `SensorDetailedConfig`, `SensorCalibration`, `SensorReading`, and DTO schemas |
| **Validation Layer** | [`packages/validation/src/schemas.ts`](file:///e:/Sentinel/packages/validation/src/schemas.ts) | Zod runtime validation schemas: `sensorTypeSchema`, `sensorInterfaceSchema`, `createSensorSchema`, `updateSensorSchema`, `configureSensorSchema`, `calibrateSensorSchema`, `sensorFilterSchema` |
| **Hardware Catalog DB** | [`apps/api/src/services/sensor-catalog.data.ts`](file:///e:/Sentinel/apps/api/src/services/sensor-catalog.data.ts) | Master database containing 18 certified industrial/IoT sensor specifications with pinout wiring diagrams, operating voltages, sampling frequency boundaries, and sector recommendations |
| **Database Models** | [`apps/api/src/models/Sensor.ts`](file:///e:/Sentinel/apps/api/src/models/Sensor.ts) | Mongoose sensor instance model with multi-tenant compound indexes `{ organizationId: 1, sensorType: 1 }`, spatial links to `facilityId` and `roomId`, electrical pin mappings, threshold arrays, and `toSafeSensor()` serializer |
| **Service Layer** | [`apps/api/src/services/sensor.service.ts`](file:///e:/Sentinel/apps/api/src/services/sensor.service.ts) | Sensor catalog retrieval, sensor instance CRUD, hardware bus configuration, linear calibration engine, and default multi-sector sensor suite seeding |
| **REST API Routes** | [`apps/api/src/routes/sensors.ts`](file:///e:/Sentinel/apps/api/src/routes/sensors.ts) | Protected endpoints: `GET /catalog`, `GET /catalog/:idOrType`, `GET /`, `POST /`, `GET /:id`, `PATCH /:id`, `PUT /:id/configure`, `POST /:id/calibrate`, `DELETE /:id` guarded by `sensor.read` and `sensor.configure` RBAC |
| **Frontend State** | [`apps/web/src/context/SensorContext.tsx`](file:///e:/Sentinel/apps/web/src/context/SensorContext.tsx) | React Context managing `catalog`, `sensors`, `selectedSensor`, reactive filters, creation, hardware configuration, and calibration |
| **Frontend UI** | [`apps/web/src/pages/SensorsPage.tsx`](file:///e:/Sentinel/apps/web/src/pages/SensorsPage.tsx) | Sensor management console: hardware metric cards, category filters, real-time telemetry gauges, radar confidence indicators, and quick action bars |
| | [`apps/web/src/components/sensor/SensorCatalogModal.tsx`](file:///e:/Sentinel/apps/web/src/components/sensor/SensorCatalogModal.tsx) | Interactive hardware specification modal: chip category explorer, ESP32 wiring guides, operating voltages, accuracy tolerances, and quick deploy triggers |
| | [`apps/web/src/components/sensor/CreateSensorModal.tsx`](file:///e:/Sentinel/apps/web/src/components/sensor/CreateSensorModal.tsx) | Sensor provisioning modal with catalog presets, spatial digital twin assignment (facility/room), and microcontroller link |
| | [`apps/web/src/components/sensor/ConfigureSensorModal.tsx`](file:///e:/Sentinel/apps/web/src/components/sensor/ConfigureSensorModal.tsx) | Deep hardware tuning modal: GPIO pins, I2C hex address, UART baud rates, sampling frequency slider, digital moving average window, and multi-tier threshold rules |
| | [`apps/web/src/components/sensor/CalibrateSensorModal.tsx`](file:///e:/Sentinel/apps/web/src/components/sensor/CalibrateSensorModal.tsx) | Field calibration console: zero-point clean-air baseline, linear slope multiplier, static offset shift, and live formula preview |

---

## 3. Master Hardware Sensor Catalog (18 Sensor Types)

SENTINEL implements the complete list of 18 sensor types defined in Section 28 of the Master Prompt:

| # | Sensor Type | Model | Manufacturer | Interface | Operating Voltage | Measurement Range | Key Application |
|---|---|---|---|---|---|---|---|
| 1 | `MMWAVE` | **LD2410C** | Hi-Link | UART / GPIO | 5V (3.3V Logic) | 0–8 targets (0.75m–6m) | Pediatric Fall Detection & Transit Child-Left-Behind |
| 2 | `PIR` | **EKMC1601111** | Panasonic | GPIO | 3.3V | Binary motion (0/1) | Corridor Rapid Footfall & Intrusion Detection |
| 3 | `CO2` | **SCD40** | Sensirion | I2C (`0x62`) | 3.3V | 400–5000 ppm | Indoor Air Quality & Demand-Controlled HVAC |
| 4 | `TEMPERATURE` | **SHT31-DIS** | Sensirion | I2C (`0x44`) | 3.3V | -40°C to +125°C | Cold Chain Storage & Thermal Comfort Setback |
| 5 | `HUMIDITY` | **SHT31-DIS** | Sensirion | I2C (`0x44`) | 3.3V | 0% to 100% RH | Cleanroom Humidity & Mold Prevention |
| 6 | `SOUND_LEVEL` | **MAX9814** | Maxim Integrated | ADC | 3.3V | 30–110 dB SPL | Patient Fall Acoustic Spikes & Glass Break Alerts |
| 7 | `DOOR_MAGNETIC` | **DC-1561** | Aleph | GPIO | 3.3V Dry Contact | Closed / Open (0/1) | Hotel Room Entry & Emergency Exit Breach |
| 8 | `PRESSURE` | **BMP280** | Bosch Sensortec | I2C (`0x76`) / SPI | 3.3V | 300–1100 hPa | Isolation Negative Pressure & Cleanroom Seals |
| 9 | `LIGHT` | **BH1750FVI** | ROHM Semiconductor | I2C (`0x23`) | 3.3V | 1–65535 lux | Smart Daylight Harvesting Architectural Control |
| 10 | `SMOKE` | **MQ-2** | Winsen Electronics | ADC / GPIO | 5V Heater | 300–10000 ppm | Industrial Combustible Smoke & Gas Early Warning |
| 11 | `GAS` | **MQ-135** | Winsen Electronics | ADC / GPIO | 5V Heater | 10–1000 ppm VOC | Chemical Storage Vapor & Ammonia Air Quality |
| 12 | `FLAME` | **IR-FLAME-01** | Waveshare | GPIO / ADC | 3.3V–5V | Binary flame (0/1) | Robotic Laser Welding Cell Optical Safety Trip |
| 13 | `WATER_LEAK` | **WL-GOLD-02** | Sentinel Industrial | GPIO / ADC | 3.3V | Binary flood (0/1) | Data Center Sub-Floor Chilled Water Immersion |
| 14 | `VIBRATION` | **SW-420** | Seeed Studio | GPIO | 3.3V–5V | 0–100 pulses | Elevator Motor Degradation & Tamper Logging |
| 15 | `ULTRASONIC` | **JSN-SR04T** | WayinTop | GPIO (Trig/Echo) | 5V | 20–600 cm | Waste Bin Fill Level & Parking Stall Clearance |
| 16 | `CURRENT` | **SCT-013-000** | YHDC | ADC (Passive) | 0–1V Burden | 0–100 A AC | Chiller Load & Motor Power Verification |
| 17 | `GPS` | **NEO-6M** | u-blox | UART (9600 baud) | 3.3V | Lat/Lng coordinates | Municipal Transit Bus Geofencing & Tracking |
| 18 | `RFID` | **MFRC522** | NXP Semiconductors | SPI / I2C | 3.3V | ISO 14443A UID | Staff Badge Access & Driver Transit Identification |

---

## 4. Hardware Configuration & Calibration Engine

### Signal Processing & Digital Filtering
- **Sampling Interval**: Microsecond to minute frequency controls ($50\text{ ms} \le \Delta t \le 60,000\text{ ms}$).
- **Moving Average Filter Window**: Smooths raw ADC jitter and radar Doppler spikes across $1 \le N \le 50$ consecutive samples.
- **Hardware Debounce Window**: Suppresses physical contact bounce on magnetic reed switches and PIR triggers ($0\text{ ms} \le t_{\text{debounce}} \le 5,000\text{ ms}$).

### Linear Calibration Engine
Every physical sensor supports field calibration adjustment:
$$\text{Calibrated Output} = (\text{Raw Signal} - \text{Zero Baseline}) \times \text{Gain Multiplier} + \text{Calibration Offset}$$
- **Zero Baseline**: Subtracts atmospheric ambient levels (e.g., $400\text{ ppm}$ background $\text{CO}_2$ or ambient acoustic noise floor).
- **Gain Multiplier**: Adjusts sensor slope to account for component aging or ADC resistor tolerances.
- **Noise Floor Cut-Off**: Clamps low-amplitude noise to zero.
- **Audit Verification**: Automatically persists `calibratedAt` timestamp and `calibratedBy` user ID.

---

## 5. Multi-Sector Seeded Sensor Nodes

Representative sensor suites provisioned across Day 5 digital twins:

1. **🏥 St. Jude Children's Medical Center (Pediatric Care Wing)**:
   - **Inpatient Room 204**: Hi-Link LD2410C 24GHz mmWave radar (Doppler presence & fall monitoring), Maxim MAX9814 acoustic spike detector, Sensirion SCD40 photoacoustic $\text{CO}_2$, and Sensirion SHT31 temperature/humidity.
   - **Emergency Triage Bay A**: LD2410C mmWave radar, Panasonic EKMC PIR rapid motion, SCD40 $\text{CO}_2$ air health.
2. **🚌 Metro Regional Transit Authority (Active Bus Fleet)**:
   - **Route Bus 12**: LD2410C mmWave radar array (child-left-behind post-route inspection), u-blox NEO-6M GNSS fleet positioning, Aleph DC-1561 passenger door reed switch, NXP MFRC522 driver RFID badge reader.
3. **🏫 Oakridge Academy High School (STEM Academic Hall)**:
   - **Classroom 101 & Lab 102**: Sensirion SCD40 $\text{CO}_2$ cognitive performance monitor, Winsen MQ-135 chemical gas sensor, ROHM BH1750 ambient lux sensor, Waveshare optical flame sensor.

---

## 6. Verification & Quality Gates

| Verification Check | Script / Command | Status |
|---|---|---|
| **Automated Sensor Suite** | `node scratch/test-day6.mjs` | ✅ **All 8 Test Suites PASSED** (18 catalog models verified, multi-sector sensor seeding, custom sensor registration, hardware bus tuning, alert threshold rules, calibration formula engine, category/type filtering, REST RBAC guards) |
| **Code Quality & Linting** | `npm run lint` | ✅ **0 ESLint errors, 0 warnings** across entire monorepo |
| **Types Package Build** | `npm run build:types` | ✅ **Exit code 0** |
| **Validation Package Build** | `npm run build:validation` | ✅ **Exit code 0** |
| **API TypeScript Build** | `npm run build:api` | ✅ **Exit code 0** |
| **Frontend Web Build** | `npm run build:web` | ✅ **Exit code 0** (Vite production bundle compiled cleanly in 3.14s) |
| **Full Monorepo Build** | `npm run build` | ✅ **Exit code 0 across all 5 workspaces** |

---

## 7. Readiness for Day 7

The platform is fully prepared for **Day 7: Devices & Microcontroller Identity**:
- Sensors are ready to bind to physical ESP32 microcontrollers via `deviceId` references.
- Bus interfaces (UART, I2C, SPI, GPIO, ADC) correspond directly to ESP32 hardware peripherals.
- Next phase will introduce:
  - ESP32 hardware registration and cryptographic provisioning
  - Device identity, token generation, and secure onboarding
  - Heartbeat status monitoring (`ONLINE`, `OFFLINE`, `UPDATING`).
