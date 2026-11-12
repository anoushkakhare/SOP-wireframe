import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { Role } from '../types';

export function useAuth() {
  const { user, token, layoutManifest, isAuthenticated, setAuth, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (role: Role = 'demand_planner') => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await authService.login(role);
      setAuth(resp);
      return resp;
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    token,
    layoutManifest,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
  };
}

