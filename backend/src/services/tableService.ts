import { tableRepository } from '../repositories/tableRepository';
import { TableResponse, ProductLevel } from '../types';

export class TableService {
  async getTable(params: {
    level?: ProductLevel;
    parent?: string;
    filters?: any;
  }): Promise<TableResponse> {
    return tableRepository.getTable(params);
  }

  async desegregate(parent?: string): Promise<TableResponse> {
    return tableRepository.desegregate(parent);
  }
}

export const tableService = new TableService();

