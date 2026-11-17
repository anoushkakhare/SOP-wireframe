import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import { KpiCard } from './KpiCard';
import { SelectionDetailsModal } from './SelectionDetailsModal';
import { KpiItem, HierarchyNode } from '../../types';
import { labels } from '../../constants/labels';
import { LEVEL_MAP } from '../../constants/hierarchy';
import { useViewStore } from '../../store/viewStore';
import { useFilterStore } from '../../store/filterStore';
import { countDescendants } from '../../utils/countDescendants';
import { metaService } from '../../services/metaService';
import { getGrainPeriods } from '../../utils/dateRange';

interface KpiCardRowProps {
  kpis?: KpiItem[];
  hierarchyNodes?: HierarchyNode[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

type ModalType = 'product' | 'customer' | 'time' | null;

export const KpiCardRow: React.FC<KpiCardRowProps> = ({
  kpis = [],
  hierarchyNodes: propNodes,
  isLoading = false,
  isError = false,
  error,
  onRetry,
}) => {
  const [modalType, setModalType] = useState<ModalType>(null);

  const { scope, apg, timeGrain } = useViewStore();
  const { appliedFilters } = useFilterStore();

  const hierarchyQuery = useQuery({
    queryKey: ['hierarchy'],
    queryFn: () => metaService.getHierarchy(),
    enabled: !propNodes || propNodes.length === 0,
  });

  const nodes = propNodes && propNodes.length > 0 ? propNodes : hierarchyQuery.data || [];

  // Helper 1: Product selection info
  const productDesc = countDescendants(scope, nodes);

  // Helper 2: Customer selection info
  let customerText = 'All 4 APGs';
  if (apg && apg.length > 0 && apg.length < 4) {
    customerText = apg.length <= 2 ? apg.join(', ') : `${apg.slice(0, 2).join(', ')} +${apg.length - 2} more`;
  }

  // Helper 3: Time selection info
  const normGrain = (timeGrain || 'month').toLowerCase();
  const grainLabel =
    normGrain === 'half' || normGrain === 'half_year'
      ? 'Half-year'
      : normGrain.charAt(0).toUpperCase() + normGrain.slice(1);

  const start = appliedFilters.startDate || '';
  const end = appliedFilters.endDate || start || '';

  const expandYear = (s: string) =>
    s.replace(/\b25\b/, '2025').replace(/\b26\b/, '2026').replace(/\b27\b/, '2027');

  let rangeText = '';
  if (!start && !end) {
    rangeText = 'Jan–Dec 2026';
  } else if (start === end) {
    rangeText = expandYear(start);
  } else {
    const mFrom = start.match(/^(.*?)\s*(\d{2})$/);
    const mTo = end.match(/^(.*?)\s*(\d{2})$/);
    if (mFrom && mTo && mFrom[2] === mTo[2]) {
      rangeText = `${mFrom[1]}–${mTo[1]} 20${mFrom[2]}`;
    } else {
      rangeText = `${expandYear(start)}–${expandYear(end)}`;
    }
  }
  const timeText = `${rangeText} · ${grainLabel}`;

  // Helper 4: Cycle selection info
  const cycleText = `${appliedFilters.planningCycle || 'Current cycle'} · ${appliedFilters.activity || 'Demand driver'}`;

  // Modal content builders
  const renderModalBody = () => {
    if (modalType === 'product') {
      const displayNodes = productDesc.selectedNodes.length > 0
        ? [
            ...productDesc.selectedNodes,
            ...productDesc.descendantNodes,
          ]
        : nodes;

      const baseLevel = productDesc.selectedNodes.length > 0 ? productDesc.level : 1;

      return (
        <div className="space-y-1.5 font-mono text-xs">
          <div className="text-xs font-sans text-text-secondary mb-3">
            Showing descendants for: <span className="font-semibold text-text-primary">{productDesc.summary}</span>
          </div>
          <div className="border border-border rounded-card divide-y divide-border bg-surface-header/30">
            {displayNodes.map((n) => {
              const levelInfo = LEVEL_MAP[n.level];
              const indentLevel = Math.max(0, n.level - baseLevel);
              return (
                <div
                  key={n.id}
                  className="flex items-center gap-2 py-2 px-3 hover:bg-hover transition-colors font-sans"
                  style={{ paddingLeft: `${indentLevel * 20 + 12}px` }}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: levelInfo?.color || '#666' }}
                  />
                  <span className="text-[11px] font-semibold text-text-secondary uppercase w-28 shrink-0">
                    {levelInfo?.label || `Level ${n.level}`}
                  </span>
                  <span className="text-xs text-text-primary font-medium">{n.name}</span>
                  <span className="ml-auto text-[10px] text-text-disabled">{n.id}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (modalType === 'time') {
      const periods = getGrainPeriods(timeGrain);
      let fromIdx = periods.indexOf(start);
      let toIdx = periods.indexOf(end);
      if (fromIdx < 0) fromIdx = 0;
      if (toIdx < 0) toIdx = periods.length - 1;
      if (fromIdx > toIdx) [fromIdx, toIdx] = [toIdx, fromIdx];

      const activePeriods = periods.slice(fromIdx, toIdx + 1);

      return (
        <div className="space-y-3 font-sans text-xs">
          <div className="text-xs text-text-secondary">
            Periods in active range (<span className="font-semibold text-text-primary">{timeText}</span>):
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {activePeriods.map((p, idx) => {
              const is25 = p.endsWith('25');
              return (
                <div
                  key={idx}
                  className="p-2.5 rounded-card border border-border bg-surface flex items-center justify-between"
                >
                  <span className="font-medium text-text-primary">{p}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                      is25 ? 'bg-positive/10 text-positive' : 'bg-primary-50 text-primary-600'
                    }`}
                  >
                    {is25 ? 'Actual' : 'Forecast'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (modalType === 'customer') {
      const allApgs = ['Modern Trade', 'General Trade', 'E-commerce', 'Quick Commerce'];
      return (
        <div className="space-y-2 font-sans text-xs">
          <div className="text-xs text-text-secondary mb-3">
            Account Planning Groups (APG):
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {allApgs.map((name) => {
              const isSelected = !apg || apg.length === 0 || apg.includes(name);
              return (
                <div
                  key={name}
                  className={`p-3 rounded-card border flex items-center justify-between ${
                    isSelected
                      ? 'border-primary-500/40 bg-primary-50/30 text-text-primary'
                      : 'border-border bg-surface text-text-disabled'
                  }`}
                >
                  <span className="font-medium">{name}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                      isSelected
                        ? 'bg-primary-500 text-white'
                        : 'bg-surface-header text-text-disabled'
                    }`}
                  >
                    {isSelected ? 'Active' : 'Filtered out'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="w-full space-y-2 select-none">
      {/* ─── Row A: Selection (4 compact cards ~64px, wraps 2x2 on mobile) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {/* 1. Product card */}
        <div className="h-16 bg-surface border border-border rounded-card px-3 py-2 flex flex-col justify-between shadow-card hover:shadow-md transition-shadow overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-text-secondary truncate">
              Product
            </span>
            <button
              type="button"
              onClick={() => setModalType('product')}
              title="See the product hierarchy"
              className="text-text-disabled hover:text-primary-600 transition-colors p-0.5 rounded cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-text-primary truncate">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: productDesc.levelColor }}
            />
            <span className="truncate" title={productDesc.summary}>
              {productDesc.summary}
            </span>
          </div>
        </div>

        {/* 2. Customer card */}
        <div className="h-16 bg-surface border border-border rounded-card px-3 py-2 flex flex-col justify-between shadow-card hover:shadow-md transition-shadow overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-text-secondary truncate">
              Customer
            </span>
            <button
              type="button"
              onClick={() => setModalType('customer')}
              title="See the customer hierarchy"
              className="text-text-disabled hover:text-primary-600 transition-colors p-0.5 rounded cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-text-primary truncate">
            <span className="truncate" title={customerText}>
              {customerText}
            </span>
          </div>
        </div>

        {/* 3. Time card */}
        <div className="h-16 bg-surface border border-border rounded-card px-3 py-2 flex flex-col justify-between shadow-card hover:shadow-md transition-shadow overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-text-secondary truncate">
              Time
            </span>
            <button
              type="button"
              onClick={() => setModalType('time')}
              title="See the time periods"
              className="text-text-disabled hover:text-primary-600 transition-colors p-0.5 rounded cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-text-primary truncate">
            <span className="truncate" title={timeText}>
              {timeText}
            </span>
          </div>
        </div>

        {/* 4. Cycle card (no link) */}
        <div className="h-16 bg-surface border border-border rounded-card px-3 py-2 flex flex-col justify-between shadow-card hover:shadow-md transition-shadow overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-text-secondary truncate">
              Cycle
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-text-primary truncate">
            <span className="truncate" title={cycleText}>
              {cycleText}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Row B: Numbers (10 cards, scrolls horizontally) ─── */}
      {isLoading ? (
        <div className="w-full flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 min-w-[130px] sm:min-w-[145px] max-w-[200px] h-[86px] bg-surface border border-border rounded-card p-2.5 flex flex-col justify-between animate-pulse shrink-0"
            >
              <div className="h-3 bg-primary-100 rounded w-2/3" />
              <div className="h-6 bg-primary-100 rounded w-4/5 mx-auto" />
              <div className="h-2.5 bg-primary-50 rounded w-1/2 mx-auto" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="w-full h-16 bg-surface border border-negative/30 rounded-card flex items-center gap-3 px-4 text-xs text-negative">
          <span>{labels.generic.error}</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="ml-1 px-2 py-0.5 rounded border border-negative text-negative hover:bg-negative/10 transition-colors text-xs font-medium"
            >
              Retry
            </button>
          )}
          {(error as any)?.statusCode && (
            <details className="ml-auto text-text-disabled">
              <summary className="cursor-pointer">Details</summary>
              <span>HTTP {(error as any).statusCode}</span>
            </details>
          )}
        </div>
      ) : !kpis || kpis.length === 0 ? (
        <div className="w-full h-16 bg-surface border border-border rounded-card flex items-center justify-center text-xs text-text-secondary">
          {labels.generic.noData}
        </div>
      ) : (
        <div className="w-full flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.key} kpi={kpi} />
          ))}
        </div>
      )}

      {/* ─── SelectionDetailsModal (Swappable slot modal) ─── */}
      <SelectionDetailsModal
        isOpen={modalType !== null}
        onClose={() => setModalType(null)}
        title={
          modalType === 'product'
            ? 'Product hierarchy'
            : modalType === 'customer'
            ? 'Customer hierarchy'
            : modalType === 'time'
            ? 'Time periods'
            : ''
        }
        subtitle={
          modalType === 'product'
            ? productDesc.summary
            : modalType === 'customer'
            ? customerText
            : modalType === 'time'
            ? timeText
            : undefined
        }
      >
        {renderModalBody()}
      </SelectionDetailsModal>
    </div>
  );
};
