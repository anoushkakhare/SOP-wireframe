import { tableRepository } from '../repositories/tableRepository';
import { TableResponse } from '../types';

export class TableService {
  async getTable(params: {
    productLevel?: number;
    scope?: string;
    apg?: string;
    filters?: any;
  }): Promise<TableResponse> {
    return tableRepository.getTable(params);
  }

  async desegregate(scope?: string): Promise<TableResponse> {
    return tableRepository.desegregate(scope);
  }
}

export const tableService = new TableService();
