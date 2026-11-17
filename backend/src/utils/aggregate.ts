/**
 * aggregate.ts – single aggregate() used by all data endpoints.
 * One function ensures KPIs, charts, treemap and table always match.
 */
import masterData from '../data/masterData.json';

export type MasterItem = typeof masterData.items[number];

const TODAY = '2026-11-17';

export interface PeriodInfo {
  label: string;
  start: string;
  end: string;
  isActual: boolean;
  priorYearLabel?: string;
  grain: string;
}

/** Resolve all descendant fuIds for a set of scope node-ids */
function descendantFuIds(scopeIds: Set<string>): Set<string> {
  if (scopeIds.size === 0) return new Set();

  const nodes = masterData.nodes as Array<{ id: string; parentId: string | null; level: number }>;
  const children: Record<string, string[]> = {};
  for (const n of nodes) {
    if (n.parentId) {
      (children[n.parentId] ||= []).push(n.id);
    }
  }

  const result = new Set<string>();
  const queue = [...scopeIds];
  while (queue.length) {
    const cur = queue.shift()!;
    const nodeInfo = nodes.find(n => n.id === cur);
    if (!nodeInfo) continue;
    if (nodeInfo.level === 5) {
      result.add(cur);
    }
    if (children[cur]) queue.push(...children[cur]);
  }
  return result;
}

/** Map a productLevel number to the item field name */
function levelField(level: number): string {
  switch (level) {
    case 1: return 'categoryId';
    case 2: return 'sopId';
    case 3: return 'brandId';
    case 4: return 'fgId';
    case 5: return 'fuId';
    default: return 'categoryId';
  }
}

/** Human-readable field for grouping by level */
function levelNameField(level: number): string {
  switch (level) {
    case 1: return 'category';
    case 2: return 'sop';
    case 3: return 'brand';
    case 4: return 'forecastGroup';
    case 5: return 'forecastUnit';
    default: return 'category';
  }
}

/** Normalize time grain name */
export function normalizeGrain(grain?: string): 'year' | 'half' | 'quarter' | 'month' | 'week' {
  if (!grain) return 'month';
  const g = grain.toLowerCase().trim();
  if (g === 'year') return 'year';
  if (g === 'half' || g === 'half-year' || g === 'half_year') return 'half';
  if (g === 'quarter') return 'quarter';
  if (g === 'month') return 'month';
  if (g === 'week') return 'week';
  return 'month';
}

/** Normalize measure name */
export function normalizeMeasure(measure?: string): 'cases' | 'units' | 'value' {
  if (!measure) return 'units';
  const m = measure.toLowerCase().trim();
  if (m === 'cases') return 'cases';
  if (m === 'value' || m === 'revenue') return 'value';
  return 'units';
}

/** Normalize period label for matching */
export function normalizePeriodLabel(l: string): string {
  return l.replace(/\b2025\b/g, '25').replace(/\b2026\b/g, '26').trim();
}

const MO_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface WeekWeight {
  week: any;
  weight: number;
}

/**
 * Returns period-to-weeks weights using allocation by days.
 * A week that straddles two months/quarters/years is split proportionally by days (d/7).
 */
export function getWeekWeightsForGrain(grainName?: string): Record<string, WeekWeight[]> {
  const norm = normalizeGrain(grainName);
  const weeks = masterData.weeks as any[];
  const result: Record<string, Map<string, { week: any; weight: number }>> = {};

  for (const w of weeks) {
    if (norm === 'week') {
      if (!result[w.wLabel]) result[w.wLabel] = new Map();
      result[w.wLabel].set(w.wLabel, { week: w, weight: 1.0 });
      continue;
    }

    const s = new Date(w.start + 'T00:00:00Z');
    for (let i = 0; i < 7; i++) {
      const cur = new Date(s.getTime() + i * 86400000);
      const yr = cur.getUTCFullYear();
      const yrStr = String(yr).slice(2);
      const mo = cur.getUTCMonth();
      let label = '';
      if (norm === 'month') {
        label = `${MO_NAMES[mo]} ${yrStr}`;
      } else if (norm === 'quarter') {
        label = `Q${Math.floor(mo / 3) + 1} ${yrStr}`;
      } else if (norm === 'half') {
        label = `H${mo < 6 ? 1 : 2} ${yrStr}`;
      } else if (norm === 'year') {
        label = `FY${yrStr}`;
      }

      if (!result[label]) result[label] = new Map();
      const existing = result[label].get(w.wLabel);
      if (existing) {
        existing.weight += 1 / 7;
      } else {
        result[label].set(w.wLabel, { week: w, weight: 1 / 7 });
      }
    }
  }

  const out: Record<string, WeekWeight[]> = {};
  for (const [pLabel, map] of Object.entries(result)) {
    out[pLabel] = Array.from(map.values());
  }
  return out;
}

