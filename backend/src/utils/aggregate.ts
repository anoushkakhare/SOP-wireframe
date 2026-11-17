/**
 * aggregate.ts – single aggregate() used by all data endpoints.
 * One function ensures KPIs, charts, treemap and table always match.
 */
import masterData from '../data/masterData.json';

export type MasterItem = typeof masterData.items[number];

/** Resolve all descendant fuIds for a set of scope node-ids */
function descendantFuIds(scopeIds: Set<string>): Set<string> {
  if (scopeIds.size === 0) return new Set(); // empty = all

  const nodes = masterData.nodes as Array<{ id: string; parentId: string | null; level: number }>;

  // Build parent→children map
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

export interface AggregateParams {
  /** If provided, filter to descendants of these node ids */
  scope?: string;        // comma-separated
  /** Group-by level (1-5) */
  level?: number;
  /** APG filter */
  apg?: string;          // comma-separated
  from?: string;
  to?: string;
}

export interface AggregatedGroup {
  id: string;
  name: string;
  level: number;
  parentId?: string | null;
  items: MasterItem[];
  monthlyForecast: Record<string, number>;
  monthlyActuals: Record<string, number>;
  monthlyOpportunity: Record<string, number>;
  monthlyRisk: Record<string, number>;
  totalForecast: number;
  totalOpportunity: number;
  totalRisk: number;
}

export function aggregate(params: AggregateParams = {}): AggregatedGroup[] {
  const { scope, level = 3, apg, from, to } = params;

  let items = masterData.items as any[];

  // APG filter
  if (apg) {
    const apgSet = new Set(apg.split(',').map(s => s.trim()));
    items = items.filter(it => apgSet.has(it.apg));
  }

  // Scope filter
  if (scope) {
    const scopeIds = new Set(scope.split(',').map(s => s.trim()).filter(Boolean));
    const fuIds = descendantFuIds(scopeIds);
    if (fuIds.size > 0) {
      items = items.filter(it => fuIds.has(it.fuId));
    }
  }

  // Month range
  const months = masterData.months as string[];
  const fromIdx = from ? months.indexOf(from) : 0;
  const toIdx   = to   ? months.indexOf(to)   : months.length - 1;
  const activeMonths = months.slice(
    fromIdx < 0 ? 0 : fromIdx,
    toIdx < 0 ? months.length : toIdx + 1
  );

  const groupField = levelField(level);
  const nameField  = levelNameField(level);

  // Build node lookup for parentId
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
        monthlyForecast: {},
        monthlyActuals: {},
        monthlyOpportunity: {},
        monthlyRisk: {},
        totalForecast: 0,
        totalOpportunity: 0,
        totalRisk: 0,
      };
    }

    const g = groups[groupId];
    g.items.push(it);

    for (const m of activeMonths) {
      const mIdx = months.indexOf(m);
      if (mIdx < masterData.currentMonthIndex) {
        const v = it.pastActuals[m] || 0;
        g.monthlyActuals[m] = (g.monthlyActuals[m] || 0) + v;
        g.monthlyForecast[m] = (g.monthlyForecast[m] || 0) + v;
        g.totalForecast += v;
      } else {
        const f = it.definitions.actualFcst[m] || 0;
        const o = it.definitions.opportunity[m] || 0;
        const r = it.definitions.risk[m] || 0;
        g.monthlyForecast[m]    = (g.monthlyForecast[m] || 0) + f;
        g.monthlyOpportunity[m] = (g.monthlyOpportunity[m] || 0) + o;
        g.monthlyRisk[m]        = (g.monthlyRisk[m] || 0) + r;
        g.totalForecast    += f;
        g.totalOpportunity += o;
        g.totalRisk        += r;
      }
    }
  }

  return Object.values(groups);
}

export { masterData, levelNameField };

