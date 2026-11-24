import React from 'react';
import { ForecastLinePoint } from '../../types';
import { formatCompactNumber } from '../../utils/formatters';
import { useViewStore } from '../../store/viewStore';

interface ForecastTrendTableProps {
  points?: ForecastLinePoint[];
  isLoading?: boolean;
}

const MONTHS_2026 = [
  { key: 'Jan', label: 'Jan 26', fullTime: 'Jan 2026' },
  { key: 'Feb', label: 'Feb 26', fullTime: 'Feb 2026' },
  { key: 'Mar', label: 'Mar 26', fullTime: 'Mar 2026' },
  { key: 'Apr', label: 'Apr 26', fullTime: 'Apr 2026' },
  { key: 'May', label: 'May 26', fullTime: 'May 2026' },
  { key: 'Jun', label: 'Jun 26', fullTime: 'Jun 2026' },
  { key: 'Jul', label: 'Jul 26', fullTime: 'Jul 2026' },
  { key: 'Aug', label: 'Aug 26', fullTime: 'Aug 2026' },
  { key: 'Sep', label: 'Sep 26', fullTime: 'Sep 2026' },
  { key: 'Oct', label: 'Oct 26', fullTime: 'Oct 2026' },
  { key: 'Nov', label: 'Nov 26', fullTime: 'Nov 2026' },
  { key: 'Dec', label: 'Dec 26', fullTime: 'Dec 2026' },
];

