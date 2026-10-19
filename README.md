# SENTINEL

### Privacy-Preserving Autonomous Sensor Intelligence & Automation Platform

> **Sense → Understand → Decide → Act → Escalate only when necessary.**

SENTINEL converts physical sensor signals into context-aware events, automatic actions, and responsible-person alerts — while preserving privacy.

---

## Architecture

```
                         SENTINEL
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
      React               Node              ESP32
    (Vite+TS)           (Express)             HAL
        │                   │                  │
    Dashboard            REST API        Sensor Drivers
    Analytics               │                  │
    Alerts              MongoDB              MQTT
        │                   │                  │
        └─────────────── MQTT / API ───────────┘
```

## Monorepo Structure

```
sentinel/
├── apps/
│   ├── api/                  # Express REST API (Node.js)
│   │   └── src/
│   │       ├── config.ts
│   │       ├── app.ts
│   │       ├── index.ts
│   │       ├── routes/
│   │       └── middleware/
│   └── web/                  # React SPA (Vite + TailwindCSS)
│       └── src/
│           ├── App.tsx
│           ├── main.tsx
│           └── pages/
├── packages/
│   ├── types/                # Shared TypeScript type definitions
│   ├── shared/               # Constants, utilities, RBAC mappings
│   └── validation/           # Zod schemas (shared frontend + backend)
├── firmware/
│   ├── esp32/                # ESP32 firmware (PlatformIO)
│   └── hal/                  # Hardware Abstraction Layer spec
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── .gitignore
├── tsconfig.base.json
├── package.json
└── README.md
```

## Tech Stack

| Layer        | Technology                                            |
| ------------ | ----------------------------------------------------- |
| Frontend     | React 18, Vite, TypeScript, TailwindCSS, TanStack Query, React Router, React Hook Form, Zod, Recharts, Lucide |
| Backend      | Node.js, Express, TypeScript, Mongoose (MongoDB), Zod |
| Database     | MongoDB                                               |
| Messaging    | MQTT (Mosquitto)                                      |
| Firmware     | ESP32, PlatformIO, Arduino Framework, C++             |
| Security     | Helmet, CORS, JWT, Argon2id, TLS                      |

## Getting Started

### Prerequisites

- Node.js ≥ 20.x
- npm ≥ 10.x
- MongoDB (local or Atlas)
- MQTT Broker (Mosquitto) — for telemetry phases

### Installation

```bash
# Clone the repository
git clone <repo-url> sentinel
cd sentinel

# Install all workspace dependencies
npm install

# Copy environment configuration
cp .env.example .env
cp apps/web/.env.example apps/web/.env

# Build shared packages
npm run build:types
npm run build:shared
npm run build:validation

# Start the API server
npm run dev:api

# Start the frontend (in a separate terminal)
npm run dev:web
```

### Development URLs

- **Frontend:** http://localhost:5173
- **API:** http://localhost:4000/api/v1
- **Health:** http://localhost:4000/api/v1/health

## Build Phases

| Day | Phase                         | Status        |
| --- | ----------------------------- | ------------- |
| 1   | Architecture                  | ✅ Complete   |
| 2   | UI System + Landing Page      | ✅ Complete   |
| 3   | Authentication                | ✅ Complete   |
| 4   | Organizations + RBAC          | ✅ Complete   |
| 5   | Facilities + Floors + Rooms   | ✅ Complete   |
| 6   | Sensor Catalog + Config       | ✅ Complete   |
| 7   | ESP32 Device Management       | ✅ Complete   |
| 8   | MQTT + Telemetry              | ⬜ Pending    |
| 9   | Sensor Fusion + Event Engine  | ⬜ Pending    |
| 10  | Automation Engine             | ⬜ Pending    |
| 11  | Alerts + Notifications        | ⬜ Pending    |
| 12  | Analytics                     | ⬜ Pending    |
| 13  | Prediction Layer              | ⬜ Pending    |
| 14  | ESP32 HAL + Firmware          | ⬜ Pending    |
| 15  | Industry Policies             | ⬜ Pending    |
| 16  | Security Hardening            | ⬜ Pending    |
| 17  | Testing                       | ⬜ Pending    |
| 18  | Production Readiness          | ⬜ Pending    |

## License

Proprietary. All rights reserved.
