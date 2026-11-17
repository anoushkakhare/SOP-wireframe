import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Role } from '../types';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, user, layoutManifest } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if role layout manifest disables this page
  if (layoutManifest?.pages && layoutManifest.pages.length > 0) {
    const pageConfig = layoutManifest.pages.find(p => p.path === location.pathname);
    if (pageConfig && pageConfig.enabled === false) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-page p-4 text-center">
        <div className="bg-surface border border-border p-6 rounded-card max-w-md shadow-card">
          <h2 className="text-base font-semibold text-negative mb-2">Access restricted</h2>
          <p className="text-xs text-text-secondary">
            Your role (<span className="font-semibold">{user.role}</span>) does not have access to this resource.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
