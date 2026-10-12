// ─────────────────────────────────────────────
// SENTINEL Web — Root Application Component
// ─────────────────────────────────────────────

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LandingPage } from './pages/LandingPage';

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
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          {/* Additional routes will be added in subsequent phases */}
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
