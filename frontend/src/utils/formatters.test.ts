import { describe, it, expect } from 'vitest';
import { formatCompactNumber } from './formatters';
import { getSignColor } from './signColor';
import { formatRelativeTime } from './relativeTime';
import { monthIndexToDateString, dateStringToMonthIndex } from './dateRange';

describe('formatCompactNumber', () => {
  it('formats Total Forecast as neutral with no sign', () => {
    expect(formatCompactNumber(1820000, { isNeutral: true })).toBe('1.82M');
  });

  it('formats positive currency values with + and K', () => {
    expect(formatCompactNumber(42000)).toBe('+42K');
    expect(formatCompactNumber(128000)).toBe('+128K');
  });

  it('formats negative currency values with - and K', () => {
    expect(formatCompactNumber(-96000)).toBe('-96K');
  });

  it('formats percentages correctly with signs', () => {
    expect(formatCompactNumber(2.8, { format: 'percent' })).toBe('+2.8%');
    expect(formatCompactNumber(5.8, { format: 'percent' })).toBe('+5.8%');
    expect(formatCompactNumber(-1.9, { format: 'percent' })).toBe('-1.9%');
    expect(formatCompactNumber(0, { format: 'percent' })).toBe('0.0%');
  });

  it('formats zero properly', () => {
    expect(formatCompactNumber(0)).toBe('0');
  });
});

describe('getSignColor', () => {
  it('returns positive green for positive numbers', () => {
    const res = getSignColor(42);
    expect(res.text).toBe('text-positive');
    expect(res.hex).toBe('#1B7F55');
  });

  it('returns negative red for negative numbers', () => {
    const res = getSignColor(-96);
    expect(res.text).toBe('text-negative');
    expect(res.hex).toBe('#C0392B');
  });

  it('returns text-primary for 0 or isNeutral', () => {
    const res0 = getSignColor(0);
    expect(res0.text).toBe('text-text-primary');
    const resNeutral = getSignColor(1820000, true);
    expect(resNeutral.text).toBe('text-text-primary');
  });
});

describe('dateRange conversion', () => {
  it('converts index 12 to Jan 2026 and 23 to Dec 2026', () => {
    expect(monthIndexToDateString(12)).toBe('Jan 2026');
    expect(monthIndexToDateString(23)).toBe('Dec 2026');
    expect(dateStringToMonthIndex('Jan 2026')).toBe(12);
    expect(dateStringToMonthIndex('Dec 2026')).toBe(23);
  });
});

describe('formatRelativeTime', () => {
  it('formats past dates into relative representations', () => {
    const twoMinAgo = new Date(Date.now() - 120 * 1000).toISOString();
    expect(formatRelativeTime(twoMinAgo)).toBe('2 min ago');

    const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    expect(formatRelativeTime(yesterday)).toBe('Yesterday');
  });
});
