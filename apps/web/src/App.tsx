// ─────────────────────────────────────────────
// SENTINEL Web — Root Application Component
// ─────────────────────────────────────────────

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { OrganizationProvider } from './context/OrganizationContext';
import { FacilityProvider } from './context/FacilityContext';
import { SensorProvider } from './context/SensorContext';
import { DeviceProvider } from './context/DeviceContext';
import { TelemetryProvider } from './context/TelemetryContext';
import { EventProvider } from './context/EventContext';
import { AutomationProvider } from './context/AutomationContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardOverviewPage } from './pages/DashboardOverviewPage';
import { OrganizationsPage } from './pages/OrganizationsPage';
import { FacilitiesPage } from './pages/FacilitiesPage';
import { SensorsPage } from './pages/SensorsPage';
import { DevicesPage } from './pages/DevicesPage';
import { TelemetryPage } from './pages/TelemetryPage';
import { EventsPage } from './pages/EventsPage';
import { AutomationsPage } from './pages/AutomationsPage';
import { AppShell } from './components/layout/AppShell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './components/ui/Card';
import { Badge } from './components/ui/Badge';
import { Construction } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

// Clean placeholder component for upcoming phased routes
const PlaceholderRoute: React.FC<{ title: string; day: string; description: string }> = ({
  title,
  day,
  description,
}) => (
  <Card variant="default" className="py-12 text-center max-w-xl mx-auto my-8">
    <CardHeader>
      <div className="w-12 h-12 rounded-2xl bg-sentinel-50 text-sentinel-600 flex items-center justify-center mx-auto mb-3">
        <Construction className="w-6 h-6" />
      </div>
      <div className="flex items-center justify-center gap-2 mb-2">
        <Badge variant="primary" size="sm">
          {day}
        </Badge>
        <span className="text-xs text-slate-400">Scheduled Implementation</span>
      </div>
      <CardTitle>{title}</CardTitle>
      <CardDescription className="max-w-md mx-auto">{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-xs text-slate-500">
        The application shell, navigation routing, and design system tokens are ready.
      </p>
    </CardContent>
  </Card>
);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OrganizationProvider>
          <FacilityProvider>
            <SensorProvider>
              <DeviceProvider>
                <TelemetryProvider>
                  <EventProvider>
                    <AutomationProvider>
                      <BrowserRouter>
                        <Routes>
                          {/* Public High-Impact Landing Page */}
                          <Route path="/" element={<LandingPage />} />

                          {/* Authentication Routes */}
                          <Route path="/login" element={<LoginPage />} />
                          <Route path="/register" element={<RegisterPage />} />

                          {/* Authenticated / Enterprise Platform Shell (Protected) */}
                          <Route
                            element={
                              <ProtectedRoute>
                                <AppShell />
                              </ProtectedRoute>
                            }
                          >
                            <Route path="/dashboard" element={<DashboardOverviewPage />} />
                            <Route path="/organizations" element={<OrganizationsPage />} />
                            <Route path="/facilities" element={<FacilitiesPage />} />
                            <Route path="/devices" element={<DevicesPage />} />
                            <Route path="/sensors" element={<SensorsPage />} />
                            <Route path="/telemetry" element={<TelemetryPage />} />
                            <Route path="/events" element={<EventsPage />} />
                            <Route path="/automations" element={<AutomationsPage />} />
                            <Route
                              path="/alerts"
                              element={
                                <PlaceholderRoute
                                  title="Alerts, Escalations & Sound Engine"
                                  day="Day 11"
                                  description="Multi-tier SLA escalation matrices, browser Web Audio beacons, and responsible-person dispatch."
                                />
                              }
                            />
                            <Route
                              path="/analytics"
                              element={
                                <PlaceholderRoute
                                  title="Analytics & ESG Digital Twin"
                                  day="Day 12"
                                  description="Time-series telemetry visualizations, energy setback savings audits, and occupancy distributions."
                                />
                              }
                            />
                          </Route>

                          {/* Catch-all Fallback */}
                          <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                      </BrowserRouter>
                    </AutomationProvider>
                  </EventProvider>
                </TelemetryProvider>
              </DeviceProvider>
            </SensorProvider>
          </FacilityProvider>
        </OrganizationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
