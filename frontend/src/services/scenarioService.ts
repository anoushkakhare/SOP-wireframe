import { request } from './apiClient';
import { Scenario } from '../types';

export const scenarioService = {
  async list(): Promise<Scenario[]> {
    return request<Scenario[]>('/scenarios');
  },

  async create(name: string): Promise<Scenario> {
    return request<Scenario>('/scenarios', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  async commit(id: string): Promise<Scenario> {
    return request<Scenario>(`/scenarios/${id}/commit`, {
      method: 'POST',
    });
  },

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/scenarios/${id}`, {
      method: 'DELETE',
    });
  },
};

