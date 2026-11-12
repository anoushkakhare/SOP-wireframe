import { chartRepository } from '../repositories/chartRepository';
import {
  ForecastLineResponse,
  StackedBarResponse,
  WaterfallResponse,
  TreemapResponse,
  ProductLevel,
} from '../types';

export class ChartService {
  async getForecastLine(parent?: string): Promise<ForecastLineResponse> {
    return chartRepository.getForecastLine(parent);
  }

  async getStackedBar(level: ProductLevel = 'brand', parent?: string): Promise<StackedBarResponse> {
    return chartRepository.getStackedBar(level, parent);
  }

  async getWaterfall(parent?: string): Promise<WaterfallResponse> {
    return chartRepository.getWaterfall(parent);
  }

  async getTreemap(level: ProductLevel = 'brand'): Promise<TreemapResponse> {
    return chartRepository.getTreemap(level);
  }
}

export const chartService = new ChartService();

