import { aggregate, getPeriodsForGrain } from '../utils/aggregate';
import masterData from '../data/masterData.json';
import { TableResponse, PlanningTableRow } from '../types';

function mapProductLevel(n: number): 'brand' | 'product' {
  return n >= 4 ? 'product' : 'brand';
}

export class TableRepository {
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
    const level = params.productLevel || 3;
    const { activePeriods, currentPeriodIndex } = getPeriodsForGrain(
      params.timeGrain,
      params.from,
      params.to
    );

    const groups = aggregate({
      scope: params.scope,
      apg: params.apg,
      level,
      timeGrain: params.timeGrain,
      measure: params.measure,
      from: params.from,
      to: params.to,
      planningCycle: params.planningCycle,
      activity: params.activity,
    });

    const rows: PlanningTableRow[] = groups.map(g => {
      const pastActuals: Record<string, number> = {};
      const opportunity: Record<string, number> = {};
      const actualFcst: Record<string, number> = {};
      const risk: Record<string, number> = {};

      activePeriods.forEach((p, pIdx) => {
        if (pIdx < currentPeriodIndex) {
          pastActuals[p.label] = g.periodActuals[p.label] || 0;
        } else {
          actualFcst[p.label] = g.periodForecast[p.label] || 0;
          opportunity[p.label] = g.periodOpportunity[p.label] || 0;
          risk[p.label] = g.periodRisk[p.label] || 0;
        }
      });

      const sample = g.items[0] as any;

      const row: PlanningTableRow = {
        id: `row_${g.id}`,
        category: sample?.category,
        sop: sample?.sop,
        brand: sample?.brand,
        forecastGroup: sample?.forecastGroup,
        forecastUnit: sample?.forecastUnit,
        customerGroup: params.apg || 'All',
        customer: params.apg || 'All',
        apg: params.apg || 'All',
        unitsPerCase: sample?.unitsPerCase || 12,
        price: sample?.price || 100,
        pastActuals,
        definitions: { opportunity, actualFcst, risk },
      };
      return row;
    });

    return {
      period: activePeriods.map(p => p.label),
      currentMonthIndex: currentPeriodIndex,
      level: mapProductLevel(level),
      productLevelNum: level,
      rows,
    };
  }

  async desegregate(scope?: string, params: { timeGrain?: string; measure?: string; from?: string; to?: string; planningCycle?: string; activity?: string } = {}): Promise<TableResponse> {
    return this.getTable({ productLevel: 5, scope, ...params });
  }
}

export const tableRepository = new TableRepository();
