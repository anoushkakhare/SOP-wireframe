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
import { ChevronDown } from 'lucide-react';

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
  const { scope, apg, timeGrain, setScope, setApg } = useViewStore();
  const { appliedFilters, draftFilters, setDraftFilter, setTimeRangeDraft, applyFilters, resetDraft } = useFilterStore();

  // Draft state for scope/apg/cycle/activity (committed on Apply)
  const [draftScope, setDraftScope] = useState<string[]>([]);
  const [draftApg, setDraftApg] = useState<string[]>([]);
  const [draftPlanningCycle, setDraftPlanningCycle] = useState<string>(
    appliedFilters.planningCycle || 'Current cycle'
  );
  const [draftActivity, setDraftActivity] = useState<string>(
    appliedFilters.activity || 'Demand driver'
  );

  // Sync draft from store when drawer opens
  useEffect(() => {
    if (isOpen) {
      setDraftScope(scope);
      setDraftApg(apg);
      setDraftPlanningCycle(appliedFilters.planningCycle || 'Current cycle');
      setDraftActivity(appliedFilters.activity || 'Demand driver');
    }
  }, [isOpen, scope, apg, timeGrain, appliedFilters.planningCycle, appliedFilters.activity]);

  const handleApply = () => {
    setScope(draftScope);
    setApg(draftApg);
    setDraftFilter('planningCycle', draftPlanningCycle);
    setDraftFilter('activity', draftActivity);
    applyFilters();
    onApply();
    onClose();
  };

  const handleReset = () => {
    setDraftScope([]);
    setDraftApg([]);
    setDraftPlanningCycle('Current cycle');
    setDraftActivity('Demand driver');
    resetDraft();
    onReset();
  };

  const handleClose = () => {
    // Discard draft – reset to current store values
    setDraftScope(scope);
    setDraftApg(apg);
    setDraftPlanningCycle(appliedFilters.planningCycle || 'Current cycle');
    setDraftActivity(appliedFilters.activity || 'Demand driver');
    onClose();
  };

  return (
    <Drawer isOpen={isOpen} onClose={handleClose} title={labels.filterDrawer.title}>
      <div className="flex flex-col h-full justify-between">
        <div className="space-y-5">
          {/* Time range slider */}
          <TimeRangeSlider
            grain={timeGrain}
            range={draftFilters.timeRange}
            startDate={draftFilters.startDate}
            endDate={draftFilters.endDate}
            onChangeRange={(r) => setTimeRangeDraft(r, timeGrain)}
            onChangeStartDate={(d) => {
              setDraftFilter('startDate', d);
            }}
            onChangeEndDate={(d) => {
              setDraftFilter('endDate', d);
            }}
          />

          {/* Planning cycle single-select */}
          <div className="relative">
            <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
              Planning cycle
            </label>
            <div className="relative">
              <select
                value={draftPlanningCycle}
                onChange={(e) => setDraftPlanningCycle(e.target.value)}
                className="w-full text-xs font-medium text-text-primary bg-surface border border-border rounded-input px-3 py-2 pr-8 appearance-none focus:outline-none focus:border-primary-700 cursor-pointer shadow-sm hover:border-primary-300"
              >
                <option value="Current cycle">Current cycle</option>
                <option value="MRF">MRF</option>
                <option value="Prior cycle snapshot">Prior cycle snapshot</option>
              </select>
              <ChevronDown className="w-4 h-4 text-text-secondary absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Activity single-select */}
          <div className="relative">
            <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
              Activity
            </label>
            <div className="relative">
              <select
                value={draftActivity}
                onChange={(e) => setDraftActivity(e.target.value)}
                className="w-full text-xs font-medium text-text-primary bg-surface border border-border rounded-input px-3 py-2 pr-8 appearance-none focus:outline-none focus:border-primary-700 cursor-pointer shadow-sm hover:border-primary-300"
              >
                <option value="Demand driver">Demand driver</option>
                <option value="Business activity">Business activity</option>
              </select>
              <ChevronDown className="w-4 h-4 text-text-secondary absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

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
