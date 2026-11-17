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
import { HierarchyNetwork } from '../hierarchy/HierarchyNetwork';

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

  // Modal content builders: plugged with HierarchyNetwork
  const renderModalBody = () => {
    if (modalType === 'product') {
      return (
        <HierarchyNetwork
          mode="product"
          nodes={nodes}
          selectedIds={scope}
        />
      );
    }

    if (modalType === 'time') {
      return (
        <HierarchyNetwork
          mode="time"
          visibleRange={{
            from: start,
            to: end,
            grain: timeGrain,
          }}
        />
      );
    }

    if (modalType === 'customer') {
      return (
        <HierarchyNetwork
          mode="customer"
          selectedApgs={apg}
        />
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
