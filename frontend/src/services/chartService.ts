import { request } from './apiClient';
import {
  ForecastLineResponse,
  StackedBarResponse,
  WaterfallResponse,
  TreemapResponse,
} from '../types';

export interface DataParams {
  productLevel?: number;
  scope?: string;
  apg?: string;
  timeGrain?: string;
  measure?: string;
  from?: string;
  to?: string;
  planningCycle?: string;
  compareTo?: string;
  activity?: string;
}

function toQs(params: DataParams): string {
  const p = new URLSearchParams();
  if (params.productLevel !== undefined) p.set('productLevel', String(params.productLevel));
  if (params.scope) p.set('scope', params.scope);
  if (params.apg) p.set('apg', params.apg);
  if (params.timeGrain) p.set('timeGrain', params.timeGrain);
  if (params.measure) p.set('measure', params.measure);
  if (params.from) p.set('from', params.from);
  if (params.to) p.set('to', params.to);
  if (params.planningCycle) p.set('planningCycle', params.planningCycle);
  if (params.compareTo) p.set('compareTo', params.compareTo);
  if (params.activity) p.set('activity', params.activity);
  const s = p.toString();
  return s ? `?${s}` : '';
}

export const chartService = {
  async getForecastLine(params: DataParams = {}): Promise<ForecastLineResponse> {
    return request<ForecastLineResponse>(`/charts/forecast-line${toQs(params)}`);
  },

  async getStackedBar(params: DataParams = {}): Promise<StackedBarResponse> {
    return request<StackedBarResponse>(`/charts/stacked-bar${toQs(params)}`);
  },

  async getWaterfall(params: DataParams = {}): Promise<WaterfallResponse> {
    return request<WaterfallResponse>(`/charts/waterfall${toQs(params)}`);
  },

  async getTreemap(params: DataParams = {}): Promise<TreemapResponse> {
    return request<TreemapResponse>(`/charts/treemap${toQs(params)}`);
  },
};
