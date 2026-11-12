import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginPage } from './pages/LoginPage';
import { DemandPlannerPage } from './pages/DemandPlannerPage';
import { DevGalleryPage } from './pages/DevGalleryPage';
import { NotFound } from './pages/NotFound';
import { RoleGuard } from './roles/RoleGuard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <RoleGuard>
                <DemandPlannerPage />
              </RoleGuard>
            }
          />
          <Route path="/dev" element={<DevGalleryPage />} />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;

