import { request } from './apiClient';
import { TableResponse } from '../types';
import { DataParams } from './chartService';

export const tableService = {
  async getTable(params: DataParams = {}): Promise<TableResponse> {
    const p = new URLSearchParams();
    if (params.productLevel !== undefined) p.set('productLevel', String(params.productLevel));
    if (params.scope) p.set('scope', params.scope);
    if (params.apg) p.set('apg', params.apg);
    if (params.timeGrain) p.set('timeGrain', params.timeGrain);
    if (params.measure) p.set('measure', params.measure);
    if (params.from) p.set('from', params.from);
    if (params.to) p.set('to', params.to);
    if (params.planningCycle) p.set('planningCycle', params.planningCycle);
    if (params.activity) p.set('activity', params.activity);
    const qs = p.toString() ? `?${p.toString()}` : '';
    return request<TableResponse>(`/table${qs}`);
  },

  async desegregate(scope?: string, params: DataParams = {}): Promise<TableResponse> {
    return request<TableResponse>('/table/desegregate', {
      method: 'POST',
      body: JSON.stringify({ scope, ...params }),
    });
  },
};
