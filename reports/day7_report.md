# SENTINEL — Day 7 Implementation Report
## ESP32 Device Management, Microcontroller Identity, and Spatial Hardware Assignment

**Date**: October 19, 2026  
**Phase**: Day 7 — ESP32 Device Management  
**Status**: Completed & Production Ready  
**Repository**: [github.com/hitteshkharyal/Sentinel](https://github.com/hitteshkharyal/Sentinel.git)  

---

### 1. Executive Summary

In accordance with Section 29 ("Device Management") and Section 48 ("Day-by-Day Build Order - Day 7") of the Master Development Prompt, SENTINEL Day 7 has been implemented and tested.

This phase delivers the core hardware device control plane for physical and simulated ESP32 microcontrollers:
- **Microcontroller Identity & Hardware Catalog**: Models for ESP32 microcontrollers with chipsets (`ESP32-WROOM-32D`, `ESP32-S3-WROOM-1`, `ESP32-C3-MINI`, `ESP32-WROOM-32U`, `ESP32-CAM`, `ESP32-GENERIC`), MAC addresses, firmware versions (`v1.4.2`), hardware revisions (`v3.2`), and power sources (`MAINS`, `BATTERY`, `POE`, `USB`).
- **Cryptographic Credential Engine**: Enforces Master Rule *"Do not authenticate only by deviceId"*. Each ESP32 receives a cryptographically generated pre-shared secret token (`sent_dev_<48_hex_chars>`). Secrets are hashed with SHA-256 in database storage, never exposed after initial provisioning or rotation.
- **Hardware Telemetry & Heartbeat Ingestion**: REST ingestion endpoint (`POST /api/v1/devices/:deviceId/heartbeat`) authenticated via `X-Device-Token` or Bearer header. Updates device state (`PROVISIONING` $\rightarrow$ `ONLINE`), Wi-Fi RSSI (dBm), free heap memory, uptime counters, and battery percentage.
- **Spatial Digital Twin Assignment & Sensor Cascade**: Seamless placement within the multi-tenant physical hierarchy (`Organization` $\rightarrow$ `Facility` $\rightarrow$ `Floor` $\rightarrow$ `Room`). When a microcontroller node is assigned or relocated, all attached physical sensors automatically cascade to the new spatial location.
- **Automated Sector Seeding**: Seeded representative physical ESP32 nodes for hospital inpatient rooms, school buses, and STEM labs, linking previously seeded Day 6 sensors to their host microcontroller.
- **High-Aesthetic Hardware Console**: Full React hardware cockpit at `/devices` with live status indicators, metric summaries, search/status toolbars, registration wizard, firmware code generator, and deep hardware telemetry inspector.

---

### 2. Architectural Components

```
                          ┌──────────────────────────────────────┐
                          │     React Web Console (/devices)     │
                          │  - Live Status Gauges (RSSI, Heap)   │
                          │  - Firmware C++ Config Generator     │
                          └──────────────────┬───────────────────┘
                                             │ HTTP / REST (JWT + RBAC)
                                             ▼
                          ┌──────────────────────────────────────┐
                          │   SENTINEL Device Control Plane      │
                          │     (/api/v1/devices)                │
                          │  - RBAC: device.register, update, etc│
                          └──────────┬─────────────────┬─────────┘
                                     │                 │
                 Protected Management│                 │ Public Ingest
                 (requirePermission) │                 │ (Token Auth)
                                     ▼                 ▼
          ┌────────────────────────────────┐   ┌───────────────────────────────┐
          │     DeviceService (Backend)    │   │ ESP32 Hardware / Telemetry    │
          │  - Crypto Token Generator      │   │ - POST /:deviceId/heartbeat   │
          │  - Sensor Cascade Engine       │   │ - X-Device-Token Validation   │
          │  - Real-time Stale Detection   │   │ - Wi-Fi RSSI & Heap Logging   │
          └────────────────┬───────────────┘   └───────────────┬───────────────┘
                           │                                   │
                           ▼                                   ▼
          ┌────────────────────────────────────────────────────────────┐
          │                    MongoDB Database                        │
          │  - DeviceModel (Spatial indexes, unique deviceId/MAC)      │
          │  - DeviceCredentialModel (SHA-256 hashed pre-shared token) │
          │  - SensorModel (Host device linking & location cascade)    │
          └────────────────────────────────────────────────────────────┘
```

---

### 3. Key Implementations

#### 3.1 Data Types (`packages/types/src/device.ts`)
- `Device`: Entity containing `deviceId`, `name`, `macAddress`, `chipModel`, `hardwareVersion`, `firmwareVersion`, `status`, `ipAddress`, `metadata` (RSSI, heap, uptime, power source), `assignedSensorsCount`, `registeredAt`, and spatial foreign keys (`facilityId`, `roomId`).
- `DeviceStatus`: `'UNREGISTERED' | 'PROVISIONING' | 'ONLINE' | 'OFFLINE' | 'ERROR' | 'UPDATING' | 'DISABLED'`.
- `DeviceCredential`: Cryptographic secret record with `keyPrefix`, `status`, and `lastRotatedAt`.
- `DeviceRegistrationResponse`: Returns newly created `Device` along with one-time plaintext `credentials` (`token`, `mqttClientId`, `mqttTopicPrefix`).

#### 3.2 Authoritative Validation (`packages/validation/src/schemas.ts`)
- `registerDeviceSchema`: Validates alphanumeric deviceId (`^[a-zA-Z0-9_-]+$`), friendly name, IEEE 802.11 MAC address regex (`^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$`), chip model, versions, and spatial target.
- `updateDeviceSchema`, `assignDeviceSchema`, `deviceHeartbeatSchema`, `rotateDeviceSecretSchema`, and `deviceFilterSchema`.

#### 3.3 Database Models (`apps/api/src/models`)
- `Device.ts`: Compound unique index `{ organizationId: 1, deviceId: 1 }`, spatial compound index `{ organizationId: 1, facilityId: 1, roomId: 1 }`, MAC address index, and `toSafeDevice()` serializer.
- `DeviceCredential.ts`: Statics `generateSecret()` returning `{ token, prefix, hashed }`, instance `verifySecret(plainSecret)` utilizing timing-safe cryptographic comparisons (`crypto.timingSafeEqual`).

#### 3.4 Backend Service & API Routes (`apps/api`)
- `DeviceService.registerDevice(...)`: Enforces facility/room existence, ensures MAC/Device ID uniqueness, creates device in `PROVISIONING` state, generates and hashes pre-shared token.
- `DeviceService.recordHeartbeat(...)`: Cryptographically verifies token against stored hash; rejects unauthenticated requests; updates status to `ONLINE`, records Wi-Fi RSSI, free heap, system uptime, and last seen timestamp.
- `DeviceService.assignDevice(...)`: Relocates device to new facility/room and immediately cascades spatial location to all sensors hosted on the device.
- `DeviceService.rotateDeviceCredential(...)`: Revokes existing active credentials, generates fresh token, and returns new credentials.
- `DeviceService.listDevices(...)`: Automatically marks stale devices as `OFFLINE` if no heartbeat has arrived within the 2-minute timeout threshold; dynamically computes attached physical sensor count.
- `apps/api/src/routes/devices.ts`: REST router mounted at `/api/v1/devices` guarded by `requirePermission('device.read')`, `requirePermission('device.register')`, `requirePermission('device.update')`, and `requirePermission('device.delete')`.

#### 3.5 Frontend Command Center (`apps/web`)
- `DeviceContext.tsx`: React state context providing devices, reactive filtering, statistics, registration, spatial assignment, secret rotation, and live heartbeat ping simulation.
- `RegisterDeviceModal.tsx`: Provisioning modal with IEEE MAC address generator, chipset selector, and interactive post-creation screen showing plaintext token and C++ firmware defines.
- `AssignDeviceModal.tsx`: Relocation modal alerting operators that hosted sensors will follow the node.
- `DeviceDetailsModal.tsx` & `DeviceDetailModal.tsx`: Real-time hardware telemetry inspector displaying Wi-Fi RSSI gauge, free RAM bar, power source, and connected sensor nodes.
- `DevicesPage.tsx`: Hardware console at `/devices` with status metrics, filter bars, and responsive microcontroller cards.

---

### 4. Test Verification Suite (`scratch/test-day7.mjs`)

The automated integration test suite verified 9 critical paths:
1. **Multi-Tenant Context**: Resolved test organization and verified pre-seeded digital twin rooms.
2. **Device Registration**: Successfully created `ESP32-TEST-ICU-09` with MAC `24:6F:28:99:AA:BB` in `PROVISIONING` state.
3. **Cryptographic Storage**: Verified key prefix and SHA-256 hashed secret in `DeviceCredentialModel`.
4. **Security Gating**:
   - Rejected invalid token with error *"Authentication failed: Invalid device secret key."*
   - Accepted valid token, updating status to `ONLINE`, recording RSSI `-61 dBm` and free heap `215,400 bytes`.
5. **Spatial Assignment & Sensor Cascade**: Attached sensor `ICU Bed 9 mmWave Motion Monitor` and relocated device to Room 201; verified sensor's `roomId` cascaded automatically.
6. **Key Rotation**: Rotated secret; verified old token was immediately rejected and new token authenticated successfully.
7. **Multi-Sector Seeded Devices**: Verified seeded hardware nodes (`ESP32-HOSPITAL-EMERGENCY-TRIAGE`, `ESP32-HOSPITAL-PEDIATRIC-SUITE-`, `ESP32-HOSPITAL-INPATIENT-CARE-R`).
8. **Statistics Aggregation**: Verified aggregate counts for total, online, provisioning, and offline devices.
9. **Clean Teardown**: Unlinked attached sensors and deleted test device and credentials.

---

### 5. Quality Gates & Deliverables

| Quality Gate | Standard | Result |
| :--- | :--- | :--- |
| **Monorepo Build** | `npm run build` | **0 errors** across types, shared, validation, api, and web |
| **ESLint Quality** | `npm run lint` | **0 errors, 0 warnings** across all TS/TSX files |
| **Integration Tests** | `node scratch/test-day7.mjs` | **9/9 test suites passed** |
| **Master Rule Compliance** | "Do not authenticate only by deviceId" | **Strictly enforced** via SHA-256 token verification |
| **Git Repository** | `main` and `master` | Synchronized with origin |

---

### 6. Next Phase: Day 8 Handover

- **Next Phase**: **DAY 8 — Communication (MQTT, Telemetry, Validation, Device Authentication)**.
- **Upcoming Objectives**:
  - MQTT broker integration (Aedes / Mosquitto) with TLS support.
  - Telemetry validation pipeline (`sentinel/{orgId}/{facilityId}/{deviceId}/telemetry`).
  - Device ownership validation on every telemetry payload against `DeviceCredentialModel`.
  - Live WebSocket telemetry bridging to the React operations dashboard.
