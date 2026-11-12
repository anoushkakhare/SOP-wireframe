import React, { useState } from 'react';
import { RoleBadge } from '../header/RoleBadge';
import { LabeledSelect } from '../header/LabeledSelect';
import { HeaderActions } from '../header/HeaderActions';
import { MetaOptions, ProductLevel, CustomerLevel, Uom } from '../../types';
import { SlidersHorizontal, X } from 'lucide-react';
import { labels } from '../../constants/labels';

interface StickyHeaderProps {
  roleTitle: string;
  userName?: string;
  metaOptions: MetaOptions | null;
  productLevel: ProductLevel;
  customerLevel: CustomerLevel;
  uom: Uom;
  onProductLevelChange: (val: ProductLevel) => void;
  onCustomerLevelChange: (val: CustomerLevel) => void;
  onUomChange: (val: Uom) => void;
  onSaveScenario: () => void;
  onCommitScenario: () => void;
  onToggleTable: () => void;
  onOpenFilter: () => void;
  onOpenScenarios: () => void;
  isTableActive?: boolean;
  hasActiveFilters?: boolean;
}

export const StickyHeader: React.FC<StickyHeaderProps> = ({
  roleTitle,
  userName,
  metaOptions,
  productLevel,
  customerLevel,
  uom,
  onProductLevelChange,
  onCustomerLevelChange,
  onUomChange,
  onSaveScenario,
  onCommitScenario,
  onToggleTable,
  onOpenFilter,
  onOpenScenarios,
  isTableActive = false,
  hasActiveFilters = false,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { selects } = labels.header;

  const productLevelOptions = metaOptions?.productLevels || [
    { value: 'brand',   label: selects.productViewOptions.brand },
    { value: 'product', label: selects.productViewOptions.product },
  ];

  const customerLevelOptions = metaOptions?.customerLevels || [
    { value: 'customer_group', label: selects.customerViewOptions.customer_group },
    { value: 'customer',       label: selects.customerViewOptions.customer },
  ];

  const uomOptions = metaOptions?.uoms || [
    { value: 'units',   label: selects.measureOptions.units },
    { value: 'volume',  label: selects.measureOptions.volume },
    { value: 'revenue', label: selects.measureOptions.revenue },
  ];

  return (
    /* Primary-700 (#0F0E9A) background per spec; height 56–64px */
    <header className="sticky top-0 z-30 w-full bg-primary-700 px-4 md:px-6 py-3 shadow-sm min-h-[56px]">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
        {/* 1. Left: Role badge */}
        <div className="shrink-0">
          <RoleBadge roleTitle={roleTitle} userName={userName} />
        </div>

        {/* 2. Middle: Desktop Labeled Selects */}
        <div className="hidden lg:flex items-center gap-3 flex-1 justify-center max-w-2xl">
          <LabeledSelect
            label={selects.productView}
            value={productLevel}
            options={productLevelOptions}
            onChange={(v) => onProductLevelChange(v as ProductLevel)}
          />
          <LabeledSelect
            label={selects.customerView}
            value={customerLevel}
            options={customerLevelOptions}
            onChange={(v) => onCustomerLevelChange(v as CustomerLevel)}
          />
          <LabeledSelect
            label={selects.measure}
            value={uom}
            options={uomOptions}
            onChange={(v) => onUomChange(v as Uom)}
          />
        </div>

        {/* 3. Right: Desktop Icon Buttons */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <HeaderActions
            onSaveScenario={onSaveScenario}
            onCommitScenario={onCommitScenario}
            onToggleTable={onToggleTable}
            onOpenFilter={onOpenFilter}
            onOpenScenarios={onOpenScenarios}
            isTableActive={isTableActive}
            hasActiveFilters={hasActiveFilters}
          />
        </div>

        {/* Mobile controls toggle */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 border border-white/30 rounded-card bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label={labels.header.mobileMenuToggle}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <SlidersHorizontal className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Collapsible Controls Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden mt-3 pt-3 border-t border-white/20 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <LabeledSelect
              label={selects.productView}
              value={productLevel}
              options={productLevelOptions}
              onChange={(v) => onProductLevelChange(v as ProductLevel)}
            />
            <LabeledSelect
              label={selects.customerView}
              value={customerLevel}
              options={customerLevelOptions}
              onChange={(v) => onCustomerLevelChange(v as CustomerLevel)}
            />
            <LabeledSelect
              label={selects.measure}
              value={uom}
              options={uomOptions}
              onChange={(v) => onUomChange(v as Uom)}
            />
          </div>

          <div className="flex sm:hidden justify-end pt-2 border-t border-white/20">
            <HeaderActions
              onSaveScenario={onSaveScenario}
              onCommitScenario={onCommitScenario}
              onToggleTable={onToggleTable}
              onOpenFilter={onOpenFilter}
              onOpenScenarios={onOpenScenarios}
              isTableActive={isTableActive}
              hasActiveFilters={hasActiveFilters}
            />
          </div>
        </div>
      )}
    </header>
  );
};
