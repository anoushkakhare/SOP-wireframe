import { create } from 'zustand';
import { FilterState, TimeGrain } from '../types';
import {
  monthIndexToDateString,
  getGrainPeriods,
  getDefaultRangeForGrain,
} from '../utils/dateRange';
import { useUiStore } from './uiStore';

const defMonth = getDefaultRangeForGrain('month');

const initialFilters: FilterState = {
  timeRange: defMonth.range,
  startDate: defMonth.from,
  endDate: defMonth.to,
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
  setTimeRangeDraft: (range: [number, number], grain?: TimeGrain | string) => void;
  syncWithGrain: (grain: TimeGrain | string) => void;
  applyFilters: () => void;
  resetDraft: () => void;
  resetAll: () => void;
}

export const useFilterStore = create<FilterStoreState>((set, get) => ({
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

  setTimeRangeDraft: (range: [number, number], grain?: TimeGrain | string) => {
    let [startIdx, endIdx] = range;
    const periods = getGrainPeriods(grain);

    startIdx = Math.max(0, Math.min(periods.length - 1, startIdx));
    endIdx = Math.max(startIdx, Math.min(periods.length - 1, endIdx));

    // Cap at 104 periods
    if (endIdx - startIdx + 1 > 104) {
      endIdx = startIdx + 103;
      useUiStore.getState().addToast('Time range capped at 104 periods', 'info');
    }

    const clampedRange: [number, number] = [startIdx, endIdx];
    set((state) => ({
      draftFilters: {
        ...state.draftFilters,
        timeRange: clampedRange,
        startDate: monthIndexToDateString(startIdx, grain),
        endDate: monthIndexToDateString(endIdx, grain),
      },
    }));
  },

  syncWithGrain: (grain: TimeGrain | string) => {
    const def = getDefaultRangeForGrain(grain);
    set((state) => ({
      appliedFilters: {
        ...state.appliedFilters,
        timeRange: def.range,
        startDate: def.from,
        endDate: def.to,
      },
      draftFilters: {
        ...state.draftFilters,
        timeRange: def.range,
        startDate: def.from,
        endDate: def.to,
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
