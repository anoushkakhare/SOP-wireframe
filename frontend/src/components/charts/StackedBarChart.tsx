import React from 'react';
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
import { ChevronDown, ChevronUp } from 'lucide-react';
import { labels } from '../../constants/labels';
import { ChartEmptyState } from './ChartEmptyState';

// ── Design-system colour constants for Recharts (needs hex)
// Customer-group series colours – indigo tints only, in order
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

interface StackedBarChartProps {
  data?: StackedBarItem[];
  level: ProductLevel;
  parentBrand?: string;
  onDrillDown?: (category: string) => void;
  onDrillUp?: () => void;
  isLoading?: boolean;
  isError?: boolean;
  statusCode?: number;
  onRetry?: () => void;
}

export const StackedBarChart: React.FC<StackedBarChartProps> = ({
  data = [],
  level,
  parentBrand,
  onDrillDown,
  onDrillUp,
  isLoading = false,
  isError = false,
  statusCode,
  onRetry,
}) => {
  const { charts } = labels;

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
        {level === 'product' && onDrillUp && (
          <button
            type="button"
            onClick={onDrillUp}
            title={charts.drillUp}
            className="px-2.5 py-1 bg-surface border border-primary-700 text-primary-700 rounded-full text-xs flex items-center gap-1 font-semibold hover:bg-primary-50 transition-colors"
          >
            <ChevronUp className="w-3.5 h-3.5" />
            {charts.drillUp}
          </button>
        )}
      </ChartEmptyState>
    );
  }

  const chartData = data.map((item) => ({
    category:    item.category,
    hasDrillDown: item.hasDrillDown,
    ...item.segments,
    _total:      item.total,
  }));

  return (
    <div className="w-full h-full flex flex-col">
      {/* Drill buttons row above bars */}
      <div className="flex items-center justify-around px-8 pb-1 pt-0.5">
        {data.map((item) => (
          <div key={item.category} className="flex flex-col items-center">
            {level === 'brand' ? (
              <button
                type="button"
                onClick={() => onDrillDown && onDrillDown(item.category)}
                title={charts.drillDown}
                aria-label={`${charts.drillDown}: ${item.category}`}
                className="w-6 h-6 rounded-full border border-primary-700 bg-surface hover:bg-primary-700 hover:text-white text-primary-700 flex items-center justify-center shadow-sm transition-all hover:scale-105"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onDrillUp && onDrillUp()}
                title={charts.drillUp}
                aria-label={charts.drillUp}
                className="w-6 h-6 rounded-full border border-primary-700 bg-primary-700 text-white hover:bg-primary-900 flex items-center justify-center shadow-sm hover:scale-105 transition-all"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 15, left: 0, bottom: 5 }}
            barSize={44}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
            <XAxis
              dataKey="category"
              tick={{ fontSize: 12, fill: AXIS_COLOR, fontWeight: 500 }}
              tickLine={false}
              axisLine={{ stroke: GRID_COLOR }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: AXIS_COLOR }}
              tickLine={false}
              axisLine={{ stroke: GRID_COLOR }}
              tickFormatter={(val) => formatCompactNumber(val, { isNeutral: true })}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const total = payload.reduce((acc, p) => acc + (Number(p.value) || 0), 0);
                  return (
                    <div className="bg-surface border border-border p-2.5 text-xs shadow-md rounded-card space-y-1.5">
                      <div className="font-semibold text-text-primary border-b border-border pb-1">{label}</div>
                      {payload.map((p: any) => (
                        <div key={p.name} className="flex justify-between gap-4">
                          <span style={{ color: p.color }} className="font-medium">{p.name}:</span>
                          <span className="font-semibold tabular-nums">{formatCompactNumber(p.value, { isNeutral: true })}</span>
                        </div>
                      ))}
                      <div className="pt-1 border-t border-border flex justify-between gap-4 font-bold text-text-primary">
                        <span>{charts.tooltip.total}:</span>
                        <span className="tabular-nums">{formatCompactNumber(total, { isNeutral: true })}</span>
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
            />

            {CUSTOMER_GROUPS.map((cg) => (
              <Bar
                key={cg}
                dataKey={cg}
                name={cg}
                stackId="cg-stack"
                fill={CG_COLORS[cg] || CG_FALLBACK}
                stroke="none"
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
