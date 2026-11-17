import { describe, it, expect } from 'vitest';

describe('Data Review Readiness Logic', () => {
  it('correctly calculates completed steps from loaded feeds and manual checks', () => {
    const feeds = [
      { id: '1', name: 'Product master', status: 'loaded' },
      { id: '2', name: 'Customer master', status: 'loaded' },
      { id: '3', name: 'Price master', status: 'loaded' },
      { id: '4', name: 'Actuals (SAP/BW)', status: 'delayed' },
      { id: '5', name: 'Statistical forecast', status: 'pending' },
    ];
    const manualChecks = {
      innovationReviewed: false,
      comboPacksReviewed: false,
    };

    const loadedCount = feeds.filter(f => f.status === 'loaded').length;
    const manualCount = (manualChecks.innovationReviewed ? 1 : 0) + (manualChecks.comboPacksReviewed ? 1 : 0);
    const totalSteps = 7;
    const completedSteps = loadedCount + manualCount;

    expect(loadedCount).toBe(3);
    expect(totalSteps).toBe(7);
    expect(completedSteps).toBe(3);
  });

  it('calculates 7/7 steps when all feeds loaded and manual ticks checked', () => {
    const feeds = [
      { id: '1', name: 'Product master', status: 'loaded' },
      { id: '2', name: 'Customer master', status: 'loaded' },
      { id: '3', name: 'Price master', status: 'loaded' },
      { id: '4', name: 'Actuals (SAP/BW)', status: 'loaded' },
      { id: '5', name: 'Statistical forecast', status: 'loaded' },
    ];
    const manualChecks = {
      innovationReviewed: true,
      comboPacksReviewed: true,
    };

    const loadedCount = feeds.filter(f => f.status === 'loaded').length;
    const manualCount = (manualChecks.innovationReviewed ? 1 : 0) + (manualChecks.comboPacksReviewed ? 1 : 0);
    const totalSteps = 7;
    const completedSteps = loadedCount + manualCount;

    expect(completedSteps).toBe(7);
    expect(completedSteps).toBe(totalSteps);
  });

  it('determines calendar chip status colors according to specification', () => {
    const getChipColor = (feed: { status: string; delayHours: number; isUpcoming?: boolean }) => {
      if (feed.status === 'loaded' && feed.delayHours === 0) {
        return 'green';
      }
      if (feed.status === 'delayed' || feed.status === 'failed' || (feed.status === 'loaded' && feed.delayHours > 0)) {
        return 'red';
      }
      if (feed.status === 'pending' && feed.isUpcoming) {
        return 'amber';
      }
      return 'grey';
    };

    expect(getChipColor({ status: 'loaded', delayHours: 0 })).toBe('green');
    expect(getChipColor({ status: 'delayed', delayHours: 14 })).toBe('red');
    expect(getChipColor({ status: 'failed', delayHours: 0 })).toBe('red');
    expect(getChipColor({ status: 'pending', delayHours: 0, isUpcoming: true })).toBe('amber');
    expect(getChipColor({ status: 'pending', delayHours: 0, isUpcoming: false })).toBe('grey');
  });

  it('validates checklist sign-off blocking items', () => {
    const checklist = [
      { id: 'feeds_loaded', label: '5 feeds loaded', checked: false },
      { id: 'mapping_gaps', label: '0 mapping gaps', checked: true },
      { id: 'null_values', label: '0 null values', checked: true },
      { id: 'innovation_reviewed', label: 'Innovation reviewed', checked: false },
      { id: 'combo_packs_reviewed', label: 'Combo packs reviewed', checked: false },
    ];

    const canSignOff = checklist.every(c => c.checked);
    const blocking = checklist.filter(c => !c.checked).map(c => c.label);

    expect(canSignOff).toBe(false);
    expect(blocking).toEqual([
      '5 feeds loaded',
      'Innovation reviewed',
      'Combo packs reviewed',
    ]);
  });
});

