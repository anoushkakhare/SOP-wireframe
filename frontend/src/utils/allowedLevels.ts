import { HierarchyNode, ProductLevelNum } from '../types';
import { LEVELS } from '../constants/hierarchy';

/**
 * allowedLevels: returns which productLevel values (1-5) are selectable
 * given the current scope.
 *
 * Rules:
 * - No scope selected → all 5 levels allowed.
 * - Scope contains nodes → min level = deepest level among selected nodes
 *   (a fully selected parent is treated as itself, not its children).
 * - Allowed levels = [minLevel..5].
 */
export function allowedLevels(
  scope: string[],
  nodes: HierarchyNode[]
): ProductLevelNum[] {
  if (!scope || scope.length === 0) {
    return LEVELS.map(l => l.id as ProductLevelNum);
  }

  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  let deepest = 1;
  for (const id of scope) {
    const n = nodeMap.get(id);
    if (n && n.level > deepest) deepest = n.level;
  }

  return LEVELS
    .filter(l => l.id >= deepest)
    .map(l => l.id as ProductLevelNum);
}

