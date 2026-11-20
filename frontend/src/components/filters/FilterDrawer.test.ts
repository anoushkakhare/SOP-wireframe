import { describe, it, expect, beforeEach } from 'vitest';
import { useFilterStore } from '../../store/filterStore';
import { useViewStore } from '../../store/viewStore';

describe('Filter drawer state logic', () => {
  beforeEach(() => {
    useFilterStore.getState().resetAll();
    useViewStore.getState().setScope([]);
    useViewStore.getState().setApg([]);
  });

  it('Reset clears draft only and does not change applied filters', () => {
    const store = useFilterStore.getState();

    // Set some applied filters
    useFilterStore.setState({
      appliedFilters: {
        ...store.appliedFilters,
        planningCycle: 'MRF',
        activity: 'Business activity',
      },
      draftFilters: {
        ...store.appliedFilters,
        planningCycle: 'MRF',
        activity: 'Business activity',
      },
    });

    expect(useFilterStore.getState().appliedFilters.planningCycle).toBe('MRF');

    // Call resetDraft
    useFilterStore.getState().resetDraft('month');

    // Draft is reset to defaults
    expect(useFilterStore.getState().draftFilters.planningCycle).toBe('Current cycle');
    expect(useFilterStore.getState().draftFilters.activity).toBe('Demand driver');

    // APPLIED FILTERS REMAIN UNCHANGED
    expect(useFilterStore.getState().appliedFilters.planningCycle).toBe('MRF');
    expect(useFilterStore.getState().appliedFilters.activity).toBe('Business activity');
  });

  it('Reset then Close (discard) leaves applied filters completely unchanged', () => {
    // Initial applied filters
    useFilterStore.setState({
      appliedFilters: {
        ...useFilterStore.getState().appliedFilters,
        planningCycle: 'Prior cycle snapshot',
      },
    });

    // Sync draft on drawer open
    useFilterStore.getState().discardDraft();
    expect(useFilterStore.getState().draftFilters.planningCycle).toBe('Prior cycle snapshot');

    // User clicks Reset in drawer
    useFilterStore.getState().resetDraft('month');
    expect(useFilterStore.getState().draftFilters.planningCycle).toBe('Current cycle');

    // User clicks Close or Esc -> discardDraft()
    useFilterStore.getState().discardDraft();

    // Draft reverts back to applied filters; applied filters never changed
    expect(useFilterStore.getState().draftFilters.planningCycle).toBe('Prior cycle snapshot');
    expect(useFilterStore.getState().appliedFilters.planningCycle).toBe('Prior cycle snapshot');
  });

  it('Apply commits draft filters to applied state', () => {
    useFilterStore.getState().resetDraft('month');
    useFilterStore.getState().setDraftFilter('planningCycle', 'MRF');

    expect(useFilterStore.getState().appliedFilters.planningCycle).toBe('Current cycle');
    expect(useFilterStore.getState().draftFilters.planningCycle).toBe('MRF');

    // Apply
    useFilterStore.getState().applyFilters();

    expect(useFilterStore.getState().appliedFilters.planningCycle).toBe('MRF');
  });
});

