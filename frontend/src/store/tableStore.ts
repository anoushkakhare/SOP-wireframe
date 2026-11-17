import { create } from 'zustand';

export type TableMode = 'view' | 'edit' | 'delta';

export interface DraftCellEdit {
  forecastUnit: string;
  apg: string;
  period: string;
  forecast?: number;
  opportunity?: number;
  risk?: number;
  fuId?: string;
  brand?: string;
  category?: string;
  sop?: string;
  forecastGroup?: string;
  unitsPerCase?: number;
  price?: number;
}

export interface CellEditKey {
  forecastUnit: string;
  apg: string;
  period: string;
  defType: 'opportunity' | 'actualFcst' | 'risk' | 'forecast';
  rowMeta?: Partial<DraftCellEdit>;
}

interface TableState {
  isDockOpen: boolean;
  mode: TableMode;
  draftEdits: Record<string, DraftCellEdit>;
  savedEdits: Record<string, DraftCellEdit>;
  isDesegregated: boolean;
  desegregatedParent?: string;

  toggleDock: () => void;
  openDock: () => void;
  closeDock: () => void;
  setMode: (mode: TableMode) => void;
  setCellEdit: (key: CellEditKey, deltaBase: number) => void;
  revertCellEdit: (key: CellEditKey) => void;
  saveEdits: () => void;
  discardEdits: () => void;
  hasUnsavedEdits: () => boolean;
  setDesegregated: (desegregated: boolean, parent?: string) => void;
}

export function makeDraftKey(forecastUnit: string, apg: string, period: string): string {
  return `${forecastUnit}__${apg}__${period}`;
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

  setCellEdit: (key, deltaBase) => {
    const draftKey = makeDraftKey(key.forecastUnit, key.apg, key.period);
    const field: 'forecast' | 'opportunity' | 'risk' =
      key.defType === 'actualFcst' ? 'forecast' : (key.defType as any);

    set((s) => {
      const existing = s.draftEdits[draftKey] || {
        forecastUnit: key.forecastUnit,
        apg: key.apg,
        period: key.period,
        ...key.rowMeta,
      };

      if (deltaBase === 0) {
        const updated = { ...existing };
        delete updated[field];
        const nextEdits = { ...s.draftEdits };
        if (!updated.forecast && !updated.opportunity && !updated.risk) {
          delete nextEdits[draftKey];
        } else {
          nextEdits[draftKey] = updated;
        }
        return { draftEdits: nextEdits };
      }

      return {
        draftEdits: {
          ...s.draftEdits,
          [draftKey]: {
            ...existing,
            ...key.rowMeta,
            forecastUnit: key.forecastUnit,
            apg: key.apg,
            period: key.period,
            [field]: deltaBase,
          },
        },
      };
    });
  },

  revertCellEdit: (key) => {
    const draftKey = makeDraftKey(key.forecastUnit, key.apg, key.period);
    const field: 'forecast' | 'opportunity' | 'risk' =
      key.defType === 'actualFcst' ? 'forecast' : (key.defType as any);

    set((s) => {
      const existing = s.draftEdits[draftKey];
      if (!existing) return s;
      const updated = { ...existing };
      delete updated[field];
      const nextEdits = { ...s.draftEdits };
      if (!updated.forecast && !updated.opportunity && !updated.risk) {
        delete nextEdits[draftKey];
      } else {
        nextEdits[draftKey] = updated;
      }
      return { draftEdits: nextEdits };
    });
  },

  saveEdits: () => {
    const { draftEdits } = get();
    set({
      savedEdits: JSON.parse(JSON.stringify(draftEdits)),
      draftEdits: {},
      mode: 'view',
    });
  },

  discardEdits: () => {
    set({
      draftEdits: {},
      savedEdits: {},
      mode: 'view',
    });
  },

  hasUnsavedEdits: () => {
    const { draftEdits } = get();
    return Object.keys(draftEdits).length > 0;
  },

  setDesegregated: (desegregated, parent) => {
    set({
      isDesegregated: desegregated,
      desegregatedParent: parent,
    });
  },
}));
