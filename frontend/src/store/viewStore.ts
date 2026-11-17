/**
 * viewStore – single source of truth for all header/view selections.
 * Persisted with zustand persist + version bump.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProductLevelNum, Uom, TimeGrain, HierarchyNode } from '../types';
import { APG_OPTIONS } from '../constants/hierarchy';

export type CustomerViewOption = 'apg';

export interface CompareState {
  on: boolean;
  b: string;
}

export interface DrillState {
  level: ProductLevelNum;
  scope: string[];
}

interface ViewState {
  productLevel: ProductLevelNum;
  scope: string[];          // selected node ids (empty = all)
  customerView: CustomerViewOption;
  measure: Uom;
  timeGrain: TimeGrain;
  apg: string[];            // selected APG values (empty = all)
  drillHistory: DrillState[];
  compare: CompareState;

  setProductLevel: (level: ProductLevelNum) => void;
  setScope: (ids: string[]) => void;
  setCustomerView: (v: CustomerViewOption) => void;
  setMeasure: (m: Uom) => void;
  setTimeGrain: (grain: TimeGrain) => void;
  setApg: (apg: string[]) => void;
  setCompare: (compare: CompareState | boolean, b?: string) => void;
  drillDown: (nodeId: string, childLevel?: ProductLevelNum) => void;
  drillUp: (parentScopeOrNodes?: string[] | HierarchyNode[], parentLevel?: ProductLevelNum) => void;
  resetHeaderOnly: () => void;
}

const DEFAULT: Pick<ViewState, 'productLevel' | 'customerView' | 'measure' | 'timeGrain'> = {
  productLevel: 3,
  customerView: 'apg',
  measure: 'units',
  timeGrain: 'month',
};

export const useViewStore = create<ViewState>()(
  persist(
    (set) => ({
      productLevel: DEFAULT.productLevel,
      scope: [],
      customerView: DEFAULT.customerView,
      measure: DEFAULT.measure,
      timeGrain: DEFAULT.timeGrain,
      apg: [],
      drillHistory: [],
      compare: { on: false, b: '' },

      setProductLevel: (level) => set({ productLevel: level }),
      setScope: (ids) => set({ scope: ids }),
      setCustomerView: (v) => set({ customerView: v }),
      setMeasure: (m) => set({ measure: m }),
      setTimeGrain: (grain) => set({ timeGrain: grain }),
      setApg: (apg) => set({ apg }),
      setCompare: (compare, b) =>
        set((state) => {
          if (typeof compare === 'boolean') {
            return { compare: { on: compare, b: b ?? (compare ? state.compare.b : '') } };
          }
          return { compare };
        }),

      drillDown: (nodeId, childLevel) =>
        set((state) => ({
          drillHistory: [...state.drillHistory, { level: state.productLevel, scope: state.scope }],
          productLevel: (childLevel ?? Math.min(state.productLevel + 1, 5)) as ProductLevelNum,
          scope: [nodeId],
        })),

      drillUp: (parentScopeOrNodes, parentLevel) =>
        set((state) => {
          if (parentLevel !== undefined && Array.isArray(parentScopeOrNodes)) {
            return { scope: parentScopeOrNodes as string[], productLevel: parentLevel };
          }
          if (state.drillHistory.length > 0) {
            const last = state.drillHistory[state.drillHistory.length - 1];
            return {
              drillHistory: state.drillHistory.slice(0, -1),
              productLevel: last.level,
              scope: last.scope,
            };
          }
          const prevLevel = Math.max(state.productLevel - 1, 1) as ProductLevelNum;
          const nodes = Array.isArray(parentScopeOrNodes) ? (parentScopeOrNodes as HierarchyNode[]) : undefined;
          const parentIds = nodes
            ? [...new Set(state.scope.map((id) => nodes.find((n) => n.id === id)?.parentId).filter((id): id is string => !!id))]
            : [];
          return {
            productLevel: prevLevel,
            scope: parentIds,
          };
        }),

      resetHeaderOnly: () =>
        set({
          productLevel: DEFAULT.productLevel,
          customerView: DEFAULT.customerView,
          measure: DEFAULT.measure,
          timeGrain: DEFAULT.timeGrain,
          // scope and apg intentionally NOT reset
        }),
    }),
    {
      name: 'view-store-v3',
      version: 3,
    }
  )
);
