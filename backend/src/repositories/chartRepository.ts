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
      planningCycle: params.planningCycle,
      activity: params.activity,
    });

    const points = activePeriods.map((p, pIdx) => {
      let forecast = 0, opp = 0, risk = 0;
      for (const g of groups) {
        if (pIdx < currentPeriodIndex) {
          forecast += g.periodActuals[p.label] || 0;
        } else {
          forecast += g.periodForecast[p.label] || 0;
          opp += g.periodOpportunity[p.label] || 0;
          risk += g.periodRisk[p.label] || 0;
        }
      }
      return {
        time: p.label,
        forecast: Math.round(forecast),
        worstCase: Math.round(forecast + (pIdx < currentPeriodIndex ? 0 : risk)),
        bestCase: Math.round(forecast + (pIdx < currentPeriodIndex ? 0 : opp)),
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
      planningCycle: params.planningCycle,
      activity: params.activity,
    });
    const availableCustomerGroups = ['Modern trade', 'General trade', 'E-commerce', 'Quick commerce'];

    const hasChild = level < 5;

    const items: StackedBarItem[] = groups.map(g => ({
      id: g.id,
      category: g.name,
      hasDrillDown: hasChild,
      segments: { ...g.apgForecast },
      total: g.totalForecast,
    }));

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
      planningCycle: params.planningCycle,
      activity: params.activity,
    });
    const allGroups = aggregate({
      level: 5,
      timeGrain: params.timeGrain as string,
      measure: params.measure,
      from: params.from,
      to: params.to,
      planningCycle: params.planningCycle,
      activity: params.activity,
    });

    const totalAll = allGroups.reduce((s, g) => s + g.totalForecast, 0);
    const totalScope = groups.reduce((s, g) => s + g.totalForecast, 0);
    const share = totalAll > 0 ? totalScope / totalAll : 1;

    const baseline = Math.round(totalScope * 0.88);
    const demandDrivers = Math.round(totalScope * 0.098);
    const manualAdjustment = totalScope - baseline - demandDrivers;
    const finalForecast = totalScope;

    const steps: WaterfallStep[] = [
      { name: 'Baseline', value: baseline, type: 'total' },
      { name: 'Demand drivers', value: demandDrivers, type: 'increase' },
      { name: 'Manual adjustment', value: manualAdjustment, type: 'increase' },
      { name: 'Final forecast', value: finalForecast, type: 'total' },
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
      planningCycle: params.planningCycle,
      activity: params.activity,
    });

    const levelStr: ProductLevel = level <= 3 ? 'brand' : 'product';

    // Level 1 is flat with no band
    if (level === 1) {
      const data: TreemapNode[] = groups
        .filter(g => g.totalForecast > 0)
        .map(g => ({
          id: g.id,
          name: g.name,
          value: Math.round(g.totalForecast),
        }));
      return { level: levelStr, data };
    }

    // Level > 1: Treemap tiles = nodes at the selected productLevel, grouped by their own parent (level-1)
    const parentLevel = level - 1;
    const parentGroups = aggregate({
      scope: params.scope,
      apg: params.apg,
      level: parentLevel,
      timeGrain: params.timeGrain as string,
      measure: params.measure,
      from: params.from,
      to: params.to,
      planningCycle: params.planningCycle,
      activity: params.activity,
    });

    const parentMap = new Map<string, typeof parentGroups[0]>();
    for (const pg of parentGroups) {
      parentMap.set(pg.id, pg);
    }

    // Group tiles by their parentId from masterData nodes hierarchy
    const childrenByParent = new Map<string, TreemapNode[]>();
    for (const tg of groups) {
      if (tg.totalForecast <= 0) continue;
      const pid = tg.parentId as string;
      if (!pid) continue;
      if (!childrenByParent.has(pid)) {
        childrenByParent.set(pid, []);
      }
      childrenByParent.get(pid)!.push({
        id: tg.id,
        name: tg.name,
        value: Math.round(tg.totalForecast),
        parentId: pid,
        parentName: parentMap.get(pid)?.name || '',
      });
    }

    const data: TreemapNode[] = [];
    for (const pg of parentGroups) {
      const children = childrenByParent.get(pg.id);
      if (!children || children.length === 0) continue;
      const parentTotal = children.reduce((sum, c) => sum + (c.value || 0), 0);
      data.push({
        id: pg.id,
        name: pg.name,
        value: parentTotal,
        children,
      });
    }

    return { level: levelStr, data };
  }
}

export const chartRepository = new ChartRepository();
