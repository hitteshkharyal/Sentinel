import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { SearchModal, SearchResultItem } from './SearchModal';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';
import { Radio, CheckCircle2, Shield, Activity } from 'lucide-react';

export const AppShell: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [simulationTriggered, setSimulationTriggered] = useState<string | null>(null);

  // Global keyboard shortcut for Ctrl/Cmd + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectSearchResult = (item: SearchResultItem) => {
    // eslint-disable-next-line no-console
    console.log('Selected space / item:', item);
  };

  const handleSimulateEvent = (eventName: string) => {
    setSimulationTriggered(eventName);
    setTimeout(() => {
      setSimulationTriggered(null);
      setSimulatorOpen(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* ── Left Navigation Sidebar ── */}
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* ── Main Workspace Content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenSimulator={() => setSimulatorOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>

      {/* ── Global Quick Search Modal (Cmd/Ctrl + K) ── */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectResult={handleSelectSearchResult}
      />

      {/* ── Simulation Modal for Live Sensor Injection ── */}
      <Modal
        isOpen={simulatorOpen}
        onClose={() => setSimulatorOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-sentinel-600" />
            <span>Simulate Hardware Sensor Signal</span>
          </div>
        }
        description="Trigger real-time telemetry events to test autonomous decision loops and instant actuators."
        maxWidth="lg"
      >
        {simulationTriggered ? (
          <div className="py-6 text-center animate-fade-in">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 animate-bounce" />
            <h4 className="text-base font-semibold text-slate-900">Telemetry Ingested</h4>
            <p className="text-sm text-slate-500 mt-1">
              Event <span className="font-semibold text-sentinel-700">{simulationTriggered}</span> broadcast over MQTT.
              Decision engine evaluated in 14ms.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert variant="info" icon={<Shield className="w-4 h-4 text-blue-600 shrink-0" />}>
              Simulated telemetry adheres strictly to SENTINEL privacy boundaries — no camera frames are synthesized.
            </Alert>

            <div className="space-y-2.5">
              {[
                {
                  id: 'co2_spike',
                  title: 'Classroom 8A: CO₂ Spike (1,480 ppm)',
                  desc: 'Triggers fresh air HVAC damper actuation to 100% intake.',
                  type: 'Air Quality',
                  badge: 'Auto-Actuation',
                  variant: 'warning' as const,
                },
                {
                  id: 'bus_occupancy',
                  title: 'School Bus 12: Post-Route Movement Detected',
                  desc: 'Triggers horn strobe + immediate escalation to dispatch and driver.',
                  type: 'Life Safety',
                  badge: 'Critical Escalation',
                  variant: 'danger' as const,
                },
                {
                  id: 'fall_assistance',
                  title: 'Room 204: Bathroom Fall Signature Detected',
                  desc: '60GHz mmWave radar reports floor velocity vector + sudden stationary posture.',
                  type: 'Healthcare',
                  badge: 'Escalation Tier 1',
                  variant: 'danger' as const,
                },
                {
                  id: 'hotel_energy',
                  title: 'Room 301: Unoccupied Departure (30 mins)',
                  desc: 'Sets thermostat to eco mode and switches off non-essential lighting.',
                  type: 'Energy Policy',
                  badge: 'Auto-Actuation',
                  variant: 'success' as const,
                },
              ].map((sim) => (
                <div
                  key={sim.id}
                  onClick={() => handleSimulateEvent(sim.title)}
                  className="p-3.5 rounded-xl border border-slate-200/80 hover:border-sentinel-300 hover:bg-sentinel-50/50 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-sentinel-700">
                        {sim.title}
                      </span>
                      <Badge variant={sim.variant} size="sm">
                        {sim.badge}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{sim.desc}</p>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0 text-xs">
                    Trigger
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-sentinel-600" />
                Hardware simulation conforms to ESP32 HAL schema
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
