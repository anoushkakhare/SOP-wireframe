export const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const YEARS = [2025, 2026, 2027];

/**
 * Total months across 2025-2027 is 36 months (0 to 35).
 * 0 = Jan 2025
 * 12 = Jan 2026
 * 23 = Dec 2026
 * 35 = Dec 2027
 */
export function monthIndexToDateString(index: number): string {
  const clamped = Math.max(0, Math.min(35, index));
  const year = 2025 + Math.floor(clamped / 12);
  const month = MONTHS[clamped % 12];
  return `${month} ${year}`;
}

export function dateStringToMonthIndex(dateString: string): number {
  const parts = dateString.trim().split(' ');
  if (parts.length < 2) return 12; // Default to Jan 2026
  const month = parts[0];
  const year = parseInt(parts[1], 10);
  const monthIdx = MONTHS.indexOf(month);
  if (monthIdx === -1 || isNaN(year)) return 12;
  const yearOffset = Math.max(0, year - 2025);
  return yearOffset * 12 + monthIdx;
}