/** Generate period list for a grain */
export function getPeriodsForGrain(grainName?: string, from?: string, to?: string) {
  const grain = normalizeGrain(grainName);
  const weeks = masterData.weeks as any[];

  const grainFieldMap: Record<string, string> = {
    week: 'wLabel',
    month: 'mLabel',
    quarter: 'qLabel',
    half: 'hLabel',
    year: 'yLabel',
  };
  const grainField = grainFieldMap[grain];

  const map = new Map<string, { label: string; start: string; end: string }>();

  if (grain === 'week') {
    for (const w of weeks) {
      map.set(w.wLabel, { label: w.wLabel, start: w.start, end: w.end });
    }
  } else {
    // Generate chronological periods using day-based calendar
    for (const w of weeks) {
      const s = new Date(w.start + 'T00:00:00Z');
      for (let i = 0; i < 7; i++) {
        const cur = new Date(s.getTime() + i * 86400000);
        const yr = cur.getUTCFullYear();
        const yrStr = String(yr).slice(2);
        const mo = cur.getUTCMonth();
        let label = '';
        if (grain === 'month') label = `${MO_NAMES[mo]} ${yrStr}`;
        else if (grain === 'quarter') label = `Q${Math.floor(mo / 3) + 1} ${yrStr}`;
        else if (grain === 'half') label = `H${mo < 6 ? 1 : 2} ${yrStr}`;
        else if (grain === 'year') label = `FY${yrStr}`;

        const isoDate = cur.toISOString().slice(0, 10);
        if (!map.has(label)) {
          map.set(label, { label, start: isoDate, end: isoDate });
        } else {
          const item = map.get(label)!;
          if (isoDate < item.start) item.start = isoDate;
          if (isoDate > item.end) item.end = isoDate;
        }
      }
    }
  }

  const allPeriods: PeriodInfo[] = Array.from(map.values()).map(p => {
    const prior = p.label.endsWith('26')
      ? p.label.replace(/26$/, '25')
      : undefined;
    return {
      label: p.label,
      start: p.start,
      end: p.end,
      isActual: p.end < TODAY,
      priorYearLabel: prior,
      grain,
    };
  });

  // Default range per grain:
  // Year = all years; Half/Quarter/Month = current FY (2026); Week = current quarter (Q4 26)
  let defaultFrom = allPeriods[0].label;
  let defaultTo = allPeriods[allPeriods.length - 1].label;

  if (grain === 'year') {
    defaultFrom = 'FY25';
    defaultTo = 'FY26';
  } else if (grain === 'half') {
    defaultFrom = 'H1 26';
    defaultTo = 'H2 26';
  } else if (grain === 'quarter') {
    defaultFrom = 'Q1 26';
    defaultTo = 'Q4 26';
  } else if (grain === 'month') {
    defaultFrom = 'Jan 26';
    defaultTo = 'Dec 26';
  } else if (grain === 'week') {
    const q4Weeks = allPeriods.filter(p => {
      const match = weeks.find(w => w.wLabel === p.label);
      return match && match.qLabel === 'Q4 26';
    });
    if (q4Weeks.length > 0) {
      defaultFrom = q4Weeks[0].label;
      defaultTo = q4Weeks[q4Weeks.length - 1].label;
    }
  }

  const normFrom = from ? normalizePeriodLabel(from) : defaultFrom;
  const normTo = to ? normalizePeriodLabel(to) : defaultTo;

  let fromIdx = allPeriods.findIndex(p => p.label === normFrom);
  let toIdx = allPeriods.findIndex(p => p.label === normTo);

  if (fromIdx < 0) fromIdx = allPeriods.findIndex(p => p.label === defaultFrom);
  if (toIdx < 0) toIdx = allPeriods.findIndex(p => p.label === defaultTo);
  if (fromIdx < 0) fromIdx = 0;
  if (toIdx < 0) toIdx = allPeriods.length - 1;
  if (fromIdx > toIdx) [fromIdx, toIdx] = [toIdx, fromIdx];

  // Cap at 104 periods
  if (toIdx - fromIdx + 1 > 104) {
    toIdx = fromIdx + 103;
  }

  const activePeriods = allPeriods.slice(fromIdx, toIdx + 1);
  const firstForecastIdx = activePeriods.findIndex(p => !p.isActual);
  const currentPeriodIndex = firstForecastIdx >= 0 ? firstForecastIdx : activePeriods.length;

  return {
    allPeriods,
    activePeriods,
    currentPeriodIndex,
    defaultFrom,
    defaultTo,
  };
}

