import { tableRepository } from '../repositories/tableRepository';
import { TableResponse } from '../types';

export class TableService {
  async getTable(params: {
    productLevel?: number;
    scope?: string;
    apg?: string;
    timeGrain?: string;
    measure?: string;
    from?: string;
    to?: string;
    planningCycle?: string;
    activity?: string;
    filters?: any;
  }): Promise<TableResponse> {
    return tableRepository.getTable(params);
  }

  async desegregate(scope?: string, params: { timeGrain?: string; measure?: string; from?: string; to?: string; planningCycle?: string; activity?: string } = {}): Promise<TableResponse> {
    return tableRepository.desegregate(scope, params);
  }
}

export const tableService = new TableService();
