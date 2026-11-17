import { request } from './apiClient';
import { KpiItem } from '../types';
import { DataParams } from './chartService';

export const kpiService = {
  async getKpis(params: DataParams & {
    uom?: string;
    measure?: string;
    timeGrain?: string;
    from?: string;
    to?: string;
    scenarioId?: string;
  } = {}): Promise<KpiItem[]> {
    const p = new URLSearchParams();
    if (params.productLevel !== undefined) p.set('productLevel', String(params.productLevel));
    if (params.scope) p.set('scope', params.scope);
    if (params.apg) p.set('apg', params.apg);
    if (params.uom) p.set('uom', params.uom);
    if (params.measure) p.set('measure', params.measure);
    if (params.timeGrain) p.set('timeGrain', params.timeGrain);
    if (params.from) p.set('from', params.from);
    if (params.to) p.set('to', params.to);
    if (params.scenarioId) p.set('scenarioId', params.scenarioId);
    if (params.planningCycle) p.set('planningCycle', params.planningCycle);
    if (params.compareTo) p.set('compareTo', params.compareTo);
    if (params.activity) p.set('activity', params.activity);
    const qs = p.toString() ? `?${p.toString()}` : '';
    return request<KpiItem[]>(`/kpis${qs}`);
  },
};
