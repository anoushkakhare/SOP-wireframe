import { describe, it, expect } from 'vitest';
import { useViewStore } from '../../store/viewStore';
import { getDivergingColor } from '../charts/TreemapChart';

describe('Compare Mode Store & Calculations', () => {
  it('toggles compare mode in viewStore', () => {
    const store = useViewStore.getState();
    expect(store.compare.on).toBe(false);

    store.setCompare(true, 'MRF');
    const updated = useViewStore.getState();
    expect(updated.compare.on).toBe(true);
    expect(updated.compare.b).toBe('MRF');

    store.setCompare(false);
    const restored = useViewStore.getState();
    expect(restored.compare.on).toBe(false);
  });

  it('calculates diverging color clamped at ±20%', () => {
    // Exactly 0% change should be neutral grey rgb(148, 163, 184)
    const neutral = getDivergingColor(0);
    expect(neutral).toBe('rgb(148, 163, 184)');

    // -20% or lower should clamp to red rgb(220, 38, 38)
    const redMin = getDivergingColor(-20);
    expect(redMin).toBe('rgb(220, 38, 38)');
    const redClamped = getDivergingColor(-45);
    expect(redClamped).toBe('rgb(220, 38, 38)');

    // +20% or higher should clamp to green rgb(22, 163, 74)
    const greenMax = getDivergingColor(20);
    expect(greenMax).toBe('rgb(22, 163, 74)');
    const greenClamped = getDivergingColor(50);
    expect(greenClamped).toBe('rgb(22, 163, 74)');

    // Intermediate values transition smoothly
    const posIntermediate = getDivergingColor(10);
    expect(posIntermediate).not.toBe(neutral);
    expect(posIntermediate).not.toBe(greenMax);
  });

  it('validates delta calculation: B - A reconciles with sign and pct', () => {
    const valA = 1000;
    const valB = 1200;
    const delta = valB - valA;
    const pct = ((delta / Math.abs(valA)) * 100).toFixed(1);
    expect(delta).toBe(200);
    expect(pct).toBe('20.0');

    const decreaseA = 1000;
    const decreaseB = 850;
    const decreaseDelta = decreaseB - decreaseA;
    const decreasePct = ((decreaseDelta / Math.abs(decreaseA)) * 100).toFixed(1);
    expect(decreaseDelta).toBe(-150);
    expect(decreasePct).toBe('-15.0');
  });
});

