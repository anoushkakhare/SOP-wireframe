import masterData from '../data/masterData.json';
import {
  ForecastLineResponse,
  StackedBarResponse,
  StackedBarItem,
  WaterfallResponse,
  WaterfallStep,
  TreemapResponse,
  TreemapNode,
  ProductLevel,
} from '../types';

const BRAND_INDIGO_COLORS: Record<string, string> = {
  'Dove': '#0F0E9A',
  "Pond's": '#2B2AB0',
  'Vaseline': '#4F4EC6',
  'Sunsilk': '#7A79D6',
  'Surf Excel': '#0F0E9A',
  'Comfort': '#2B2AB0',
  'Domestos': '#4F4EC6',
  'Lux': '#2B2AB0',
  'Lifebuoy': '#4F4EC6',
  'Rexona': '#7A79D6',
  'Closeup': '#A3A2E2',
  'Knorr': '#0F0E9A',
  "Hellmann's": '#2B2AB0',
  'Brooke Bond': '#4F4EC6',
  'Lipton': '#7A79D6',
};

export class ChartRepository {
  async getForecastLine(parent?: string): Promise<ForecastLineResponse> {
    let items = masterData.items as any[];
    if (parent) {
      items = items.filter((it) => it.brand === parent);
    }

    const points = masterData.months.map((m: string, mIdx: number) => {
      let forecast = 0;
      let opp = 0;
      let risk = 0;

      items.forEach((it) => {
        if (mIdx < masterData.currentMonthIndex) {
          forecast += it.pastActuals[m] || 0;
        } else {
          forecast += it.definitions.actualFcst[m] || 0;
          opp += it.definitions.opportunity[m] || 0;
          risk += it.definitions.risk[m] || 0;
        }
      });

      // Best case & worst case bounds
      const worstCase = Math.round(forecast + (mIdx < masterData.currentMonthIndex ? 0 : risk));
      const bestCase = Math.round(forecast + (mIdx < masterData.currentMonthIndex ? 0 : opp));

      return {
        time: m,
        forecast,
        worstCase,
        bestCase,
      };
    });

    return { points };
  }

  async getStackedBar(level: ProductLevel = 'brand', parent?: string): Promise<StackedBarResponse> {
    let items = masterData.items as any[];
    const availableCustomerGroups = ['Modern trade', 'General trade', 'E-commerce', 'Quick commerce'];

    if (level === 'product') {
      if (parent) {
        items = items.filter((it) => it.brand === parent);
      }

      // Group by product
      const productMap: Record<string, { total: number; segments: Record<string, number> }> = {};
      items.forEach((it) => {
        if (!productMap[it.product]) {
          productMap[it.product] = { total: 0, segments: {} };
        }
        let itemTotal = 0;
        masterData.months.forEach((m: string, idx: number) => {
          itemTotal += idx < masterData.currentMonthIndex ? it.pastActuals[m] : it.definitions.actualFcst[m];
        });

        productMap[it.product].segments[it.customerGroup] =
          (productMap[it.product].segments[it.customerGroup] || 0) + itemTotal;
        productMap[it.product].total += itemTotal;
      });

      const barItems: StackedBarItem[] = Object.entries(productMap).map(([prodName, data]) => ({
        category: prodName,
        hasDrillDown: false,
        segments: data.segments,
        total: data.total,
      }));

      return {
        level: 'product',
        parent,
        items: barItems,
        availableCustomerGroups,
      };
    }

    // Level === 'brand'
    const brandMap: Record<string, { total: number; segments: Record<string, number> }> = {};
    items.forEach((it) => {
      if (!brandMap[it.brand]) {
        brandMap[it.brand] = { total: 0, segments: {} };
      }
      let itemTotal = 0;
      masterData.months.forEach((m: string, idx: number) => {
        itemTotal += idx < masterData.currentMonthIndex ? it.pastActuals[m] : it.definitions.actualFcst[m];
      });

      brandMap[it.brand].segments[it.customerGroup] =
        (brandMap[it.brand].segments[it.customerGroup] || 0) + itemTotal;
      brandMap[it.brand].total += itemTotal;
    });

    const barItems: StackedBarItem[] = Object.entries(brandMap).map(([brandName, data]) => ({
      category: brandName,
      hasDrillDown: true,
      segments: data.segments,
      total: data.total,
    }));

    return {
      level: 'brand',
      items: barItems,
      availableCustomerGroups,
    };
  }

  async getWaterfall(parent?: string): Promise<WaterfallResponse> {
    let items = masterData.items as any[];
    let parentShare = 1.0;

    if (parent) {
      const parentItems = items.filter((it) => it.brand === parent);
      let totalAll = 0;
      let totalParent = 0;
      items.forEach((it) => {
        masterData.months.forEach((m: string, idx: number) => {
          const val = idx < masterData.currentMonthIndex ? it.pastActuals[m] : it.definitions.actualFcst[m];
          totalAll += val;
        });
      });
      parentItems.forEach((it) => {
        masterData.months.forEach((m: string, idx: number) => {
          const val = idx < masterData.currentMonthIndex ? it.pastActuals[m] : it.definitions.actualFcst[m];
          totalParent += val;
        });
      });
      parentShare = totalAll > 0 ? totalParent / totalAll : 0.2;
    }

    const baseline = Math.round(masterData.targets.baseline * parentShare);
    const demandDrivers = Math.round(masterData.targets.demandDrivers * parentShare);
    const manualAdjustment = Math.round(masterData.targets.manualAdjustment * parentShare);
    const finalForecast = baseline + demandDrivers + manualAdjustment;

    const steps: WaterfallStep[] = [
      { name: 'Baseline', value: baseline, type: 'total' },
      { name: 'Demand drivers', value: demandDrivers, type: 'increase' },
      { name: 'Manual adjustment', value: manualAdjustment, type: 'increase' },
      { name: 'Final forecast', value: finalForecast, type: 'total' },
    ];

    return { steps };
  }

  async getTreemap(level: ProductLevel = 'brand'): Promise<TreemapResponse> {
    const items = masterData.items as any[];

    if (level === 'product') {
      const flatNodes: TreemapNode[] = items.map((it, idx) => {
        let val = 0;
        masterData.months.forEach((m: string, mIdx: number) => {
          val += mIdx < masterData.currentMonthIndex ? it.pastActuals[m] : it.definitions.actualFcst[m];
        });
        const color = BRAND_INDIGO_COLORS[it.brand] || (idx % 2 === 0 ? '#4F4EC6' : '#7A79D6');
        return {
          name: it.product,
          value: val,
          brand: it.brand,
          color,
        };
      });

      return {
        level: 'product',
        data: flatNodes,
      };
    }

    // Level === 'brand'
    const brandGroups: Record<string, any[]> = {};
    items.forEach((it) => {
      if (!brandGroups[it.brand]) {
        brandGroups[it.brand] = [];
      }
      let val = 0;
      masterData.months.forEach((m: string, mIdx: number) => {
        val += mIdx < masterData.currentMonthIndex ? it.pastActuals[m] : it.definitions.actualFcst[m];
      });
      brandGroups[it.brand].push({
        name: it.product,
        value: val,
        brand: it.brand,
        color: BRAND_INDIGO_COLORS[it.brand] || '#4F4EC6',
      });
    });

    const brandNodes: TreemapNode[] = Object.entries(brandGroups).map(([brandName, children]) => ({
      name: brandName,
      brand: brandName,
      color: BRAND_INDIGO_COLORS[brandName] || '#0F0E9A',
      children,
    }));

    return {
      level: 'brand',
      data: brandNodes,
    };
  }
}

export const chartRepository = new ChartRepository();
