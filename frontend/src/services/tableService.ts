import { request } from './apiClient';
import { TableResponse, ProductLevel } from '../types';

export const tableService = {
  async getTable(params: {
    level?: ProductLevel;
    parent?: string;
    filters?: any;
  } = {}): Promise<TableResponse> {
    const query = new URLSearchParams();
    if (params.level) query.set('level', params.level);
    if (params.parent) query.set('parent', params.parent);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<TableResponse>(`/table${qs}`);
  },

  async desegregate(parent?: string): Promise<TableResponse> {
    return request<TableResponse>('/table/desegregate', {
      method: 'POST',
      body: JSON.stringify({ parent }),
    });
  },
};

