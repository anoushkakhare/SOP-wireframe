import { create } from 'zustand';

export type TableMode = 'view' | 'edit' | 'delta';

export interface CellEditKey {
  rowId: string;
  defType: 'opportunity' | 'actualFcst' | 'risk';
  month: string;
}

interface TableState {
  isDockOpen: boolean;
  mode: TableMode;
  // Local edits map: key = `${rowId}_${defType}_${month}`, value = new number
  draftEdits: Record<string, number>;
  savedEdits: Record<string, number>;
  isDesegregated: boolean;
  desegregatedParent?: string;

  toggleDock: () => void;
  openDock: () => void;
  closeDock: () => void;
  setMode: (mode: TableMode) => void;
  setCellEdit: (key: CellEditKey, value: number) => void;
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

  setCellEdit: (key, value) => {
    const editKey = `${key.rowId}_${key.defType}_${key.month}`;
    set((s) => ({
      draftEdits: {
        ...s.draftEdits,
        [editKey]: value,
      },
    }));
  },

  saveEdits: () => {
    const { draftEdits } = get();
    set({
      savedEdits: { ...draftEdits },
      mode: 'view',
    });
  },

  discardEdits: () => {
    const { savedEdits } = get();
    set({
      draftEdits: { ...savedEdits },
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

