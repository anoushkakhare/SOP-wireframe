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
  from?: string;
  to?: string;
}

function toQs(params: DataParams): string {
  const p = new URLSearchParams();
  if (params.productLevel !== undefined) p.set('productLevel', String(params.productLevel));
  if (params.scope)  p.set('scope',  params.scope);
  if (params.apg)    p.set('apg',    params.apg);
  if (params.from)   p.set('from',   params.from);
  if (params.to)     p.set('to',     params.to);
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
