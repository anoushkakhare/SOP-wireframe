/**
 * viewStore – single source of truth for all header/view selections.
 * Persisted with zustand persist + version bump.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProductLevelNum, Uom } from '../types';
import { APG_OPTIONS } from '../constants/hierarchy';

export type CustomerViewOption = 'apg';

interface ViewState {
  productLevel: ProductLevelNum;
  scope: string[];          // selected node ids (empty = all)
  customerView: CustomerViewOption;
  measure: Uom;
  apg: string[];            // selected APG values (empty = all)

  setProductLevel: (level: ProductLevelNum) => void;
  setScope: (ids: string[]) => void;
  setCustomerView: (v: CustomerViewOption) => void;
  setMeasure: (m: Uom) => void;
  setApg: (apg: string[]) => void;
  drillDown: (nodeId: string, childLevel: ProductLevelNum) => void;
  drillUp: (parentScope: string[], parentLevel: ProductLevelNum) => void;
  resetHeaderOnly: () => void;
}

const DEFAULT: Pick<ViewState, 'productLevel' | 'customerView' | 'measure'> = {
  productLevel: 3,
  customerView: 'apg',
  measure: 'units',
};

export const useViewStore = create<ViewState>()(
  persist(
    (set) => ({
      productLevel: DEFAULT.productLevel,
      scope: [],
      customerView: DEFAULT.customerView,
      measure: DEFAULT.measure,
      apg: [],

      setProductLevel: (level) => set({ productLevel: level }),
      setScope: (ids) => set({ scope: ids }),
      setCustomerView: (v) => set({ customerView: v }),
      setMeasure: (m) => set({ measure: m }),
      setApg: (apg) => set({ apg }),

      drillDown: (nodeId, childLevel) =>
        set({ scope: [nodeId], productLevel: childLevel }),

      drillUp: (parentScope, parentLevel) =>
        set({ scope: parentScope, productLevel: parentLevel }),

      resetHeaderOnly: () =>
        set({
          productLevel: DEFAULT.productLevel,
          customerView: DEFAULT.customerView,
          measure: DEFAULT.measure,
          // scope and apg intentionally NOT reset
        }),
    }),
    {
      name: 'view-store-v2',
      version: 2,
    }
  )
);