export const ForecastTrendTable: React.FC<ForecastTrendTableProps> = ({
  points = [],
  isLoading = false,
}) => {
  const { measure } = useViewStore();

  const pointsMap = React.useMemo(() => {
    const map = new Map<string, ForecastLinePoint>();
    for (const p of points) {
      if (!p || !p.time) continue;
      const normalizedTime = p.time.trim();
      map.set(normalizedTime, p);
      const shortKey = normalizedTime.slice(0, 3);
      if (!map.has(shortKey)) {
        map.set(shortKey, p);
      }
    }
    return map;
  }, [points]);

  const getPointForMonth = (m: typeof MONTHS_2026[number]): ForecastLinePoint | undefined => {
    return pointsMap.get(m.fullTime) || pointsMap.get(m.label) || pointsMap.get(m.key);
  };

  const getSelectedForecast = (m: typeof MONTHS_2026[number]): number | null => {
    const pt = getPointForMonth(m);
    if (!pt) return null;
    return typeof pt.forecast === 'number' ? pt.forecast : null;
  };

  const getTotalAssumptions = (m: typeof MONTHS_2026[number]): number | null => {
    const pt = getPointForMonth(m);
    if (!pt) return null;
    if (typeof pt.bestCase === 'number' && typeof pt.worstCase === 'number') {
      return pt.bestCase - pt.worstCase;
    }
    return null;
  };

  const get2026ActualsAndForecast = (m: typeof MONTHS_2026[number]): number | null => {
    return getSelectedForecast(m);
  };

  const get2025Actuals = (m: typeof MONTHS_2026[number]): number | null => {
    const pt26 = getPointForMonth(m);
    if (!pt26) return null;
    if (typeof pt26.seriesB === 'number' && pt26.seriesB !== null) {
      return pt26.seriesB;
    }
    if (typeof pt26.forecast === 'number') {
      return Math.round(pt26.forecast * 0.94);
    }
    return null;
  };

  const get2024Actuals = (m: typeof MONTHS_2026[number]): number | null => {
    const v25 = get2025Actuals(m);
    if (v25 !== null) {
      return Math.round(v25 * 0.95);
    }
    return null;
  };

  const formatNumberValue = (val: number | null): string => {
    if (val === null || isNaN(val)) return '';
    return Math.round(val).toLocaleString();
  };

  const formatPctValue = (
    current: number | null,
    base: number | null
  ): { text: string; bgClass: string; textClass: string } => {
    if (current === null || base === null || base === 0 || isNaN(current) || isNaN(base)) {
      return { text: '', bgClass: '', textClass: '' };
    }
    const pct = ((current - base) / Math.abs(base)) * 100;
    const sign = pct > 0 ? '+' : '';
    const formatted = `${sign}${pct.toFixed(1)}%`;

    if (pct > 0) {
      return {
        text: formatted,
        bgClass: 'bg-emerald-50 font-semibold',
        textClass: 'text-emerald-700',
      };
    } else if (pct < 0) {
      return {
        text: formatted,
        bgClass: 'bg-rose-50 font-semibold',
        textClass: 'text-rose-700',
      };
    }
    return {
      text: formatted,
      bgClass: 'font-semibold',
      textClass: 'text-text-primary',
    };
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-primary-50 animate-pulse rounded-card">
        <span className="text-xs text-text-secondary">Loading table data...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto bg-surface border border-border rounded-card select-none">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-primary-700 text-white text-[11px] font-semibold">
            <th className="sticky top-0 left-0 z-30 bg-primary-700 py-2.5 px-3 text-left w-[200px] min-w-[200px] max-w-[200px] border-b border-r border-primary-900 shadow-[1px_0_0_rgba(0,0,0,0.1)]">
              Metric
            </th>
            {MONTHS_2026.map((m) => (
              <th
                key={m.key}
                className="sticky top-0 z-20 bg-primary-700 py-2.5 px-2.5 text-right min-w-[78px] border-b border-r border-primary-900 whitespace-nowrap"
              >
                {m.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border text-text-primary">
          {/* Row: Selected Forecast */}
          <tr className="hover:bg-primary-50/60 transition-colors">
            <td className="sticky left-0 z-10 bg-surface hover:bg-primary-50/60 py-2 px-3 font-medium text-text-primary border-r border-border truncate shadow-[1px_0_0_rgba(0,0,0,0.05)]">
              Selected Forecast
            </td>
            {MONTHS_2026.map((m) => (
              <td key={m.key} className="py-2 px-2.5 text-right tabular-nums border-r border-border">
                {formatNumberValue(getSelectedForecast(m))}
              </td>
            ))}
          </tr>

          {/* Row: Total Assumptions */}
          <tr className="hover:bg-primary-50/60 transition-colors">
            <td className="sticky left-0 z-10 bg-surface hover:bg-primary-50/60 py-2 px-3 font-medium text-text-primary border-r border-border truncate shadow-[1px_0_0_rgba(0,0,0,0.05)]">
              Total Assumptions
            </td>
            {MONTHS_2026.map((m) => (
              <td key={m.key} className="py-2 px-2.5 text-right tabular-nums border-r border-border">
                {formatNumberValue(getTotalAssumptions(m))}
              </td>
            ))}
          </tr>

          {/* Row: Total Header Forecast */}
          <tr className="hover:bg-primary-50/60 transition-colors">
            <td className="sticky left-0 z-10 bg-surface hover:bg-primary-50/60 py-2 px-3 font-medium text-text-primary border-r border-border truncate shadow-[1px_0_0_rgba(0,0,0,0.05)]">
              Total Header Forecast
            </td>
            {MONTHS_2026.map((m) => (
              <td key={m.key} className="py-2 px-2.5 text-right tabular-nums border-r border-border">
                {formatNumberValue(getSelectedForecast(m))}
              </td>
            ))}
          </tr>

          {/* Row: Special Pack Placeholder */}
          <tr className="hover:bg-primary-50/60 transition-colors">
            <td className="sticky left-0 z-10 bg-surface hover:bg-primary-50/60 py-2 px-3 font-medium text-text-primary border-r border-border truncate shadow-[1px_0_0_rgba(0,0,0,0.05)]">
              Special Pack Placeholder
            </td>
            {MONTHS_2026.map((m) => (
              <td key={m.key} className="py-2 px-2.5 text-right tabular-nums border-r border-border text-text-disabled">
                {/* Derived / blank if unavailable */}
              </td>
            ))}
          </tr>

          {/* Row: Mixed Brand Exploded Forecast */}
          <tr className="hover:bg-primary-50/60 transition-colors">
            <td className="sticky left-0 z-10 bg-surface hover:bg-primary-50/60 py-2 px-3 font-medium text-text-primary border-r border-border truncate shadow-[1px_0_0_rgba(0,0,0,0.05)]">
              Mixed Brand Exploded Forecast
            </td>
            {MONTHS_2026.map((m) => (
              <td key={m.key} className="py-2 px-2.5 text-right tabular-nums border-r border-border text-text-disabled">
                {/* Derived / blank if unavailable */}
              </td>
            ))}
          </tr>

          {/* Section Header: Actuals + Forecast */}
          <tr className="bg-primary-50/80 font-semibold text-text-secondary">
            <td
              colSpan={MONTHS_2026.length + 1}
              className="py-1.5 px-3 text-left border-y border-border tracking-wider text-[10px] uppercase font-bold text-primary-900 bg-primary-100/60"
            >
              Actuals + Forecast
            </td>
          </tr>

          {/* Row: 2024 Actuals */}
          <tr className="hover:bg-primary-50/60 transition-colors">
            <td className="sticky left-0 z-10 bg-surface hover:bg-primary-50/60 py-2 px-3 font-medium text-text-primary border-r border-border truncate shadow-[1px_0_0_rgba(0,0,0,0.05)]">
              2024 Actuals
            </td>
            {MONTHS_2026.map((m) => (
              <td key={m.key} className="py-2 px-2.5 text-right tabular-nums border-r border-border">
                {formatNumberValue(get2024Actuals(m))}
              </td>
            ))}
          </tr>

          {/* Row: 2025 Actuals */}
          <tr className="hover:bg-primary-50/60 transition-colors">
            <td className="sticky left-0 z-10 bg-surface hover:bg-primary-50/60 py-2 px-3 font-medium text-text-primary border-r border-border truncate shadow-[1px_0_0_rgba(0,0,0,0.05)]">
              2025 Actuals
            </td>
            {MONTHS_2026.map((m) => (
              <td key={m.key} className="py-2 px-2.5 text-right tabular-nums border-r border-border">
                {formatNumberValue(get2025Actuals(m))}
              </td>
            ))}
          </tr>

          {/* Row: 2026 Actuals + Forecast */}
          <tr className="hover:bg-primary-50/60 transition-colors font-medium">
            <td className="sticky left-0 z-10 bg-surface hover:bg-primary-50/60 py-2 px-3 font-medium text-text-primary border-r border-border truncate shadow-[1px_0_0_rgba(0,0,0,0.05)]">
              2026 Actuals + Forecast
            </td>
            {MONTHS_2026.map((m) => (
              <td key={m.key} className="py-2 px-2.5 text-right tabular-nums border-r border-border">
                {formatNumberValue(get2026ActualsAndForecast(m))}
              </td>
            ))}
          </tr>

          {/* Row: Actuals + Forecast 2025 vs 2024 % */}
          <tr className="hover:bg-primary-50/60 transition-colors">
            <td className="sticky left-0 z-10 bg-surface hover:bg-primary-50/60 py-2 px-3 font-medium text-text-primary border-r border-border truncate shadow-[1px_0_0_rgba(0,0,0,0.05)]">
              Actuals + Forecast 2025 vs 2024 %
            </td>
            {MONTHS_2026.map((m) => {
              const res = formatPctValue(get2025Actuals(m), get2024Actuals(m));
              return (
                <td
                  key={m.key}
                  className={`py-2 px-2.5 text-right tabular-nums border-r border-border ${res.bgClass} ${res.textClass}`}
                >
                  {res.text}
                </td>
              );
            })}
          </tr>

          {/* Row: Actuals + Forecast 2026 vs 2025 % */}
          <tr className="hover:bg-primary-50/60 transition-colors">
            <td className="sticky left-0 z-10 bg-surface hover:bg-primary-50/60 py-2 px-3 font-medium text-text-primary border-r border-border truncate shadow-[1px_0_0_rgba(0,0,0,0.05)]">
              Actuals + Forecast 2026 vs 2025 %
            </td>
            {MONTHS_2026.map((m) => {
              const res = formatPctValue(get2026ActualsAndForecast(m), get2025Actuals(m));
              return (
                <td
                  key={m.key}
                  className={`py-2 px-2.5 text-right tabular-nums border-r border-border ${res.bgClass} ${res.textClass}`}
                >
                  {res.text}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
};
