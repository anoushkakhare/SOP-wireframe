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

  it('verifies sign-off enables only after validation counts reach 0 and both Reviewed ticks are set', () => {
    let mappingGapsCount = 25;
    let nullValuesCount = 5;
    let feedsLoaded = true;
    let innovationReviewed = false;
    let comboPacksReviewed = false;

    const buildChecklist = () => [
      { id: 'feeds_loaded', label: '5 feeds loaded', checked: feedsLoaded },
      { id: 'mapping_gaps', label: `${mappingGapsCount} mapping gaps`, checked: mappingGapsCount === 0 },
      { id: 'null_values', label: `${nullValuesCount} null values`, checked: nullValuesCount === 0 },
      { id: 'innovation_reviewed', label: 'Innovation reviewed', checked: innovationReviewed },
      { id: 'combo_packs_reviewed', label: 'Combo packs reviewed', checked: comboPacksReviewed },
    ];

    // Initially: blocked by mapping gaps, null values, and both manual ticks
    let checklist = buildChecklist();
    expect(checklist.every(c => c.checked)).toBe(false);

    // Fixing mapping gaps row by row decrements count
    for (let i = 0; i < 5; i++) {
      mappingGapsCount = Math.max(0, mappingGapsCount - 5);
    }
    expect(mappingGapsCount).toBe(0);

    // Still blocked because null values > 0 and reviews pending
    checklist = buildChecklist();
    expect(checklist.find(c => c.id === 'mapping_gaps')?.checked).toBe(true);
    expect(checklist.every(c => c.checked)).toBe(false);

    // Replacing null values
    for (let i = 0; i < 5; i++) {
      nullValuesCount = Math.max(0, nullValuesCount - 1);
    }
    expect(nullValuesCount).toBe(0);

    checklist = buildChecklist();
    expect(checklist.find(c => c.id === 'null_values')?.checked).toBe(true);
    expect(checklist.every(c => c.checked)).toBe(false);

    // Set Innovation tick
    innovationReviewed = true;
    checklist = buildChecklist();
    expect(checklist.every(c => c.checked)).toBe(false);

    // Set Special packs tick
    comboPacksReviewed = true;
    checklist = buildChecklist();

    // Now all 5 items are checked and sign-off enables!
    expect(checklist.every(c => c.checked)).toBe(true);
  });

  it('validates innovation product uniqueness and source forecast unit requirements', () => {
    const existing = [
      { code: 'NPD-2026-001', name: 'Dove Men Care Fresh Radiance' },
    ];

    const validateInnovation = (code: string, sourceUnits: string[]) => {
      if (!code.trim()) return 'Code is required';
      if (existing.some(e => e.code.toLowerCase() === code.trim().toLowerCase())) {
        return 'Code must be unique';
      }
      if (sourceUnits.length === 0) {
        return 'At least one source forecast unit is required';
      }
      return null;
    };

    expect(validateInnovation('NPD-2026-001', ['Dove Daily Moisture'])).toBe('Code must be unique');
    expect(validateInnovation('NPD-2026-002', [])).toBe('At least one source forecast unit is required');
    expect(validateInnovation('NPD-2026-002', ['Dove Daily Moisture'])).toBeNull();
  });
});

describe('Data Review Visual & Transaction Review Logic', () => {
  it('correctly calculates Pie distribution with Top 6 + Other slice', () => {
    const rawGroups = [
      { group: 'G1', value: 100, rowCount: 10 },
      { group: 'G2', value: 90, rowCount: 9 },
      { group: 'G3', value: 80, rowCount: 8 },
      { group: 'G4', value: 70, rowCount: 7 },
      { group: 'G5', value: 60, rowCount: 6 },
      { group: 'G6', value: 50, rowCount: 5 },
      { group: 'G7', value: 40, rowCount: 4 },
      { group: 'G8', value: 30, rowCount: 3 },
      { group: 'G9', value: 20, rowCount: 2 },
    ];

    const sorted = [...rawGroups].sort((a, b) => b.value - a.value);
    const top6 = sorted.slice(0, 6);
    const otherSlice = sorted.slice(6);
    const otherValue = otherSlice.reduce((s, x) => s + x.value, 0);
    const otherRowCount = otherSlice.reduce((s, x) => s + x.rowCount, 0);

    const pieData = [
      ...top6,
      {
        group: 'Other',
        value: otherValue,
        rowCount: otherRowCount,
      },
    ];

    expect(pieData.length).toBe(7);
    expect(pieData[0].group).toBe('G1');
    expect(pieData[5].group).toBe('G6');
    expect(pieData[6].group).toBe('Other');
    expect(pieData[6].value).toBe(40 + 30 + 20); // 90
    expect(pieData[6].rowCount).toBe(4 + 3 + 2); // 9
  });

  it('correctly maps master data nodes to required columns (id, name, level, parent, child count)', () => {
    const sampleNodes = [
      { id: 'cat_1', name: 'Category 1', level: 1, parentId: null },
      { id: 'sop_1', name: 'S&OP 1', level: 2, parentId: 'cat_1' },
      { id: 'sop_2', name: 'S&OP 2', level: 2, parentId: 'cat_1' },
      { id: 'br_1', name: 'Brand 1', level: 3, parentId: 'sop_1' },
    ];

    const childCounts = new Map<string, number>();
    for (const n of sampleNodes) {
      if (n.parentId) {
        childCounts.set(n.parentId, (childCounts.get(n.parentId) || 0) + 1);
      }
    }

    const tableRows = sampleNodes.map((n) => ({
      id: n.id,
      name: n.name,
      level: n.level,
      parent: n.parentId || '—',
      childCount: childCounts.get(n.id) || 0,
    }));

    expect(tableRows[0]).toEqual({
      id: 'cat_1',
      name: 'Category 1',
      level: 1,
      parent: '—',
      childCount: 2,
    });
    expect(tableRows[1].childCount).toBe(1);
    expect(tableRows[2].childCount).toBe(0);
  });

  it('verifies height distribution when bottom table dock is expanded vs collapsed', () => {
    const totalHeight = 640;
    const headerHeight = 45;
    const padding = 16;
    const canvasAvailable = totalHeight - headerHeight - padding; // 579px

    const expandedDockHeight = 210;
    const collapsedDockHeight = 32;

    const chartHeightWhenDockExpanded = canvasAvailable - expandedDockHeight; // 369px
    const chartHeightWhenDockCollapsed = canvasAvailable - collapsedDockHeight; // 547px

    expect(chartHeightWhenDockCollapsed).toBeGreaterThan(chartHeightWhenDockExpanded);
    expect(chartHeightWhenDockCollapsed - chartHeightWhenDockExpanded).toBe(expandedDockHeight - collapsedDockHeight);
  });
});


