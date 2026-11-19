import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as echarts from 'echarts';
import { Search, ChevronRight, Plus, Minus, Maximize2, Minimize2 } from 'lucide-react';
import { HierarchyNode } from '../../types';
import { LEVELS, LEVEL_MAP, APG_OPTIONS } from '../../constants/hierarchy';
import { buildCalendarWeeks, getWeekSplitInfo, WeekSplitInfo } from '../../utils/weekSplit';

export type HierarchyMode = 'product' | 'customer' | 'time';

export interface HierarchyNetworkProps {
  mode: HierarchyMode;
  nodes?: HierarchyNode[];
  selectedIds?: string[];
  visibleRange?: { from?: string; to?: string; grain?: string };
  selectedApgs?: string[];
}

export interface TreeNodeData {
  id: string;
  name: string;
  rawName: string;
  level: number;
  count: number;
  isMatch?: boolean;
  collapsed?: boolean;
  children?: TreeNodeData[];
  itemStyle?: any;
  label?: any;
}

export function filterTree(
  root: TreeNodeData | null | undefined,
  query: string
): TreeNodeData | null {
  if (!root) return null;
  const q = query.trim().toLowerCase();
  if (!q) return root;

  const cloneNode = (
    node: TreeNodeData,
    filteredChildren: TreeNodeData[] | undefined,
    isMatch: boolean
  ): TreeNodeData => {
    const levelColor = LEVEL_MAP[node.level]?.color || '#4F4EC6';
    return {
      ...node,
      isMatch,
      collapsed: false,
      count: filteredChildren ? filteredChildren.length : 0,
      children: filteredChildren && filteredChildren.length > 0 ? filteredChildren : undefined,
      itemStyle: {
        ...node.itemStyle,
        color: isMatch ? '#FEF08A' : (node.itemStyle?.color || levelColor),
        borderColor: isMatch ? '#CA8A04' : (node.itemStyle?.borderColor || levelColor),
        borderWidth: isMatch ? 3 : (node.itemStyle?.borderWidth || 1),
      },
      label: {
        ...node.label,
        color: isMatch ? '#854D0E' : (node.label?.color || '#1A1C2E'),
        fontWeight: isMatch ? 'bold' : (node.label?.fontWeight || 'normal'),
        backgroundColor: isMatch ? '#FEF08A' : undefined,
        padding: isMatch ? [2, 4] : undefined,
        borderRadius: isMatch ? 3 : undefined,
      },
    };
  };

  const cloneAllDescendants = (node: TreeNodeData): TreeNodeData => {
    const isDirect = (node.rawName || node.name).toLowerCase().includes(q);
    const children = node.children?.map(cloneAllDescendants);
    return cloneNode(node, children, isDirect);
  };

  const filterNode = (node: TreeNodeData, hasMatchingAncestor: boolean): TreeNodeData | null => {
    const isDirect = (node.rawName || node.name).toLowerCase().includes(q);
    const effectiveAncestorMatch = hasMatchingAncestor || isDirect;

    if (effectiveAncestorMatch) {
      const children = node.children?.map(cloneAllDescendants);
      return cloneNode(node, children, isDirect);
    }

    if (!node.children || node.children.length === 0) {
      return null;
    }

    const filteredChildren: TreeNodeData[] = [];
    for (const child of node.children) {
      const filteredChild = filterNode(child, false);
      if (filteredChild) {
        filteredChildren.push(filteredChild);
      }
    }

    if (filteredChildren.length === 0) {
      return null;
    }

    return cloneNode(node, filteredChildren, false);
  };

  return filterNode(root, false);
}

export function countMatches(node: TreeNodeData | null | undefined): number {
  if (!node) return 0;
  let count = node.isMatch ? 1 : 0;
  if (node.children) {
    for (const child of node.children) {
      count += countMatches(child);
    }
  }
  return count;
}

export function setTreeCollapsed(root: TreeNodeData, collapsed: boolean): TreeNodeData {
  const walk = (n: TreeNodeData): TreeNodeData => ({
    ...n,
    collapsed,
    children: n.children ? n.children.map(walk) : undefined,
  });
  return walk(root);
}

