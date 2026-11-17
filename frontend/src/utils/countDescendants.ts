import { HierarchyNode } from '../types';
import { LEVEL_MAP } from '../constants/hierarchy';

export interface DescendantCounts {
  selectedNames: string[];
  level: number;
  levelColor: string;
  countsByLevel: Record<number, number>;
  summary: string;
  selectedNodes: HierarchyNode[];
  descendantNodes: HierarchyNode[];
}

/**
 * Pure helper to compute selection counts and summary from hierarchy nodes.
 */
export function countDescendants(
  scope: string[] = [],
  nodes: HierarchyNode[] = []
): DescendantCounts {
  const selectedNodes = scope && scope.length > 0
    ? nodes.filter(n => scope.includes(n.id))
    : [];

  if (selectedNodes.length === 0) {
    const brandsCount = nodes.filter(n => n.level === 3).length;
    const unitsCount = nodes.filter(n => n.level === 5).length;
    return {
      selectedNames: ['All categories'],
      level: 1,
      levelColor: LEVEL_MAP[1]?.color || '#0F0E9A',
      countsByLevel: { 3: brandsCount, 5: unitsCount },
      summary: `All categories · ${brandsCount} brands · ${unitsCount} forecast units`,
      selectedNodes: [],
      descendantNodes: nodes,
    };
  }

  // Find all descendants recursively
  const childMap: Record<string, HierarchyNode[]> = {};
  for (const n of nodes) {
    if (n.parentId) {
      (childMap[n.parentId] ||= []).push(n);
    }
  }

  const descendantNodes: HierarchyNode[] = [];
  const queue = [...selectedNodes];
  const visited = new Set<string>(selectedNodes.map(n => n.id));

  while (queue.length > 0) {
    const cur = queue.shift()!;
    const children = childMap[cur.id] || [];
    for (const child of children) {
      if (!visited.has(child.id)) {
        visited.add(child.id);
        descendantNodes.push(child);
        queue.push(child);
      }
    }
  }

  const countsByLevel: Record<number, number> = {};
  for (const n of descendantNodes) {
    countsByLevel[n.level] = (countsByLevel[n.level] || 0) + 1;
  }

  const primaryLevel = selectedNodes[0].level;
  const levelColor = LEVEL_MAP[primaryLevel]?.color || '#1B8A7A';

  let namesStr = '';
  if (selectedNodes.length === 1) {
    namesStr = selectedNodes[0].name;
  } else if (selectedNodes.length === 2) {
    namesStr = `${selectedNodes[0].name}, ${selectedNodes[1].name}`;
  } else {
    namesStr = `${selectedNodes[0].name}, ${selectedNodes[1].name} +${selectedNodes.length - 2} more`;
  }

  const parts: string[] = [namesStr];
  for (let l = primaryLevel + 1; l <= 5; l++) {
    const count = countsByLevel[l] || 0;
    if (count > 0) {
      if (l === 2) parts.push(`${count} S&OP group${count === 1 ? '' : 's'}`);
      else if (l === 3) parts.push(`${count} brand${count === 1 ? '' : 's'}`);
      else if (l === 4) parts.push(`${count} forecast group${count === 1 ? '' : 's'}`);
      else if (l === 5) parts.push(`${count} unit${count === 1 ? '' : 's'}`);
    }
  }

  return {
    selectedNames: selectedNodes.map(n => n.name),
    level: primaryLevel,
    levelColor,
    countsByLevel,
    summary: parts.join(' · '),
    selectedNodes,
    descendantNodes,
  };
}
