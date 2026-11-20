import { describe, it, expect } from 'vitest';
import { buildCalendarWeeks, getWeekSplitInfo } from '../../utils/weekSplit';
import { HierarchyNode } from '../../types';
import { filterTree, applyDefaultExpansion, countMatches, TreeNodeData } from './HierarchyNetwork';

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

describe('HierarchyNetwork - filterTree and default expansion', () => {
  const createTestTree = (): TreeNodeData => ({
    id: 'root-all',
    name: 'All categories (2)',
    rawName: 'All categories',
    level: 0,
    count: 2,
    collapsed: false,
    children: [
      {
        id: 'cat_bw',
        name: 'Beauty & Wellbeing (2)',
        rawName: 'Beauty & Wellbeing',
        level: 1,
        count: 2,
        collapsed: false,
        children: [
          {
            id: 'sop_hc',
            name: 'Hair Care (2)',
            rawName: 'Hair Care',
            level: 2,
            count: 2,
            collapsed: false,
            children: [
              {
                id: 'br_dove',
                name: 'Dove (1)',
                rawName: 'Dove',
                level: 3,
                count: 1,
                collapsed: false,
                children: [
                  {
                    id: 'fg_dove_sh',
                    name: 'Dove Shampoo Range (2)',
                    rawName: 'Dove Shampoo Range',
                    level: 4,
                    count: 2,
                    collapsed: false,
                    children: [
                      {
                        id: 'fu_dove_200',
                        name: 'Dove Nourishing Shampoo 200ml (0)',
                        rawName: 'Dove Nourishing Shampoo 200ml',
                        level: 5,
                        count: 0,
                        collapsed: false,
                      },
                      {
                        id: 'fu_dove_400',
                        name: 'Dove Daily Moisture Conditioner 400ml (0)',
                        rawName: 'Dove Daily Moisture Conditioner 400ml',
                        level: 5,
                        count: 0,
                        collapsed: false,
                      },
                    ],
                  },
                ],
              },
              {
                id: 'br_sunsilk',
                name: 'Sunsilk (1)',
                rawName: 'Sunsilk',
                level: 3,
                count: 1,
                collapsed: false,
                children: [
                  {
                    id: 'fg_sun_sh',
                    name: 'Sunsilk Black Shine (1)',
                    rawName: 'Sunsilk Black Shine',
                    level: 4,
                    count: 1,
                    collapsed: false,
                    children: [
                      {
                        id: 'fu_sun_180',
                        name: 'Sunsilk Shampoo 180ml (0)',
                        rawName: 'Sunsilk Shampoo 180ml',
                        level: 5,
                        count: 0,
                        collapsed: false,
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: 'sop_sc',
            name: 'Skin Care (1)',
            rawName: 'Skin Care',
            level: 2,
            count: 1,
            collapsed: false,
            children: [
              {
                id: 'br_vaseline',
                name: 'Vaseline (0)',
                rawName: 'Vaseline',
                level: 3,
                count: 0,
                collapsed: false,
              },
            ],
          },
        ],
      },
      {
        id: 'cat_pc',
        name: 'Personal Care (1)',
        rawName: 'Personal Care',
        level: 1,
        count: 1,
        collapsed: false,
        children: [
          {
            id: 'sop_deo',
            name: 'Deodorants (1)',
            rawName: 'Deodorants',
            level: 2,
            count: 1,
            collapsed: false,
            children: [
              {
                id: 'br_rexona',
                name: 'Rexona (0)',
                rawName: 'Rexona',
                level: 3,
                count: 0,
                collapsed: false,
              },
            ],
          },
        ],
      },
    ],
  });

  it('match at L3 includes its L4/L5 descendants and ancestor path', () => {
    const tree = createTestTree();
    const result = filterTree(tree, 'Dove');

    expect(result).not.toBeNull();
    // Ancestor path
    expect(result?.id).toBe('root-all');
    expect(result?.children?.length).toBe(1);
    expect(result?.children?.[0].id).toBe('cat_bw');

    const catBw = result?.children?.[0];
    expect(catBw?.children?.length).toBe(1);
    expect(catBw?.children?.[0].id).toBe('sop_hc');

    const sopHc = catBw?.children?.[0];
    // Sibling Sunsilk is removed
    expect(sopHc?.children?.length).toBe(1);
    expect(sopHc?.children?.[0].id).toBe('br_dove');

    const brDove = sopHc?.children?.[0];
    // L4 descendant included
    expect(brDove?.children?.length).toBe(1);
    expect(brDove?.children?.[0].id).toBe('fg_dove_sh');

    // L5 descendants included
    const fgDoveSh = brDove?.children?.[0];
    expect(fgDoveSh?.children?.length).toBe(2);
    expect(fgDoveSh?.children?.map((c) => c.id)).toEqual(['fu_dove_200', 'fu_dove_400']);

    // Non-matching branches are removed
    expect(result?.children?.some((c) => c.id === 'cat_pc')).toBe(false);
    expect(catBw?.children?.some((c) => c.id === 'sop_sc')).toBe(false);
    expect(sopHc?.children?.some((c) => c.id === 'br_sunsilk')).toBe(false);
  });

  it('match at L5 includes only the path', () => {
    const tree = createTestTree();
    const result = filterTree(tree, 'Conditioner');

    expect(result).not.toBeNull();
    expect(result?.id).toBe('root-all');

    const catBw = result?.children?.[0];
    expect(catBw?.id).toBe('cat_bw');
    expect(catBw?.children?.length).toBe(1);

    const sopHc = catBw?.children?.[0];
    expect(sopHc?.id).toBe('sop_hc');
    expect(sopHc?.children?.length).toBe(1);

    const brDove = sopHc?.children?.[0];
    expect(brDove?.id).toBe('br_dove');
    expect(brDove?.children?.length).toBe(1);

    const fgDoveSh = brDove?.children?.[0];
    expect(fgDoveSh?.id).toBe('fg_dove_sh');

    // Only the target L5 node is present; sibling 'fu_dove_200' is not included
    expect(fgDoveSh?.children?.length).toBe(1);
    expect(fgDoveSh?.children?.[0].id).toBe('fu_dove_400');
  });

  it('no match returns empty', () => {
    const tree = createTestTree();
    const result = filterTree(tree, 'NonExistentBrandXYZ');
    expect(result).toBeNull();
  });

  it('ancestors are expanded', () => {
    const tree = createTestTree();
    const result = filterTree(tree, 'Conditioner');

    expect(result?.collapsed).toBe(false);
    const catBw = result?.children?.[0];
    expect(catBw?.collapsed).toBe(false);
    const sopHc = catBw?.children?.[0];
    expect(sopHc?.collapsed).toBe(false);
    const brDove = sopHc?.children?.[0];
    expect(brDove?.collapsed).toBe(false);
    const fgDoveSh = brDove?.children?.[0];
    expect(fgDoveSh?.collapsed).toBe(false);
    const fuDove400 = fgDoveSh?.children?.[0];
    expect(fuDove400?.collapsed).toBe(false);
  });

  it('default view expands only the first path and collapses others', () => {
    const tree = createTestTree();
    const defaultTree = applyDefaultExpansion(tree);

    // Root is expanded
    expect(defaultTree.collapsed).toBe(false);
    // First L1 is expanded
    expect(defaultTree.children?.[0]?.collapsed).toBe(false);
    // Other L1 siblings are collapsed
    expect(defaultTree.children?.[1]?.collapsed).toBe(true);

    const firstL1 = defaultTree.children?.[0];
    // First L2 is expanded
    expect(firstL1?.children?.[0].collapsed).toBe(false);
    // Other L2 siblings are collapsed
    expect(firstL1?.children?.[1].collapsed).toBe(true);

    const firstL2 = firstL1?.children?.[0];
    // L3 nodes (Dove, Sunsilk) are collapsed
    expect(firstL2?.children?.[0].collapsed).toBe(true);
    expect(firstL2?.children?.[1].collapsed).toBe(true);
  });

  it('default view expands just the root when root is at level 3 or deeper', () => {
    const l3Root: TreeNodeData = {
      id: 'br_dove',
      name: 'Dove (1)',
      rawName: 'Dove',
      level: 3,
      count: 1,
      children: [
        {
          id: 'fg_1',
          name: 'Forecast Group 1',
          rawName: 'Forecast Group 1',
          level: 4,
          count: 0,
        },
      ],
    };
    const defaultTree = applyDefaultExpansion(l3Root);
    expect(defaultTree.collapsed).toBe(false);
    expect(defaultTree.children?.[0]?.collapsed).toBe(true);
  });
});

