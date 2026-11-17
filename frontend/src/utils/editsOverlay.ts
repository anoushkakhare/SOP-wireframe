import { DraftCellEdit } from '../store/tableStore';

export function toMeasureUnits(deltaBase: number, measure: string, upc = 12, price = 100): number {
  if (measure === 'cases') return Math.round(deltaBase / (upc || 12));
  if (measure === 'value') return Math.round(deltaBase * (price || 100));
  return Math.round(deltaBase);
}

export function editMatchesFilters(
  edit: DraftCellEdit,
  scope: string[] = [],
  apgFilter: string[] = []
): boolean {
  if (apgFilter && apgFilter.length > 0) {
    const editApg = (edit.apg || '').toLowerCase().trim();
    if (editApg && editApg !== 'all') {
      const matchApg = apgFilter.some((a) => a.toLowerCase().trim() === editApg);
      if (!matchApg) return false;
    }
  }

  if (scope && scope.length > 0) {
    const scopeSet = new Set(scope.map((s) => s.toLowerCase().trim()));
    const fields = [
      edit.fuId,
      edit.forecastUnit,
      edit.forecastGroup,
      edit.brand,
      edit.sop,
      edit.category,
    ]
      .filter(Boolean)
      .map((s) => String(s).toLowerCase().trim());

    const inScope = fields.some((f) => scopeSet.has(f));
    if (!inScope) return false;
  }

  return true;
}

const MONTHS_MAP: Record<string, { q: string; h: string }> = {
  jan: { q: 'q1', h: 'h1' },
  feb: { q: 'q1', h: 'h1' },
  mar: { q: 'q1', h: 'h1' },
  apr: { q: 'q2', h: 'h1' },
  may: { q: 'q2', h: 'h1' },
  jun: { q: 'q2', h: 'h1' },
  jul: { q: 'q3', h: 'h2' },
  aug: { q: 'q3', h: 'h2' },
  sep: { q: 'q3', h: 'h2' },
  oct: { q: 'q4', h: 'h2' },
  nov: { q: 'q4', h: 'h2' },
  dec: { q: 'q4', h: 'h2' },
};

export function periodMatchesGrain(editPeriod: string, targetPeriod: string): boolean {
  if (editPeriod === targetPeriod) return true;
  const ep = editPeriod.toLowerCase().trim();
  const tp = targetPeriod.toLowerCase().trim();
  if (ep === tp) return true;

  // Month like "Jan 26" or "Jan 2026"
  const mMatch = ep.match(/^([a-z]{3})\s*(\d{2,4})$/);
  if (mMatch) {
    const [, mon, yr] = mMatch;
    const yr2 = yr.slice(-2);
    const info = MONTHS_MAP[mon];
    if (info) {
      if (tp.includes(info.q) && tp.includes(yr2)) return true;
      if (tp.includes(info.h) && tp.includes(yr2)) return true;
      if (tp.includes(yr2) && (tp.includes('fy') || tp.match(/\b20\d\d\b/))) return true;
    }
  }

  // Week like "W48 26"
  const wMatch = ep.match(/^w(\d{1,2})\s*(\d{2,4})$/);
  if (wMatch) {
    const [, wNumStr, yr] = wMatch;
    const wNum = parseInt(wNumStr, 10);
    const yr2 = yr.slice(-2);

    let mon = 'jan';
    if (wNum >= 5 && wNum <= 8) mon = 'feb';
    else if (wNum >= 9 && wNum <= 13) mon = 'mar';
    else if (wNum >= 14 && wNum <= 17) mon = 'apr';
    else if (wNum >= 18 && wNum <= 21) mon = 'may';
    else if (wNum >= 22 && wNum <= 26) mon = 'jun';
    else if (wNum >= 27 && wNum <= 30) mon = 'jul';
    else if (wNum >= 31 && wNum <= 35) mon = 'aug';
    else if (wNum >= 36 && wNum <= 39) mon = 'sep';
    else if (wNum >= 40 && wNum <= 43) mon = 'oct';
    else if (wNum >= 44 && wNum <= 48) mon = 'nov';
    else if (wNum >= 49) mon = 'dec';

    if (tp.includes(mon) && tp.includes(yr2)) return true;
    const info = MONTHS_MAP[mon];
    if (info) {
      if (tp.includes(info.q) && tp.includes(yr2)) return true;
      if (tp.includes(info.h) && tp.includes(yr2)) return true;
      if (tp.includes(yr2) && (tp.includes('fy') || tp.match(/\b20\d\d\b/))) return true;
    }
  }

  return false;
}

export function matchNodeAtLevel(
  edit: DraftCellEdit,
  level: number,
  nodeCategoryOrName: string,
  nodeId?: string
): boolean {
  const target = (nodeCategoryOrName || '').toLowerCase().trim();
  const idTarget = (nodeId || '').toLowerCase().trim();

  let candidate = '';
  let idCandidate = '';
  switch (level) {
    case 1:
      candidate = edit.category || '';
      break;
    case 2:
      candidate = edit.sop || '';
      break;
    case 3:
      candidate = edit.brand || '';
      break;
    case 4:
      candidate = edit.forecastGroup || '';
      break;
    case 5:
      candidate = edit.forecastUnit || '';
      idCandidate = edit.fuId || '';
      break;
    default:
      candidate = edit.brand || '';
  }

  const c = candidate.toLowerCase().trim();
  if (c && (c === target || target.includes(c) || c.includes(target))) return true;
  if (idTarget && idCandidate && idTarget === idCandidate.toLowerCase().trim()) return true;
  return false;
}
