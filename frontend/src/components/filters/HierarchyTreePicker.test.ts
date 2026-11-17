import { describe, it, expect } from 'vitest';
import {
  buildChildMap,
  allDescendants,
  getNodeCheckState,
  toggleNode,
  normaliseUpward,
} from './HierarchyTreePicker';
import { HierarchyNode } from '../../types';

const testNodes: HierarchyNode[] = [
  // L1
  { id: 'l1', name: 'Category 1', level: 1, parentId: null },

  // L2
  { id: 'l2_1', name: 'SOP Group 1', level: 2, parentId: 'l1' },
  { id: 'l2_2', name: 'SOP Group 2', level: 2, parentId: 'l1' },

  // L3 under l2_1
  { id: 'l3_1', name: 'Brand 1', level: 3, parentId: 'l2_1' },
  { id: 'l3_2', name: 'Brand 2', level: 3, parentId: 'l2_1' },

  // L4 under l3_1
  { id: 'l4_1', name: 'Forecast Group 1', level: 4, parentId: 'l3_1' },
  { id: 'l4_2', name: 'Forecast Group 2', level: 4, parentId: 'l3_1' },

  // L5 under l4_1
  { id: 'l5_1', name: 'Forecast Unit 1', level: 5, parentId: 'l4_1' },
  { id: 'l5_2', name: 'Forecast Unit 2', level: 5, parentId: 'l4_1' },
];

const childMap = buildChildMap(testNodes);
const nodeById = new Map(testNodes.map(n => [n.id, n]));

describe('HierarchyTreePicker checkbox logic', () => {
  it('select L1 -> every descendant checked', () => {
    let selection = new Set<string>();
    selection = toggleNode('l1', selection, nodeById, childMap);

    // selection should be normalized to just L1
    expect(selection).toEqual(new Set(['l1']));

    // L1 is checked
    expect(getNodeCheckState('l1', selection, nodeById, childMap)).toBe('checked');

    // Every descendant of L1 must render checked
    const descendants = allDescendants('l1', childMap);
    expect(descendants.length).toBe(8);
    for (const descId of descendants) {
      expect(getNodeCheckState(descId, selection, nodeById, childMap)).toBe('checked');
    }
  });

  it('uncheck an L5 -> its ancestors indeterminate, siblings checked', () => {
    // Start with L1 selected
    let selection = new Set(['l1']);

    // Uncheck L5 (l5_1)
    selection = toggleNode('l5_1', selection, nodeById, childMap);

    // l5_1 is unchecked
    expect(getNodeCheckState('l5_1', selection, nodeById, childMap)).toBe('unchecked');

    // Ancestors: l4_1, l3_1, l2_1, l1 are all indeterminate
    const ancestors = ['l4_1', 'l3_1', 'l2_1', 'l1'];
    for (const ancId of ancestors) {
      expect(getNodeCheckState(ancId, selection, nodeById, childMap)).toBe('indeterminate');
    }

    // Siblings on the path are checked:
    // l5_1 sibling is l5_2
    expect(getNodeCheckState('l5_2', selection, nodeById, childMap)).toBe('checked');
    // l4_1 sibling is l4_2
    expect(getNodeCheckState('l4_2', selection, nodeById, childMap)).toBe('checked');
    // l3_1 sibling is l3_2
    expect(getNodeCheckState('l3_2', selection, nodeById, childMap)).toBe('checked');
    // l2_1 sibling is l2_2
    expect(getNodeCheckState('l2_2', selection, nodeById, childMap)).toBe('checked');
  });

  it('uncheck an L3 -> its L4/L5 children unchecked', () => {
    // Start with L1 selected
    let selection = new Set(['l1']);

    // Uncheck L3 (l3_1)
    selection = toggleNode('l3_1', selection, nodeById, childMap);

    // l3_1 is unchecked
    expect(getNodeCheckState('l3_1', selection, nodeById, childMap)).toBe('unchecked');

    // Its L4 and L5 children are unchecked
    const l3_1_descendants = allDescendants('l3_1', childMap);
    expect(l3_1_descendants).toEqual(['l4_1', 'l4_2', 'l5_1', 'l5_2']);
    for (const childId of l3_1_descendants) {
      expect(getNodeCheckState(childId, selection, nodeById, childMap)).toBe('unchecked');
    }

    // Siblings stay checked
    expect(getNodeCheckState('l3_2', selection, nodeById, childMap)).toBe('checked');
    expect(getNodeCheckState('l2_2', selection, nodeById, childMap)).toBe('checked');

    // Ancestors become indeterminate
    expect(getNodeCheckState('l2_1', selection, nodeById, childMap)).toBe('indeterminate');
    expect(getNodeCheckState('l1', selection, nodeById, childMap)).toBe('indeterminate');
  });

  it('re-check all siblings -> collapses back to the parent', () => {
    // Start with L1 selected, then uncheck l5_1
    let selection = new Set(['l1']);
    selection = toggleNode('l5_1', selection, nodeById, childMap);

    // Re-check l5_1 so all siblings are checked
    selection = toggleNode('l5_1', selection, nodeById, childMap);

    // Should collapse all the way back to the root parent
    expect(selection).toEqual(new Set(['l1']));
    expect(getNodeCheckState('l1', selection, nodeById, childMap)).toBe('checked');
    for (const descId of allDescendants('l1', childMap)) {
      expect(getNodeCheckState(descId, selection, nodeById, childMap)).toBe('checked');
    }
  });

  it('selecting never selects other nodes of the same level', () => {
    let selection = new Set<string>();
    // Select l2_1
    selection = toggleNode('l2_1', selection, nodeById, childMap);
    expect(selection).toEqual(new Set(['l2_1']));
    expect(getNodeCheckState('l2_1', selection, nodeById, childMap)).toBe('checked');
    // l2_2 must remain unchecked
    expect(getNodeCheckState('l2_2', selection, nodeById, childMap)).toBe('unchecked');
  });
});