export function applyDefaultExpansion(root: TreeNodeData): TreeNodeData {
  const clone = (node: TreeNodeData): TreeNodeData => ({
    ...node,
    children: node.children ? node.children.map(clone) : undefined,
  });
  const tree = clone(root);

  const walk = (node: TreeNodeData, isRoot: boolean, isFirstPath: boolean) => {
    if (isRoot) {
      node.collapsed = false;
      if (node.level >= 3) {
        if (node.children) {
          for (const child of node.children) {
            walk(child, false, false);
          }
        }
        return;
      }
      if (node.children) {
        node.children.forEach((child, idx) => {
          const nextFirstPath = node.level < 2 && idx === 0;
          walk(child, false, nextFirstPath);
        });
      }
    } else {
      if (isFirstPath) {
        node.collapsed = false;
        if (node.children) {
          node.children.forEach((child, idx) => {
            const nextFirstPath = node.level < 2 && idx === 0;
            walk(child, false, nextFirstPath);
          });
        }
      } else {
        node.collapsed = true;
        if (node.children) {
          for (const child of node.children) {
            walk(child, false, false);
          }
        }
      }
    }
  };

  walk(tree, true, true);
  return tree;
}

export const HierarchyNetwork: React.FC<HierarchyNetworkProps> = ({
  mode,
  nodes = [],
  selectedIds = [],
  visibleRange,
  selectedApgs = [],
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [expandAllToggle, setExpandAllToggle] = useState<boolean | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setSearchQuery('');
    setDebouncedQuery('');
    setExpandAllToggle(null);
  }, [mode]);

  const [expandedTimeNodeIds, setExpandedTimeNodeIds] = useState<Set<string>>(() => {
    // Default expanded to Quarter in Time mode:
    // Year and Half are expanded by default; Quarters and Months start collapsed
    const initial = new Set<string>();
    initial.add('FY25');
    initial.add('FY26');
    initial.add('H1 25');
    initial.add('H2 25');
    initial.add('H1 26');
    initial.add('H2 26');
    return initial;
  });

  // ─── 1. Product Mode Data Preparation ───────────────────────────────────────
  const productData = useMemo(() => {
    if (mode !== 'product' || nodes.length === 0) {
      return { tree: null, ancestors: [], startLevel: 1, matchCount: 0 };
    }

    const nodeById = new Map<string, HierarchyNode>(nodes.map((n) => [n.id, n]));
    const childMap = new Map<string, HierarchyNode[]>();
    for (const n of nodes) {
      if (n.parentId) {
        const list = childMap.get(n.parentId) || [];
        list.push(n);
        childMap.set(n.parentId, list);
      }
    }

    // Determine roots
    const activeSelectedIds = selectedIds && selectedIds.length > 0
      ? selectedIds.filter((id) => nodeById.has(id))
      : [];

    let roots: HierarchyNode[] = [];
    let ancestors: HierarchyNode[] = [];
    let startLevel = 1;

    if (activeSelectedIds.length === 0) {
      // Rooted at all categories (level 1)
      roots = nodes.filter((n) => n.level === 1);
      startLevel = 1;
    } else {
      roots = activeSelectedIds.map((id) => nodeById.get(id)!);
      startLevel = Math.min(...roots.map((r) => r.level));

      // Compute ancestors of the first selected node for breadcrumb
      let curr = roots[0].parentId ? nodeById.get(roots[0].parentId) : null;
      while (curr) {
        ancestors.unshift(curr);
        curr = curr.parentId ? nodeById.get(curr.parentId) : null;
      }
    }

    // Recursive tree builder for full tree
    const buildFullNode = (node: HierarchyNode): TreeNodeData => {
      const childrenNodes = childMap.get(node.id) || [];
      const children = childrenNodes.map(buildFullNode);
      const levelColor = LEVEL_MAP[node.level]?.color || '#4F4EC6';
      const labelText = `${node.name} (${children.length})`;

      return {
        id: node.id,
        name: labelText,
        rawName: node.name,
        level: node.level,
        count: children.length,
        isMatch: false,
        collapsed: false,
        children: children.length > 0 ? children : undefined,
        itemStyle: {
          color: levelColor,
          borderColor: levelColor,
          borderWidth: 1,
        },
        label: {
          color: '#1A1C2E',
          fontWeight: 'normal',
        },
      };
    };

    let fullTree: TreeNodeData;
    if (roots.length === 1 && activeSelectedIds.length > 0) {
      fullTree = buildFullNode(roots[0]);
    } else {
      const builtRoots = roots.map(buildFullNode);
      fullTree = {
        id: 'root-all',
        name: activeSelectedIds.length === 0 ? `All categories (${roots.length})` : `Selected roots (${roots.length})`,
        rawName: activeSelectedIds.length === 0 ? 'All categories' : 'Selected roots',
        level: activeSelectedIds.length === 0 ? 0 : Math.max(0, startLevel - 1),
        count: roots.length,
        isMatch: false,
        collapsed: false,
        children: builtRoots,
        itemStyle: {
          color: '#0F0E9A',
          borderColor: '#0F0E9A',
        },
        label: {
          color: '#1A1C2E',
          fontWeight: 'normal',
        },
      };
    }

    const query = debouncedQuery.trim();
    let tree: TreeNodeData | null = null;
    let matchCount = 0;

    if (query) {
      const filtered = filterTree(fullTree, query);
      matchCount = countMatches(filtered);
      if (filtered) {
        if (expandAllToggle === true) {
          tree = setTreeCollapsed(filtered, false);
        } else if (expandAllToggle === false) {
          tree = setTreeCollapsed(filtered, true);
        } else {
          tree = filtered;
        }
      } else {
        tree = null;
      }
    } else {
      matchCount = 0;
      if (expandAllToggle === true) {
        tree = setTreeCollapsed(fullTree, false);
      } else if (expandAllToggle === false) {
        tree = setTreeCollapsed(fullTree, true);
      } else {
        tree = applyDefaultExpansion(fullTree);
      }
    }

    return { tree, ancestors, startLevel, matchCount };
  }, [mode, nodes, selectedIds, debouncedQuery, expandAllToggle]);

  // ─── 2. Customer Mode Data Preparation ─────────────────────────────────────
  const customerData = useMemo(() => {
    if (mode !== 'customer') return { tree: null, matchCount: 0 };

    const apgChildren: TreeNodeData[] = APG_OPTIONS.map((apgName) => {
      const isSelected = selectedApgs.length === 0 || selectedApgs.includes(apgName);
      return {
        id: apgName,
        name: `${apgName} (0)`,
        rawName: apgName,
        level: 2,
        count: 0,
        isMatch: false,
        collapsed: false,
        itemStyle: {
          color: isSelected ? '#0F0E9A' : '#A3A2E2',
          borderColor: isSelected ? '#0F0E9A' : '#D6D6F1',
        },
        label: {
          color: isSelected ? '#1A1C2E' : '#71717A',
          fontWeight: isSelected ? '500' : 'normal',
        },
      };
    });

    const fullTree: TreeNodeData = {
      id: 'all-apgs',
      name: `All APGs (${apgChildren.length})`,
      rawName: 'All APGs',
      level: 1,
      count: apgChildren.length,
      isMatch: false,
      collapsed: false,
      children: apgChildren,
      itemStyle: {
        color: '#0F0E9A',
        borderColor: '#0F0E9A',
      },
      label: {
        color: '#1A1C2E',
        fontWeight: 'normal',
      },
    };

    const query = debouncedQuery.trim();
    let tree: TreeNodeData | null = null;
    let matchCount = 0;

    if (query) {
      const filtered = filterTree(fullTree, query);
      matchCount = countMatches(filtered);
      if (filtered) {
        if (expandAllToggle === true) {
          tree = setTreeCollapsed(filtered, false);
        } else if (expandAllToggle === false) {
          tree = setTreeCollapsed(filtered, true);
        } else {
          tree = filtered;
        }
      } else {
        tree = null;
      }
    } else {
      matchCount = 0;
      if (expandAllToggle === true) {
        tree = setTreeCollapsed(fullTree, false);
      } else if (expandAllToggle === false) {
        tree = setTreeCollapsed(fullTree, true);
      } else {
        tree = applyDefaultExpansion(fullTree);
      }
    }

    return { tree, matchCount };
  }, [mode, debouncedQuery, expandAllToggle, selectedApgs]);

  // ─── 3. Time Mode Data Preparation ─────────────────────────────────────────
  const timeGraphData = useMemo(() => {
    if (mode !== 'time') return null;

    const weeks = buildCalendarWeeks();

    // Determine target year range from visibleRange or default to FY26
    let targetYears = [2026];
    if (visibleRange?.from?.includes('25') || visibleRange?.to?.includes('25')) {
      targetYears = [2025, 2026];
    } else if (visibleRange?.from?.includes('FY25')) {
      targetYears = [2025];
    }

    const filteredWeeks = weeks.filter((w) => targetYears.includes(w.year));
    const query = searchQuery.trim().toLowerCase();

    // Build hierarchy levels:
    // Level 0: Year (FY25, FY26)
    // Level 1: Half (H1, H2)
    // Level 2: Quarter (Q1, Q2, Q3, Q4)
    // Level 3: Month (Jan..Dec)
    // Level 4: Week (W01..W53)

    interface GraphNode {
      id: string;
      name: string;
      rawName: string;
      level: number;
      col: number;
      x: number;
      y: number;
      isStraddling?: boolean;
      straddlingTooltip?: string;
      isMatch?: boolean;
      hasChildren?: boolean;
      isExpanded?: boolean;
      symbolSize?: number;
      itemStyle?: any;
      label?: any;
      tooltip?: any;
    }

    interface GraphLink {
      source: string;
      target: string;
      isDashed?: boolean;
      lineStyle?: any;
    }

    const yearNodes: string[] = targetYears.map((y) => `FY${String(y).slice(2)}`);
    const halfNodesMap = new Map<string, string[]>(); // year -> halves
    const quarterNodesMap = new Map<string, string[]>(); // half -> quarters
    const monthNodesMap = new Map<string, string[]>(); // quarter -> months
    const weekNodesMap = new Map<string, WeekSplitInfo[]>(); // month -> weeks

    for (const yr of targetYears) {
      const yrStr = `FY${String(yr).slice(2)}`;
      const h1 = `H1 ${String(yr).slice(2)}`;
      const h2 = `H2 ${String(yr).slice(2)}`;
      halfNodesMap.set(yrStr, [h1, h2]);

      quarterNodesMap.set(h1, [`Q1 ${String(yr).slice(2)}`, `Q2 ${String(yr).slice(2)}`]);
      quarterNodesMap.set(h2, [`Q3 ${String(yr).slice(2)}`, `Q4 ${String(yr).slice(2)}`]);

      monthNodesMap.set(`Q1 ${String(yr).slice(2)}`, [`Jan ${String(yr).slice(2)}`, `Feb ${String(yr).slice(2)}`, `Mar ${String(yr).slice(2)}`]);
      monthNodesMap.set(`Q2 ${String(yr).slice(2)}`, [`Apr ${String(yr).slice(2)}`, `May ${String(yr).slice(2)}`, `Jun ${String(yr).slice(2)}`]);
      monthNodesMap.set(`Q3 ${String(yr).slice(2)}`, [`Jul ${String(yr).slice(2)}`, `Aug ${String(yr).slice(2)}`, `Sep ${String(yr).slice(2)}`]);
      monthNodesMap.set(`Q4 ${String(yr).slice(2)}`, [`Oct ${String(yr).slice(2)}`, `Nov ${String(yr).slice(2)}`, `Dec ${String(yr).slice(2)}`]);
    }

    for (const w of filteredWeeks) {
      for (const m of w.months) {
        const list = weekNodesMap.get(m) || [];
        if (!list.some((existing) => existing.wLabel === w.wLabel)) {
          list.push(w);
          weekNodesMap.set(m, list);
        }
      }
    }

    // Determine visible nodes and links based on expandedTimeNodeIds
    const visibleNodes: GraphNode[] = [];
    const visibleLinks: GraphLink[] = [];

    const isExpanded = (id: string) => {
      if (expandAllToggle === true) return true;
      if (expandAllToggle === false) return false;
      return expandedTimeNodeIds.has(id);
    };

    // Columns: Year=0, Half=1, Quarter=2, Month=3, Week=4
    const colX = [60, 200, 360, 520, 700];

    // Collect visible items per column
    const colItems: string[][] = [[], [], [], [], []];

    // Col 0: Years
    for (const y of yearNodes) {
      colItems[0].push(y);
      if (isExpanded(y)) {
        const halves = halfNodesMap.get(y) || [];
        for (const h of halves) {
          colItems[1].push(h);
          visibleLinks.push({ source: y, target: h });
          if (isExpanded(h)) {
            const quarters = quarterNodesMap.get(h) || [];
            for (const q of quarters) {
              colItems[2].push(q);
              visibleLinks.push({ source: h, target: q });
              if (isExpanded(q)) {
                const months = monthNodesMap.get(q) || [];
                for (const m of months) {
                  colItems[3].push(m);
                  visibleLinks.push({ source: q, target: m });
                  if (isExpanded(m)) {
                    const weeksInMonth = weekNodesMap.get(m) || [];
                    for (const w of weeksInMonth) {
                      if (!colItems[4].includes(w.wLabel)) {
                        colItems[4].push(w.wLabel);
                      }
                      const isStraddling = w.months.length > 1;
                      visibleLinks.push({
                        source: m,
                        target: w.wLabel,
                        isDashed: isStraddling,
                        lineStyle: {
                          type: isStraddling ? 'dashed' : 'solid',
                          color: isStraddling ? '#B7791F' : '#CBD5E1',
                          width: isStraddling ? 2 : 1.5,
                        },
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    // Compute max height for neat vertical spacing
    const maxItems = Math.max(1, ...colItems.map((c) => c.length));
    const rowSpacing = 36;
    const totalHeight = Math.max(480, maxItems * rowSpacing + 60);

    // Build GraphNode objects with fixed column coordinates
    for (let c = 0; c < 5; c++) {
      const items = colItems[c];
      const count = items.length;
      items.forEach((id, idx) => {
        const y = ((idx + 1) / (count + 1)) * totalHeight;
        const x = colX[c];

        let rawName = id;
        let countSuffix = '';
        let isStraddling = false;
        let straddlingTooltip: string | undefined = undefined;
        let hasChildren = false;

        if (c === 0) {
          hasChildren = true;
          countSuffix = ` (${halfNodesMap.get(id)?.length || 0})`;
        } else if (c === 1) {
          hasChildren = true;
          countSuffix = ` (${quarterNodesMap.get(id)?.length || 0})`;
        } else if (c === 2) {
          hasChildren = true;
          countSuffix = ` (${monthNodesMap.get(id)?.length || 0})`;
        } else if (c === 3) {
          hasChildren = true;
          countSuffix = ` (${weekNodesMap.get(id)?.length || 0})`;
        } else if (c === 4) {
          const splitInfo = getWeekSplitInfo(id);
          rawName = splitInfo?.wShort || id;
          if (splitInfo?.isStraddling) {
            isStraddling = true;
            straddlingTooltip = splitInfo.tooltip;
          }
        }

        const isMatch = query ? rawName.toLowerCase().includes(query) || id.toLowerCase().includes(query) : false;
        const expanded = isExpanded(id);

        let nodeColor = '#3F6FD8';
        if (c === 0) nodeColor = '#0F0E9A';
        else if (c === 1) nodeColor = '#3F6FD8';
        else if (c === 2) nodeColor = '#1B8A7A';
        else if (c === 3) nodeColor = '#B7791F';
        else if (c === 4) nodeColor = isStraddling ? '#B7791F' : '#8B5CB8';

        let displayName = `${rawName}${countSuffix}`;
        if (isStraddling) {
          displayName = `${rawName} [split]`;
        } else if (hasChildren) {
          displayName = `${rawName}${countSuffix} ${expanded ? '−' : '+'}`;
        }

        visibleNodes.push({
          id,
          name: displayName,
          rawName,
          level: c + 1,
          col: c,
          x,
          y,
          isStraddling,
          straddlingTooltip,
          isMatch,
          hasChildren,
          isExpanded: expanded,
          symbolSize: isStraddling ? 14 : hasChildren ? 12 : 9,
          itemStyle: {
            color: isMatch ? '#EAB308' : nodeColor,
            borderColor: isStraddling ? '#B7791F' : isMatch ? '#CA8A04' : '#FFFFFF',
            borderWidth: isStraddling ? 2 : 1.5,
          },
          label: {
            show: true,
            position: 'right',
            color: isMatch ? '#CA8A04' : isStraddling ? '#B7791F' : '#1A1C2E',
            fontWeight: isMatch || isStraddling ? 'bold' : 'normal',
            fontSize: 11,
          },
          tooltip: straddlingTooltip
            ? {
                formatter: () => `
                  <div class="p-1.5 font-sans">
                    <div class="font-bold text-amber-700">${straddlingTooltip}</div>
                    <div class="text-[10px] text-gray-500 mt-0.5">Straddles two months with proportional daily allocation</div>
                  </div>
                `,
              }
            : undefined,
        });
      });
    }

    return { nodes: visibleNodes, links: visibleLinks, totalHeight };
  }, [mode, visibleRange, searchQuery, expandedTimeNodeIds, expandAllToggle]);

  // ─── 4. ECharts Initialization and Rendering ───────────────────────────────
  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current, undefined, {
        renderer: 'canvas',
      });
    }

    const chart = chartInstanceRef.current;

    if (mode === 'product' || mode === 'customer') {
      const treeRoot = mode === 'product' ? productData.tree : customerData.tree;
      if (!treeRoot) {
        chart.clear();
        return;
      }

      const option: echarts.EChartsOption = {
        tooltip: {
          trigger: 'item',
          triggerOn: 'mousemove',
          backgroundColor: '#FFFFFF',
          borderColor: '#E2E8F0',
          textStyle: { color: '#1A1C2E', fontSize: 12 },
        },
        series: [
          {
            type: 'tree',
            orient: 'LR',
            data: [treeRoot],
            top: '8%',
            left: '12%',
            bottom: '8%',
            right: '20%',
            symbolSize: 9,
            edgeShape: 'curve',
            initialTreeDepth: -1,
            roam: true,
            label: {
              position: 'left',
              verticalAlign: 'middle',
              align: 'right',
              fontSize: 11,
            },
            leaves: {
              label: {
                position: 'right',
                verticalAlign: 'middle',
                align: 'left',
              },
            },
            expandAndCollapse: true,
            animationDuration: 300,
            animationDurationUpdate: 300,
          },
        ],
      };

      chart.setOption(option, true);
    } else if (mode === 'time' && timeGraphData) {
      const option: echarts.EChartsOption = {
        tooltip: {
          trigger: 'item',
          backgroundColor: '#FFFFFF',
          borderColor: '#E2E8F0',
          textStyle: { color: '#1A1C2E', fontSize: 12 },
        },
        series: [
          {
            type: 'graph',
            layout: 'none',
            roam: true,
            edgeSymbol: ['none', 'none'],
            data: timeGraphData.nodes,
            links: timeGraphData.links,
            lineStyle: {
              curveness: 0.15,
            },
            emphasis: {
              focus: 'adjacency',
              lineStyle: {
                width: 3,
              },
            },
            animationDuration: 300,
            animationDurationUpdate: 300,
          },
        ],
      };

      chart.setOption(option, true);

      // Handle click to expand / collapse in Time graph
      const handleClick = (params: any) => {
        if (params.dataType === 'node') {
          const clickedId = params.data.id;
          if (params.data.hasChildren) {
            setExpandedTimeNodeIds((prev) => {
              const next = new Set(prev);
              if (next.has(clickedId)) {
                next.delete(clickedId);
              } else {
                next.add(clickedId);
              }
              return next;
            });
            setExpandAllToggle(null);
          }
        }
      };

      chart.off('click');
      chart.on('click', handleClick);
    }

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && chartRef.current) {
      resizeObserver = new ResizeObserver(() => {
        chart.resize();
      });
      resizeObserver.observe(chartRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [mode, productData, customerData, timeGraphData]);

  // Cleanup chart on unmount
  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  // ─── Controls: Expand All / Collapse All ───────────────────────────────────
  const handleExpandAll = () => {
    setExpandAllToggle(true);
    if (mode === 'time') {
      setExpandedTimeNodeIds((prev) => {
        const next = new Set(prev);
        ['FY25', 'FY26', 'H1 25', 'H2 25', 'H1 26', 'H2 26', 'Q1 25', 'Q2 25', 'Q3 25', 'Q4 25', 'Q1 26', 'Q2 26', 'Q3 26', 'Q4 26', 'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'May 26', 'Jun 26', 'Jul 26', 'Aug 26', 'Sep 26', 'Oct 26', 'Nov 26', 'Dec 26'].forEach(id => next.add(id));
        return next;
      });
    }
  };

  const handleCollapseAll = () => {
    setExpandAllToggle(false);
    if (mode === 'time') {
      setExpandedTimeNodeIds(new Set(['FY25', 'FY26']));
    }
  };

  // ─── Header Columns Aligned to Depth ───────────────────────────────────────
  const renderColumnHeaders = () => {
    if (mode === 'product') {
      const startLvl = productData.startLevel || 1;
      const visibleLevels = LEVELS.filter((lvl) => lvl.id >= startLvl);

      return (
        <div className="flex items-center gap-2 px-6 py-2 bg-surface-header/40 border-b border-border text-xs overflow-x-auto">
          <span className="text-[10px] uppercase font-semibold text-text-secondary tracking-wider mr-2 shrink-0">
            Levels:
          </span>
          {visibleLevels.map((lvl) => (
            <div
              key={lvl.id}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface border border-border shadow-xs shrink-0"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: lvl.color }}
              />
              <span className="text-[11px] font-medium text-text-primary">
                L{lvl.id} {lvl.label}
              </span>
            </div>
          ))}
        </div>
      );
    }

    if (mode === 'customer') {
      return (
        <div className="flex items-center gap-2 px-6 py-2 bg-surface-header/40 border-b border-border text-xs">
          <span className="text-[10px] uppercase font-semibold text-text-secondary tracking-wider mr-2">
            Levels:
          </span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface border border-border shadow-xs">
            <span className="w-2 h-2 rounded-full bg-primary-700 shrink-0" />
            <span className="text-[11px] font-medium text-text-primary">L1 All APGs</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-text-disabled" />
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface border border-border shadow-xs">
            <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />
            <span className="text-[11px] font-medium text-text-primary">L2 Account Planning Group (APG)</span>
          </div>
        </div>
      );
    }

    if (mode === 'time') {
      const timeColumns = [
        { label: 'Year', color: '#0F0E9A' },
        { label: 'Half', color: '#3F6FD8' },
        { label: 'Quarter', color: '#1B8A7A' },
        { label: 'Month', color: '#B7791F' },
        { label: 'Week', color: '#8B5CB8' },
      ];
      return (
        <div className="flex items-center gap-2 px-6 py-2 bg-surface-header/40 border-b border-border text-xs overflow-x-auto">
          <span className="text-[10px] uppercase font-semibold text-text-secondary tracking-wider mr-2 shrink-0">
            Time Grains:
          </span>
          {timeColumns.map((c, i) => (
            <React.Fragment key={c.label}>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface border border-border shadow-xs shrink-0">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                <span className="text-[11px] font-medium text-text-primary">{c.label}</span>
              </div>
              {i < timeColumns.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5 text-text-disabled shrink-0" />
              )}
            </React.Fragment>
          ))}
          <div className="ml-auto flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Split weeks connected to both parent months</span>
          </div>
        </div>
      );
    }

    return null;
  };

  // ─── Ancestor Breadcrumb for Product Mode ──────────────────────────────────
  const renderAncestorsBreadcrumb = () => {
    if (mode !== 'product' || productData.ancestors.length === 0) return null;

    return (
      <div className="flex items-center gap-1.5 px-6 py-2 bg-primary-50/50 border-b border-border text-xs text-text-secondary overflow-x-auto">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-text-disabled mr-1 shrink-0">
          Ancestors:
        </span>
        {productData.ancestors.map((anc, idx) => {
          const color = LEVEL_MAP[anc.level]?.color || '#666';
          return (
            <React.Fragment key={anc.id}>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface border border-border shrink-0">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="font-medium text-text-primary">{anc.name}</span>
                <span className="text-[10px] text-text-disabled">L{anc.level}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-text-disabled shrink-0" />
            </React.Fragment>
          );
        })}
        <span className="text-primary-700 font-semibold px-1 shrink-0">
          {productData.tree?.rawName} (Root)
        </span>
      </div>
    );
  };

  const activeMatchCount = mode === 'product' ? productData.matchCount : mode === 'customer' ? customerData.matchCount : 0;

  return (
    <div className="w-full h-full flex flex-col bg-surface rounded-card overflow-hidden">
      {/* ── Top Controls Bar: Search, Expand All, Collapse All ── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-surface-header/60 gap-4">
        {/* Search */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-text-secondary absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                if (!val.trim()) {
                  setDebouncedQuery('');
                }
                setExpandAllToggle(null);
              }}
              placeholder={
                mode === 'product'
                  ? 'Search products, brands, units…'
                  : mode === 'customer'
                    ? 'Search APG…'
                    : 'Search period (e.g. W05, Jan, Q1)…'
              }
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-surface border border-border rounded-card focus:outline-none focus:ring-1 focus:ring-primary-500 text-text-primary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setDebouncedQuery('');
                  setExpandAllToggle(null);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-primary text-xs"
              >
                ✕
              </button>
            )}
          </div>
          {debouncedQuery.trim() && (mode === 'product' || mode === 'customer') && (
            <span
              className={`text-xs whitespace-nowrap font-medium ${
                activeMatchCount === 0 ? 'text-text-disabled italic' : 'text-text-secondary'
              }`}
            >
              {activeMatchCount === 0 ? 'No matches' : `${activeMatchCount} matches`}
            </span>
          )}
        </div>

        {/* Expand / Collapse Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExpandAll}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-card border border-border bg-surface hover:bg-hover text-text-primary transition-colors shadow-xs"
            title="Expand all nodes"
          >
            <Plus className="w-3.5 h-3.5 text-text-secondary" />
            <span>Expand all</span>
          </button>
          <button
            type="button"
            onClick={handleCollapseAll}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-card border border-border bg-surface hover:bg-hover text-text-primary transition-colors shadow-xs"
            title="Collapse all nodes"
          >
            <Minus className="w-3.5 h-3.5 text-text-secondary" />
            <span>Collapse all</span>
          </button>
        </div>
      </div>

      {/* ── Ancestors Breadcrumb (Product mode) ── */}
      {renderAncestorsBreadcrumb()}

      {/* ── Column Headers Aligned to Depth ── */}
      {renderColumnHeaders()}

      {/* ── ECharts Canvas Container ── */}
      <div className="flex-1 w-full min-h-[460px] relative bg-surface p-2">
        <div
          ref={chartRef}
          className={`w-full h-full min-h-[460px] ${
            debouncedQuery.trim() && activeMatchCount === 0 && (mode === 'product' || mode === 'customer')
              ? 'invisible'
              : ''
          }`}
        />
        {debouncedQuery.trim() && activeMatchCount === 0 && (mode === 'product' || mode === 'customer') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-text-secondary p-6">
            <p className="text-sm font-medium">No matches</p>
            <p className="text-xs text-text-disabled mt-1">
              No hierarchy nodes match &ldquo;{debouncedQuery}&rdquo;
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

