/**
 * weekSplit.ts
 *
 * Calendar week calculations and split information for straddling weeks.
 * Pure utility functions for Week view axis, table header tooltips, and Time hierarchy.
 */

const MO_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface WeekSplitInfo {
  wLabel: string;
  wShort: string;
  start: string;
  end: string;
  dateSpan: string;
  isStraddling: boolean;
  months: string[];
  entries: Array<{ month: string; days: number }>;
  d1?: number;
  m1?: string;
  d2?: number;
  m2?: string;
  splitText?: string;
  tooltip?: string;
  year: number;
  quarter: string;
  half: string;
}

/**
 * Builds the canonical list of ISO weeks for 2025 to 2027.
 */
export function buildCalendarWeeks(): WeekSplitInfo[] {
  const weeks: WeekSplitInfo[] = [];
  let d = new Date(Date.UTC(2024, 11, 30)); // Mon Dec 30 2024

  while (true) {
    const thu = new Date(d.getTime() + 3 * 86400000);
    const yr = thu.getUTCFullYear();
    if (yr > 2027) break;
    const end = new Date(d.getTime() + 6 * 86400000); // Sunday
    const jan4 = new Date(Date.UTC(yr, 0, 4));
    const jan4Day = (jan4.getUTCDay() + 6) % 7;
    const thu1 = new Date(jan4.getTime() + (3 - jan4Day) * 86400000);
    const weekNum = 1 + Math.round((thu.getTime() - thu1.getTime()) / (7 * 86400000));
    const yrStr = String(yr).slice(2);
    const wLabel = `W${String(weekNum).padStart(2, '0')} ${yrStr}`;
    const wShort = `W${String(weekNum).padStart(2, '0')}`;

    const monthDays: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const cur = new Date(d.getTime() + i * 86400000);
      const m = MO_NAMES[cur.getUTCMonth()];
      const y = String(cur.getUTCFullYear()).slice(2);
      const key = `${m} ${y}`;
      monthDays[key] = (monthDays[key] || 0) + 1;
    }

    const rawEntries = Object.entries(monthDays);
    const isStraddling = rawEntries.length > 1;
    const sDay = d.getUTCDate();
    const sMonth = MO_NAMES[d.getUTCMonth()];
    const eDay = end.getUTCDate();
    const eMonth = MO_NAMES[end.getUTCMonth()];
    const dateSpan = `${sDay} ${sMonth}–${eDay} ${eMonth}`;

    const entries = rawEntries.map(([month, days]) => ({ month, days }));
    const months = rawEntries.map((e) => e[0]);

    let d1: number | undefined;
    let m1: string | undefined;
    let d2: number | undefined;
    let m2: string | undefined;
    let splitText: string | undefined;
    let tooltip: string | undefined;

    if (isStraddling) {
      d1 = rawEntries[0][1];
      m1 = rawEntries[0][0].split(' ')[0];
      d2 = rawEntries[1][1];
      m2 = rawEntries[1][0].split(' ')[0];
      splitText = `${d1} d ${m1} / ${d2} d ${m2}`;
      tooltip = `${wShort} · ${dateSpan}: ${splitText}`;
    }

    const moIdx = thu.getUTCMonth();
    const qNum = Math.floor(moIdx / 3) + 1;
    const quarter = `Q${qNum} ${yrStr}`;
    const hNum = moIdx < 6 ? 1 : 2;
    const half = `H${hNum} ${yrStr}`;

    weeks.push({
      wLabel,
      wShort,
      start: d.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
      dateSpan,
      isStraddling,
      months,
      entries,
      d1,
      m1,
      d2,
      m2,
      splitText,
      tooltip,
      year: yr,
      quarter,
      half,
    });

    d = new Date(d.getTime() + 7 * 86400000);
  }

  return weeks;
}

const CACHED_WEEKS: WeekSplitInfo[] = buildCalendarWeeks();
const WEEK_MAP = new Map<string, WeekSplitInfo>();
for (const w of CACHED_WEEKS) {
  WEEK_MAP.set(w.wLabel, w);
  // Also index by wShort + year e.g. "W05", "W05 2026"
  if (!WEEK_MAP.has(w.wShort)) {
    WEEK_MAP.set(w.wShort, w);
  }
}

/**
 * Returns split info for a week label (e.g. "W05 26", "W05", "W05 2026").
 */
export function getWeekSplitInfo(wLabel?: string): WeekSplitInfo | null {
  if (!wLabel) return null;
  const clean = wLabel.replace(/\b2025\b/g, '25').replace(/\b2026\b/g, '26').trim();
  const direct = WEEK_MAP.get(clean);
  if (direct) return direct;

  // Fallback match by Wxx
  const match = clean.match(/W\d{2}/i);
  if (match) {
    const short = match[0].toUpperCase();
    return WEEK_MAP.get(short) || null;
  }

  return null;
}

/**
 * Returns tooltip text if the week is straddling, or undefined if not.
 */
export function getStraddlingTooltip(wLabel?: string): string | undefined {
  const info = getWeekSplitInfo(wLabel);
  return info?.isStraddling ? info.tooltip : undefined;
}

