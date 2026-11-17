import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { StackedBarItem, ProductLevel } from '../../types';
import { formatCompactNumber } from '../../utils/formatters';
import { labels } from '../../constants/labels';
import { ChartEmptyState } from './ChartEmptyState';
import { useViewStore } from '../../store/viewStore';
import { VerticalZoomSlider } from './VerticalZoomSlider';
import { getStraddlingTooltip } from '../../utils/weekSplit';

// ── Design-system colour constants for Recharts (needs hex)
// APG series colours – indigo tints only, in order
const CG_COLORS: Record<string, string> = {
  'Modern trade':    '#0F0E9A',  // primary-700
  'General trade':   '#4F4EC6',  // primary-500
  'E-commerce':      '#A3A2E2',  // primary-300
  'Quick commerce':  '#D6D6F1',  // lighter indigo
};
const CG_FALLBACK = '#8A8FA8';  // neutral grey for unexpected group
const AXIS_COLOR  = '#5A6078';  // text-secondary
const GRID_COLOR  = '#E8EAF1';  // chart-grid

/** All known customer groups in display order */
const CUSTOMER_GROUPS = ['Modern trade', 'General trade', 'E-commerce', 'Quick commerce'];

const APG_NORM_MAP: Record<string, string> = {
  'Modern Trade': 'Modern trade',
  'General Trade': 'General trade',
  'E-commerce': 'E-commerce',
  'Quick Commerce': 'Quick commerce',
  'Modern trade': 'Modern trade',
  'General trade': 'General trade',
  'Quick commerce': 'Quick commerce',
};

interface StackedBarChartProps {
  data?: StackedBarItem[];
  level?: ProductLevel;
  parentBrand?: string;
  drillOn?: boolean;
  onToggleDrillOn?: (on: boolean) => void;
  onDrillDown?: (nodeIdOrCategory: string) => void;
  onDrillUp?: () => void;
  isLoading?: boolean;
  isError?: boolean;
  statusCode?: number;
  onRetry?: () => void;
}

const CustomXAxisTick = (props: any) => {
  const { x, y, payload } = props;
  const fullText = String(payload?.value || '');
  const splitTooltip = getStraddlingTooltip(fullText);
  const maxChars = 12; // ~90px at 11px font
  const displayText = fullText.length > maxChars ? `${fullText.slice(0, maxChars)}…` : fullText;

  return (
    <g transform={`translate(${x},${y})`}>
      <title>{splitTooltip || fullText}</title>
      <text
        x={0}
        y={0}
        dy={12}
        dx={-4}
        textAnchor="end"
        transform="rotate(-35)"
        fill={splitTooltip ? '#B7791F' : AXIS_COLOR}
        fontSize={11}
        fontWeight={splitTooltip ? 600 : 500}
      >
        {displayText}
      </text>
    </g>
  );
};

