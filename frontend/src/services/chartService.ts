import { request } from './apiClient';
import {
  ForecastLineResponse,
  StackedBarResponse,
  WaterfallResponse,
  TreemapResponse,
  ProductLevel,
} from '../types';

export const chartService = {
  async getForecastLine(parent?: string): Promise<ForecastLineResponse> {
    const qs = parent ? `?parent=${encodeURIComponent(parent)}` : '';
    return request<ForecastLineResponse>(`/charts/forecast-line${qs}`);
  },

  async getStackedBar(level: ProductLevel = 'brand', parent?: string): Promise<StackedBarResponse> {
    const params = new URLSearchParams();
    params.set('level', level);
    if (parent) params.set('parent', parent);
    return request<StackedBarResponse>(`/charts/stacked-bar?${params.toString()}`);
  },

  async getWaterfall(parent?: string): Promise<WaterfallResponse> {
    const qs = parent ? `?parent=${encodeURIComponent(parent)}` : '';
    return request<WaterfallResponse>(`/charts/waterfall${qs}`);
  },

  async getTreemap(level: ProductLevel = 'brand'): Promise<TreemapResponse> {
    return request<TreemapResponse>(`/charts/treemap?level=${level}`);
  },
};

