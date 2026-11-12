import { create } from 'zustand';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface UiState {
  isFilterDrawerOpen: boolean;
  isScenarioDrawerOpen: boolean;
  isSaveScenarioModalOpen: boolean;
  isCommitModalOpen: boolean;
  isDiscardConfirmModalOpen: boolean;
  deleteScenarioTarget: { id: string; name: string } | null;
  fullscreenChartId: string | null;
  toasts: ToastItem[];

  setFilterDrawerOpen: (open: boolean) => void;
  setScenarioDrawerOpen: (open: boolean) => void;
  setSaveScenarioModalOpen: (open: boolean) => void;
  setCommitModalOpen: (open: boolean) => void;
  setDiscardConfirmModalOpen: (open: boolean) => void;
  setDeleteScenarioTarget: (target: { id: string; name: string } | null) => void;
  setFullscreenChartId: (id: string | null) => void;

  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isFilterDrawerOpen: false,
  isScenarioDrawerOpen: false,
  isSaveScenarioModalOpen: false,
  isCommitModalOpen: false,
  isDiscardConfirmModalOpen: false,
  deleteScenarioTarget: null,
  fullscreenChartId: null,
  toasts: [],

  setFilterDrawerOpen: (open) => set({ isFilterDrawerOpen: open }),
  setScenarioDrawerOpen: (open) => set({ isScenarioDrawerOpen: open }),
  setSaveScenarioModalOpen: (open) => set({ isSaveScenarioModalOpen: open }),
  setCommitModalOpen: (open) => set({ isCommitModalOpen: open }),
  setDiscardConfirmModalOpen: (open) => set({ isDiscardConfirmModalOpen: open }),
  setDeleteScenarioTarget: (target) => set({ deleteScenarioTarget: target }),
  setFullscreenChartId: (id) => set({ fullscreenChartId: id }),

  addToast: (message, type = 'success') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4000);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
