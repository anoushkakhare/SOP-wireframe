import React from 'react';
import { Drawer } from '../layout/Drawer';
import { TimeRangeSlider } from './TimeRangeSlider';
import { FilterSelect } from './FilterSelect';
import { FilterActions } from './FilterActions';
import { MetaOptions } from '../../types';
import { useFilterStore } from '../../store/filterStore';
import { labels } from '../../constants/labels';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
  metaOptions: MetaOptions | null;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  onApply,
  onReset,
  metaOptions,
}) => {
  const { draftFilters, setDraftFilter, setTimeRangeDraft, applyFilters, resetDraft } = useFilterStore();
  const { fields, placeholder } = labels.filterDrawer;

  const handleApply = () => {
    applyFilters();
    onApply();
    onClose();
  };

  const handleReset = () => {
    resetDraft();
    onReset();
  };

  // Fallback lists use realistic Unilever-style names from master data
  const categories     = metaOptions?.filters.categories     || ['Beauty & Wellbeing', 'Personal Care', 'Home Care', 'Foods'];
  const brands         = metaOptions?.filters.brands         || ["Dove", "Pond's", "Vaseline", "Sunsilk", "Lux", "Lifebuoy", "Rexona", "Closeup", "Surf Excel", "Comfort", "Domestos", "Vim", "Knorr", "Hellmann's", "Brooke Bond", "Lipton"];
  const products       = metaOptions?.filters.products       || ['Dove Nourishing Shampoo', 'Surf Excel Matic Liquid', 'Knorr Chicken Stock Cubes'];
  const customerGroups = metaOptions?.filters.customerGroups || ['Modern trade', 'General trade', 'E-commerce', 'Quick commerce'];
  const customers      = metaOptions?.filters.customers      || ['Reliance Retail', 'DMart', 'Amazon', 'Flipkart', 'Blinkit', 'Zepto'];
  const businessUnits  = metaOptions?.filters.businessUnits  || ['Beauty & Wellbeing', 'Personal Care', 'Home Care', 'Foods'];

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={labels.filterDrawer.title}>
      <div className="flex flex-col h-full justify-between">
        <div className="space-y-4">
          {/* Time range slider */}
          <TimeRangeSlider
            range={draftFilters.timeRange}
            startDate={draftFilters.startDate}
            endDate={draftFilters.endDate}
            onChangeRange={setTimeRangeDraft}
            onChangeStartDate={(d) => setDraftFilter('startDate', d)}
            onChangeEndDate={(d) => setDraftFilter('endDate', d)}
          />

          <FilterSelect
            label={fields.category}
            options={categories}
            selected={draftFilters.categories}
            onChange={(sel) => setDraftFilter('categories', sel)}
            allLabel={placeholder('categor')}
          />

          <FilterSelect
            label={fields.brand}
            options={brands}
            selected={draftFilters.brands}
            onChange={(sel) => setDraftFilter('brands', sel)}
            allLabel={placeholder('brand')}
          />

          <FilterSelect
            label={fields.product}
            options={products}
            selected={draftFilters.products}
            onChange={(sel) => setDraftFilter('products', sel)}
            allLabel={placeholder('product')}
          />

          <FilterSelect
            label={fields.customerGroup}
            options={customerGroups}
            selected={draftFilters.customerGroups}
            onChange={(sel) => setDraftFilter('customerGroups', sel)}
            allLabel={placeholder('customer group')}
          />

          <FilterSelect
            label={fields.customer}
            options={customers}
            selected={draftFilters.customers}
            onChange={(sel) => setDraftFilter('customers', sel)}
            allLabel={placeholder('customer')}
          />

          <FilterSelect
            label={fields.businessUnit}
            options={businessUnits}
            selected={draftFilters.businessUnits}
            onChange={(sel) => setDraftFilter('businessUnits', sel)}
            allLabel={placeholder('business unit')}
          />
        </div>

        {/* Bottom Actions */}
        <FilterActions
          onApply={handleApply}
          onReset={handleReset}
          onClose={onClose}
        />
      </div>
    </Drawer>
  );
};
