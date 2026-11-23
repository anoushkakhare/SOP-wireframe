import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import { KpiCard } from './KpiCard';
import { SelectionDetailsModal } from './SelectionDetailsModal';
import { KpiItem, HierarchyNode } from '../../types';
import { labels } from '../../constants/labels';
import { useViewStore } from '../../store/viewStore';
import { useFilterStore } from '../../store/filterStore';
import { countDescendants } from '../../utils/countDescendants';
import { metaService } from '../../services/metaService';
import { HierarchyNetwork } from '../hierarchy/HierarchyNetwork';

/** Responsive grid for KPI number cards.
 *  ≥1200px : fixed grid, all N columns equal width, fills full row.
 *  <1200px : horizontal-scroll row, each card min 160px.
 */
const KpiGrid: React.FC<{ kpis: KpiItem[] }> = ({ kpis }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [wide, setWide] = useState(
    typeof window !== 'undefined' && window.innerWidth >= 1200,
  );

  useEffect(() => {
    const el = ref.current?.parentElement ?? window as unknown as Element;
    const obs = new ResizeObserver(([entry]) => {
      setWide((entry?.contentRect?.width ?? window.innerWidth) >= 1200);
    });
    obs.observe(el as Element);
    return () => obs.disconnect();
  }, []);

  const n = kpis.length || 1;

  const gridStyle: React.CSSProperties = wide
    ? {
        display: 'grid',
        gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
        gap: '12px',
        width: '100%',
      }
    : {
        display: 'grid',
        gridAutoFlow: 'column',
        gridAutoColumns: 'minmax(160px, 1fr)',
        gap: '12px',
        overflowX: 'auto',
        width: '100%',
        paddingBottom: '4px',
      };

  return (
    <div ref={ref} className="no-scrollbar scroll-smooth" style={gridStyle}>
      {kpis.map((kpi) => (
        <KpiCard key={kpi.key} kpi={kpi} />
      ))}
    </div>
  );
};

export interface SelectionKpiRowProps {
  hierarchyNodes?: HierarchyNode[];
}

export interface KpiNumbersRowProps {
  kpis?: KpiItem[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export interface KpiCardRowProps extends KpiNumbersRowProps {
  hierarchyNodes?: HierarchyNode[];
}

type ModalType = 'product' | 'customer' | 'time' | null;

export const SelectionKpiRow: React.FC<SelectionKpiRowProps> = ({
  hierarchyNodes: propNodes,
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
    <>
      {/* ─── Row A: Selection (4 compact cards ~56px on mobile, ~64px desktop) ─── */}
      <div className="flex md:grid md:grid-cols-4 gap-2 overflow-x-auto md:overflow-visible no-scrollbar pb-1 md:pb-0">
        {/* 1. Product card */}
        <div className="h-14 md:h-16 min-w-[150px] md:min-w-0 flex-1 shrink-0 md:shrink bg-surface border border-border rounded-card px-3 py-1.5 md:py-2 flex flex-col justify-between shadow-card hover:shadow-md transition-shadow overflow-hidden">
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
        <div className="h-14 md:h-16 min-w-[150px] md:min-w-0 flex-1 shrink-0 md:shrink bg-surface border border-border rounded-card px-3 py-1.5 md:py-2 flex flex-col justify-between shadow-card hover:shadow-md transition-shadow overflow-hidden">
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
        <div className="h-14 md:h-16 min-w-[150px] md:min-w-0 flex-1 shrink-0 md:shrink bg-surface border border-border rounded-card px-3 py-1.5 md:py-2 flex flex-col justify-between shadow-card hover:shadow-md transition-shadow overflow-hidden">
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
        <div className="h-14 md:h-16 min-w-[150px] md:min-w-0 flex-1 shrink-0 md:shrink bg-surface border border-border rounded-card px-3 py-1.5 md:py-2 flex flex-col justify-between shadow-card hover:shadow-md transition-shadow overflow-hidden">
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
    </>
  );
};

export const KpiNumbersRow: React.FC<KpiNumbersRowProps> = ({
  kpis = [],
  isLoading = false,
  isError = false,
  error,
  onRetry,
}) => {
  return (
    <div className="w-full select-none">
      {/* ─── Row B: Numbers (8 cards, scrolls horizontally) ─── */}
      {isLoading ? (
        /* Skeleton: same responsive grid as the live row */
        <div
          className="w-full pb-1 no-scrollbar"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, minmax(160px, 1fr))',
            gap: '12px',
            overflowX: 'auto',
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface border border-border rounded-card p-2.5 flex flex-col justify-between animate-pulse"
              style={{ height: '120px', boxSizing: 'border-box' }}
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
        /*
         * ≥1200px: grid fills full width, all columns equal.
         * <1200px: auto-flow column with min 160px per card → horizontal scroll.
         */
        <KpiGrid kpis={kpis} />
      )}
    </div>
  );
};

export const KpiCardRow: React.FC<KpiCardRowProps> = ({
  hierarchyNodes,
  ...numberProps
}) => {
  return (
    <div className="w-full space-y-2 select-none">
      <SelectionKpiRow hierarchyNodes={hierarchyNodes} />
      <KpiNumbersRow {...numberProps} />
    </div>
  );
};
