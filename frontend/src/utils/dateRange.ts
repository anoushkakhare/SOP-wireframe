import { TimeGrain } from '../types';

export const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const YEARS = [2025, 2026, 2027];

export const GRAIN_PERIODS: Record<string, string[]> = {
  year: ['FY25', 'FY26', 'FY27'],
  half: ['H1 25', 'H2 25', 'H1 26', 'H2 26', 'H1 27', 'H2 27'],
  quarter: [
    'Q1 25', 'Q2 25', 'Q3 25', 'Q4 25',
    'Q1 26', 'Q2 26', 'Q3 26', 'Q4 26',
    'Q1 27', 'Q2 27', 'Q3 27', 'Q4 27',
  ],
  month: [
    'Jan 25', 'Feb 25', 'Mar 25', 'Apr 25', 'May 25', 'Jun 25',
    'Jul 25', 'Aug 25', 'Sep 25', 'Oct 25', 'Nov 25', 'Dec 25',
    'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'May 26', 'Jun 26',
    'Jul 26', 'Aug 26', 'Sep 26', 'Oct 26', 'Nov 26', 'Dec 26',
    'Jan 27', 'Feb 27', 'Mar 27', 'Apr 27', 'May 27', 'Jun 27',
    'Jul 27', 'Aug 27', 'Sep 27', 'Oct 27', 'Nov 27', 'Dec 27',
  ],
  week: Array.from({ length: 52 }, (_, i) => `W${String(i + 1).padStart(2, '0')} 25`)
    .concat(Array.from({ length: 52 }, (_, i) => `W${String(i + 1).padStart(2, '0')} 26`))
    .concat(Array.from({ length: 52 }, (_, i) => `W${String(i + 1).padStart(2, '0')} 27`)),
};

export function normalizeGrain(grain?: string): string {
  if (!grain) return 'month';
  const g = grain.toLowerCase().trim();
  if (g === 'half' || g === 'half-year' || g === 'half_year') return 'half';
  return g;
}

export function getGrainPeriods(grain?: TimeGrain | string): string[] {
  const g = normalizeGrain(grain);
  return GRAIN_PERIODS[g] || GRAIN_PERIODS.month;
}

export function getDefaultRangeForGrain(grain?: TimeGrain | string): {
  from: string;
  to: string;
  range: [number, number];
} {
  const g = normalizeGrain(grain);
  const periods = getGrainPeriods(g);

  let from = periods[0];
  let to = periods[periods.length - 1];

  if (g === 'year') {
    from = 'FY25';
    to = 'FY26';
  } else if (g === 'half') {
    from = 'H1 26';
    to = 'H2 26';
  } else if (g === 'quarter') {
    from = 'Q1 26';
    to = 'Q4 26';
  } else if (g === 'month') {
    from = 'Jan 26';
    to = 'Dec 26';
  } else if (g === 'week') {
    from = 'W40 26';
    to = 'W53 26';
  }

  let startIdx = periods.indexOf(from);
  let endIdx = periods.indexOf(to);
  if (startIdx < 0) startIdx = 0;
  if (endIdx < 0) endIdx = periods.length - 1;

  return { from, to, range: [startIdx, endIdx] };
}

export function monthIndexToDateString(index: number, grain?: TimeGrain | string): string {
  if (grain) {
    const periods = getGrainPeriods(grain);
    const clamped = Math.max(0, Math.min(periods.length - 1, index));
    return periods[clamped];
  }
  const clamped = Math.max(0, Math.min(35, index));
  const year = 2025 + Math.floor(clamped / 12);
  const month = MONTHS[clamped % 12];
  return `${month} ${year}`;
}

export function dateStringToMonthIndex(dateString: string, grain?: TimeGrain | string): number {
  if (grain) {
    const periods = getGrainPeriods(grain);
    const norm = dateString.replace(/\b2025\b/, '25').replace(/\b2026\b/, '26').replace(/\b2027\b/, '27').trim();
    const idx = periods.indexOf(norm);
    if (idx >= 0) return idx;
    const def = getDefaultRangeForGrain(grain);
    return def.range[0];
  }

  const parts = dateString.trim().split(' ');
  if (parts.length < 2) return 12;
  const month = parts[0];
  let year = parseInt(parts[1], 10);
  if (year < 100) year += 2000;
  const monthIdx = MONTHS.indexOf(month);
  if (monthIdx === -1 || isNaN(year)) return 12;
  const yearOffset = Math.max(0, year - 2025);
  return yearOffset * 12 + monthIdx;
}
