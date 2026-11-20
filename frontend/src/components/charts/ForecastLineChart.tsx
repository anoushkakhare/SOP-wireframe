import React, { useState, useEffect } from 'react';
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
import { useViewStore } from '../../store/viewStore';
import { VerticalZoomSlider } from './VerticalZoomSlider';
import { getStraddlingTooltip } from '../../utils/weekSplit';

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

const CustomLineXAxisTick = (props: any) => {
  const { x, y, payload } = props;
  const val = String(payload?.value || '');
  const splitTooltip = getStraddlingTooltip(val);

  return (
    <g transform={`translate(${x},${y})`}>
      {splitTooltip && <title>{splitTooltip}</title>}
      <text
        x={0}
        y={0}
        dy={12}
        textAnchor="middle"
        fill={splitTooltip ? '#B7791F' : COLORS.axis}
        fontSize={11}
        fontWeight={splitTooltip ? 600 : 400}
      >
        {val}
      </text>
    </g>
  );
};

export const ForecastLineChart: React.FC<ForecastLineChartProps> = ({
  data = [],
  isLoading = false,
  isError = false,
  statusCode,
  onRetry,
}) => {
  const { charts } = labels;
  const { productLevel, scope, apg, measure, timeGrain, compare } = useViewStore();
  const measureLabel = measure === 'value' ? 'Value (₹)' : measure === 'cases' ? 'Cases' : 'Units';

  const [zoomRange, setZoomRange] = useState<[number, number]>([0, 100]);

  // Reset zoom on level/filter/measure change
  useEffect(() => {
    setZoomRange([0, 100]);
  }, [productLevel, scope, apg, measure, timeGrain]);

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
  const nameA = data[0]?.aName || 'Current cycle';
  const nameB = data[0]?.bName || compare.b;

  const chartData = data.map((d) => ({
    time:      d.time,
    forecast:  d.forecast,
    band:      [d.worstCase, d.bestCase],
    worstCase: d.worstCase,
    bestCase:  d.bestCase,
    seriesA:   d.seriesA !== undefined ? d.seriesA : d.forecast,
    seriesB:   d.seriesB,
    delta:     d.delta,
  }));

  const allVals = data.flatMap((d) => [
    d.forecast,
    d.worstCase,
    d.bestCase,
    d.seriesA,
    d.seriesB,
  ].filter((v): v is number => typeof v === 'number'));
  const minVal = allVals.length ? Math.min(...allVals) : 0;
  const maxVal = allVals.length ? Math.max(...allVals) : 100;
  const naturalMin = Math.max(0, Math.floor(minVal * 0.9));
  const naturalMax = Math.ceil(maxVal * 1.05);

  const isZoomed = zoomRange[0] > 0 || zoomRange[1] < 100;
  const yMin = Math.round(naturalMin + (naturalMax - naturalMin) * (zoomRange[0] / 100));
  const yMax = Math.max(yMin + 1, Math.round(naturalMin + (naturalMax - naturalMin) * (zoomRange[1] / 100)));

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

      {/* Main chart area */}
      <div className="flex-1 h-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 12, right: 18, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
            <XAxis
              dataKey="time"
              tick={<CustomLineXAxisTick />}
              tickLine={false}
              axisLine={{ stroke: COLORS.grid }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: COLORS.axis }}
              tickLine={false}
              axisLine={{ stroke: COLORS.grid }}
              tickFormatter={(val) => formatCompactNumber(val, { isNeutral: true, measure })}
              domain={isZoomed ? [yMin, yMax] : ['auto', 'auto']}
              allowDataOverflow={true}
              name={labels.charts.axisForecast(measureLabel)}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  const straddlingTooltip = getStraddlingTooltip(label);

                  if (isComparing) {
                    const valA = item.seriesA ?? item.forecast;
                    const valB = item.seriesB;
                    const delta = item.delta;
                    const pct = valA && delta !== null ? ((delta / Math.abs(valA)) * 100).toFixed(1) : null;
                    const isDeltaPos = delta !== null && delta >= 0;

                    return (
                      <div className="bg-surface border border-border p-2.5 text-xs shadow-md rounded-card space-y-1.5 z-50">
                        <div className="font-semibold text-text-primary border-b border-border pb-1 flex items-center justify-between gap-2">
                          <span>{label}</span>
                          <span className="text-[10px] px-1 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                            Compare
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="font-medium text-primary-700 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-primary-700 inline-block" />
                            {nameA}:
                          </span>
                          <span className="font-bold tabular-nums">
                            {formatCompactNumber(valA, { isNeutral: true, measure })}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="font-medium text-[#D97706] flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#D97706] inline-block" />
                            {nameB}:
                          </span>
                          <span className="font-bold tabular-nums">
                            {valB !== null && valB !== undefined ? formatCompactNumber(valB, { isNeutral: true, measure }) : '–'}
                          </span>
                        </div>
                        {delta !== null && delta !== undefined && (
                          <div className={`pt-1 border-t border-border flex justify-between gap-4 font-bold ${
                            isDeltaPos ? 'text-positive' : 'text-negative'
                          }`}>
                            <span>Delta (B - A):</span>
                            <span className="tabular-nums">
                              {isDeltaPos ? '+' : ''}{formatCompactNumber(delta, { measure })} {pct ? `(${isDeltaPos ? '+' : ''}${pct}%)` : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div className="bg-surface border border-border p-2.5 text-xs shadow-md rounded-card space-y-1.5 z-50">
                      <div className="font-semibold text-text-primary border-b border-border pb-1 flex items-center justify-between gap-2">
                        <span>{label}</span>
                        {straddlingTooltip && (
                          <span className="text-[10px] px-1 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                            Split week
                          </span>
                        )}
                      </div>
                      {straddlingTooltip && (
                        <div className="text-[11px] text-amber-800 bg-amber-50/50 p-1.5 rounded font-mono border border-amber-200/50">
                          {straddlingTooltip}
                        </div>
                      )}
                      <div className="flex justify-between gap-4">
                        <span style={{ color: COLORS.positive }}>{charts.tooltip.bestCase}:</span>
                        <span className="font-semibold tabular-nums">{formatCompactNumber(item.bestCase, { isNeutral: true, measure })}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="font-semibold text-text-primary">{charts.tooltip.forecast}:</span>
                        <span className="font-bold tabular-nums">{formatCompactNumber(item.forecast, { isNeutral: true, measure })}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span style={{ color: COLORS.negative }}>{charts.tooltip.worstCase}:</span>
                        <span className="font-semibold tabular-nums">{formatCompactNumber(item.worstCase, { isNeutral: true, measure })}</span>
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
              formatter={(value) => <span className="text-text-secondary text-xs">{value}</span>}
            />

            {/* In compare mode: A solid indigo, B dashed amber (#D97706) */}
            {isComparing ? (
              <>
                <Line
                  name={nameA}
                  type="monotone"
                  dataKey="seriesA"
                  stroke={COLORS.forecast}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: COLORS.forecast, strokeWidth: 1 }}
                  activeDot={{ r: 5, fill: COLORS.forecast }}
                />
                <Line
                  name={nameB}
                  type="monotone"
                  dataKey="seriesB"
                  stroke="#D97706"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  connectNulls={false}
                  dot={{ r: 3, fill: '#D97706', strokeWidth: 1 }}
                  activeDot={{ r: 5, fill: '#D97706' }}
                />
              </>
            ) : (
              <>
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
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Vertical Y-axis zoom slider */}
      <div className="w-5 shrink-0 h-full flex flex-col items-center justify-center py-2 select-none border-l border-border/40">
        <VerticalZoomSlider zoomRange={zoomRange} onChange={setZoomRange} />
      </div>
    </div>
  );
};
