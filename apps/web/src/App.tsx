// ─────────────────────────────────────────────
// SENTINEL Web — Root Application Component
// ─────────────────────────────────────────────

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { OrganizationProvider } from './context/OrganizationContext';
import { FacilityProvider } from './context/FacilityContext';
import { SensorProvider } from './context/SensorContext';
import { DeviceProvider } from './context/DeviceContext';
import { TelemetryProvider } from './context/TelemetryContext';
import { EventProvider } from './context/EventContext';
import { AutomationProvider } from './context/AutomationContext';
import { AlertProvider } from './context/AlertContext';
import { AnalyticsProvider } from './context/AnalyticsContext';
import { PredictionProvider } from './context/PredictionContext';
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
import { AlertsPage } from './pages/AlertsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { PredictionsPage } from './pages/PredictionsPage';
import { AppShell } from './components/layout/AppShell';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
        <OrganizationProvider>
          <FacilityProvider>
            <SensorProvider>
              <DeviceProvider>
                <TelemetryProvider>
                  <EventProvider>
                    <AutomationProvider>
                      <AlertProvider>
                        <AnalyticsProvider>
                          <PredictionProvider>
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
                                  <Route path="/alerts" element={<AlertsPage />} />
                                  <Route path="/analytics" element={<AnalyticsPage />} />
                                  <Route path="/predictions" element={<PredictionsPage />} />
                                </Route>

                                {/* Catch-all Fallback */}
                                <Route path="*" element={<Navigate to="/" replace />} />
                              </Routes>
                            </BrowserRouter>
                          </PredictionProvider>
                        </AnalyticsProvider>
                      </AlertProvider>
                    </AutomationProvider>
                  </EventProvider>
                </TelemetryProvider>
              </DeviceProvider>
            </SensorProvider>
          </FacilityProvider>
        </OrganizationProvider>
      </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
