import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FilterState, TimeGrain } from '../types';
import {
  monthIndexToDateString,
  getGrainPeriods,
  getDefaultRangeForGrain,
} from '../utils/dateRange';

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
  planningCycle: 'Current cycle',
  activity: 'Demand driver',
};

function clampStoredFilters(filters: FilterState): FilterState {
  if (!filters) return { ...initialFilters };
  const grain = 'month';
  const periods = getGrainPeriods(grain);
  const def = getDefaultRangeForGrain(grain);

  let [startIdx, endIdx] = Array.isArray(filters.timeRange) ? filters.timeRange : def.range;
  const startDate = filters.startDate;
  const endDate = filters.endDate;

  const is19xx = (str?: string) => typeof str === 'string' && (str.includes('19') || str.includes('1900'));

  if (
    is19xx(startDate) ||
    is19xx(endDate) ||
    typeof startIdx !== 'number' ||
    typeof endIdx !== 'number' ||
    startIdx < 0 ||
    startIdx >= periods.length - 1 ||
    endIdx <= startIdx ||
    endIdx >= periods.length
  ) {
    return {
      ...filters,
      timeRange: def.range,
      startDate: def.from,
      endDate: def.to,
    };
  }

  // 104-period clamp
  if (endIdx - startIdx + 1 > 104) {
    endIdx = startIdx + 103;
  }

  return {
    ...filters,
    timeRange: [startIdx, endIdx],
    startDate: startDate || periods[startIdx],
    endDate: endDate || periods[endIdx],
  };
}

// Clean up legacy store keys if any
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const legacyKeys = ['filter-store', 'filter-store-v1', 'filter_store'];
    for (const key of legacyKeys) {
      if (window.localStorage.getItem(key)) {
        window.localStorage.removeItem(key);
      }
    }
  } catch {}
}

interface FilterStoreState {
  appliedFilters: FilterState;
  draftFilters: FilterState;
  setDraftFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  setTimeRangeDraft: (range: [number, number], grain?: TimeGrain | string) => void;
  syncWithGrain: (grain: TimeGrain | string) => void;
  applyFilters: () => void;
  resetDraft: (grain?: TimeGrain | string) => void;
  discardDraft: () => void;
  resetAll: () => void;
}

export const useFilterStore = create<FilterStoreState>()(
  persist(
    (set, get) => ({
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

        startIdx = Math.max(0, Math.min(periods.length - 2, startIdx));
        endIdx = Math.max(startIdx + 1, Math.min(periods.length - 1, endIdx));

        // 104-period clamp
        if (endIdx - startIdx + 1 > 104) {
          endIdx = startIdx + 103;
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

      resetDraft: (grain?: TimeGrain | string) => {
        const def = grain ? getDefaultRangeForGrain(grain) : defMonth;
        set({
          draftFilters: {
            ...initialFilters,
            timeRange: def.range,
            startDate: def.from,
            endDate: def.to,
          },
        });
      },

      discardDraft: () => {
        set((state) => ({
          draftFilters: { ...state.appliedFilters },
        }));
      },

      resetAll: () => {
        set({
          appliedFilters: { ...initialFilters },
          draftFilters: { ...initialFilters },
        });
      },
    }),
    {
      name: 'filter-store-v2',
      version: 2,
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.appliedFilters = clampStoredFilters(state.appliedFilters);
        state.draftFilters = clampStoredFilters(state.draftFilters);
      },
    }
  )
);
