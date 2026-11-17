import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { RoleBadge } from '../header/RoleBadge';
import { LabeledSelect } from '../header/LabeledSelect';
import { HeaderActions } from '../header/HeaderActions';
import { ReadinessChip } from '../header/ReadinessChip';
import { CalendarPopover } from '../header/CalendarPopover';
import { Uom, ProductLevelNum, TimeGrain } from '../../types';
import { CustomerViewOption } from '../../store/viewStore';
import { SlidersHorizontal, X, RotateCcw } from 'lucide-react';
import { labels } from '../../constants/labels';
import { LEVEL_MAP } from '../../constants/hierarchy';

interface StickyHeaderProps {
  roleTitle: string;
  userName?: string;
  productLevel?: ProductLevelNum;
  allowedLevels?: ProductLevelNum[];
  customerView?: CustomerViewOption;
  measure?: Uom;
  measureOptions?: Array<{ value: string; label: string }>;
  timeGrain?: TimeGrain;
  timeGrainOptions?: Array<{ value: string; label: string }>;
  onProductLevelChange?: (val: ProductLevelNum) => void;
  onCustomerViewChange?: (val: CustomerViewOption) => void;
  onMeasureChange?: (val: Uom) => void;
  onTimeGrainChange?: (val: TimeGrain) => void;
  onResetHeaderOnly?: () => void;
  onSaveScenario?: () => void;
  onCommitScenario?: () => void;
  onToggleTable?: () => void;
  onOpenFilter?: () => void;
  onOpenScenarios?: () => void;
  isTableActive?: boolean;
  activeFilterCount?: number;
}

