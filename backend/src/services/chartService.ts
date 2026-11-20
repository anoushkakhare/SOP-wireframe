import { chartRepository } from '../repositories/chartRepository';
import {
  ForecastLineResponse,
  StackedBarResponse,
  WaterfallResponse,
  TreemapResponse,
  DataQueryParams,
} from '../types';

export class ChartService {
  async getForecastLine(params: DataQueryParams = {}): Promise<ForecastLineResponse> {
    return chartRepository.getForecastLine(params);
  }

  async getStackedBar(params: DataQueryParams = {}): Promise<StackedBarResponse> {
    return chartRepository.getStackedBar(params);
  }

  async getWaterfall(params: DataQueryParams = {}): Promise<WaterfallResponse> {
    return chartRepository.getWaterfall(params);
  }

  async getTreemap(params: DataQueryParams = {}): Promise<TreemapResponse> {
    return chartRepository.getTreemap(params);
  }
}

export const chartService = new ChartService();
