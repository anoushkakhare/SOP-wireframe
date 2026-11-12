import { kpiRepository } from '../repositories/kpiRepository';
import { KpiItem, ProductLevel, CustomerLevel, Uom } from '../types';

export class KpiService {
  async getKpis(params: {
    productLevel?: ProductLevel;
    customerLevel?: CustomerLevel;
    uom?: Uom;
    parent?: string;
    scenarioId?: string;
  }): Promise<KpiItem[]> {
    return kpiRepository.getKpis(params);
  }
}

export const kpiService = new KpiService();

