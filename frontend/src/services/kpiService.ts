import { request } from './apiClient';
import { KpiItem } from '../types';

export const kpiService = {
  async getKpis(params: Record<string, any> = {}): Promise<KpiItem[]> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, String(v));
      }
    });
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<KpiItem[]>(`/kpis${qs}`);
  },
};

