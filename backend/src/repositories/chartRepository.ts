import { aggregate } from '../utils/aggregate';
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
    const groups = aggregate({ scope: params.scope, apg: params.apg, level: 5 });

    const months = masterData.months as string[];
    const points = months.map((m, mIdx) => {
      let forecast = 0, opp = 0, risk = 0;
      for (const g of groups) {
        if (mIdx < masterData.currentMonthIndex) {
          forecast += g.monthlyActuals[m] || 0;
        } else {
          forecast += g.monthlyForecast[m] || 0;
          opp      += g.monthlyOpportunity[m] || 0;
          risk     += g.monthlyRisk[m] || 0;
        }
      }
      return {
        time: m,
        forecast,
        worstCase: Math.round(forecast + (mIdx < masterData.currentMonthIndex ? 0 : risk)),
        bestCase:  Math.round(forecast + (mIdx < masterData.currentMonthIndex ? 0 : opp)),
      };
    });
    return { points };
  }

  async getStackedBar(params: DataQueryParams = {}): Promise<StackedBarResponse> {
    const level = resolveProductLevel(params);
    const groups = aggregate({ scope: params.scope, apg: params.apg, level });
    const availableCustomerGroups = ['Modern Trade', 'General Trade', 'E-commerce', 'Quick Commerce'];

    const childLevel = Math.min(level + 1, 5);
    const hasChild = level < 5;

    // For each group, also aggregate by APG to get segments
    const items: StackedBarItem[] = groups.map(g => {
      const scopeForGroup = g.id;
      const apgGroups = aggregate({ scope: scopeForGroup, level: 5 });
      const segments: Record<string, number> = {};
      for (const ag of apgGroups) {
        for (const item of ag.items) {
          const seg = item.apg as string;
          segments[seg] = (segments[seg] || 0) + ag.totalForecast / ag.items.length;
        }
      }
      // Simpler: group items by apg directly
      const segMap: Record<string, number> = {};
      for (const item of g.items) {
        const months = masterData.months as string[];
        let v = 0;
        for (const m of months) {
          const mIdx = months.indexOf(m);
          if (mIdx < masterData.currentMonthIndex) {
            v += (item as any).pastActuals[m] || 0;
          } else {
            v += (item as any).definitions.actualFcst[m] || 0;
          }
        }
        segMap[(item as any).apg] = (segMap[(item as any).apg] || 0) + v;
      }

      return {
        category: g.name,
        hasDrillDown: hasChild,
        segments: segMap,
        total: g.totalForecast,
      };
    });

    // Map numeric level to old ProductLevel for backward compat
    const levelStr: ProductLevel = level <= 3 ? 'brand' : 'product';

    return {
      level: levelStr,
      items,
      availableCustomerGroups,
    };
  }

  async getWaterfall(params: DataQueryParams = {}): Promise<WaterfallResponse> {
    const groups = aggregate({ scope: params.scope, apg: params.apg, level: 5 });
    const allGroups = aggregate({ level: 5 });

    const totalAll = allGroups.reduce((s, g) => s + g.totalForecast, 0);
    const totalScope = groups.reduce((s, g) => s + g.totalForecast, 0);
    const share = totalAll > 0 ? totalScope / totalAll : 1;

    const baseline         = Math.round(masterData.targets.baseline * share);
    const demandDrivers    = Math.round(masterData.targets.demandDrivers * share);
    const manualAdjustment = Math.round(masterData.targets.manualAdjustment * share);
    const finalForecast    = baseline + demandDrivers + manualAdjustment;

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
    const groups = aggregate({ scope: params.scope, apg: params.apg, level });

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

    // Build nested by grouping level+1 children under each group
    const childGroups = aggregate({ scope: params.scope, apg: params.apg, level: level + 1 });
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
