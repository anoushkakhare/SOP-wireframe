import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { ForecastLinePoint } from '../../types';
import { formatCompactNumber } from '../../utils/formatters';
import { labels } from '../../constants/labels';
import { ChartEmptyState } from './ChartEmptyState';

// ── Design-system colour constants (kept here for Recharts which needs hex values)
const COLORS = {
  forecast:  '#0F0E9A',  // --color-primary-700 / --color-chart-forecast
  bandFill:  '#E2E2F6',  // --color-primary-100  (60% opacity applied via fillOpacity)
  bandEdge:  '#A3A2E2',  // --color-primary-300
  grid:      '#E8EAF1',  // --color-chart-grid
  axis:      '#5A6078',  // --color-text-secondary
  positive:  '#1B7F55',  // --color-positive
  negative:  '#C0392B',  // --color-negative
};

interface ForecastLineChartProps {
  data?: ForecastLinePoint[];
  isLoading?: boolean;
  isError?: boolean;
  statusCode?: number;
  onRetry?: () => void;
}

export const ForecastLineChart: React.FC<ForecastLineChartProps> = ({
  data = [],
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

  if (!data || data.length === 0) {
    return (
      <ChartEmptyState isError={isError} statusCode={statusCode} onRetry={onRetry} />
    );
  }

  const chartData = data.map((d) => ({
    time:      d.time,
    forecast:  d.forecast,
    band:      [d.worstCase, d.bestCase],
    worstCase: d.worstCase,
    bestCase:  d.bestCase,
  }));

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 12, right: 18, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 12, fill: COLORS.axis }}
            tickLine={false}
            axisLine={{ stroke: COLORS.grid }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: COLORS.axis }}
            tickLine={false}
            axisLine={{ stroke: COLORS.grid }}
            tickFormatter={(val) => formatCompactNumber(val, { isNeutral: true })}
            domain={['auto', 'auto']}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-surface border border-border p-2.5 text-xs shadow-md rounded-card space-y-1.5">
                    <div className="font-semibold text-text-primary border-b border-border pb-1">{label}</div>
                    <div className="flex justify-between gap-4">
                      <span style={{ color: COLORS.positive }}>{charts.tooltip.bestCase}:</span>
                      <span className="font-semibold tabular-nums">{formatCompactNumber(item.bestCase, { isNeutral: true })}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="font-semibold text-text-primary">{charts.tooltip.forecast}:</span>
                      <span className="font-bold tabular-nums">{formatCompactNumber(item.forecast, { isNeutral: true })}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span style={{ color: COLORS.negative }}>{charts.tooltip.worstCase}:</span>
                      <span className="font-semibold tabular-nums">{formatCompactNumber(item.worstCase, { isNeutral: true })}</span>
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
            wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
          />

          {/* Shaded band between worst and best case */}
          <Area
            name={charts.series.band}
            dataKey="band"
            stroke={COLORS.bandEdge}
            strokeDasharray="4 3"
            fill={COLORS.bandFill}
            fillOpacity={0.6}
            activeDot={false}
            isAnimationActive={false}
          />

          {/* Forecast main line */}
          <Line
            name={charts.series.forecastLine}
            type="monotone"
            dataKey="forecast"
            stroke={COLORS.forecast}
            strokeWidth={2.5}
            dot={{ r: 3, fill: COLORS.forecast, strokeWidth: 1 }}
            activeDot={{ r: 5, fill: COLORS.forecast }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