export interface AggregateParams {
  scope?: string;
  level?: number;
  apg?: string;
  timeGrain?: string;
  measure?: string;
  from?: string;
  to?: string;
  planningCycle?: string;
  activity?: string;
  pureForecast?: boolean;
  pastPeriodsOnly?: boolean;
}

export interface AggregatedGroup {
  id: string;
  name: string;
  level: number;
  parentId?: string | null;
  items: MasterItem[];
  periodForecast: Record<string, number>;
  periodActuals: Record<string, number>;
  periodPlanForecast: Record<string, number>;
  periodOpportunity: Record<string, number>;
  periodRisk: Record<string, number>;
  monthlyForecast: Record<string, number>;
  monthlyActuals: Record<string, number>;
  monthlyOpportunity: Record<string, number>;
  monthlyRisk: Record<string, number>;
  totalForecast: number;
  totalOpportunity: number;
  totalRisk: number;
  priorTotalForecast: number;
  ytdForecast: number;
  priorYtdForecast: number;
  ytgForecast: number;
  priorYtgForecast: number;
  apgForecast: Record<string, number>;
}

export const APG_DISPLAY_NAMES: Record<string, string> = {
  'Modern Trade': 'Modern trade',
  'General Trade': 'General trade',
  'E-commerce': 'E-commerce',
  'Quick Commerce': 'Quick commerce',
  'Modern trade': 'Modern trade',
  'General trade': 'General trade',
  'Quick commerce': 'Quick commerce',
};

