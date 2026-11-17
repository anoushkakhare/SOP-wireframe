import { request } from './apiClient';
import { KpiItem } from '../types';
import { DataParams } from './chartService';

export const kpiService = {
  async getKpis(params: DataParams & { uom?: string; scenarioId?: string } = {}): Promise<KpiItem[]> {
    const p = new URLSearchParams();
    if (params.productLevel !== undefined) p.set('productLevel', String(params.productLevel));
    if (params.scope)       p.set('scope',       params.scope);
    if (params.apg)         p.set('apg',         params.apg);
    if (params.uom)         p.set('uom',         params.uom);
    if (params.scenarioId)  p.set('scenarioId',  params.scenarioId);
    const qs = p.toString() ? `?${p.toString()}` : '';
    return request<KpiItem[]>(`/kpis${qs}`);
  },
};
