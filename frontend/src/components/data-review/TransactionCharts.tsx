import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { TransactionReviewItem } from '../../types';
import { formatCompactNumber } from '../../utils/formatters';

// Consistent design system palette
export const TRANSACTION_PALETTE = [
  '#0F0E9A', // primary-700 (Deep Navy / Royal)
  '#3F6FD8', // primary-500 (Soft Cobalt)
  '#1B8A7A', // Teal
  '#B7791F', // Warm Amber
  '#8B5CB8', // Purple
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#64748B', // Slate / "Other"
];

const GRID_COLOR = '#E8EAF1';
const AXIS_COLOR = '#5A6078';

interface TransactionChartCommonProps {
  items: TransactionReviewItem[];
  periods: string[];
  groups: string[];
  measure?: string;
  isLoading?: boolean;
}

// ─── 1. Stacked Bar Chart ───────────────────────────────────────────────────
export const TransactionBarChart: React.FC<TransactionChartCommonProps> = ({
  items,
  periods,
  groups,
  measure = 'value',
  isLoading = false,
}) => {
  // Transform flat items into { period, [group]: value, rowCounts: { [group]: rows } }
  const chartData = useMemo(() => {
    const periodMap = new Map<string, any>();
    for (const p of periods) {
      periodMap.set(p, { period: p, _rowCounts: {}, _anomalies: {} });
    }

    for (const it of items) {
      const entry = periodMap.get(it.period);
      if (entry) {
        entry[it.group] = it.value;
        entry._rowCounts[it.group] = it.rowCount;
        if (it.isAnomaly) {
          entry._anomalies[it.group] = it.isAnomaly;
        }
      }
    }

    return Array.from(periodMap.values());
  }, [items, periods]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50/50 animate-pulse rounded-lg">
        <span className="text-xs text-text-secondary">Loading transactions...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-xs text-text-disabled">
        No transaction data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 10, right: 15, left: -5, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
        <XAxis
          dataKey="period"
          stroke={AXIS_COLOR}
          tick={{ fontSize: 11, fill: AXIS_COLOR }}
          tickLine={false}
          interval={0}
          angle={-30}
          textAnchor="end"
          height={35}
        />
        <YAxis
          stroke={AXIS_COLOR}
          tick={{ fontSize: 11, fill: AXIS_COLOR }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatCompactNumber(v, { isNeutral: true, measure })}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload || payload.length === 0) return null;
            const dataPoint = payload[0]?.payload;
            const total = payload.reduce((sum, p) => sum + (Number(p.value) || 0), 0);
            return (
              <div className="bg-surface border border-border rounded-lg shadow-dropdown p-2.5 text-xs select-none max-w-xs">
                <div className="font-semibold text-text-primary border-b border-border-subtle pb-1 mb-1.5 flex items-center justify-between">
                  <span>{label}</span>
                  <span className="font-mono tabular-nums text-primary-700">
                    Total: {formatCompactNumber(total, { isNeutral: true, measure })}
                  </span>
                </div>
                <div className="space-y-1 max-h-48 overflow-auto">
                  {payload.map((p: any) => {
                    const groupName = p.name;
                    const val = Number(p.value) || 0;
                    const rows = dataPoint?._rowCounts?.[groupName] ?? 0;
                    const anomaly = dataPoint?._anomalies?.[groupName];
                    return (
                      <div
                        key={groupName}
                        className="flex items-center justify-between gap-3 text-[11px]"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-xs shrink-0"
                            style={{ backgroundColor: p.color }}
                          />
                          <span className="truncate text-text-secondary">{groupName}</span>
                          {anomaly === 'gap' && (
                            <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                              GAP
                            </span>
                          )}
                          {anomaly === 'spike' && (
                            <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-800">
                              SPIKE
                            </span>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono tabular-nums font-medium text-text-primary mr-1.5">
                            {formatCompactNumber(val, { isNeutral: true, measure })}
                          </span>
                          <span className="font-mono text-[10px] text-text-disabled">
                            ({rows.toLocaleString()} r)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }}
        />
        <Legend
          verticalAlign="top"
          align="right"
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, paddingBottom: 6 }}
        />
        {groups.map((g, idx) => (
          <Bar
            key={g}
            dataKey={g}
            stackId="transactions"
            fill={TRANSACTION_PALETTE[idx % TRANSACTION_PALETTE.length]}
            maxBarSize={45}
            radius={idx === groups.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};

// ─── 2. Line Chart ──────────────────────────────────────────────────────────
export const TransactionLineChart: React.FC<TransactionChartCommonProps> = ({
  items,
  periods,
  groups,
  measure = 'value',
  isLoading = false,
}) => {
  const chartData = useMemo(() => {
    const periodMap = new Map<string, any>();
    for (const p of periods) {
      periodMap.set(p, { period: p, _rowCounts: {}, _anomalies: {} });
    }

    for (const it of items) {
      const entry = periodMap.get(it.period);
      if (entry) {
        entry[it.group] = it.value;
        entry._rowCounts[it.group] = it.rowCount;
        if (it.isAnomaly) {
          entry._anomalies[it.group] = it.isAnomaly;
        }
      }
    }

    return Array.from(periodMap.values());
  }, [items, periods]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50/50 animate-pulse rounded-lg">
        <span className="text-xs text-text-secondary">Loading trend lines...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-xs text-text-disabled">
        No transaction trend data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 10, right: 15, left: -5, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
        <XAxis
          dataKey="period"
          stroke={AXIS_COLOR}
          tick={{ fontSize: 11, fill: AXIS_COLOR }}
          tickLine={false}
          interval={0}
          angle={-30}
          textAnchor="end"
          height={35}
        />
        <YAxis
          stroke={AXIS_COLOR}
          tick={{ fontSize: 11, fill: AXIS_COLOR }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatCompactNumber(v, { isNeutral: true, measure })}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload || payload.length === 0) return null;
            const dataPoint = payload[0]?.payload;
            return (
              <div className="bg-surface border border-border rounded-lg shadow-dropdown p-2.5 text-xs select-none max-w-xs">
                <div className="font-semibold text-text-primary border-b border-border-subtle pb-1 mb-1.5">
                  {label}
                </div>
                <div className="space-y-1 max-h-48 overflow-auto">
                  {payload.map((p: any) => {
                    const groupName = p.name;
                    const val = Number(p.value) || 0;
                    const rows = dataPoint?._rowCounts?.[groupName] ?? 0;
                    const anomaly = dataPoint?._anomalies?.[groupName];
                    return (
                      <div
                        key={groupName}
                        className="flex items-center justify-between gap-3 text-[11px]"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: p.color }}
                          />
                          <span className="truncate text-text-secondary">{groupName}</span>
                          {anomaly === 'gap' && (
                            <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                              GAP (0)
                            </span>
                          )}
                          {anomaly === 'spike' && (
                            <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-800">
                              SPIKE
                            </span>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono tabular-nums font-medium text-text-primary mr-1.5">
                            {formatCompactNumber(val, { isNeutral: true, measure })}
                          </span>
                          <span className="font-mono text-[10px] text-text-disabled">
                            ({rows.toLocaleString()} r)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }}
        />
        <Legend
          verticalAlign="top"
          align="right"
          iconType="plainline"
          iconSize={12}
          wrapperStyle={{ fontSize: 11, paddingBottom: 6 }}
        />
        {groups.map((g, idx) => (
          <Line
            key={g}
            type="monotone"
            dataKey={g}
            stroke={TRANSACTION_PALETTE[idx % TRANSACTION_PALETTE.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

// ─── 3. Pie Chart (Top 6 + Other) ───────────────────────────────────────────
export const TransactionPieChart: React.FC<TransactionChartCommonProps> = ({
  items,
  measure = 'value',
  isLoading = false,
}) => {
  // Aggregate totals per group, sort descending, slice top 6 + Other
  const pieData = useMemo(() => {
    const totalsByGroup = new Map<string, { value: number; rowCount: number }>();
    for (const it of items) {
      const curr = totalsByGroup.get(it.group) || { value: 0, rowCount: 0 };
      curr.value += it.value;
      curr.rowCount += it.rowCount;
      totalsByGroup.set(it.group, curr);
    }

    const sorted = Array.from(totalsByGroup.entries())
      .map(([name, stats]) => ({
        name,
        value: stats.value,
        rowCount: stats.rowCount,
      }))
      .sort((a, b) => b.value - a.value);

    if (sorted.length <= 6) {
      return sorted;
    }

    const top6 = sorted.slice(0, 6);
    const otherSlice = sorted.slice(6);
    const otherValue = otherSlice.reduce((s, x) => s + x.value, 0);
    const otherRowCount = otherSlice.reduce((s, x) => s + x.rowCount, 0);

    return [
      ...top6,
      {
        name: 'Other',
        value: otherValue,
        rowCount: otherRowCount,
      },
    ];
  }, [items]);

  const grandTotal = useMemo(() => {
    return pieData.reduce((sum, item) => sum + item.value, 0);
  }, [pieData]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50/50 animate-pulse rounded-lg">
        <span className="text-xs text-text-secondary">Loading pie distribution...</span>
      </div>
    );
  }

  if (pieData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-xs text-text-disabled">
        No transaction distribution data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload || payload.length === 0) return null;
            const dataPoint = payload[0]?.payload;
            const val = Number(dataPoint?.value) || 0;
            const pct = grandTotal > 0 ? ((val / grandTotal) * 100).toFixed(1) : '0.0';
            const rows = dataPoint?.rowCount ?? 0;

            return (
              <div className="bg-surface border border-border rounded-lg shadow-dropdown p-2.5 text-xs select-none">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: payload[0].color }}
                  />
                  <span className="font-semibold text-text-primary">{dataPoint.name}</span>
                </div>
                <div className="space-y-0.5 text-[11px] font-mono tabular-nums">
                  <div className="text-text-primary font-medium">
                    {formatCompactNumber(val, { isNeutral: true, measure })} ({pct}%)
                  </div>
                  <div className="text-text-secondary">{rows.toLocaleString()} rows ingested</div>
                </div>
              </div>
            );
          }}
        />
        <Legend
          verticalAlign="middle"
          align="right"
          layout="vertical"
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, paddingLeft: 10 }}
          formatter={(value, entry: any) => {
            const item = entry?.payload;
            const pct = grandTotal > 0 ? ((item.value / grandTotal) * 100).toFixed(0) : '0';
            return (
              <span className="text-text-secondary">
                {value} <span className="text-text-disabled font-mono">({pct}%)</span>
              </span>
            );
          }}
        />
        <Pie
          data={pieData}
          cx="40%"
          cy="50%"
          innerRadius={45}
          outerRadius={95}
          paddingAngle={2}
          dataKey="value"
        >
          {pieData.map((entry, index) => {
            const isOther = entry.name === 'Other';
            const color = isOther
              ? '#64748B'
              : TRANSACTION_PALETTE[index % TRANSACTION_PALETTE.length];
            return <Cell key={`cell-${entry.name}`} fill={color} />;
          })}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
};

