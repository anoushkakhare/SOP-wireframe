import { describe, it, expect } from 'vitest';
import { buildCalendarWeeks, getWeekSplitInfo } from '../../utils/weekSplit';
import { HierarchyNode } from '../../types';

describe('HierarchyNetwork - Time mode straddling and split rules', () => {
  it('correctly maps a straddling week under both parent months', () => {
    const weeks = buildCalendarWeeks();
    const w05_26 = weeks.find((w) => w.wLabel === 'W05 26');

    expect(w05_26).toBeDefined();
    expect(w05_26?.isStraddling).toBe(true);
    expect(w05_26?.months).toEqual(['Jan 26', 'Feb 26']);
    expect(w05_26?.tooltip).toBe('W05 · 26 Jan–1 Feb: 6 d Jan / 1 d Feb');
  });

  it('correctly provides split text with exact days per month', () => {
    const info = getWeekSplitInfo('W05 26');
    expect(info?.splitText).toBe('6 d Jan / 1 d Feb');
    expect(info?.tooltip).toBe('W05 · 26 Jan–1 Feb: 6 d Jan / 1 d Feb');
  });

  it('ensures non-straddling weeks only have a single month parent', () => {
    const info2 = getWeekSplitInfo('W02 26');
    expect(info2?.isStraddling).toBe(false);
    expect(info2?.months.length).toBe(1);
    expect(info2?.tooltip).toBeUndefined();
  });
});

describe('HierarchyNetwork - Product mode ancestor and descendant scoping', () => {
  const sampleNodes: HierarchyNode[] = [
    { id: 'cat-1', name: 'Personal Care', level: 1, parentId: null },
    { id: 'sop-1', name: 'Skin Cleansing', level: 2, parentId: 'cat-1' },
    { id: 'brand-1', name: 'Dove', level: 3, parentId: 'sop-1' },
    { id: 'fg-1', name: 'Dove Bar', level: 4, parentId: 'brand-1' },
    { id: 'fu-1', name: 'Dove Bar 100g', level: 5, parentId: 'fg-1' },
  ];

  it('finds ancestors for a selected brand', () => {
    const nodeById = new Map(sampleNodes.map((n) => [n.id, n]));
    const target = nodeById.get('brand-1')!;

    const ancestors: HierarchyNode[] = [];
    let curr = target.parentId ? nodeById.get(target.parentId) : null;
    while (curr) {
      ancestors.unshift(curr);
      curr = curr.parentId ? nodeById.get(curr.parentId) : null;
    }

    expect(ancestors.map((a) => a.name)).toEqual(['Personal Care', 'Skin Cleansing']);
  });

  it('roots tree at selected node and only includes its descendants', () => {
    const childMap = new Map<string, HierarchyNode[]>();
    for (const n of sampleNodes) {
      if (n.parentId) {
        const list = childMap.get(n.parentId) || [];
        list.push(n);
        childMap.set(n.parentId, list);
      }
    }

    const collectDescendants = (id: string): string[] => {
      const children = childMap.get(id) || [];
      const res: string[] = [];
      for (const c of children) {
        res.push(c.id);
        res.push(...collectDescendants(c.id));
      }
      return res;
    };

    const doveDescendants = collectDescendants('brand-1');
    expect(doveDescendants).toEqual(['fg-1', 'fu-1']);
    expect(doveDescendants).not.toContain('cat-1');
    expect(doveDescendants).not.toContain('sop-1');
  });
});

