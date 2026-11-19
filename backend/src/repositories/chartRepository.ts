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

    const cycleA = params.planningCycle || 'Current cycle';
    const compareTo = params.compareTo;

    if (compareTo) {
      const isBActuals = compareTo.toLowerCase().includes('actual');
      const groupsA = aggregate({
        ...params,
        level: 5,
        planningCycle: cycleA,
        pureForecast: true,
      });
      const groupsB = aggregate({
        ...params,
        level: 5,
        planningCycle: compareTo,
        pureForecast: true,
      });

      const points = activePeriods.map((p, pIdx) => {
        let valA = 0;
        let oppA = 0;
        let riskA = 0;
        let valB: number | null = 0;

        for (const g of groupsA) {
          valA += g.periodForecast[p.label] || 0;
          oppA += g.periodOpportunity[p.label] || 0;
          riskA += g.periodRisk[p.label] || 0;
        }

        if (isBActuals) {
          if (pIdx < currentPeriodIndex) {
            let sumB = 0;
            for (const g of groupsB) {
              sumB += g.periodForecast[p.label] || 0;
            }
            valB = sumB;
          } else {
            valB = null; // Actuals past periods only
          }
        } else {
          let sumB = 0;
          for (const g of groupsB) {
            sumB += g.periodForecast[p.label] || 0;
          }
          valB = sumB;
        }

        const rValA = Math.round(valA);
        const rValB = valB !== null ? Math.round(valB) : null;
        const delta = rValB !== null ? Math.round(rValB - rValA) : null;

        return {
          time: p.label,
          forecast: rValA,
          worstCase: Math.round(valA + riskA),
          bestCase: Math.round(valA + oppA),
          seriesA: rValA,
          seriesB: rValB,
          delta,
          aName: cycleA,
          bName: compareTo,
        };
      });

      return { points, compareTo, cycleA };
    }

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
    const availableCustomerGroups = ['Modern trade', 'General trade', 'E-commerce', 'Quick commerce'];
    const hasChild = level < 5;
    const levelStr: ProductLevel = level <= 3 ? 'brand' : 'product';

    const cycleA = params.planningCycle || 'Current cycle';
    const compareTo = params.compareTo;

    if (compareTo) {
      const isActuals = compareTo.toLowerCase().includes('actual');
      const groupsA = aggregate({
        ...params,
        level,
        planningCycle: cycleA,
        pureForecast: true,
        pastPeriodsOnly: isActuals,
      });
      const groupsB = aggregate({
        ...params,
        level,
        planningCycle: compareTo,
        pureForecast: true,
        pastPeriodsOnly: isActuals,
      });

      const bMap = new Map(groupsB.map(g => [g.id, g]));

      const items: StackedBarItem[] = groupsA.map(gA => {
        const gB = bMap.get(gA.id);
        const totA = gA.totalForecast;
        const totB = gB ? gB.totalForecast : 0;
        const delta = totB - totA;

        return {
          id: gA.id,
          category: gA.name,
          hasDrillDown: hasChild,
          segments: { ...gA.apgForecast },
          total: totA,
          seriesA: totA,
          seriesB: totB,
          delta,
          segmentsA: { ...gA.apgForecast },
          segmentsB: { ...(gB?.apgForecast || {}) },
        };
      });

      return {
        level: levelStr,
        items,
        availableCustomerGroups,
        compareTo,
        cycleA,
      };
    }

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

    const items: StackedBarItem[] = groups.map(g => ({
      id: g.id,
      category: g.name,
      hasDrillDown: hasChild,
      segments: { ...g.apgForecast },
      total: g.totalForecast,
    }));

    return {
      level: levelStr,
      items,
      availableCustomerGroups,
    };
  }

  async getWaterfall(params: DataQueryParams = {}): Promise<WaterfallResponse> {
    const cycleA = params.planningCycle || 'Current cycle';
    const compareTo = params.compareTo;

    if (compareTo) {
      const isActuals = compareTo.toLowerCase().includes('actual');
      const groupsA = aggregate({
        ...params,
        level: 5,
        planningCycle: cycleA,
        pureForecast: true,
        pastPeriodsOnly: isActuals,
      });
      const groupsB = aggregate({
        ...params,
        level: 5,
        planningCycle: compareTo,
        pureForecast: true,
        pastPeriodsOnly: isActuals,
      });

      const totalA = groupsA.reduce((s, g) => s + g.totalForecast, 0);
      const totalB = groupsB.reduce((s, g) => s + g.totalForecast, 0);

      const baseA = Math.round(totalA * 0.88);
      const ddA = Math.round(totalA * 0.098);
      const maA = totalA - baseA - ddA;

      const baseB = Math.round(totalB * 0.88);
      const ddB = Math.round(totalB * 0.098);
      const maB = totalB - baseB - ddB;

      const baseChange = baseB - baseA;
      const ddChange = ddB - ddA;
      const maChange = maB - maA;

      const steps: WaterfallStep[] = [
        {
          name: `Forecast ${cycleA}`,
          value: totalA,
          type: 'total',
          topDrivers: [
            { name: 'Core volume base', value: Math.round(totalA * 0.55) },
            { name: 'Channel promotion volume', value: Math.round(totalA * 0.28) },
            { name: 'Innovation uplift', value: totalA - Math.round(totalA * 0.55) - Math.round(totalA * 0.28) },
          ],
        },
        {
          name: 'Baseline change',
          value: baseChange,
          type: baseChange >= 0 ? 'increase' : 'decrease',
          topDrivers: [
            { name: 'Trend momentum revision', value: Math.round(baseChange * 0.52) },
            { name: 'Base run-rate restatement', value: Math.round(baseChange * 0.28) },
            { name: 'Distribution reset', value: baseChange - Math.round(baseChange * 0.52) - Math.round(baseChange * 0.28) },
          ],
        },
        {
          name: 'Demand drivers change',
          value: ddChange,
          type: ddChange >= 0 ? 'increase' : 'decrease',
          topDrivers: [
            { name: 'Festive promo', value: Math.round(ddChange * 0.58) },
            { name: 'Media blitz', value: Math.round(ddChange * 0.26) },
            { name: 'Price increase', value: ddChange - Math.round(ddChange * 0.58) - Math.round(ddChange * 0.26) },
          ],
        },
        {
          name: 'Manual adjustment change',
          value: maChange,
          type: maChange >= 0 ? 'increase' : 'decrease',
          topDrivers: [
            { name: 'Supply quota realignment', value: Math.round(maChange * 0.5) },
            { name: 'Regional buffer revision', value: Math.round(maChange * 0.3) },
            { name: 'Key account override', value: maChange - Math.round(maChange * 0.5) - Math.round(maChange * 0.3) },
          ],
        },
        {
          name: `Forecast ${compareTo}`,
          value: totalB,
          type: 'total',
          topDrivers: [
            { name: 'Core volume base', value: Math.round(totalB * 0.55) },
            { name: 'Channel promotion volume', value: Math.round(totalB * 0.28) },
            { name: 'Innovation uplift', value: totalB - Math.round(totalB * 0.55) - Math.round(totalB * 0.28) },
          ],
        },
      ];

      return { steps, compareTo, cycleA };
    }

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

    const totalScope = groups.reduce((s, g) => s + g.totalForecast, 0);

    const baseline = Math.round(totalScope * 0.88);
    const demandDrivers = Math.round(totalScope * 0.098);
    const manualAdjustment = totalScope - baseline - demandDrivers;
    const finalForecast = totalScope;

    const steps: WaterfallStep[] = [
      {
        name: 'Baseline',
        value: baseline,
        type: 'total',
        topDrivers: [
          { name: 'Core run-rate', value: Math.round(baseline * 0.62) },
          { name: 'Distribution reach', value: Math.round(baseline * 0.24) },
          { name: 'Organic category trend', value: baseline - Math.round(baseline * 0.62) - Math.round(baseline * 0.24) },
        ],
      },
      {
        name: 'Demand drivers',
        value: demandDrivers,
        type: 'increase',
        topDrivers: [
          { name: 'Festive promo', value: Math.round(demandDrivers * 0.55) },
          { name: 'Media blitz', value: Math.round(demandDrivers * 0.30) },
          { name: 'Price increase', value: demandDrivers - Math.round(demandDrivers * 0.55) - Math.round(demandDrivers * 0.30) },
        ],
      },
      {
        name: 'Manual adjustment',
        value: manualAdjustment,
        type: manualAdjustment >= 0 ? 'increase' : 'decrease',
        topDrivers: [
          { name: 'Supply constraint', value: -Math.round(Math.abs(manualAdjustment) * 0.45) },
          { name: 'Regional distributor push', value: Math.round(Math.abs(manualAdjustment) * 0.85) },
          { name: 'Inventory buffer', value: manualAdjustment - (-Math.round(Math.abs(manualAdjustment) * 0.45)) - Math.round(Math.abs(manualAdjustment) * 0.85) },
        ],
      },
      {
        name: 'Final forecast',
        value: finalForecast,
        type: 'total',
        topDrivers: [
          { name: 'Beauty & Wellbeing', value: Math.round(finalForecast * 0.42) },
          { name: 'Personal Care', value: Math.round(finalForecast * 0.35) },
          { name: 'Home Care & Foods', value: finalForecast - Math.round(finalForecast * 0.42) - Math.round(finalForecast * 0.35) },
        ],
      },
    ];
    return { steps };
  }

  async getTreemap(params: DataQueryParams = {}): Promise<TreemapResponse> {
    const level = resolveProductLevel(params);
    const levelStr: ProductLevel = level <= 3 ? 'brand' : 'product';
    const cycleA = params.planningCycle || 'Current cycle';
    const compareTo = params.compareTo;

    if (compareTo) {
      const isActuals = compareTo.toLowerCase().includes('actual');
      if (level === 1) {
        const groupsA = aggregate({
          ...params,
          level: 1,
          planningCycle: cycleA,
          pureForecast: true,
          pastPeriodsOnly: isActuals,
        });
        const groupsB = aggregate({
          ...params,
          level: 1,
          planningCycle: compareTo,
          pureForecast: true,
          pastPeriodsOnly: isActuals,
        });

        const aMap = new Map(groupsA.map(g => [g.id, g]));

        const data: TreemapNode[] = groupsB
          .filter(gB => gB.totalForecast > 0)
          .map(gB => {
            const gA = aMap.get(gB.id);
            const valB = Math.round(gB.totalForecast);
            const valA = gA ? Math.round(gA.totalForecast) : 0;
            const delta = valB - valA;
            const pctChange = valA > 0 ? +(((valB - valA) / valA) * 100).toFixed(1) : 0;
            return {
              id: gB.id,
              name: gB.name,
              value: valB,
              valueA: valA,
              valueB: valB,
              delta,
              pctChange,
            };
          });

        return { level: levelStr, data, compareTo, cycleA };
      }

      const parentLevel = level - 1;
      const parentGroupsA = aggregate({
        ...params,
        level: parentLevel,
        planningCycle: cycleA,
        pureForecast: true,
        pastPeriodsOnly: isActuals,
      });
      const parentGroupsB = aggregate({
        ...params,
        level: parentLevel,
        planningCycle: compareTo,
        pureForecast: true,
        pastPeriodsOnly: isActuals,
      });
      const groupsA = aggregate({
        ...params,
        level,
        planningCycle: cycleA,
        pureForecast: true,
        pastPeriodsOnly: isActuals,
      });
      const groupsB = aggregate({
        ...params,
        level,
        planningCycle: compareTo,
        pureForecast: true,
        pastPeriodsOnly: isActuals,
      });

      const parentMapB = new Map<string, typeof parentGroupsB[0]>();
      for (const pg of parentGroupsB) {
        parentMapB.set(pg.id, pg);
      }
      const aMap = new Map(groupsA.map(g => [g.id, g]));

      const childrenByParent = new Map<string, TreemapNode[]>();
      for (const tgB of groupsB) {
        if (tgB.totalForecast <= 0) continue;
        const pid = tgB.parentId as string;
        if (!pid) continue;
        if (!childrenByParent.has(pid)) {
          childrenByParent.set(pid, []);
        }
        const tgA = aMap.get(tgB.id);
        const valB = Math.round(tgB.totalForecast);
        const valA = tgA ? Math.round(tgA.totalForecast) : 0;
        const delta = valB - valA;
        const pctChange = valA > 0 ? +(((valB - valA) / valA) * 100).toFixed(1) : 0;

        childrenByParent.get(pid)!.push({
          id: tgB.id,
          name: tgB.name,
          value: valB,
          valueA: valA,
          valueB: valB,
          delta,
          pctChange,
          parentId: pid,
          parentName: parentMapB.get(pid)?.name || '',
        });
      }

      const data: TreemapNode[] = [];
      for (const pgB of parentGroupsB) {
        const children = childrenByParent.get(pgB.id);
        if (!children || children.length === 0) continue;
        const parentTotalB = children.reduce((sum, c) => sum + (c.value || 0), 0);
        const parentTotalA = children.reduce((sum, c) => sum + (c.valueA || 0), 0);
        const parentDelta = parentTotalB - parentTotalA;
        const parentPct = parentTotalA > 0 ? +(((parentTotalB - parentTotalA) / parentTotalA) * 100).toFixed(1) : 0;

        data.push({
          id: pgB.id,
          name: pgB.name,
          value: parentTotalB,
          valueA: parentTotalA,
          valueB: parentTotalB,
          delta: parentDelta,
          pctChange: parentPct,
          children,
        });
      }

      return { level: levelStr, data, compareTo, cycleA };
    }

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
