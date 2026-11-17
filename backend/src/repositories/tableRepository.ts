import { aggregate } from '../utils/aggregate';
import masterData from '../data/masterData.json';
import { TableResponse, PlanningTableRow } from '../types';

function levelField(level: number): string {
  switch (level) {
    case 1: return 'categoryId';
    case 2: return 'sopId';
    case 3: return 'brandId';
    case 4: return 'fgId';
    case 5: return 'fuId';
    default: return 'brandId';
  }
}

function mapProductLevel(n: number): 'brand' | 'product' {
  return n >= 4 ? 'product' : 'brand';
}

export class TableRepository {
  async getTable(params: {
    productLevel?: number;
    scope?: string;
    apg?: string;
    filters?: any;
  }): Promise<TableResponse> {
    const level = params.productLevel || 3;
    const groups = aggregate({ scope: params.scope, apg: params.apg, level });
    const months = masterData.months as string[];

    const rows: PlanningTableRow[] = groups.map(g => {
      const pastActuals: Record<string, number> = {};
      const opportunity: Record<string, number> = {};
      const actualFcst:  Record<string, number> = {};
      const risk:        Record<string, number> = {};

      months.forEach((m, mIdx) => {
        if (mIdx < masterData.currentMonthIndex) {
          pastActuals[m] = g.monthlyActuals[m] || 0;
        } else {
          actualFcst[m]  = g.monthlyForecast[m] || 0;
          opportunity[m] = g.monthlyOpportunity[m] || 0;
          risk[m]        = g.monthlyRisk[m] || 0;
        }
      });

      // Pull sample item for denormalized fields
      const sample = g.items[0] as any;

      const row: PlanningTableRow = {
        id: `row_${g.id}`,
        category:      sample?.category,
        sop:           sample?.sop,
        brand:         sample?.brand,
        forecastGroup: sample?.forecastGroup,
        forecastUnit:  sample?.forecastUnit,
        customerGroup: params.apg || 'All',
        customer:      params.apg || 'All',
        apg:           params.apg || 'All',
        pastActuals,
        definitions: { opportunity, actualFcst, risk },
      };
      return row;
    });

    return {
      period: months,
      currentMonthIndex: masterData.currentMonthIndex,
      level: mapProductLevel(level),
      productLevelNum: level,
      rows,
    };
  }

  async desegregate(parentScope?: string): Promise<TableResponse> {
    // Desegregate = show level 5 (forecast unit) rows
    return this.getTable({ productLevel: 5, scope: parentScope });
  }
}

export const tableRepository = new TableRepository();
