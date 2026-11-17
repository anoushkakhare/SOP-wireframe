import { describe, it, expect } from 'vitest';
import { getWeekSplitInfo, getStraddlingTooltip } from './weekSplit';

describe('weekSplit utility', () => {
  it('correctly identifies W05 26 as straddling Jan and Feb with exact tooltip', () => {
    const info = getWeekSplitInfo('W05 26');
    expect(info).toBeDefined();
    expect(info?.isStraddling).toBe(true);
    expect(info?.months).toEqual(['Jan 26', 'Feb 26']);
    expect(info?.d1).toBe(6);
    expect(info?.m1).toBe('Jan');
    expect(info?.d2).toBe(1);
    expect(info?.m2).toBe('Feb');
    expect(info?.dateSpan).toBe('26 Jan–1 Feb');
    expect(info?.tooltip).toBe('W05 · 26 Jan–1 Feb: 6 d Jan / 1 d Feb');
    expect(getStraddlingTooltip('W05 26')).toBe('W05 · 26 Jan–1 Feb: 6 d Jan / 1 d Feb');
  });

  it('correctly identifies non-straddling weeks (e.g. W02 26, W03 26) as false with no tooltip', () => {
    const info2 = getWeekSplitInfo('W02 26');
    expect(info2?.isStraddling).toBe(false);
    expect(info2?.tooltip).toBeUndefined();
    expect(getStraddlingTooltip('W02 26')).toBeUndefined();

    const info3 = getWeekSplitInfo('W03 26');
    expect(info3?.isStraddling).toBe(false);
    expect(info3?.tooltip).toBeUndefined();
    expect(getStraddlingTooltip('W03 26')).toBeUndefined();
  });

  it('correctly identifies W14 26 as straddling Mar and Apr', () => {
    const info = getWeekSplitInfo('W14 26');
    expect(info?.isStraddling).toBe(true);
    expect(info?.months).toEqual(['Mar 26', 'Apr 26']);
    expect(info?.d1).toBe(2);
    expect(info?.m1).toBe('Mar');
    expect(info?.d2).toBe(5);
    expect(info?.m2).toBe('Apr');
    expect(info?.tooltip).toBe('W14 · 30 Mar–5 Apr: 2 d Mar / 5 d Apr');
  });
});