export function aggregate(params: AggregateParams = {}): AggregatedGroup[] {
  const { scope, level = 3, apg, timeGrain, measure, from, to, planningCycle, activity } = params;
  const normGrain = normalizeGrain(timeGrain);
  const normMeas = normalizeMeasure(measure);
  const normCycle = (planningCycle || 'Current cycle').toLowerCase().trim();
  const normActivity = (activity || 'Demand driver').toLowerCase().trim();

  let items = masterData.items as any[];

  if (apg) {
    const apgList = Array.isArray(apg) ? apg : String(apg).split(',');
    const apgSet = new Set(apgList.map(s => String(s).trim()));
    items = items.filter(it => apgSet.has(it.apg));
  }

  if (scope) {
    const scopeList = Array.isArray(scope) ? scope : String(scope).split(',');
    const scopeIds = new Set(scopeList.map(s => String(s).trim()).filter(Boolean));
    const fuIds = descendantFuIds(scopeIds);
    if (fuIds.size > 0) {
      items = items.filter(it => fuIds.has(it.fuId));
    }
  }

  const { activePeriods, allPeriods } = getPeriodsForGrain(normGrain, from, to);
  const periodWeights = getWeekWeightsForGrain(normGrain);

  // Also pre-map prior year periods
  const priorPeriodMap: Record<string, string | undefined> = {};
  for (const p of activePeriods) {
    if (p.priorYearLabel && allPeriods.some(ap => ap.label === p.priorYearLabel)) {
      priorPeriodMap[p.label] = p.priorYearLabel;
    }
  }

  const groupField = levelField(level);
  const nameField = levelNameField(level);
  const nodeById: Record<string, any> = Object.fromEntries(
    (masterData.nodes as any[]).map((n: any) => [n.id, n])
  );

  const groups: Record<string, AggregatedGroup> = {};

  for (const it of items) {
    const groupId = it[groupField];
    if (!groups[groupId]) {
      const node = nodeById[groupId];
      groups[groupId] = {
        id: groupId,
        name: it[nameField],
        level,
        parentId: node?.parentId ?? null,
        items: [],
        periodForecast: {},
        periodActuals: {},
        periodPlanForecast: {},
        periodOpportunity: {},
        periodRisk: {},
        monthlyForecast: {},
        monthlyActuals: {},
        monthlyOpportunity: {},
        monthlyRisk: {},
        totalForecast: 0,
        totalOpportunity: 0,
        totalRisk: 0,
        priorTotalForecast: 0,
        ytdForecast: 0,
        priorYtdForecast: 0,
        ytgForecast: 0,
        priorYtgForecast: 0,
        apgForecast: {},
      };
    }
    const g = groups[groupId];
    g.items.push(it);

    const unitsPerCase = it.unitsPerCase || 12;
    const price = it.price || 100;

    const isActualsCycle = normCycle.includes('actual');
    const cycleKey = normCycle.includes('mrf')
      ? 'MRF'
      : normCycle.includes('prior')
        ? 'Prior cycle snapshot'
        : 'Current cycle';

    const hasCycleData = Boolean(it.weeklyForecastByCycle?.[cycleKey]);
    let cycleFactor = 1.0;
    if (!hasCycleData) {
      if (normCycle.includes('prior')) {
        const str = it.fuId || it.id || 'seed';
        let h = 0;
        for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
        const noise = (((Math.abs(h) % 1000) / 1000) - 0.5) * 0.04;
        cycleFactor = 0.97 + noise;
      } else if (normCycle.includes('mrf')) {
        cycleFactor = 0.88;
      }
    }

    let activityFactor = 1.0;
    if (normActivity.includes('business')) {
      activityFactor = 0.95;
    } else if (normActivity.includes('demand')) {
      activityFactor = 1.04;
    }
    const factor = cycleFactor * activityFactor;

    const convert = (baseUnits: number): number => {
      if (normMeas === 'cases') return baseUnits / unitsPerCase;
      if (normMeas === 'value') return baseUnits * price;
      return baseUnits;
    };

    // Aggregate for each active period
    for (const p of activePeriods) {
      const pWeights = periodWeights[p.label] || [];
      let pUnits = 0;
      let pOpp = 0;
      let pRisk = 0;
      let pPlanUnits = 0;
      let pActUnits = 0;

      for (const { week: w, weight } of pWeights) {
        if (params.pastPeriodsOnly && !w.isActual) {
          continue;
        }

        const uAct = (it.weeklyActuals?.[w.wLabel] ?? 0) * weight;
        const rawFcst = it.weeklyForecastByCycle?.[cycleKey]?.[w.wLabel] ?? it.weeklyForecast?.[w.wLabel] ?? 0;
        const uFcst = rawFcst * weight;

        if (w.isActual) {
          pActUnits += uAct;
        }
        pPlanUnits += uFcst;

        if (params.pureForecast) {
          if (isActualsCycle) {
            pUnits += w.isActual ? uAct : 0;
          } else {
            pUnits += uFcst;
            if (!w.isActual) {
              pOpp += (it.weeklyOpportunity?.[w.wLabel] || 0) * weight;
              pRisk += (it.weeklyRisk?.[w.wLabel] || 0) * weight;
            }
          }
        } else {
          if (w.isActual) {
            const u = isActualsCycle
              ? (it.weeklyActuals?.[w.wLabel] ?? 0)
              : (it.weeklyActuals?.[w.wLabel] ?? it.weeklyForecast?.[w.wLabel] ?? 0);
            pUnits += u * weight;
          } else {
            const u = it.weeklyForecastByCycle?.[cycleKey]?.[w.wLabel] ?? it.weeklyForecast?.[w.wLabel] ?? 0;
            pUnits += u * weight;
            pOpp += (it.weeklyOpportunity?.[w.wLabel] || 0) * weight;
            pRisk += (it.weeklyRisk?.[w.wLabel] || 0) * weight;
          }
        }
      }

      if (factor !== 1.0) {
        pUnits = pUnits * factor;
        pOpp = pOpp * factor;
        pRisk = pRisk * factor;
        pPlanUnits = pPlanUnits * factor;
      }

      const val = convert(pUnits);
      const opp = convert(pOpp);
      const rsk = convert(pRisk);
      const planVal = convert(pPlanUnits);
      const actVal = convert(pActUnits);

      g.periodPlanForecast[p.label] = (g.periodPlanForecast[p.label] || 0) + planVal;
      g.periodActuals[p.label] = (g.periodActuals[p.label] || 0) + actVal;

      if (params.pureForecast) {
        g.periodForecast[p.label] = (g.periodForecast[p.label] || 0) + val;
        g.periodOpportunity[p.label] = (g.periodOpportunity[p.label] || 0) + opp;
        g.periodRisk[p.label] = (g.periodRisk[p.label] || 0) + rsk;
        g.totalOpportunity += opp;
        g.totalRisk += rsk;
        if (p.isActual) {
          g.ytdForecast += val;
        } else {
          g.ytgForecast += val;
        }
      } else {
        if (p.isActual) {
          g.periodForecast[p.label] = (g.periodForecast[p.label] || 0) + val;
          g.ytdForecast += val;
        } else {
          g.periodForecast[p.label] = (g.periodForecast[p.label] || 0) + val;
          g.periodOpportunity[p.label] = (g.periodOpportunity[p.label] || 0) + opp;
          g.periodRisk[p.label] = (g.periodRisk[p.label] || 0) + rsk;
          g.totalOpportunity += opp;
          g.totalRisk += rsk;
          g.ytgForecast += val;
        }
      }
      g.totalForecast += val;
      const apgKey = APG_DISPLAY_NAMES[it.apg] || it.apg;
      g.apgForecast[apgKey] = (g.apgForecast[apgKey] || 0) + val;

      // Backward compat aliases
      g.monthlyForecast[p.label] = g.periodForecast[p.label];
      g.monthlyActuals[p.label] = g.periodActuals[p.label] || 0;
      g.monthlyOpportunity[p.label] = g.periodOpportunity[p.label] || 0;
      g.monthlyRisk[p.label] = g.periodRisk[p.label] || 0;

      // Prior year comparison
      const priorLabel = priorPeriodMap[p.label];
      if (priorLabel) {
        const priorPWeights = periodWeights[priorLabel] || [];
        let priorUnits = 0;
        for (const { week: pw, weight } of priorPWeights) {
          priorUnits += (it.weeklyActuals?.[pw.wLabel] ?? (it.weeklyForecast?.[pw.wLabel] || 0)) * weight;
        }
        if (factor !== 1.0) {
          priorUnits = priorUnits * factor;
        }
        const priorVal = convert(priorUnits);
        g.priorTotalForecast += priorVal;
        if (p.isActual) {
          g.priorYtdForecast += priorVal;
        } else {
          g.priorYtgForecast += priorVal;
        }
      }
    }
  }

  // Round totals appropriately for cases/value/units
  for (const g of Object.values(groups)) {
    g.totalForecast = Math.round(g.totalForecast);
    g.totalOpportunity = Math.round(g.totalOpportunity);
    g.totalRisk = Math.round(g.totalRisk);
    g.priorTotalForecast = Math.round(g.priorTotalForecast);
    g.ytdForecast = Math.round(g.ytdForecast);
    g.priorYtdForecast = Math.round(g.priorYtdForecast);
    g.ytgForecast = Math.round(g.ytgForecast);
    g.priorYtgForecast = Math.round(g.priorYtgForecast);
    for (const k of Object.keys(g.periodForecast)) {
      g.periodForecast[k] = Math.round(g.periodForecast[k]);
      g.monthlyForecast[k] = g.periodForecast[k];
    }
    for (const k of Object.keys(g.periodActuals)) {
      g.periodActuals[k] = Math.round(g.periodActuals[k]);
      g.monthlyActuals[k] = g.periodActuals[k];
    }
    for (const k of Object.keys(g.periodOpportunity)) {
      g.periodOpportunity[k] = Math.round(g.periodOpportunity[k]);
      g.monthlyOpportunity[k] = g.periodOpportunity[k];
    }
    for (const k of Object.keys(g.periodRisk)) {
      g.periodRisk[k] = Math.round(g.periodRisk[k]);
      g.monthlyRisk[k] = g.periodRisk[k];
    }
    let apgSum = 0;
    for (const k of Object.keys(g.apgForecast)) {
      g.apgForecast[k] = Math.round(g.apgForecast[k]);
      apgSum += g.apgForecast[k];
    }
    if (apgSum !== g.totalForecast && Object.keys(g.apgForecast).length > 0) {
      const diff = g.totalForecast - apgSum;
      const largestKey = Object.entries(g.apgForecast).sort((a, b) => b[1] - a[1])[0][0];
      g.apgForecast[largestKey] += diff;
    }
  }

  return Object.values(groups);
}

export { masterData, levelNameField };
