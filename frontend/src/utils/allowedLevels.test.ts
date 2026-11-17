import { describe, it, expect } from 'vitest';
import { allowedLevels } from './allowedLevels';
import { HierarchyNode } from '../types';

const nodes: HierarchyNode[] = [
  { id: 'cat_bw', name: 'Beauty & Wellbeing', level: 1, parentId: null },
  { id: 'sop_hc', name: 'Hair Care',          level: 2, parentId: 'cat_bw' },
  { id: 'br_dove', name: 'Dove',              level: 3, parentId: 'sop_hc' },
  { id: 'fg_dove_sh', name: 'Dove Shampoo',  level: 4, parentId: 'br_dove' },
  { id: 'fu_dove_sh_200', name: 'Dove 200ml',level: 5, parentId: 'fg_dove_sh' },
];

describe('allowedLevels', () => {
  it('returns all 5 levels when scope is empty', () => {
    expect(allowedLevels([], nodes)).toEqual([1, 2, 3, 4, 5]);
  });

  it('returns levels ≥ deepest selected node when scope has a category (level 1)', () => {
    expect(allowedLevels(['cat_bw'], nodes)).toEqual([1, 2, 3, 4, 5]);
  });

  it('returns levels ≥ 3 when scope contains a brand (level 3)', () => {
    expect(allowedLevels(['br_dove'], nodes)).toEqual([3, 4, 5]);
  });

  it('returns only level 5 when scope has a forecast unit', () => {
    expect(allowedLevels(['fu_dove_sh_200'], nodes)).toEqual([5]);
  });

  it('uses the deepest level when multiple nodes are selected', () => {
    // brand + sop: deepest is 3
    expect(allowedLevels(['sop_hc', 'br_dove'], nodes)).toEqual([3, 4, 5]);
  });
});

