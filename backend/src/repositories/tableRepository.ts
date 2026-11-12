import masterData from '../data/masterData.json';
import { TableResponse, ProductLevel, PlanningTableRow } from '../types';

export class TableRepository {
  async getTable(params: {
    level?: ProductLevel;
    parent?: string;
    filters?: any;
  }): Promise<TableResponse> {
    const level: ProductLevel = params.level || 'brand';
    let rawItems = masterData.items as any[];

    if (params.parent) {
      rawItems = rawItems.filter((it) => it.brand === params.parent);
    }

    if (level === 'product') {
      const rows: PlanningTableRow[] = rawItems.map((it) => ({
        id: it.id,
        category: it.category,
        brand: it.brand,
        product: it.product,
        customerGroup: it.customerGroup,
        customer: it.customer,
        pastActuals: it.pastActuals,
        definitions: it.definitions,
      }));

      return {
        period: masterData.months,
        currentMonthIndex: masterData.currentMonthIndex,
        level: 'product',
        rows,
      };
    }

    // Brand level: Group by Brand × CustomerGroup × Customer
    const brandMap: Record<string, PlanningTableRow> = {};
    rawItems.forEach((it) => {
      const groupKey = `${it.category}_${it.brand}_${it.customerGroup}_${it.customer}`;
      if (!brandMap[groupKey]) {
        brandMap[groupKey] = {
          id: `b_${groupKey}`,
          category: it.category,
          brand: it.brand,
          customerGroup: it.customerGroup,
          customer: it.customer,
          pastActuals: {},
          definitions: {
            opportunity: {},
            actualFcst: {},
            risk: {},
          },
        };
      }

      const row = brandMap[groupKey];
      masterData.months.forEach((m: string, idx: number) => {
        if (idx < masterData.currentMonthIndex) {
          row.pastActuals[m] = (row.pastActuals[m] || 0) + (it.pastActuals[m] || 0);
        } else {
          row.definitions.actualFcst[m] =
            (row.definitions.actualFcst[m] || 0) + (it.definitions.actualFcst[m] || 0);
          row.definitions.opportunity[m] =
            (row.definitions.opportunity[m] || 0) + (it.definitions.opportunity[m] || 0);
          row.definitions.risk[m] =
            (row.definitions.risk[m] || 0) + (it.definitions.risk[m] || 0);
        }
      });
    });

    const rows = Object.values(brandMap);

    return {
      period: masterData.months,
      currentMonthIndex: masterData.currentMonthIndex,
      level: 'brand',
      rows,
    };
  }

  async desegregate(parentBrand?: string): Promise<TableResponse> {
    let rawItems = masterData.items as any[];
    if (parentBrand) {
      rawItems = rawItems.filter((it) => it.brand === parentBrand);
    }

    const rows: PlanningTableRow[] = rawItems.map((it) => {
      const diffs: Record<string, Record<string, number>> = {
        opportunity: {
          'Jun 2026': 250,
          'Jul 2026': -150,
          'Aug 2026': 300,
        },
        actualFcst: {
          'Jun 2026': 1100,
          'Jul 2026': -750,
          'Aug 2026': 1350,
        },
        risk: {
          'Jun 2026': -180,
          'Jul 2026': 220,
          'Aug 2026': -90,
        },
      };

      return {
        id: it.id,
        category: it.category,
        brand: it.brand,
        product: it.product,
        customerGroup: it.customerGroup,
        customer: it.customer,
        pastActuals: it.pastActuals,
        definitions: it.definitions,
        diffs,
      };
    });

    return {
      period: masterData.months,
      currentMonthIndex: masterData.currentMonthIndex,
      level: 'product',
      rows,
    };
  }
}

export const tableRepository = new TableRepository();
