import { describe, it, expect } from 'vitest';
import { getContrastRatio, pickTextColor, TREEMAP_PALETTE } from './TreemapChart';
import masterData from '../../../../backend/src/data/masterData.json';

describe('Treemap colours and contrast', () => {
  it('has 6 steps in the indigo/blue-slate palette', () => {
    expect(TREEMAP_PALETTE.length).toBe(6);
  });

  it('guarantees WCAG AA contrast (>= 4.5:1) for header text against darker tint', () => {
    for (const step of TREEMAP_PALETTE) {
      const ratio = getContrastRatio(step.header, '#FFFFFF');
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('guarantees WCAG AA contrast (>= 4.5:1) for tile text against lighter tint', () => {
    for (const step of TREEMAP_PALETTE) {
      const textColor = pickTextColor(step.tile);
      const ratio = getContrastRatio(step.tile, textColor);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('Treemap hierarchy parent grouping', () => {
  const nodes = masterData.nodes;

  it('verifies Rexona sits under true parent Deodorants, NOT Skin Cleansing', () => {
    const rexona = nodes.find(n => n.name === 'Rexona' && n.level === 3);
    expect(rexona).toBeDefined();
    const parent = nodes.find(n => n.id === rexona?.parentId);
    expect(parent?.name).toBe('Deodorants');
    expect(parent?.name).not.toBe('Skin Cleansing');
  });

  it('verifies Closeup sits under true parent Oral Care, NOT Skin Cleansing', () => {
    const closeup = nodes.find(n => n.name === 'Closeup' && n.level === 3);
    expect(closeup).toBeDefined();
    const parent = nodes.find(n => n.id === closeup?.parentId);
    expect(parent?.name).toBe('Oral Care');
    expect(parent?.name).not.toBe('Skin Cleansing');
  });

  it('verifies Skin Cleansing only contains true children Lux and Lifebuoy', () => {
    const skinCleansing = nodes.find(n => n.name === 'Skin Cleansing' && n.level === 2);
    expect(skinCleansing).toBeDefined();
    const children = nodes.filter(n => n.parentId === skinCleansing?.id);
    const childNames = children.map(c => c.name);
    expect(childNames).toContain('Lux');
    expect(childNames).toContain('Lifebuoy');
    expect(childNames).not.toContain('Rexona');
    expect(childNames).not.toContain('Closeup');
  });

  it('verifies every brand node sits under its true S&OP parent', () => {
    const brands = nodes.filter(n => n.level === 3);
    for (const b of brands) {
      expect(b.parentId).toBeDefined();
      const parent = nodes.find(n => n.id === b.parentId);
      expect(parent).toBeDefined();
      expect(parent?.level).toBe(2);
    }
  });
});
