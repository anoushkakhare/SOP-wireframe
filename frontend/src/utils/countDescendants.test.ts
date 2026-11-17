import { describe, it, expect } from 'vitest';
import { countDescendants } from './countDescendants';
import { HierarchyNode } from '../types';

const mockNodes: HierarchyNode[] = [
  { id: 'cat_bw', name: 'Beauty & Wellbeing', level: 1, parentId: null },
  { id: 'sop_hc', name: 'Hair Care', level: 2, parentId: 'cat_bw' },
  { id: 'br_dove', name: 'Dove', level: 3, parentId: 'sop_hc' },
  { id: 'fg_dove_sh', name: 'Dove Shampoo Range', level: 4, parentId: 'br_dove' },
  { id: 'fu_dove_sh_200', name: 'Dove Shampoo 200ml', level: 5, parentId: 'fg_dove_sh' },
  { id: 'fu_dove_sh_340', name: 'Dove Shampoo 340ml', level: 5, parentId: 'fg_dove_sh' },
  { id: 'fg_dove_co', name: 'Dove Conditioner Range', level: 4, parentId: 'br_dove' },
  { id: 'fu_dove_co_180', name: 'Dove Conditioner 180ml', level: 5, parentId: 'fg_dove_co' },
  { id: 'fu_dove_co_335', name: 'Dove Conditioner 335ml', level: 5, parentId: 'fg_dove_co' },
  { id: 'fu_dove_co_500', name: 'Dove Conditioner 500ml', level: 5, parentId: 'fg_dove_co' },
  { id: 'br_surf', name: 'Surf Excel', level: 3, parentId: 'sop_hc' },
  { id: 'fg_surf_mat', name: 'Surf Matic', level: 4, parentId: 'br_surf' },
  { id: 'fu_surf_1kg', name: 'Surf 1kg', level: 5, parentId: 'fg_surf_mat' },
];

describe('countDescendants helper', () => {
  it('returns All categories summary when scope is empty', () => {
    const res = countDescendants([], mockNodes);
    expect(res.level).toBe(1);
    expect(res.summary).toBe('All categories · 2 brands · 6 forecast units');
  });

  it('returns descendant counts for Brand=Dove', () => {
    const res = countDescendants(['br_dove'], mockNodes);
    expect(res.level).toBe(3);
    expect(res.summary).toBe('Dove · 2 forecast groups · 5 units');
    expect(res.levelColor).toBe('#1B8A7A');
  });

  it('handles multiple selected nodes with +n more notation', () => {
    const res = countDescendants(['br_dove', 'br_surf'], mockNodes);
    expect(res.summary).toBe('Dove, Surf Excel · 3 forecast groups · 6 units');
  });
});