export const StickyHeader: React.FC<StickyHeaderProps> = ({
  roleTitle,
  userName,
  productLevel = 1,
  allowedLevels = [1, 2, 3, 4, 5],
  customerView = 'apg',
  measure = 'cases',
  measureOptions,
  timeGrain = 'month',
  timeGrainOptions,
  onProductLevelChange,
  onCustomerViewChange,
  onMeasureChange,
  onTimeGrainChange,
  onResetHeaderOnly,
  onSaveScenario,
  onCommitScenario,
  onToggleTable,
  onOpenFilter,
  onOpenScenarios,
  isTableActive = false,
  activeFilterCount = 0,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isDataReview = location.pathname === '/data-review';
  const { selects } = labels.header;

  // Build product level options showing only allowed levels with colour dots
  const productLevelOptions = allowedLevels.map(id => {
    const lv = LEVEL_MAP[id];
    return { value: String(id), label: lv?.label || `Level ${id}`, color: lv?.color };
  });

  const customerViewOptions = [
    { value: 'apg', label: 'APG' },
  ];

  const defaultTimeGrains = [
    { value: 'year', label: 'Year' },
    { value: 'half', label: 'Half-year' },
    { value: 'quarter', label: 'Quarter' },
    { value: 'month', label: 'Month' },
    { value: 'week', label: 'Week' },
  ];

  const resolvedTimeGrains = timeGrainOptions && timeGrainOptions.length > 0
    ? timeGrainOptions
    : defaultTimeGrains;

  const defaultMeasures = [
    { value: 'cases', label: selects.measureOptions.cases || 'Cases' },
    { value: 'units', label: selects.measureOptions.units || 'Units' },
    { value: 'value', label: selects.measureOptions.value || 'Value' },
  ];

  const resolvedMeasures = measureOptions && measureOptions.length > 0
    ? measureOptions
    : defaultMeasures;

  const LevelDot = ({ color }: { color?: string }) =>
    color ? <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: color }} /> : null;

  const selects_desktop = !isDataReview ? (
    <div className="hidden lg:flex items-center gap-3 flex-1 justify-center max-w-2xl">
      {/* Product view */}
      <LabeledSelect
        label={selects.productView}
        value={String(productLevel)}
        options={productLevelOptions.map(o => ({ value: o.value, label: o.label }))}
        onChange={(v) => onProductLevelChange?.(Number(v) as ProductLevelNum)}
        renderOption={(o) => (
          <span className="flex items-center">
            <LevelDot color={productLevelOptions.find(p => p.value === o.value)?.color} />
            {o.label}
          </span>
        )}
      />
      {/* Time view */}
      <LabeledSelect
        label="Time view"
        value={timeGrain}
        options={resolvedTimeGrains}
        onChange={(v) => onTimeGrainChange?.(v as TimeGrain)}
      />
      {/* Customer view */}
      <LabeledSelect
        label={selects.customerView}
        value={customerView}
        options={customerViewOptions}
        onChange={(v) => onCustomerViewChange?.(v as CustomerViewOption)}
      />
      {/* Measure */}
      <LabeledSelect
        label={selects.measure}
        value={measure}
        options={resolvedMeasures}
        onChange={(v) => onMeasureChange?.(v as Uom)}
      />
      {/* Reset header */}
      {onResetHeaderOnly && (
        <button
          type="button"
          onClick={onResetHeaderOnly}
          title="Reset view"
          className="p-1.5 rounded text-white/70 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          aria-label="Reset view"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  ) : (
    <div className="flex-1" />
  );

  return (
    <header className="sticky top-0 z-30 w-full bg-primary-700 px-4 md:px-6 py-2.5 shadow-sm min-h-[56px]">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
        {/* 1. Left: Unilever logo + Role badge */}
        <div className="flex items-center gap-4 shrink-0">
          <img
            src="/unilever-logo.png"
            alt="Unilever"
            style={{ height: 38, width: 'auto', objectFit: 'contain', display: 'block' }}
          />
          <RoleBadge roleTitle={roleTitle} userName={userName} />
        </div>

        {selects_desktop}

        {/* Right side: Readiness chip, calendar icon, and dashboard-only actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <ReadinessChip />
          <CalendarPopover />

          {!isDataReview && onSaveScenario && onCommitScenario && onToggleTable && onOpenFilter && onOpenScenarios && (
            <div className="hidden sm:flex items-center gap-2 pl-1 border-l border-white/20">
              <HeaderActions
                onSaveScenario={onSaveScenario}
                onCommitScenario={onCommitScenario}
                onToggleTable={onToggleTable}
                onOpenFilter={onOpenFilter}
                onOpenScenarios={onOpenScenarios}
                isTableActive={isTableActive}
                activeFilterCount={activeFilterCount}
              />
            </div>
          )}

          {!isDataReview && (
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
          )}
        </div>
      </div>

      {!isDataReview && isMobileMenuOpen && (
        <div className="lg:hidden mt-3 pt-3 border-t border-white/20 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <LabeledSelect
              label={selects.productView}
              value={String(productLevel)}
              options={productLevelOptions.map(o => ({ value: o.value, label: o.label }))}
              onChange={(v) => onProductLevelChange?.(Number(v) as ProductLevelNum)}
            />
            <LabeledSelect
              label="Time view"
              value={timeGrain}
              options={resolvedTimeGrains}
              onChange={(v) => onTimeGrainChange?.(v as TimeGrain)}
            />
            <LabeledSelect
              label={selects.customerView}
              value={customerView}
              options={customerViewOptions}
              onChange={(v) => onCustomerViewChange?.(v as CustomerViewOption)}
            />
            <LabeledSelect
              label={selects.measure}
              value={measure}
              options={resolvedMeasures}
              onChange={(v) => onMeasureChange?.(v as Uom)}
            />
          </div>
          {onSaveScenario && onCommitScenario && onToggleTable && onOpenFilter && onOpenScenarios && (
            <div className="flex sm:hidden justify-end pt-2 border-t border-white/20">
              <HeaderActions
                onSaveScenario={onSaveScenario}
                onCommitScenario={onCommitScenario}
                onToggleTable={onToggleTable}
                onOpenFilter={onOpenFilter}
                onOpenScenarios={onOpenScenarios}
                isTableActive={isTableActive}
                activeFilterCount={activeFilterCount}
              />
            </div>
          )}
        </div>
      )}
    </header>
  );
};
