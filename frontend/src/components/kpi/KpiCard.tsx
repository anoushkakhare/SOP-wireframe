import React from 'react';
import { KpiItem } from '../../types';
import { formatCompactNumber } from '../../utils/formatters';
import { getSignColor } from '../../utils/signColor';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { labels } from '../../constants/labels';
import { useViewStore } from '../../store/viewStore';

interface KpiCardProps {
  kpi: KpiItem;
}

const TOOLTIP_MAP: Record<string, string> = {
  total_forecast: labels.kpi.tooltips.totalForecast,
  baseline: 'MRF baseline sum for the selected range.',
  actuals: 'Actual closed periods in the selected range.',
  forecast_adj: labels.kpi.tooltips.forecastAdj,
  risk: labels.kpi.tooltips.risk,
  opportunity: labels.kpi.tooltips.opportunity,
  growth_prev: 'Growth compared to the previous period.',
  fy_growth: labels.kpi.tooltips.fyGrowth,
  ytd_growth: labels.kpi.tooltips.ytdGrowth,
  ytg_growth: labels.kpi.tooltips.ytgGrowth,
};

export const KpiCard: React.FC<KpiCardProps> = ({ kpi }) => {
  const { measure, compare } = useViewStore();
  const isValue = measure === 'value';
  const isNeutral = Boolean(
    kpi.isNeutral ||
    kpi.key === 'total_forecast' ||
    kpi.key === 'baseline' ||
    kpi.key === 'actuals' ||
    kpi.value === null
  );

  const formattedValue = kpi.value === null
    ? '–'
    : formatCompactNumber(kpi.value, {
      format: kpi.format === 'percent' ? 'percent' : (isValue ? 'currency' : 'number'),
      isNeutral,
      measure,
    });

  const signStyle = getSignColor(kpi.value, isNeutral);
  const baseTooltip = TOOLTIP_MAP[kpi.key] || kpi.label;
  let tooltipText = baseTooltip
    .replace(/\bunits\b/gi, measure === 'cases' ? 'cases' : measure === 'value' ? 'value' : 'units')
    .replace(/\bvolume\b/gi, measure === 'value' ? 'value' : measure === 'cases' ? 'cases' : 'volume');

  if (kpi.roValue !== undefined && kpi.roValue !== null) {
    const roSign = kpi.roValue >= 0 ? '+' : '';
    tooltipText += ` · incl. R&O: ${roSign}${kpi.roValue}%`;
  }

  const showIcon = !isNeutral && kpi.value !== null && kpi.value !== 0;
  const TrendIcon =
    isNeutral || kpi.value === null || kpi.value === 0
      ? Minus
      : kpi.value > 0
        ? TrendingUp
        : TrendingDown;

  const measureCaption = measure === 'value' ? '₹ (Value)' : measure === 'cases' ? 'Cases' : 'Units';

  let bottomCaption = measureCaption;
  if (kpi.key === 'growth_prev') {
    bottomCaption = kpi.label.replace(/^Growth\s+/i, '');
  } else if (
    kpi.format === 'percent' ||
    kpi.key.startsWith('growth_') ||
    kpi.key.endsWith('_growth')
  ) {
    bottomCaption = labels.kpi.vsLastYear;
  }

  const isCompareMode = compare.on && Boolean(compare.b) && kpi.delta !== undefined && kpi.delta !== null;
  const formattedDelta = isCompareMode
    ? formatCompactNumber(kpi.delta!, {
        format: kpi.format === 'percent' ? 'percent' : (isValue ? 'currency' : 'number'),
        isNeutral: false,
        measure,
      })
    : '';
  const deltaSign = (kpi.delta ?? 0) >= 0 ? '+' : '';
  const pctSign = (kpi.pctChange ?? 0) >= 0 ? '+' : '';
  const formattedDeltaText = `vs ${compare.b}: ${deltaSign}${formattedDelta} (${pctSign}${(kpi.pctChange ?? 0).toFixed(1)}%)`;

  return (
    <div
      className="flex-1 min-w-[130px] sm:min-w-[145px] max-w-[200px] h-[86px] bg-surface border border-border rounded-card p-2.5 flex flex-col justify-between shadow-card select-none hover:shadow-md transition-shadow shrink-0"
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-[11px] font-medium text-text-secondary leading-tight truncate" title={kpi.label}>
          {kpi.label}
        </span>
        <div className="relative group/tooltip shrink-0">
          <Info className="w-3 h-3 text-text-disabled hover:text-text-secondary cursor-pointer" />
          <div className="absolute top-full mt-1.5 right-0 hidden group-hover/tooltip:block z-50 pointer-events-none">
            <div className="bg-text-primary text-white text-[11px] font-normal py-1.5 px-2.5 rounded-card shadow-lg w-48 leading-snug">
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
            aria-label={kpi.value! > 0 ? 'positive' : 'negative'}
          />
        )}
        {formattedValue}
      </div>

      {isCompareMode ? (
        <div
          className={`text-[10px] font-semibold text-center truncate tabular-nums ${
            kpi.delta! >= 0 ? 'text-positive' : 'text-negative'
          }`}
          title={formattedDeltaText}
        >
          {formattedDeltaText}
        </div>
      ) : (
        <div className="text-[10px] text-text-secondary text-center truncate">
          {bottomCaption}
        </div>
      )}
    </div>
  );
};
