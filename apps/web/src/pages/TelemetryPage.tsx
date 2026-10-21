// ─────────────────────────────────────────────
// SENTINEL Web — Live Telemetry & MQTT Operations Console
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import {
  Activity,
  Radio,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Server,
  Layers,
  Thermometer,
  Wind,
  Flame,
  Volume2,
  DoorClosed,
  Eye,
  Terminal,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Tabs, TabList, Tab, TabPanel } from '../components/ui/Tabs';
import { LiveTelemetryFeed } from '../components/telemetry/LiveTelemetryFeed';
import { SimulateTelemetryModal } from '../components/telemetry/SimulateTelemetryModal';
import { SendCommandModal } from '../components/telemetry/SendCommandModal';
import { useTelemetry } from '../context/TelemetryContext';

export const TelemetryPage: React.FC = () => {
  const {
    stats,
    latestSensors,
    connectionStatus,
    fetchStats,
    fetchLatestSensors,
    isLoadingStats,
  } = useTelemetry();

  const [activeTab, setActiveTab] = useState<string>('stream');
  const [isSimulateOpen, setIsSimulateOpen] = useState<boolean>(false);
  const [isCommandOpen, setIsCommandOpen] = useState<boolean>(false);

  // Compute validation percentage
  const total = stats?.totalMessages ?? 0;
  const valid = stats?.validMessages ?? 0;
  const validRate = total > 0 ? ((valid / total) * 100).toFixed(1) : '100.0';

  const handleRefresh = async () => {
    await Promise.all([fetchStats(), fetchLatestSensors()]);
  };

  const getSensorIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'temperature':
        return <Thermometer className="w-4 h-4 text-rose-500" />;
      case 'humidity':
        return <Wind className="w-4 h-4 text-sky-500" />;
      case 'co2':
        return <Flame className="w-4 h-4 text-amber-500" />;
      case 'sound':
      case 'soundlevel':
        return <Volume2 className="w-4 h-4 text-purple-500" />;
      case 'door':
        return <DoorClosed className="w-4 h-4 text-emerald-500" />;
      case 'mmwave':
      case 'radar':
        return <Radio className="w-4 h-4 text-sentinel-500" />;
      case 'pir':
        return <Eye className="w-4 h-4 text-indigo-500" />;
      default:
        return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Telemetry Pipeline & MQTT Console
            </h1>
            <Badge
              variant={connectionStatus === 'connected' ? 'success' : 'warning'}
              size="sm"
              dot
              pulsing={connectionStatus === 'connected'}
            >
              {connectionStatus === 'connected' ? 'Broker Online' : 'Connecting'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500">
            Real-time sensory telemetry ingest, zero-trust token authentication, spatial digital twin synchronization, and MQTT actuator dispatch.
          </p>
        </div>

        {/* Global Pipeline Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            isLoading={isLoadingStats}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCommandOpen(true)}
            leftIcon={<Terminal className="w-3.5 h-3.5 text-indigo-600" />}
          >
            Dispatch Command
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsSimulateOpen(true)}
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            Simulate Packet
          </Button>
        </div>
      </div>

      {/* Top Telemetry KPIs Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Ingestion Throughput */}
        <Card variant="default">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Ingestion Throughput
            </CardTitle>
            <div className="w-7 h-7 rounded-lg bg-sentinel-50 text-sentinel-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 font-mono">
                {stats?.messagesPerMinute ?? 0}
              </span>
              <span className="text-xs font-medium text-slate-500">packets / min</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Rolling 5-minute ingestion average
            </p>
          </CardContent>
        </Card>

        {/* Metric 2: Total Ingested Packets */}
        <Card variant="default">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Packets Ingested
            </CardTitle>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 font-mono">
                {total.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500">stored</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {stats?.lastMessageAt
                ? `Last packet: ${new Date(stats.lastMessageAt).toLocaleTimeString()}`
                : 'Awaiting initial telemetry'}
            </p>
          </CardContent>
        </Card>

        {/* Metric 3: Authoritative Validation Rate */}
        <Card variant="default">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Validation Compliance
            </CardTitle>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-600 font-mono">
                {validRate}%
              </span>
              <span className="text-xs text-slate-500">valid</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Zero-trust authenticated & physical bounds checked
            </p>
          </CardContent>
        </Card>

        {/* Metric 4: Broker & Gateway Status */}
        <Card variant="default">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Broker Architecture
            </CardTitle>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-slate-900 font-mono">
                MQTT :1883
              </span>
              <Badge variant="primary" size="sm">
                Aedes
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              WebSocket stream: /ws/telemetry
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabbed Workspace */}
      <Tabs activeTab={activeTab} onChange={setActiveTab}>
        <TabList>
          <Tab id="stream" icon={<Activity className="w-4 h-4" />}>
            Live Telemetry Stream
          </Tab>
          <Tab
            id="sensors"
            icon={<Radio className="w-4 h-4" />}
            badge={
              <Badge variant="neutral" size="sm">
                {latestSensors.length}
              </Badge>
            }
          >
            Live Sensor Matrix
          </Tab>
          <Tab id="docs" icon={<Server className="w-4 h-4" />}>
            MQTT Architecture & Schema
          </Tab>
        </TabList>

        {/* Tab 1: Live Stream Inspector */}
        <TabPanel id="stream">
          <LiveTelemetryFeed />
        </TabPanel>

        {/* Tab 2: Live Sensor Matrix */}
        <TabPanel id="sensors">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Active Sensor Hardware Snapshots
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time calibrated values updated automatically as telemetry packets arrive.
                </p>
              </div>
              <Badge variant="neutral" size="sm">
                {latestSensors.length} Deployed Hardware Units
              </Badge>
            </div>

            {latestSensors.length === 0 ? (
              <Card variant="default" className="py-12 text-center">
                <CardContent>
                  <Radio className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <div className="text-sm font-semibold text-slate-700">
                    No active sensors registered yet
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Add sensors via the Sensor Catalog or simulate a telemetry packet to see live sensor states here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {latestSensors.map((sensor) => (
                  <div
                    key={sensor._id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                          {getSensorIcon(sensor.sensorType)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-xs">
                            {sensor.name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {sensor.deviceId} • {sensor.interfaceType}
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={sensor.status === 'ONLINE' ? 'success' : 'neutral'}
                        size="sm"
                      >
                        {sensor.status}
                      </Badge>
                    </div>

                    {/* Sensor Value Box */}
                    <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-baseline justify-between">
                      <span className="text-xs text-slate-500 font-medium">
                        Latest Calibrated Reading:
                      </span>
                      <span className="text-sm font-bold text-slate-900 font-mono">
                        {sensor.lastReading?.value !== undefined
                          ? typeof sensor.lastReading.value === 'object'
                            ? JSON.stringify(sensor.lastReading.value)
                            : `${sensor.lastReading.value} ${sensor.lastReading.unit || ''}`
                          : 'Pending reading'}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Model: {sensor.model}</span>
                      <span>
                        {sensor.lastReading?.timestamp
                          ? new Date(sensor.lastReading.timestamp).toLocaleTimeString()
                          : 'Never seen'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabPanel>

        {/* Tab 3: MQTT Architecture & Protocols Guide */}
        <TabPanel id="docs">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Topic Structure */}
            <Card variant="default">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-sentinel-600" />
                  <CardTitle className="text-sm">Standard MQTT Topic Hierarchy</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-slate-600">
                <p>
                  SENTINEL mandates a strictly multi-tenant hierarchical topic structure across all edge gateways and ESP32 microcontrollers:
                </p>
                <div className="space-y-2 font-mono text-[11px]">
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-sentinel-600 font-semibold block">
                      sentinel/&#123;orgId&#125;/&#123;facilityId&#125;/&#123;deviceId&#125;/telemetry
                    </span>
                    <span className="text-slate-500 text-[10px]">
                      Sensor readings payload (QoS 0 or 1). Validated against range & calibration offsets.
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-indigo-600 font-semibold block">
                      sentinel/&#123;orgId&#125;/&#123;facilityId&#125;/&#123;deviceId&#125;/status
                    </span>
                    <span className="text-slate-500 text-[10px]">
                      Heartbeat, WiFi RSSI, free heap, battery, and LWT (Last Will and Testament).
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-amber-600 font-semibold block">
                      sentinel/&#123;orgId&#125;/&#123;facilityId&#125;/&#123;deviceId&#125;/command
                    </span>
                    <span className="text-slate-500 text-[10px]">
                      Cloud commands to microcontrollers (reboot, calibrate, relay triggers).
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-emerald-600 font-semibold block">
                      sentinel/&#123;orgId&#125;/&#123;facilityId&#125;/&#123;deviceId&#125;/config
                    </span>
                    <span className="text-slate-500 text-[10px]">
                      Dynamic configuration push (intervals, sensor thresholds).
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-purple-600 font-semibold block">
                      sentinel/&#123;orgId&#125;/&#123;facilityId&#125;/&#123;deviceId&#125;/ack
                    </span>
                    <span className="text-slate-500 text-[10px]">
                      Device command execution acknowledgements.
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Zero-Trust Rules & Authoritative Calibration */}
            <Card variant="default">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <CardTitle className="text-sm">Zero-Trust Rules & Calibration Formula</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-xs text-slate-600">
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">
                    1. Zero-Trust Device Authentication
                  </h4>
                  <p className="text-[11px] leading-relaxed">
                    Per Master Prompt rules, devices <strong>CANNOT</strong> authenticate by deviceId alone. Each MQTT CONNECT packet or HTTP telemetry POST must present the cryptographic secret token (<code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded font-mono">sent_dev_...</code>) provisioned in Day 6.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">
                    2. Clock Drift Tolerances
                  </h4>
                  <p className="text-[11px] leading-relaxed">
                    The authoritative validator rejects packets with timestamps older than <strong>24 hours</strong> in the past or more than <strong>5 minutes</strong> in the future to mitigate replay attacks and corrupted RTC clocks.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">
                    3. Sensor Calibration Formula
                  </h4>
                  <div className="p-2.5 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px]">
                    <span className="text-emerald-400">
                      CalibratedValue = (Raw - Baseline) * Multiplier + Offset
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Raw readings sent by sensors are transformed before saving to the database and updating the Room Digital Twin.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">
                    4. Room Digital Twin Synchronization
                  </h4>
                  <p className="text-[11px] leading-relaxed">
                    Valid telemetry automatically updates the containing room&#39;s live temperature, humidity, CO₂, sound level, door state, and occupancy presence in real time.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabPanel>
      </Tabs>

      {/* Modals */}
      <SimulateTelemetryModal
        isOpen={isSimulateOpen}
        onClose={() => setIsSimulateOpen(false)}
      />

      <SendCommandModal
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
      />
    </div>
  );
};
