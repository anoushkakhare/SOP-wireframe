import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { WaterfallStep } from '../../types';
import { formatCompactNumber } from '../../utils/formatters';
import { labels } from '../../constants/labels';
import { ChartEmptyState } from './ChartEmptyState';
import { useViewStore } from '../../store/viewStore';

// ── Design-system colour constants for Recharts
const COLORS = {
  baseline:   '#4F4EC6',  // primary-500
  increase:   '#1B7F55',  // positive green
  decrease:   '#C0392B',  // negative red
  final:      '#0F0E9A',  // primary-700 / brand
  connector:  '#C8CCDA',  // border-strong (dotted grey)
  grid:       '#E8EAF1',  // chart-grid
  axis:       '#5A6078',  // text-secondary
};

/** Map waterfall step name → display label (from labels.ts) */
const STEP_LABELS: Record<string, string> = {
  Baseline:          labels.charts.waterfall.baseline,
  DD:                labels.charts.waterfall.demandDrivers,
  'Demand drivers':  labels.charts.waterfall.demandDrivers,
  Adjust:            labels.charts.waterfall.manualAdjustment,
  'Manual adjustment': labels.charts.waterfall.manualAdjustment,
  Forecast:          labels.charts.waterfall.finalForecast,
  'Final forecast':  labels.charts.waterfall.finalForecast,
};

interface WaterfallChartProps {
  data?: WaterfallStep[];
  isLoading?: boolean;
  isError?: boolean;
  statusCode?: number;
  onRetry?: () => void;
}

export const WaterfallChart: React.FC<WaterfallChartProps> = ({
  data = [],
  isLoading = false,
  isError = false,
  statusCode,
  onRetry,
}) => {
  const { charts } = labels;
  const { measure, compare } = useViewStore();
  const measureLabel = measure === 'value' ? 'Value (₹)' : measure === 'cases' ? 'Cases' : 'Units';

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
    return <ChartEmptyState />;
  }

  const isComparing = compare.on && Boolean(compare.b);

  // Build floating bar data
  let runningTotal = 0;
  const processedData = data.map((step) => {
    let base = 0;
    let height = Math.abs(step.value);

    if (step.type === 'total') {
      base = 0;
      height = step.value;
      runningTotal = step.value;
    } else if (step.type === 'decrease') {
      runningTotal -= height;
      base = runningTotal;
    } else if (step.type === 'increase') {
      base = runningTotal;
      runningTotal += height;
    }

    // Colour by step type / name
    let color = COLORS.baseline;
    if (step.type === 'increase') {
      color = COLORS.increase;
    } else if (step.type === 'decrease') {
      color = COLORS.decrease;
    }

    const displayName = STEP_LABELS[step.name] || step.name;

    if (step.type === 'total') {
      if (isComparing && step.name.includes(compare.b)) {
        color = '#D97706'; // Amber for Forecast B
      } else {
        color = COLORS.final; // Indigo for Forecast A / Final forecast
      }
    }

    return {
      name:       displayName,
      origName:   step.name,
      base,
      height,
      rawDelta:   step.value,
      type:       step.type,
      color,
      isTotal:    step.type === 'total',
      topDrivers: step.topDrivers,
    };
  });

  return (
    <div className="w-full h-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={processedData}
          margin={{ top: 14, right: 15, left: 0, bottom: 5 }}
          barSize={52}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: COLORS.axis, fontWeight: 500 }}
            tickLine={false}
            axisLine={{ stroke: COLORS.grid }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: COLORS.axis }}
            tickLine={false}
            axisLine={{ stroke: COLORS.grid }}
            tickFormatter={(val) => formatCompactNumber(val, { isNeutral: true, measure })}
            name={measureLabel}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                const formattedDelta = item.isTotal
                  ? formatCompactNumber(item.height, { isNeutral: true, measure })
                  : formatCompactNumber(item.rawDelta, { withSign: true, measure });
                const drivers = item.topDrivers || [];

                return (
                  <div className="bg-surface border border-border p-2.5 text-xs shadow-md rounded-card space-y-1.5 z-50 min-w-[210px]">
                    <div className="font-semibold text-text-primary border-b border-border pb-1 flex items-center justify-between gap-3">
                      <span>{item.name}</span>
                      <span className="font-bold tabular-nums text-text-primary">{formattedDelta}</span>
                    </div>
                    {drivers.length > 0 && (
                      <div className="space-y-1 pt-0.5">
                        <div className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
                          Top 3 Drivers
                        </div>
                        {drivers.map((drv: any, idx: number) => {
                          const isPos = drv.value >= 0;
                          return (
                            <div key={idx} className="flex justify-between items-center text-[11px] gap-2">
                              <span className="text-text-secondary truncate">{drv.name}</span>
                              <span className={`font-semibold tabular-nums shrink-0 ${
                                item.isTotal ? 'text-text-primary' : (isPos ? 'text-positive' : 'text-negative')
                              }`}>
                                {item.isTotal ? '' : (isPos ? '+' : '')}{formatCompactNumber(drv.value, { withSign: !item.isTotal, measure })}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />

          {/* Invisible base bar to float deltas */}
          <Bar dataKey="base" stackId="waterfall" fill="transparent" isAnimationActive={false} />

          {/* Visible waterfall bar */}
          <Bar dataKey="height" stackId="waterfall" stroke="none" isAnimationActive={false}>
            {processedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