export const StackedBarChart: React.FC<StackedBarChartProps> = ({
  data = [],
  drillOn = false,
  onToggleDrillOn,
  onDrillDown,
  isLoading = false,
  isError = false,
  statusCode,
  onRetry,
}) => {
  const { charts } = labels;
  const { productLevel, scope, apg, measure, timeGrain } = useViewStore();
  const measureLabel = measure === 'value' ? 'Value (₹)' : measure === 'cases' ? 'Cases' : 'Units';

  const [zoomRange, setZoomRange] = useState<[number, number]>([0, 100]);

  // Reset zoom on level/filter/measure change
  useEffect(() => {
    setZoomRange([0, 100]);
  }, [productLevel, scope, apg, measure, timeGrain]);

  // Esc key turns off drill mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && drillOn && onToggleDrillOn) {
        onToggleDrillOn(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drillOn, onToggleDrillOn]);

  // Auto-off at level 5
  useEffect(() => {
    if (productLevel >= 5 && drillOn && onToggleDrillOn) {
      onToggleDrillOn(false);
    }
  }, [productLevel, drillOn, onToggleDrillOn]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-primary-50 animate-pulse rounded-card">
        <span className="text-xs text-text-secondary">{charts.loading}</span>
      </div>
    );
  }

  if (isError) {
    return <ChartEmptyState isError statusCode={statusCode} onRetry={onRetry} />;
  }

  if (!data || data.length === 0) {
    return (
      <ChartEmptyState>
        <span>{charts.noData}</span>
      </ChartEmptyState>
    );
  }

  const chartData = data.map((item) => {
    const normSegments: Record<string, number> = {};
    for (const [k, v] of Object.entries(item.segments || {})) {
      const normKey = APG_NORM_MAP[k] || k;
      normSegments[normKey] = (normSegments[normKey] || 0) + v;
    }
    return {
      id: item.id,
      category: item.category,
      hasDrillDown: item.hasDrillDown,
      ...normSegments,
      _total: item.total,
    };
  });

  const maxTotal = Math.max(...data.map((d) => d.total || 0), 1);
  const isZoomed = zoomRange[0] > 0 || zoomRange[1] < 100;
  const yMin = Math.round((maxTotal * zoomRange[0]) / 100);
  const yMax = Math.max(yMin + 1, Math.round((maxTotal * zoomRange[1]) / 100));

  const minPlotWidth = data.length * 56;

  return (
    <div className="w-full h-full flex flex-row relative min-h-0">
      {/* Zoomed chip */}
      {isZoomed && (
        <div className="absolute top-1 right-8 z-20 flex items-center gap-1.5 px-2 py-0.5 bg-primary-50 border border-primary-200 rounded text-[11px] text-primary-800 shadow-sm">
          <span>Y-axis zoomed</span>
          <button
            type="button"
            onClick={() => setZoomRange([0, 100])}
            className="text-primary-700 underline font-medium hover:text-primary-900 ml-1"
          >
            Reset zoom
          </button>
        </div>
      )}

      {/* Horizontal scrollable plot area */}
      <div className="flex-1 h-full min-h-0 overflow-x-auto overflow-y-hidden">
        <div
          style={{
            minWidth: '100%',
            width: minPlotWidth > 0 ? `${Math.max(minPlotWidth, 100)}px` : '100%',
            height: '100%',
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 15, left: 0, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
              <XAxis
                dataKey="category"
                interval={0}
                tick={<CustomXAxisTick />}
                height={60}
                tickLine={false}
                axisLine={{ stroke: GRID_COLOR }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: AXIS_COLOR }}
                tickLine={false}
                axisLine={{ stroke: GRID_COLOR }}
                tickFormatter={(val) => formatCompactNumber(val, { isNeutral: true, measure })}
                name={measureLabel}
                domain={isZoomed ? [yMin, yMax] : [0, 'auto']}
                allowDataOverflow={true}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const total = payload.reduce((acc, p) => acc + (Number(p.value) || 0), 0);
                    return (
                      <div className="bg-surface border border-border p-2.5 text-xs shadow-md rounded-card space-y-1.5 z-50">
                        <div className="font-semibold text-text-primary border-b border-border pb-1">{label}</div>
                        {payload.map((p: any) => (
                          <div key={p.name} className="flex justify-between gap-4">
                            <span style={{ color: p.color }} className="font-medium">{p.name}:</span>
                            <span className="font-semibold tabular-nums">{formatCompactNumber(p.value, { isNeutral: true, measure })}</span>
                          </div>
                        ))}
                        <div className="pt-1 border-t border-border flex justify-between gap-4 font-bold text-text-primary">
                          <span>{charts.tooltip.total}:</span>
                          <span className="tabular-nums">{formatCompactNumber(total, { isNeutral: true, measure })}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ fontSize: '11px', paddingBottom: '4px' }}
                formatter={(value) => <span className="text-text-secondary text-xs">{value}</span>}
              />

              {CUSTOMER_GROUPS.map((cg) => (
                <Bar
                  key={cg}
                  dataKey={cg}
                  name={cg}
                  stackId="cg-stack"
                  fill={CG_COLORS[cg] || CG_FALLBACK}
                  stroke="none"
                  maxBarSize={48}
                  cursor={drillOn ? 'pointer' : 'default'}
                  activeBar={drillOn ? { stroke: '#0F0E9A', strokeWidth: 1.5, fillOpacity: 0.85 } : false}
                  onClick={(entry: any) => {
                    if (drillOn && onDrillDown) {
                      const idOrCategory = entry?.id || entry?.payload?.id || entry?.category || entry?.payload?.category;
                      if (idOrCategory) onDrillDown(idOrCategory);
                    }
                  }}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Vertical Y-axis zoom slider */}
      <div className="w-5 shrink-0 h-full flex flex-col items-center justify-center py-2 select-none border-l border-border/40">
        <VerticalZoomSlider zoomRange={zoomRange} onChange={setZoomRange} />
      </div>
    </div>
  );
};
