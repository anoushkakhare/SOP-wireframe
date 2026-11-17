import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginPage } from './pages/LoginPage';
import { DemandPlannerPage } from './pages/DemandPlannerPage';
import { DataReviewPage } from './pages/DataReviewPage';
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

const LandingRedirect: React.FC = () => {
  const lastPage = localStorage.getItem('unilever_last_page') || '/dashboard';
  return <Navigate to={lastPage} replace />;
};

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
                <LandingRedirect />
              </RoleGuard>
            }
          />
          <Route
            path="/dashboard"
            element={
              <RoleGuard>
                <DemandPlannerPage />
              </RoleGuard>
            }
          />
          <Route
            path="/data-review"
            element={
              <RoleGuard>
                <DataReviewPage />
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
