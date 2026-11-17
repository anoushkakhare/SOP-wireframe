import React, { useState, useEffect } from 'react';
import { Drawer } from '../layout/Drawer';
import { TimeRangeSlider } from './TimeRangeSlider';
import { FilterActions } from './FilterActions';
import { HierarchyTreePicker } from './HierarchyTreePicker';
import { FilterSelect } from './FilterSelect';
import { HierarchyNode } from '../../types';
import { useViewStore } from '../../store/viewStore';
import { useFilterStore } from '../../store/filterStore';
import { APG_OPTIONS } from '../../constants/hierarchy';
import { labels } from '../../constants/labels';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
  hierarchyNodes: HierarchyNode[];
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  onApply,
  onReset,
  hierarchyNodes,
}) => {
  const { scope, apg, setScope, setApg } = useViewStore();
  const { draftFilters, setDraftFilter, setTimeRangeDraft, applyFilters, resetDraft } = useFilterStore();

  // Draft state for scope/apg (committed on Apply)
  const [draftScope, setDraftScope] = useState<string[]>([]);
  const [draftApg,   setDraftApg]   = useState<string[]>([]);

  // Sync draft from store when drawer opens
  useEffect(() => {
    if (isOpen) {
      setDraftScope(scope);
      setDraftApg(apg);
    }
  }, [isOpen, scope, apg]);

  const handleApply = () => {
    setScope(draftScope);
    setApg(draftApg);
    applyFilters();
    onApply();
    onClose();
  };

  const handleReset = () => {
    setDraftScope([]);
    setDraftApg([]);
    resetDraft();
    onReset();
  };

  const handleClose = () => {
    // Discard draft – reset to current store values
    setDraftScope(scope);
    setDraftApg(apg);
    onClose();
  };

  return (
    <Drawer isOpen={isOpen} onClose={handleClose} title={labels.filterDrawer.title}>
      <div className="flex flex-col h-full justify-between">
        <div className="space-y-5">
          {/* Time range slider */}
          <TimeRangeSlider
            range={draftFilters.timeRange}
            startDate={draftFilters.startDate}
            endDate={draftFilters.endDate}
            onChangeRange={setTimeRangeDraft}
            onChangeStartDate={(d) => setDraftFilter('startDate', d)}
            onChangeEndDate={(d) => setDraftFilter('endDate', d)}
          />

          {/* Product hierarchy picker */}
          <div>
            <p className="text-xs font-semibold text-text-secondary mb-1.5">Product hierarchy</p>
            <HierarchyTreePicker
              nodes={hierarchyNodes}
              value={draftScope}
              onChange={setDraftScope}
            />
          </div>

          {/* APG multi-select */}
          <FilterSelect
            label="APG (Account Planning Group)"
            options={APG_OPTIONS as unknown as string[]}
            selected={draftApg}
            onChange={setDraftApg}
            allLabel="All APGs"
          />
        </div>

        <FilterActions
          onApply={handleApply}
          onReset={handleReset}
          onClose={handleClose}
        />
      </div>
    </Drawer>
  );
};
