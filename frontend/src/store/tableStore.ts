import { create } from 'zustand';

export type TableMode = 'view' | 'edit' | 'delta';

export interface CellDelta {
  period?: string;
  forecast?: number;
  opportunity?: number;
  risk?: number;
  forecastMeasure?: number;
  opportunityMeasure?: number;
  riskMeasure?: number;
}

export interface CellEditKey {
  rowId: string;
  defType: 'opportunity' | 'actualFcst' | 'risk' | 'forecast';
  month: string;
}

interface TableState {
  isDockOpen: boolean;
  mode: TableMode;
  draftEdits: Record<string, CellDelta>;
  savedEdits: Record<string, CellDelta>;
  isDesegregated: boolean;
  desegregatedParent?: string;

  toggleDock: () => void;
  openDock: () => void;
  closeDock: () => void;
  setMode: (mode: TableMode) => void;
  setCellEdit: (key: CellEditKey, deltaBase: number, deltaMeasure?: number) => void;
  revertCellEdit: (key: CellEditKey) => void;
  saveEdits: () => void;
  discardEdits: () => void;
  hasUnsavedEdits: () => boolean;
  setDesegregated: (desegregated: boolean, parent?: string) => void;
}

export const useTableStore = create<TableState>((set, get) => ({
  isDockOpen: false,
  mode: 'view',
  draftEdits: {},
  savedEdits: {},
  isDesegregated: false,
  desegregatedParent: undefined,

  toggleDock: () => set((s) => ({ isDockOpen: !s.isDockOpen })),
  openDock: () => set({ isDockOpen: true }),
  closeDock: () => set({ isDockOpen: false }),

  setMode: (mode) => set({ mode }),

  setCellEdit: (key, deltaBase, deltaMeasure) => {
    const cellKey = `${key.rowId}_${key.month}`;
    const field: 'forecast' | 'opportunity' | 'risk' =
      key.defType === 'actualFcst' ? 'forecast' : (key.defType as any);
    const measureField =
      field === 'forecast'
        ? 'forecastMeasure'
        : field === 'opportunity'
        ? 'opportunityMeasure'
        : 'riskMeasure';

    set((s) => {
      const existing = s.draftEdits[cellKey] || {};
      if (deltaBase === 0 && (deltaMeasure ?? 0) === 0) {
        const updated = { ...existing };
        delete updated[field];
        delete updated[measureField];
        const nextEdits = { ...s.draftEdits };
        if (!updated.forecast && !updated.opportunity && !updated.risk) {
          delete nextEdits[cellKey];
        } else {
          nextEdits[cellKey] = updated;
        }
        return { draftEdits: nextEdits };
      }
      return {
        draftEdits: {
          ...s.draftEdits,
          [cellKey]: {
            ...existing,
            period: key.month,
            [field]: deltaBase,
            [measureField]: deltaMeasure ?? deltaBase,
          },
        },
      };
    });
  },

  revertCellEdit: (key) => {
    const cellKey = `${key.rowId}_${key.month}`;
    const field: 'forecast' | 'opportunity' | 'risk' =
      key.defType === 'actualFcst' ? 'forecast' : (key.defType as any);
    const measureField =
      field === 'forecast'
        ? 'forecastMeasure'
        : field === 'opportunity'
        ? 'opportunityMeasure'
        : 'riskMeasure';

    set((s) => {
      const existing = s.draftEdits[cellKey];
      if (!existing) return s;
      const updated = { ...existing };
      delete updated[field];
      delete updated[measureField];
      const nextEdits = { ...s.draftEdits };
      if (!updated.forecast && !updated.opportunity && !updated.risk) {
        delete nextEdits[cellKey];
      } else {
        nextEdits[cellKey] = updated;
      }
      return { draftEdits: nextEdits };
    });
  },

  saveEdits: () => {
    const { draftEdits } = get();
    set({
      savedEdits: JSON.parse(JSON.stringify(draftEdits)),
      mode: 'view',
    });
  },

  discardEdits: () => {
    const { savedEdits } = get();
    set({
      draftEdits: JSON.parse(JSON.stringify(savedEdits)),
      mode: 'view',
    });
  },

  hasUnsavedEdits: () => {
    const { draftEdits, savedEdits } = get();
    return JSON.stringify(draftEdits) !== JSON.stringify(savedEdits);
  },

  setDesegregated: (desegregated, parent) => {
    set({
      isDesegregated: desegregated,
      desegregatedParent: parent,
    });
  },
}));

