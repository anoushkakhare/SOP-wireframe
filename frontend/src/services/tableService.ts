import { request } from './apiClient';
import { TableResponse } from '../types';
import { DataParams } from './chartService';

export const tableService = {
  async getTable(params: DataParams = {}): Promise<TableResponse> {
    const p = new URLSearchParams();
    if (params.productLevel !== undefined) p.set('productLevel', String(params.productLevel));
    if (params.scope) p.set('scope', params.scope);
    if (params.apg)   p.set('apg',   params.apg);
    const qs = p.toString() ? `?${p.toString()}` : '';
    return request<TableResponse>(`/table${qs}`);
  },

  async desegregate(scope?: string): Promise<TableResponse> {
    return request<TableResponse>('/table/desegregate', {
      method: 'POST',
      body: JSON.stringify({ scope }),
    });
  },
};
