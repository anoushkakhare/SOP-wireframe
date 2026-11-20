import { TimeGrain, DataRange } from '../types';

export const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const DATA_RANGE: DataRange = {
  start: '2025-01',
  end: '2027-12',
};

let currentDataRange: DataRange = { ...DATA_RANGE };

export function getDataRange(): DataRange {
  return currentDataRange;
}

export function computeYears(range: DataRange = currentDataRange): number[] {
  const startYear = parseInt(range.start.split('-')[0], 10);
  const endYear = parseInt(range.end.split('-')[0], 10);
  const years: number[] = [];
  for (let y = startYear; y <= endYear; y++) {
    years.push(y);
  }
  return years;
}

export const YEARS: number[] = computeYears();

export function getWeeksInYear(year: number): number {
  const d = new Date(year, 11, 31);
  const day = d.getDay();
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  return day === 4 || (day === 3 && isLeap) ? 53 : 52;
}

function buildGrainPeriods(years: number[]): Record<string, string[]> {
  return {
    year: years.map((y) => `FY${y}`),
    half: years.flatMap((y) => [`H1 ${y}`, `H2 ${y}`]),
    quarter: years.flatMap((y) => [`Q1 ${y}`, `Q2 ${y}`, `Q3 ${y}`, `Q4 ${y}`]),
    month: years.flatMap((y) => MONTHS.map((m) => `${m} ${y}`)),
    week: years.flatMap((y) => {
      const count = getWeeksInYear(y);
      return Array.from({ length: count }, (_, i) => `W${String(i + 1).padStart(2, '0')} ${y}`);
    }),
  };
}

let GRAIN_PERIODS: Record<string, string[]> = buildGrainPeriods(YEARS);

export function setDataRange(range: DataRange) {
  if (range && range.start && range.end) {
    currentDataRange = { ...range };
    YEARS.length = 0;
    YEARS.push(...computeYears(currentDataRange));
    GRAIN_PERIODS = buildGrainPeriods(YEARS);
  }
}

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
  const currentYear = YEARS.includes(2026) ? 2026 : YEARS[0];

  let from = periods[0];
  let to = periods[periods.length - 1];

  if (g === 'year') {
    from = `FY${YEARS[0]}`;
    to = `FY${YEARS[YEARS.length - 1]}`;
  } else if (g === 'half') {
    from = `H1 ${currentYear}`;
    to = `H2 ${currentYear}`;
  } else if (g === 'quarter') {
    from = `Q1 ${currentYear}`;
    to = `Q4 ${currentYear}`;
  } else if (g === 'month') {
    from = `Jan ${currentYear}`;
    to = `Dec ${currentYear}`;
  } else if (g === 'week') {
    from = `W40 ${currentYear}`;
    to = `W${getWeeksInYear(currentYear)} ${currentYear}`;
  }

  let startIdx = periods.indexOf(from);
  let endIdx = periods.indexOf(to);
  if (startIdx < 0) startIdx = 0;
  if (endIdx < 0) endIdx = periods.length - 1;
  if (startIdx > endIdx) [startIdx, endIdx] = [endIdx, startIdx];

  // 104-period clamp
  if (endIdx - startIdx + 1 > 104) {
    endIdx = startIdx + 103;
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
  const startYear = parseInt(currentDataRange.start.split('-')[0], 10);
  const maxMonths = YEARS.length * 12 - 1;
  const clamped = Math.max(0, Math.min(maxMonths, index));
  const year = startYear + Math.floor(clamped / 12);
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
  const startYear = parseInt(currentDataRange.start.split('-')[0], 10);
  if (parts.length < 2) return 12;
  const month = parts[0];
  let year = parseInt(parts[1], 10);
  if (year < 100) year += 2000;
  const monthIdx = MONTHS.indexOf(month);
  if (monthIdx === -1 || isNaN(year)) return 12;
  const yearOffset = Math.max(0, year - startYear);
  return yearOffset * 12 + monthIdx;
}
