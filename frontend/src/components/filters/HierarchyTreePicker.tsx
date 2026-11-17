import React, { useState, useMemo, useCallback, KeyboardEvent } from 'react';
import { ChevronRight, ChevronDown, Minus, Check } from 'lucide-react';
import { HierarchyNode } from '../../types';
import { LEVEL_MAP } from '../../constants/hierarchy';

interface HierarchyTreePickerProps {
  nodes: HierarchyNode[];
  value: string[];                        // selected node ids
  onChange: (ids: string[]) => void;
  placeholder?: string;
}

type CheckState = 'checked' | 'unchecked' | 'indeterminate';

function buildChildMap(nodes: HierarchyNode[]): Record<string, string[]> {
  const m: Record<string, string[]> = {};
  for (const n of nodes) {
    if (n.parentId) (m[n.parentId] ||= []).push(n.id);
  }
  return m;
}

function allDescendants(id: string, childMap: Record<string, string[]>): string[] {
  const result: string[] = [];
  const queue = [id];
  while (queue.length) {
    const cur = queue.shift()!;
    const ch = childMap[cur] || [];
    result.push(...ch);
    queue.push(...ch);
  }
  return result;
}

export const HierarchyTreePicker: React.FC<HierarchyTreePickerProps> = ({
  nodes,
  value,
  onChange,
  placeholder = 'Search hierarchy…',
}) => {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const childMap  = useMemo(() => buildChildMap(nodes), [nodes]);
  const nodeById  = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);
  const roots     = useMemo(() => nodes.filter(n => !n.parentId), [nodes]);
  const selected  = useMemo(() => new Set(value), [value]);

  const getCheckState = useCallback((id: string): CheckState => {
    if (selected.has(id)) return 'checked';
    const desc = allDescendants(id, childMap);
    if (desc.length === 0) return 'unchecked';
    const checkedCount = desc.filter(d => selected.has(d)).length;
    if (checkedCount === 0) return 'unchecked';
    if (checkedCount === desc.length) return 'checked';
    return 'indeterminate';
  }, [selected, childMap]);

  const toggle = useCallback((id: string) => {
    const desc = allDescendants(id, childMap);
    const all  = [id, ...desc];
    const cur  = getCheckState(id);

    if (cur === 'checked') {
      // Deselect self + descendants
      onChange(value.filter(v => !all.includes(v)));
    } else {
      // Select self (and deselect descendants – parent covers them)
      const withoutDesc = value.filter(v => !all.includes(v) && !isAncestorSelected(v, id));
      onChange([...new Set([...withoutDesc, id])]);
    }
  }, [value, childMap, getCheckState, onChange]);

  function isAncestorSelected(candidateId: string, targetId: string): boolean {
    // Is targetId an ancestor of candidateId?
    let cur = nodeById.get(candidateId);
    while (cur?.parentId) {
      if (cur.parentId === targetId) return true;
      cur = nodeById.get(cur.parentId);
    }
    return false;
  }

  const selectAll = () => {
    // Select root nodes (covers all)
    onChange(roots.map(r => r.id));
  };

  const reset = () => onChange([]);

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpanded(new Set(nodes.filter(n => childMap[n.id]).map(n => n.id)));
  const collapseAll = () => setExpanded(new Set());

  // Search filter: visible nodes = nodes matching + their ancestors
  const matchIds = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    const matched = new Set<string>();
    for (const n of nodes) {
      if (n.name.toLowerCase().includes(q)) {
        matched.add(n.id);
        // Add ancestors
        let cur = n;
        while (cur.parentId) {
          matched.add(cur.parentId);
          cur = nodeById.get(cur.parentId)!;
          if (!cur) break;
        }
      }
    }
    return matched;
  }, [search, nodes, nodeById]);

  // Auto-expand when searching
  const visibleExpanded = useMemo(() => {
    if (!matchIds) return expanded;
    const ex = new Set(expanded);
    for (const id of matchIds) {
      const n = nodeById.get(id);
      if (n?.parentId) ex.add(id);
    }
    return ex;
  }, [matchIds, expanded, nodeById]);

  function renderNode(nodeId: string, depth = 0): React.ReactNode {
    const n = nodeById.get(nodeId);
    if (!n) return null;
    if (matchIds && !matchIds.has(nodeId)) return null;

    const children = childMap[nodeId] || [];
    const hasChildren = children.length > 0;
    const isExpanded = visibleExpanded.has(nodeId);
    const checkState = getCheckState(nodeId);
    const lv = LEVEL_MAP[n.level];
    const isMatch = matchIds && search && n.name.toLowerCase().includes(search.toLowerCase());

    const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(nodeId); }
      if (e.key === 'ArrowRight' && hasChildren) { setExpanded(p => new Set([...p, nodeId])); }
      if (e.key === 'ArrowLeft' && hasChildren)  { setExpanded(p => { const nx = new Set(p); nx.delete(nodeId); return nx; }); }
    };

    return (
      <div key={nodeId}>
        <div
          className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer hover:bg-primary-50 group ${isMatch ? 'bg-yellow-50' : ''}`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          role="treeitem"
          aria-selected={checkState === 'checked'}
          aria-expanded={hasChildren ? isExpanded : undefined}
          tabIndex={0}
          onKeyDown={handleKey}
          onClick={() => toggle(nodeId)}
        >
          {/* Expand toggle */}
          {hasChildren ? (
            <button
              className="p-0.5 rounded hover:bg-primary-100 shrink-0"
              onClick={e => { e.stopPropagation(); toggleExpand(nodeId); }}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded
                ? <ChevronDown className="w-3 h-3 text-text-secondary" />
                : <ChevronRight className="w-3 h-3 text-text-secondary" />
              }
            </button>
          ) : (
            <span className="w-4 shrink-0" />
          )}

          {/* Tri-state checkbox */}
          <div
            className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors
              ${checkState === 'checked' ? 'bg-primary-700 border-primary-700' : 'border-border bg-surface'}
              ${checkState === 'indeterminate' ? 'bg-primary-100 border-primary-400' : ''}
            `}
            aria-hidden
          >
            {checkState === 'checked' && <Check className="w-2.5 h-2.5 text-white" />}
            {checkState === 'indeterminate' && <Minus className="w-2.5 h-2.5 text-primary-700" />}
          </div>

          {/* Level colour dot */}
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: lv?.color }}
            title={lv?.label}
          />

          {/* Level chip */}
          <span
            className="text-[9px] font-semibold px-1 py-0.5 rounded shrink-0"
            style={{ background: lv?.color + '22', color: lv?.color }}
          >
            L{n.level}
          </span>

          {/* Name */}
          <span className={`text-xs text-text-primary truncate ${isMatch ? 'font-semibold' : ''}`}>
            {n.name}
          </span>
        </div>

        {hasChildren && isExpanded && (
          <div role="group">
            {children.map(cid => renderNode(cid, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Search */}
      <input
        type="search"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder={placeholder}
        className="w-full text-xs px-2.5 py-1.5 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary-400"
        aria-label="Search hierarchy"
      />

      {/* Toolbar */}
      <div className="flex gap-2 text-[10px] text-text-secondary">
        <button className="hover:text-primary-700 underline" onClick={reset}>Reset</button>
        <button className="hover:text-primary-700 underline" onClick={selectAll}>Select all</button>
        <span className="flex-1" />
        <button className="hover:text-primary-700 underline" onClick={expandAll}>Expand all</button>
        <button className="hover:text-primary-700 underline" onClick={collapseAll}>Collapse all</button>
      </div>

      {/* Tree */}
      <div
        className="max-h-64 overflow-y-auto border border-border rounded bg-surface"
        role="tree"
        aria-label="Product hierarchy"
      >
        {roots.map(r => renderNode(r.id, 0))}
        {matchIds && matchIds.size === 0 && (
          <p className="text-xs text-text-secondary p-3 text-center">No matches</p>
        )}
      </div>

      {value.length > 0 && (
        <p className="text-[10px] text-text-secondary">
          {value.length} node{value.length !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  );
};

