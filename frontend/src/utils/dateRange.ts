import { TimeGrain } from '../types';

export const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const YEARS = Array.from({ length: 2027 - 1900 + 1 }, (_, i) => 1900 + i);

export function getWeeksInYear(year: number): number {
  const d = new Date(year, 11, 31);
  const day = d.getDay();
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  return day === 4 || (day === 3 && isLeap) ? 53 : 52;
}

const GRAIN_PERIODS: Record<string, string[]> = {
  year: YEARS.map((y) => `FY${y}`),
  half: YEARS.flatMap((y) => [`H1 ${y}`, `H2 ${y}`]),
  quarter: YEARS.flatMap((y) => [`Q1 ${y}`, `Q2 ${y}`, `Q3 ${y}`, `Q4 ${y}`]),
  month: YEARS.flatMap((y) => MONTHS.map((m) => `${m} ${y}`)),
  week: YEARS.flatMap((y) => {
    const count = getWeeksInYear(y);
    return Array.from({ length: count }, (_, i) => `W${String(i + 1).padStart(2, '0')} ${y}`);
  }),
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

export function normalizeDateInput(d: string): string {
  return d
    .replace(/\bFY25\b/g, 'FY2025')
    .replace(/\bFY26\b/g, 'FY2026')
    .replace(/\bFY27\b/g, 'FY2027')
    .replace(/\b25\b/g, '2025')
    .replace(/\b26\b/g, '2026')
    .replace(/\b27\b/g, '2027')
    .trim();
}

export function getDefaultRangeForGrain(grain?: TimeGrain | string): {
  from: string;
  to: string;
  range: [number, number];
} {
  const g = normalizeGrain(grain);
  const periods = getGrainPeriods(g);
  const total = periods.length;

  // Middle position with 20-25% gap
  const maxAllowedGap = Math.max(1, total - 2);
  const desiredGap = Math.min(maxAllowedGap, Math.max(1, Math.round(total * 0.22)));
  const mid = Math.floor(total / 2);

  let startIdx = Math.max(0, mid - Math.floor(desiredGap / 2));
  let endIdx = Math.min(total - 1, startIdx + desiredGap);

  if (endIdx - startIdx < 1) {
    endIdx = Math.min(total - 1, startIdx + 1);
  }
  if (endIdx >= total) {
    endIdx = total - 1;
    startIdx = Math.max(0, endIdx - desiredGap);
  }

  return {
    from: periods[startIdx],
    to: periods[endIdx],
    range: [startIdx, endIdx],
  };
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
    const norm = normalizeDateInput(dateString);
    const idx = periods.indexOf(norm);
    if (idx >= 0) return idx;
    const directIdx = periods.indexOf(dateString.trim());
    if (directIdx >= 0) return directIdx;
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
