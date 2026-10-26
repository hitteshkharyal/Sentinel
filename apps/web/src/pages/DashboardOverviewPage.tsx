// ─────────────────────────────────────────────
// SENTINEL Web — Operations Center Overview
// GuardianEye Inspired Obsidian Glassmorphism
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import {
  Building2,
  DoorClosed,
  Radio,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Wind,
  ShieldAlert,
  Zap,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const DashboardOverviewPage: React.FC = () => {
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Record<string, boolean>>({});

  const handleAcknowledge = (id: string) => {
    setAcknowledgedAlerts((prev) => ({ ...prev, [id]: true }));
  };

  const actionItems = [
    {
      id: 'alert-bus12',
      facility: 'Transport Fleet Depot',
      location: 'School Bus #12 (District 4)',
      title: 'Person detected after route completion',
      severity: 'critical' as const,
      sensor: 'Ceiling mmWave 60GHz Vital Radar (sens_bus_radar_12)',
      time: 'Just now (1m 42s ago)',
      sla: 'SLA Escalation to District Dispatch in 03:18 mins',
      context: 'Vehicle ignition was turned OFF at 14:45. mmWave radar detected stationary micro-movement (breathing cadence: 18 bpm) in row 6.',
      actionTaken: 'Autonomous warning chime initiated. Responsible driver pinged.',
    },
    {
      id: 'alert-room204',
      facility: 'St. Jude General Hospital',
      location: 'Patient Recovery Room #204 (Floor 2)',
      title: 'Assistance indication in private bathroom',
      severity: 'high' as const,
      sensor: 'Dual mmWave Radar + Acoustic SPL Sensor',
      time: '6 mins ago',
      sla: 'Nurse station escalated · Awaiting bedside confirmation',
      context: 'Rapid vertical descent trajectory detected, followed by zero posture elevation for 180 seconds. Acoustic peak of 78 dBA.',
      actionTaken: 'Emergency door latch unlocked via relay. Duty nurse alerted.',
    },
    {
      id: 'alert-cls8a',
      facility: 'Oakridge STEM Academy',
      location: 'Classroom 8A — Chemistry Lab (Floor 1)',
      title: 'CO₂ above configured threshold (1,450 ppm)',
      severity: 'warning' as const,
      sensor: 'Sensirion SCD40 Photoacoustic NDIR Sensor',
      time: '12 mins ago',
      sla: 'Autonomous mitigation active',
      context: 'Indoor carbon dioxide elevated beyond 1,200 ppm threshold during 35-student laboratory session. Temperature: 22.4°C.',
      actionTaken: 'HVAC intake damper auto-commanded to 100% fresh air via BACnet.',
    },
  ];

  const recentTelemetryStream = [
    {
      id: 'tel-1',
      device: 'ESP32-RADAR-HOTEL-301',
      room: 'Room 301 (Marina Hotel)',
      type: 'Occupancy',
      val: 'Departed (Unoccupied)',
      action: 'Eco-setback triggered: HVAC +2°C, lights off',
      time: '14s ago',
    },
    {
      id: 'tel-2',
      device: 'ESP32-ENV-OFFICE-4B',
      room: 'Boardroom B (Metropolitan HQ)',
      type: 'Air & Noise',
      val: 'CO₂: 610 ppm · SPL: 44 dBA',
      action: 'Normal parameters · Meeting in progress',
      time: '28s ago',
    },
    {
      id: 'tel-3',
      device: 'ESP32-RADAR-PARKING-P1',
      room: 'Bay 14 (Underground Park)',
      type: 'Vehicle mmWave',
      val: 'Vehicle Entry',
      action: 'Lighting zone 3 ramped from 20% to 100%',
      time: '45s ago',
    },
    {
      id: 'tel-4',
      device: 'ESP32-COLD-WH-02',
      room: 'Freezer Unit 2 (Logistics Hub)',
      type: 'Thermal Contact',
      val: '-18.4°C · Door: Closed',
      action: 'Seal intact · Compressor duty cycle 45%',
      time: '1m ago',
    },
  ];

  return (
    <div className="space-y-6 text-[var(--theme-text)] font-sans">
      {/* ── Top Metric KPI Counters ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 font-mono">
        {/* Facilities */}
        <div className="glass-card hud-bracket p-4 sm:p-5 relative">
          <div className="flex items-center justify-between text-[var(--theme-text-muted)] mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Facilities</span>
            <Building2 className="w-4 h-4 text-[var(--theme-primary)]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-[var(--theme-text)]">12</span>
            <span className="text-[11px] text-[var(--theme-primary)] font-semibold">Active sites</span>
          </div>
        </div>

        {/* Monitored Rooms */}
        <div className="glass-card hud-bracket p-4 sm:p-5 relative">
          <div className="flex items-center justify-between text-[var(--theme-text-muted)] mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Rooms</span>
            <DoorClosed className="w-4 h-4 text-[var(--theme-primary)]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-[var(--theme-text)]">184</span>
            <span className="text-[11px] text-[var(--theme-primary)] font-semibold">Digital twins</span>
          </div>
        </div>

        {/* Total Sensors */}
        <div className="glass-card hud-bracket p-4 sm:p-5 relative">
          <div className="flex items-center justify-between text-[var(--theme-text-muted)] mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Sensors</span>
            <Radio className="w-4 h-4 text-[var(--theme-primary)]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-[var(--theme-text)]">421</span>
            <span className="text-[11px] text-[var(--theme-text-muted)] font-semibold">Deployed</span>
          </div>
        </div>

        {/* Online Devices */}
        <div className="glass-card hud-bracket p-4 sm:p-5 relative">
          <div className="flex items-center justify-between text-[var(--theme-text-muted)] mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Online Mesh</span>
            <CheckCircle2 className="w-4 h-4 text-[var(--theme-primary)]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-[var(--theme-primary)]">397</span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">94.3% mesh</span>
          </div>
        </div>

        {/* Active Alerts */}
        <div className="glass-card hud-bracket p-4 sm:p-5 relative border-rose-500/40 bg-rose-500/10 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-rose-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Alerts</span>
            <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-500">3</span>
            <span className="text-[11px] text-rose-500 font-bold">Require action</span>
          </div>
        </div>
      </div>

      {/* ── ACTION REQUIRED Priority Queue ── */}
      <div className="space-y-3 font-mono">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <h2 className="text-sm sm:text-base font-bold text-[var(--theme-text)] tracking-wider uppercase flex items-center gap-2">
              Action Required // Escalation Queue
            </h2>
          </div>
          <span className="text-[11px] text-[var(--theme-text-muted)] font-semibold">
            Ordered by Life Safety &amp; Escalation SLA
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3.5">
          {actionItems.map((item) => {
            const isAck = acknowledgedAlerts[item.id];
            const severityStyles = {
              critical: {
                border: 'border-rose-500/40 bg-rose-500/10',
                badge: 'danger' as const,
                badgeLabel: '🚨 CRITICAL ESCALATION',
                icon: <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />,
              },
              high: {
                border: 'border-amber-500/40 bg-amber-500/10',
                badge: 'warning' as const,
                badgeLabel: '⚠️ URGENT ASSISTANCE',
                icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
              },
              warning: {
                border: 'border-[var(--theme-border)] bg-[var(--theme-badge-bg)]',
                badge: 'info' as const,
                badgeLabel: '💨 CO₂ MITIGATION ACTIVE',
                icon: <Wind className="w-5 h-5 text-[var(--theme-primary)] shrink-0" />,
              },
            };

            const style = severityStyles[item.severity];

            return (
              <div
                key={item.id}
                className={`hud-bracket glass-card p-5 transition-all ${style.border} ${isAck ? 'opacity-60' : ''}`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left Column: Details */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="mt-0.5 p-2 rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)]">{style.icon}</div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Badge variant={style.badge} size="sm" dot pulsing={!isAck}>
                          {style.badgeLabel}
                        </Badge>
                        <span className="text-xs font-bold text-[var(--theme-text)]">{item.facility}</span>
                        <span className="text-xs text-[var(--theme-text-dim)]">·</span>
                        <span className="text-xs font-semibold text-[var(--theme-primary)]">{item.location}</span>
                        <span className="text-xs text-[var(--theme-text-dim)]">·</span>
                        <span className="text-xs text-[var(--theme-text-muted)]">{item.time}</span>
                      </div>

                      <h3 className="text-base font-bold text-[var(--theme-text)] tracking-tight leading-snug font-sans">
                        {item.title}
                      </h3>

                      <p className="text-xs text-[var(--theme-text-muted)] mt-1.5 leading-relaxed font-sans font-normal">
                        {item.context}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs">
                        <div className="flex items-center gap-1.5 text-[var(--theme-text-muted)]">
                          <Radio className="w-3.5 h-3.5 text-[var(--theme-primary)]" />
                          <span className="font-mono text-[11px] font-semibold">{item.sensor}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--theme-text)] bg-[var(--theme-badge-bg)] border border-[var(--theme-badge-border)] px-2 py-0.5 rounded font-bold">
                          <Zap className="w-3 h-3 text-[var(--theme-primary)]" />
                          <span>{item.actionTaken}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Responsible Action Buttons */}
                  <div className="flex md:flex-col items-end justify-between md:justify-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[var(--theme-border)]">
                    <span className="text-[11px] font-mono font-bold text-rose-500 text-right">
                      {item.sla}
                    </span>
                    <div className="flex items-center gap-2">
                      {isAck ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--theme-badge-bg)] border border-[var(--theme-badge-border)] text-[var(--theme-primary)] text-xs font-mono font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[var(--theme-primary)]" />
                          Acknowledged
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleAcknowledge(item.id)}
                          className="text-xs whitespace-nowrap"
                        >
                          Acknowledge &amp; Act
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs whitespace-nowrap"
                        rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Telemetry Stream & System Insights ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Real-time Ingestion Stream */}
        <Card variant="default" className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Autonomous Sensor Stream</CardTitle>
                <CardDescription>Live edge signals decoded and routed without raw camera feeds</CardDescription>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--theme-primary)] font-mono font-bold bg-[var(--theme-badge-bg)] px-2.5 py-1 rounded-full border border-[var(--theme-badge-border)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--theme-primary)] animate-pulse" />
                MQTT Active
              </div>
            </div>
          </CardHeader>
          <CardContent className="divide-y divide-[var(--theme-border)]">
            {recentTelemetryStream.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-4 text-xs font-mono">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[var(--theme-text)]">{item.room}</span>
                    <Badge variant="primary" size="sm">
                      {item.type}
                    </Badge>
                  </div>
                  <p className="text-[var(--theme-primary)] text-[11px] mt-0.5 font-semibold">{item.val}</p>
                  <p className="text-emerald-500 font-semibold text-[11px] mt-0.5 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-emerald-500" /> {item.action}
                  </p>
                </div>
                <span className="text-[11px] text-[var(--theme-text-muted)] shrink-0 font-medium">{item.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Environmental & ESG Efficiency Widget */}
        <Card variant="glass" className="flex flex-col justify-between">
          <div>
            <CardHeader>
              <div className="flex items-center gap-2 text-[var(--theme-primary)] font-mono font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-[var(--theme-primary)]" />
                <span>Autonomous Efficiency</span>
              </div>
              <CardTitle className="mt-1">Energy &amp; Privacy Impact</CardTitle>
              <CardDescription>Metrics verified across 184 monitored zones today</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-1 font-mono">
              <div className="p-3.5 rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--theme-text-muted)] font-semibold">HVAC Setback Savings</span>
                  <span className="text-xs font-bold text-[var(--theme-primary)]">142.8 kWh</span>
                </div>
                <div className="w-full bg-[var(--theme-badge-bg)] h-2 rounded-full mt-2 overflow-hidden border border-[var(--theme-border)]">
                  <div className="bg-[var(--theme-primary)] h-full rounded-full w-[68%]" />
                </div>
                <p className="text-[10px] text-[var(--theme-text-muted)] mt-1.5 font-normal">
                  68 unoccupied rooms set to standby temperature.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--theme-text-muted)] font-semibold">Privacy Compliance</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-300">100% HIPAA/GDPR</span>
                </div>
                <p className="text-[10px] text-[var(--theme-text-muted)] mt-1.5 leading-relaxed font-normal">
                  Zero biometric images stored or captured. mmWave points are processed on edge microcontrollers.
                </p>
              </div>
            </CardContent>
          </div>

          <div className="p-6 pt-0">
            <Button
              variant="outline"
              className="w-full text-xs justify-between"
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              <span>Download Digital Twin ESG Audit</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
