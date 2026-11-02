# SENTINEL — Production Deployment & Operations Runbook

This document is the authoritative operations guide for deploying, maintaining, monitoring, and scaling Project Sentinel in mission-critical enterprise environments.

---

## 1. System Architecture & Topology

```
                          Internet / IoT Devices
                                   │
                                   ▼
         ┌───────────────────────────────────────────────────┐
         │       TLS Termination & Reverse Proxy Gateway     │
         │           (Nginx :80/:443 / Cloudflare)           │
         └─────────────┬─────────────────────────┬───────────┘
                       │                         │
            Static UI  │                         │  /api/v1/*
         & Assets (SPA)│                         │  /ws/*
                       ▼                         ▼
         ┌───────────────────────┐     ┌───────────────────────┐
         │     sentinel-web      │     │     sentinel-api      │
         │ (Nginx 1.25 + React)  │     │  (Express Node.js 20) │
         └───────────────────────┘     └───────────┬───────────┘
                                                   │
                           ┌───────────────────────┼───────────────────────┐
                           │                       │                       │
                           ▼                       ▼                       ▼
               ┌───────────────────────┐┌───────────────────────┐┌───────────────────────┐
               │    Embedded Broker    ││     MongoDB 7.0       ││   WebSocket Gateway   │
               │   (Aedes MQTT :1883)  ││   (Time-Series / DB)  ││   (/ws/telemetry)     │
               └───────────────────────┘└───────────────────────┘└───────────────────────┘
```

---

## 2. Infrastructure Sizing Guide

| Deployment Size | Target Metrics | Recommended Hardware | Database Specs |
|---|---|---|---|
| **Starter / Edge** | 1–50 devices, 1 facility | 2 vCPU, 4GB RAM, 40GB SSD | Standalone MongoDB 7.0 |
| **Standard Commercial** | 50–500 devices, 5–10 facilities | 4 vCPU, 8GB RAM, 150GB NVMe SSD | 3-node Replica Set (Primary, Secondary, Arbiter) |
| **Enterprise / Multi-Site** | 500–5,000+ devices, 50+ sites | 8+ vCPU, 16–32GB RAM, 500GB+ NVMe | MongoDB Atlas Dedicated (M30+) or Sharded Cluster |

---

## 3. Quickstart Deployment (Docker Compose)

### 3.1 Clone & Configure Environment

```bash
git clone https://github.com/hitteshkharyal/Sentinel.git /opt/sentinel
cd /opt/sentinel

# Generate cryptographically secure JWT secrets
JWT_SECRET=$(openssl rand -hex 32)
cat <<EOF > .env
NODE_ENV=production
PORT=4000
MQTT_PORT=1883
MONGODB_URI=mongodb://sentinel-mongo:27017/sentinel
JWT_SECRET=${JWT_SECRET}
CORS_ORIGIN=http://your-domain.com
FRONTEND_URL=http://your-domain.com
EOF
```

### 3.2 Build & Launch Containers

```bash
# Build and start all services in detached mode
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Verify running services
docker compose ps
```

### 3.3 Verify Container Health Probes

```bash
# Test API Liveness Probe
curl -f http://localhost:4000/api/v1/health/live

# Test API Readiness Probe (verifies database connectivity and heap memory)
curl -f http://localhost:4000/api/v1/health/ready

# Check Comprehensive Diagnostics
curl -s http://localhost:4000/api/v1/health | jq .
```

---

## 4. Production Environment Variables Reference

| Variable | Description | Default | Production Requirement |
|---|---|---|---|
| `NODE_ENV` | Runtime environment mode | `development` | **Must be `production`** |
| `PORT` | API HTTP port | `4000` | Typically internal port `4000` |
| `MQTT_PORT` | Embedded MQTT broker port | `1883` | Default TCP port `1883` or `8883` (MQTTS) |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/sentinel` | Remote cluster URI with credentials & replicaSet |
| `JWT_SECRET` | Cryptographic secret for signing tokens | *Random required* | **Must be ≥ 32 characters, non-default** |
| `JWT_EXPIRY` | Access token lifespan | `15m` | Recommended `15m` with refresh token rotation |
| `CORS_ORIGIN` | Authorized browser origins | `http://localhost:5173` | **Strict authoritative domain (no wildcards `*`)** |
| `FRONTEND_URL` | Canonical frontend URL | `http://localhost:5173` | Production HTTPS address |
| `ADMIN_EMAILS` | Pre-approved administrator emails | `admin@sentinel.local` | Comma-delimited list of initial admins |

---

## 5. Production Health Probes & Monitoring

Sentinel provides three standardized HTTP endpoints for Docker, Kubernetes, and uptime monitors:

### 5.1 Liveness Probe (`GET /api/v1/health/live`)
- **Purpose:** Used by container orchestrators to detect process lockups.
- **Expected Status:** `200 OK`
- **Output:**
  ```json
  {
    "status": "alive",
    "timestamp": "2026-11-02T10:00:00.000Z",
    "uptime": 86400,
    "pid": 1
  }
  ```

### 5.2 Readiness Probe (`GET /api/v1/health/ready`)
- **Purpose:** Ensures the container has verified MongoDB connectivity and is safe to accept external traffic.
- **Expected Status:** `200 OK` (Ready) or `503 Service Unavailable` (Unready)
- **Output:**
  ```json
  {
    "status": "ready",
    "timestamp": "2026-11-02T10:00:00.000Z",
    "checks": {
      "database": "ok",
      "dbLatencyMs": 4,
      "memory": "ok",
      "heapUsagePercent": 42
    }
  }
  ```

### 5.3 Diagnostic Endpoint (`GET /api/v1/health`)
- **Purpose:** Comprehensive metrics payload reporting memory consumption, database latency, MQTT status, and active WebSocket connections.

---

## 6. Database Maintenance & Indexing

### 6.1 Database Index Verification
Sentinel automatically synchronizes indexes on startup. To verify or force an index rebuild:
```bash
# In the running API container:
docker exec sentinel-api node -e "
  import('./dist/db/indexes.js').then(async ({ DatabaseIndexManager }) => {
    const stats = await DatabaseIndexManager.getIndexStats();
    console.log('Collection Indexes:', stats);
    process.exit(0);
  });
"
```

### 6.2 Automated Database Backups (Cron)
Create a daily backup script `/usr/local/bin/sentinel-backup.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/sentinel/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

mongodump --uri="mongodb://localhost:27017/sentinel" --gzip --out="$BACKUP_DIR"

# Keep only the last 30 daily backups
find /var/backups/sentinel/ -type d -mtime +30 -exec rm -rf {} +
```

---

## 7. Graceful Shutdown & Zero-Downtime Deployments

Project Sentinel traps `SIGTERM` and `SIGINT` to coordinate zero-loss shutdowns:
1. Stops accepting incoming HTTP requests (`server.close()`).
2. Transmits close frames to all active WebSocket clients.
3. Flushes and closes the Aedes MQTT broker.
4. Cleanly closes MongoDB connections.
5. Employs a 10-second unref watchdog timer preventing zombie processes.

---

## 8. SSL / TLS Termination Runbook

For production public domains, place Nginx or Caddy with Let's Encrypt in front of the stack:

```nginx
server {
    listen 443 ssl http2;
    server_name sentinel.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/sentinel.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sentinel.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```
