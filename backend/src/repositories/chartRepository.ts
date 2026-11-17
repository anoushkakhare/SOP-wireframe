import { aggregate, getPeriodsForGrain } from '../utils/aggregate';
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
  DataQueryParams,
} from '../types';
import { LEVELS } from '../constants/hierarchy';

const LEVEL_COLORS: Record<number, string> = Object.fromEntries(
  LEVELS.map(l => [l.id, l.color])
);

function resolveProductLevel(params: DataQueryParams): number {
  if (params.productLevel) return params.productLevel;
  return 3; // default brand
}

export class ChartRepository {
  async getForecastLine(params: DataQueryParams = {}): Promise<ForecastLineResponse> {
    const { activePeriods, currentPeriodIndex } = getPeriodsForGrain(
      params.timeGrain as string,
      params.from,
      params.to
    );

    const groups = aggregate({
      scope: params.scope,
      apg: params.apg,
      level: 5,
      timeGrain: params.timeGrain as string,
      measure: params.measure,
      from: params.from,
      to: params.to,
    });

    const points = activePeriods.map((p, pIdx) => {
      let forecast = 0, opp = 0, risk = 0;
      for (const g of groups) {
        if (pIdx < currentPeriodIndex) {
          forecast += g.periodActuals[p.label] || 0;
        } else {
          forecast += g.periodForecast[p.label] || 0;
          opp      += g.periodOpportunity[p.label] || 0;
          risk     += g.periodRisk[p.label] || 0;
        }
      }
      return {
        time: p.label,
        forecast: Math.round(forecast),
        worstCase: Math.round(forecast + (pIdx < currentPeriodIndex ? 0 : risk)),
        bestCase:  Math.round(forecast + (pIdx < currentPeriodIndex ? 0 : opp)),
      };
    });
    return { points };
  }

  async getStackedBar(params: DataQueryParams = {}): Promise<StackedBarResponse> {
    const level = resolveProductLevel(params);
    const groups = aggregate({
      scope: params.scope,
      apg: params.apg,
      level,
      timeGrain: params.timeGrain as string,
      measure: params.measure,
      from: params.from,
      to: params.to,
    });
    const availableCustomerGroups = ['Modern Trade', 'General Trade', 'E-commerce', 'Quick Commerce'];

    const hasChild = level < 5;

    const items: StackedBarItem[] = groups.map(g => {
      const segMap: Record<string, number> = {};
      for (const item of g.items) {
        // Aggregate across this item's contribution
        const itemGroups = aggregate({
          scope: item.fuId,
          level: 5,
          timeGrain: params.timeGrain as string,
          measure: params.measure,
          from: params.from,
          to: params.to,
        });
        const itemTotal = itemGroups.reduce((s, ig) => s + ig.totalForecast, 0);
        segMap[item.apg] = (segMap[item.apg] || 0) + itemTotal;
      }

      for (const k of Object.keys(segMap)) {
        segMap[k] = Math.round(segMap[k]);
      }

      return {
        category: g.name,
        hasDrillDown: hasChild,
        segments: segMap,
        total: Math.round(g.totalForecast),
      };
    });

    const levelStr: ProductLevel = level <= 3 ? 'brand' : 'product';

    return {
      level: levelStr,
      items,
      availableCustomerGroups,
    };
  }

  async getWaterfall(params: DataQueryParams = {}): Promise<WaterfallResponse> {
    const groups = aggregate({
      scope: params.scope,
      apg: params.apg,
      level: 5,
      timeGrain: params.timeGrain as string,
      measure: params.measure,
      from: params.from,
      to: params.to,
    });
    const allGroups = aggregate({
      level: 5,
      timeGrain: params.timeGrain as string,
      measure: params.measure,
      from: params.from,
      to: params.to,
    });

    const totalAll = allGroups.reduce((s, g) => s + g.totalForecast, 0);
    const totalScope = groups.reduce((s, g) => s + g.totalForecast, 0);
    const share = totalAll > 0 ? totalScope / totalAll : 1;

    const baseline         = Math.round(totalScope * 0.88);
    const demandDrivers    = Math.round(totalScope * 0.098);
    const manualAdjustment = totalScope - baseline - demandDrivers;
    const finalForecast    = totalScope;

    const steps: WaterfallStep[] = [
      { name: 'Baseline',           value: baseline,         type: 'total'    },
      { name: 'Demand drivers',     value: demandDrivers,    type: 'increase' },
      { name: 'Manual adjustment',  value: manualAdjustment, type: 'increase' },
      { name: 'Final forecast',     value: finalForecast,    type: 'total'    },
    ];
    return { steps };
  }

  async getTreemap(params: DataQueryParams = {}): Promise<TreemapResponse> {
    const level = resolveProductLevel(params);
    const groups = aggregate({
      scope: params.scope,
      apg: params.apg,
      level,
      timeGrain: params.timeGrain as string,
      measure: params.measure,
      from: params.from,
      to: params.to,
    });

    const color = LEVEL_COLORS[level] || '#0F0E9A';
    const levelStr: ProductLevel = level <= 3 ? 'brand' : 'product';

    if (level >= 4) {
      const nodes: TreemapNode[] = groups.map(g => ({
        name:  g.name,
        value: Math.round(g.totalForecast),
        brand: g.name,
        color,
      }));
      return { level: levelStr, data: nodes };
    }

    const childGroups = aggregate({
      scope: params.scope,
      apg: params.apg,
      level: level + 1,
      timeGrain: params.timeGrain as string,
      measure: params.measure,
      from: params.from,
      to: params.to,
    });
    const parentMap: Record<string, TreemapNode[]> = {};
    for (const cg of childGroups) {
      const pid = cg.parentId as string | null;
      if (!pid) continue;
      (parentMap[pid] ||= []).push({
        name:  cg.name,
        value: Math.round(cg.totalForecast),
        brand: cg.name,
        color: LEVEL_COLORS[level + 1] || color,
      });
    }

    const data: TreemapNode[] = groups.map(g => ({
      name:     g.name,
      brand:    g.name,
      color,
      children: parentMap[g.id] || [],
    }));

    return { level: levelStr, data };
  }
}

export const chartRepository = new ChartRepository();
