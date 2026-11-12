import { create } from 'zustand';
import { FilterState } from '../types';
import { monthIndexToDateString } from '../utils/dateRange';

const initialFilters: FilterState = {
  timeRange: [12, 23], // Jan 2026 - Dec 2026
  startDate: 'Jan 2026',
  endDate: 'Dec 2026',
  categories: [],
  brands: [],
  products: [],
  customerGroups: [],
  customers: [],
  businessUnits: [],
};

interface FilterStoreState {
  appliedFilters: FilterState;
  draftFilters: FilterState;
  setDraftFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  setTimeRangeDraft: (range: [number, number]) => void;
  applyFilters: () => void;
  resetDraft: () => void;
  resetAll: () => void;
}

export const useFilterStore = create<FilterStoreState>((set) => ({
  appliedFilters: { ...initialFilters },
  draftFilters: { ...initialFilters },

  setDraftFilter: (key, value) => {
    set((state) => ({
      draftFilters: {
        ...state.draftFilters,
        [key]: value,
      },
    }));
  },

  setTimeRangeDraft: (range: [number, number]) => {
    const [startIdx, endIdx] = range;
    set((state) => ({
      draftFilters: {
        ...state.draftFilters,
        timeRange: range,
        startDate: monthIndexToDateString(startIdx),
        endDate: monthIndexToDateString(endIdx),
      },
    }));
  },

  applyFilters: () => {
    set((state) => ({
      appliedFilters: { ...state.draftFilters },
    }));
  },

  resetDraft: () => {
    set({
      draftFilters: { ...initialFilters },
    });
  },

  resetAll: () => {
    set({
      appliedFilters: { ...initialFilters },
      draftFilters: { ...initialFilters },
    });
  },
}));

