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
  risk: labels.kpi.tooltips.risk,
  opportunity: labels.kpi.tooltips.opportunity,
  opportunity_risk: labels.kpi.tooltips.opportunityRisk,
  growth_prev: 'Growth compared to the previous period.',
  fy_growth: labels.kpi.tooltips.fyGrowth,
  ytd_growth: labels.kpi.tooltips.ytdGrowth,
  ytg_growth: labels.kpi.tooltips.ytgGrowth,
};

/*
 * Shared sizing tokens (all KPI cards use these via inline style / className).
 *   --kpi-min-h : min-height for every card  (was 86px → now 114px, +28px)
 *   --kpi-val   : clamp for single-value cards
 *   --kpi-val-sm: clamp for the stacked Opp+Risk values (slightly smaller)
 *   --kpi-lbl   : clamp for the card title / sub-label
 */
const TOKEN = {
  cardBase:
    'flex-1 min-w-[130px] sm:min-w-[145px] max-w-[200px] bg-surface border border-border rounded-card p-2.5 flex flex-col justify-between shadow-card select-none hover:shadow-md transition-shadow shrink-0',
  // min-height token applied via style prop so it's one place to change
  minH: '114px',
  // font-size tokens via inline style
  valSize: 'clamp(22px, 1.6vw, 28px)',
  valSmSize: 'clamp(13px, 1.1vw, 16px)',   // stacked Opp & Risk rows
  lblSize: 'clamp(11px, 0.8vw, 13px)',
  subSize: 'clamp(10px, 0.7vw, 11px)',
};

export const KpiCard: React.FC<KpiCardProps> = ({ kpi }) => {
  const { measure, compare } = useViewStore();
  const isValue = measure === 'value';

  // ─── Merged Opportunity & Risk KPI card ────────────────────────────────
  if (kpi.key === 'opportunity_risk' || (kpi.opportunityValue !== undefined && kpi.riskValue !== undefined)) {
    const oppValue = kpi.opportunityValue ?? 0;
    const riskValue = kpi.riskValue ?? 0;

    const formattedOpp = formatCompactNumber(oppValue, {
      format: isValue ? 'currency' : 'number',
      isNeutral: false,
      measure,
    });

    const formattedRisk = formatCompactNumber(riskValue, {
      format: isValue ? 'currency' : 'number',
      isNeutral: false,
      measure,
    });

    const oppDisplay = oppValue > 0 && !formattedOpp.startsWith('+') ? `+${formattedOpp}` : formattedOpp;
    const riskDisplay = riskValue < 0 && !formattedRisk.startsWith('-') ? `-${formattedRisk}` : formattedRisk;

    const baseTooltip = TOOLTIP_MAP.opportunity_risk || labels.kpi.tooltips.opportunityRisk || kpi.label;
    const tooltipText = baseTooltip
      .replace(/\bunits\b/gi, measure === 'cases' ? 'cases' : measure === 'value' ? 'value' : 'units')
      .replace(/\bvolume\b/gi, measure === 'value' ? 'value' : measure === 'cases' ? 'cases' : 'volume');

    const measureCaption = measure === 'value' ? '₹ (Value)' : measure === 'cases' ? 'Cases' : 'Units';

    return (
      <div
        className={TOKEN.cardBase}
        style={{ minHeight: TOKEN.minH }}
      >
        {/* Title row */}
        <div className="flex items-center justify-between gap-1">
          <span
            className="font-medium text-text-secondary leading-tight truncate"
            style={{ fontSize: TOKEN.lblSize }}
            title={kpi.label}
          >
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

        {/* Stacked Opportunity / Risk rows with thin horizontal divider */}
        <div className="flex flex-col gap-0.5 my-0.5">
          {/* Opportunity row */}
          <div className="flex items-center gap-1 min-w-0">
            <TrendingUp className="w-3.5 h-3.5 shrink-0 text-positive" aria-label="positive" />
            <span
              className="font-bold tracking-tight tabular-nums text-positive truncate"
              style={{ fontSize: TOKEN.valSmSize }}
              title={oppDisplay}
            >
              {oppDisplay}
            </span>
            <span
              className="text-text-secondary font-medium leading-none ml-0.5 shrink-0"
              style={{ fontSize: TOKEN.subSize }}
            >
              Opp.
            </span>
          </div>

          {/* Thin horizontal divider */}
          <div className="border-t border-border w-full" />

          {/* Risk row */}
          <div className="flex items-center gap-1 min-w-0">
            <TrendingDown className="w-3.5 h-3.5 shrink-0 text-negative" aria-label="negative" />
            <span
              className="font-bold tracking-tight tabular-nums text-negative truncate"
              style={{ fontSize: TOKEN.valSmSize }}
              title={riskDisplay}
            >
              {riskDisplay}
            </span>
            <span
              className="text-text-secondary font-medium leading-none ml-0.5 shrink-0"
              style={{ fontSize: TOKEN.subSize }}
            >
              Risk
            </span>
          </div>
        </div>

        {/* Units caption */}
        <div
          className="text-text-secondary text-center truncate"
          style={{ fontSize: TOKEN.subSize }}
        >
          {measureCaption}
        </div>
      </div>
    );
  }

  // ─── Standard single-value KPI card ────────────────────────────────────
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
      className={TOKEN.cardBase}
      style={{ minHeight: TOKEN.minH }}
    >
      {/* Title */}
      <div className="flex items-center justify-between gap-1">
        <span
          className="font-medium text-text-secondary leading-tight truncate"
          style={{ fontSize: TOKEN.lblSize }}
          title={kpi.label}
        >
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

      {/* Value — vertically centered via flex-1 + flex + items-center */}
      <div className="flex-1 flex items-center justify-center">
        <div
          className={`flex items-center justify-center gap-1 font-bold tracking-tight tabular-nums ${signStyle.text}`}
          style={{ fontSize: TOKEN.valSize }}
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
      </div>

      {/* Bottom caption */}
      {isCompareMode ? (
        <div
          className={`font-semibold text-center truncate tabular-nums ${
            kpi.delta! >= 0 ? 'text-positive' : 'text-negative'
          }`}
          style={{ fontSize: TOKEN.subSize }}
          title={formattedDeltaText}
        >
          {formattedDeltaText}
        </div>
      ) : (
        <div
          className="text-text-secondary text-center truncate"
          style={{ fontSize: TOKEN.subSize }}
        >
          {bottomCaption}
        </div>
      )}
    </div>
  );
};
