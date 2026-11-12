import React from 'react';
import { KpiItem } from '../../types';
import { formatCompactNumber } from '../../utils/formatters';
import { getSignColor } from '../../utils/signColor';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { labels } from '../../constants/labels';

interface KpiCardProps {
  kpi: KpiItem;
}

const TOOLTIP_MAP: Record<string, string> = {
  total_forecast: labels.kpi.tooltips.totalForecast,
  forecast_adj:   labels.kpi.tooltips.forecastAdj,
  risk:           labels.kpi.tooltips.risk,
  opportunity:    labels.kpi.tooltips.opportunity,
  growth_fy:      labels.kpi.tooltips.fyGrowth,
  growth_ytd:     labels.kpi.tooltips.ytdGrowth,
  growth_ytg:     labels.kpi.tooltips.ytgGrowth,
  growth_fy_ro:   labels.kpi.tooltips.fyGrowthRO,
  growth_ytg_ro:  labels.kpi.tooltips.ytgGrowthRO,
};

/**
 * KpiCard – displays a single KPI metric.
 *
 * Visual rules (per spec):
 * - Positive values → positive green, up triangle icon
 * - Negative values → negative red, down triangle icon
 * - Neutral (total forecast, zero) → text-primary, no icon
 * - Numbers always use tabular-nums
 * - Info tooltip with one-line definition
 * - "vs last year" caption where data exists
 */
export const KpiCard: React.FC<KpiCardProps> = ({ kpi }) => {
  const isNeutral = kpi.isNeutral || kpi.key === 'total_forecast';
  const formattedValue = formatCompactNumber(kpi.value, {
    format: kpi.format,
    isNeutral,
  });

  const signStyle = getSignColor(kpi.value, isNeutral);
  const tooltipText = TOOLTIP_MAP[kpi.key] || kpi.label;

  const TrendIcon =
    isNeutral || kpi.value === 0
      ? Minus
      : kpi.value > 0
      ? TrendingUp
      : TrendingDown;

  const showIcon = !isNeutral && kpi.value !== 0;
  const hasVsLastYear = kpi.format === 'percent' || kpi.key.startsWith('growth_');

  return (
    <div
      className="flex-1 min-w-[130px] sm:min-w-[145px] max-w-[200px] h-[86px] bg-surface border border-border rounded-card p-2.5 flex flex-col justify-between shadow-card select-none hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-[11px] font-medium text-text-secondary leading-tight truncate" title={kpi.label}>
          {kpi.label}
        </span>
        <div className="relative group/tooltip shrink-0">
          <Info className="w-3 h-3 text-text-disabled hover:text-text-secondary cursor-pointer" />
          <div className="absolute top-full mt-1.5 right-0 hidden group-hover/tooltip:block z-50 pointer-events-none">
            <div className="bg-text-primary text-white text-[11px] font-normal py-1.5 px-2.5 rounded-card shadow-lg w-44 leading-snug">
              {tooltipText}
            </div>
          </div>
        </div>
      </div>

      <div
        className={`flex items-center justify-center gap-1 text-lg sm:text-xl font-bold tracking-tight truncate tabular-nums ${signStyle.text}`}
        title={formattedValue}
      >
        {showIcon && (
          <TrendIcon
            className="w-4 h-4 shrink-0"
            aria-label={kpi.value > 0 ? 'positive' : 'negative'}
          />
        )}
        {formattedValue}
      </div>

      <div className="text-[10px] text-text-secondary text-center truncate">
        {hasVsLastYear ? labels.kpi.vsLastYear : '\u00A0'}
      </div>
    </div>
  );
};
