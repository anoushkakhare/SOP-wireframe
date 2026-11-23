/**
 * FullscreenSplitLayout
 * Generic fullscreen overlay: chart on top, planning table dock at the bottom.
 * No absolute/fixed overlap — pure flex-col inside a fixed viewport overlay.
 *
 * Usage:
 *   <FullscreenSplitLayout title="…" onClose={…} tableSlot={<BottomDockInline …/>}>
 *     <MyChart />
 *   </FullscreenSplitLayout>
 */
import React, { useEffect, useRef, useCallback } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

interface FullscreenSplitLayoutProps {
  title: string;
  onClose: () => void;
  /** Optional header controls (drill toolbar, etc.) rendered beside the title */
  headerAction?: React.ReactNode;
  /** The chart canvas (will fill the top flex area) */
  children: React.ReactNode;
  /** The table dock rendered in the bottom panel */
  tableSlot: React.ReactNode;
  /** Whether the table panel starts collapsed */
  defaultTableCollapsed?: boolean;
}

export const FullscreenSplitLayout: React.FC<FullscreenSplitLayoutProps> = ({
  title,
  onClose,
  headerAction,
  children,
  tableSlot,
  defaultTableCollapsed = false,
}) => {
  const [tableCollapsed, setTableCollapsed] = React.useState(defaultTableCollapsed);
  const chartRef = useRef<HTMLDivElement>(null);

  // ESC → close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Notify ECharts instances to resize whenever the chart area size changes
  const dispatchResize = useCallback(() => {
    // ECharts listens to window resize; dispatching a resize event is the
    // cleanest way to trigger chart.resize() without direct chart refs.
    window.dispatchEvent(new Event('resize'));
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;
    const ro = new ResizeObserver(dispatchResize);
    ro.observe(chartRef.current);
    // initial trigger after mount
    dispatchResize();
    return () => ro.disconnect();
  }, [dispatchResize]);

  // Also trigger resize when table collapses/expands
  useEffect(() => {
    // small delay so layout paint finishes first
    const t = setTimeout(dispatchResize, 150);
    return () => clearTimeout(t);
  }, [tableCollapsed, dispatchResize]);

  return (
    // Full-viewport fixed overlay, sitting above the sticky header (z-40)
    <div
      className="fixed inset-0 z-40 bg-bg flex flex-col"
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      {/* ── Chart header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface shrink-0 select-none">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-sm font-semibold text-text-primary tracking-tight truncate">
            {title}
          </h2>
          {headerAction && (
            <div className="flex items-center">{headerAction}</div>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Exit fullscreen"
          title="Exit fullscreen (Esc)"
          className="w-7 h-7 flex items-center justify-center rounded-card hover:bg-primary-50 text-text-secondary hover:text-primary-700 transition-colors border border-transparent hover:border-border shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Chart area ───────────────────────────────────────────────── */}
      <div
        ref={chartRef}
        className="bg-surface relative min-h-0"
        style={{ flex: tableCollapsed ? '1 1 auto' : '1 1 60%', minHeight: '220px' }}
      >
        {/* Inner wrapper fills the area */}
        <div className="absolute inset-0 p-3">
          {children}
        </div>
      </div>

      {/* ── Divider with collapse chevron ────────────────────────────── */}
      <div
        className="shrink-0 flex items-center justify-center h-5 bg-surface border-t border-b border-border cursor-pointer hover:bg-primary-50 transition-colors select-none"
        onClick={() => setTableCollapsed((c) => !c)}
        title={tableCollapsed ? 'Expand table' : 'Collapse table'}
        role="button"
        aria-label={tableCollapsed ? 'Expand table' : 'Collapse table'}
      >
        {tableCollapsed
          ? <ChevronUp className="w-3.5 h-3.5 text-text-secondary" />
          : <ChevronDown className="w-3.5 h-3.5 text-text-secondary" />
        }
      </div>

      {/* ── Table dock ───────────────────────────────────────────────── */}
      {!tableCollapsed && (
        <div
          className="shrink-0 flex flex-col overflow-hidden border-t border-border bg-surface"
          style={{
            height: 'clamp(180px, 40vh, 50vh)',
            // Mobile: 45% of viewport
          }}
        >
          <style>{`
            @media (max-width: 767px) {
              .fs-table-dock { height: 45vh !important; }
            }
          `}</style>
          <div className="fs-table-dock flex flex-col h-full overflow-hidden">
            {tableSlot}
          </div>
        </div>
      )}
    </div>
  );
};
