import { kpiRepository } from '../repositories/kpiRepository';
import { KpiItem, Uom } from '../types';

export class KpiService {
  async getKpis(params: {
    productLevel?: number;
    scope?: string;
    apg?: string;
    uom?: Uom;
    measure?: string;
    timeGrain?: string;
    from?: string;
    to?: string;
    scenarioId?: string;
  }): Promise<KpiItem[]> {
    return kpiRepository.getKpis(params);
  }
}

export const kpiService = new KpiService();
