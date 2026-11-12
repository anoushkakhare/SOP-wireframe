import { request } from './apiClient';
import { LoginResponse, Role } from '../types';

export const authService = {
  async login(role: Role = 'demand_planner'): Promise<LoginResponse> {
    return request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
  },
};

