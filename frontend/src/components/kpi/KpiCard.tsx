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
 * ONE source of truth for card dimensions and font sizes.
 * Change CARD_H / CARD_W here to resize all cards at once.
 */
const CARD_H = 140;   // px — fixed height for every card
const CARD_W = 160;   // px — fixed width  (flex: 0 0 CARD_W, no grow/shrink)

const TOKEN = {
  // Applied via style={} so the values are truly shared
  cardStyle: {
    width: `${CARD_W}px`,
    height: `${CARD_H}px`,
    flex: `0 0 ${CARD_W}px`,
    boxSizing: 'border-box' as const,
    overflow: 'hidden',
  },
  cardBase:
    'bg-surface border border-border rounded-card p-2.5 flex flex-col shadow-card select-none hover:shadow-md transition-shadow',

  // font-size tokens
  valSize:   'clamp(22px, 1.6vw, 28px)',
  valSmSize: 'clamp(12px, 1.0vw, 15px)',  // stacked Opp & Risk — slightly smaller
  lblSize:   'clamp(11px, 0.8vw, 13px)',
  subSize:   'clamp(10px, 0.7vw, 11px)',
};

// ─── Shared title block ───────────────────────────────────────────────────────
// Fixed 2-line height so values sit at the same vertical position on every card.
const TitleBlock: React.FC<{ label: string; tooltip: React.ReactNode }> = ({ label, tooltip }) => (
  <div className="flex items-start justify-between gap-1" style={{ height: '2.6em', flexShrink: 0 }}>
    <span
      className="font-medium text-text-secondary leading-tight overflow-hidden"
      style={{
        fontSize: TOKEN.lblSize,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical' as const,
        overflow: 'hidden',
      }}
    >
      {label}
    </span>
    {tooltip}
  </div>
);

const TooltipIcon: React.FC<{ text: string }> = ({ text }) => (
  <div className="relative group/tooltip shrink-0 mt-0.5">
    <Info className="w-3 h-3 text-text-disabled hover:text-text-secondary cursor-pointer" />
    <div className="absolute top-full mt-1.5 right-0 hidden group-hover/tooltip:block z-50 pointer-events-none">
      <div className="bg-text-primary text-white text-[11px] font-normal py-1.5 px-2.5 rounded-card shadow-lg w-48 leading-snug">
        {text}
      </div>
    </div>
  </div>
);

export const KpiCard: React.FC<KpiCardProps> = ({ kpi }) => {
  const { measure, compare } = useViewStore();
  const isValue = measure === 'value';

  // ─── Merged Opportunity & Risk KPI card ──────────────────────────────────
  if (kpi.key === 'opportunity_risk' || (kpi.opportunityValue !== undefined && kpi.riskValue !== undefined)) {
    const oppValue  = kpi.opportunityValue ?? 0;
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

    const oppDisplay  = oppValue  > 0 && !formattedOpp.startsWith('+')  ? `+${formattedOpp}`  : formattedOpp;
    const riskDisplay = riskValue < 0 && !formattedRisk.startsWith('-') ? `-${formattedRisk}` : formattedRisk;

    const baseTooltip = TOOLTIP_MAP.opportunity_risk || labels.kpi.tooltips.opportunityRisk || kpi.label;
    const tooltipText = baseTooltip
      .replace(/\bunits\b/gi,  measure === 'cases' ? 'cases' : measure === 'value' ? 'value' : 'units')
      .replace(/\bvolume\b/gi, measure === 'value' ? 'value' : measure === 'cases' ? 'cases' : 'volume');

    const measureCaption = measure === 'value' ? '₹ (Value)' : measure === 'cases' ? 'Cases' : 'Units';

    return (
      <div className={TOKEN.cardBase} style={TOKEN.cardStyle}>
        {/* Title — fixed 2-line height */}
        <TitleBlock label={kpi.label} tooltip={<TooltipIcon text={tooltipText} />} />

        {/* Stacked Opp / Risk — fills remaining space */}
        <div className="flex-1 flex flex-col justify-center gap-px min-h-0 my-1">
          {/* Opportunity row */}
          <div className="flex items-center gap-1 min-w-0">
            <span
              className="font-bold tracking-tight tabular-nums text-positive truncate"
              style={{ fontSize: TOKEN.valSmSize }}
              title={oppDisplay}
            >
              {oppDisplay}
            </span>
            <span
              className="text-text-secondary font-medium shrink-0"
              style={{ fontSize: TOKEN.subSize, lineHeight: 1 }}
            >
              Opp.
            </span>
          </div>

          {/* Thin horizontal divider */}
          <div className="border-t border-border w-full my-px" />

          {/* Risk row */}
          <div className="flex items-center gap-1 min-w-0">
            <span
              className="font-bold tracking-tight tabular-nums text-negative truncate"
              style={{ fontSize: TOKEN.valSmSize }}
              title={riskDisplay}
            >
              {riskDisplay}
            </span>
            <span
              className="text-text-secondary font-medium shrink-0"
              style={{ fontSize: TOKEN.subSize, lineHeight: 1 }}
            >
              Risk
            </span>
          </div>
        </div>

        {/* Units caption — fixed bottom */}
        <div
          className="text-text-secondary text-center truncate"
          style={{ fontSize: TOKEN.subSize, flexShrink: 0 }}
        >
          {measureCaption}
        </div>
      </div>
    );
  }

  // ─── Standard single-value KPI card ──────────────────────────────────────
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

  const signStyle  = getSignColor(kpi.value, isNeutral);
  const baseTooltip = TOOLTIP_MAP[kpi.key] || kpi.label;
  let tooltipText = baseTooltip
    .replace(/\bunits\b/gi,  measure === 'cases' ? 'cases' : measure === 'value' ? 'value' : 'units')
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
  const pctSign   = (kpi.pctChange ?? 0) >= 0 ? '+' : '';
  const formattedDeltaText = `vs ${compare.b}: ${deltaSign}${formattedDelta} (${pctSign}${(kpi.pctChange ?? 0).toFixed(1)}%)`;

  return (
    <div className={TOKEN.cardBase} style={TOKEN.cardStyle}>
      {/* Title — fixed 2-line height */}
      <TitleBlock label={kpi.label} tooltip={<TooltipIcon text={tooltipText} />} />

      {/* Value — takes remaining space, vertically centered */}
      <div className="flex-1 flex items-center justify-center min-h-0">
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

      {/* Bottom caption — fixed bottom */}
      {isCompareMode ? (
        <div
          className={`font-semibold text-center truncate tabular-nums ${
            kpi.delta! >= 0 ? 'text-positive' : 'text-negative'
          }`}
          style={{ fontSize: TOKEN.subSize, flexShrink: 0 }}
          title={formattedDeltaText}
        >
          {formattedDeltaText}
        </div>
      ) : (
        <div
          className="text-text-secondary text-center truncate"
          style={{ fontSize: TOKEN.subSize, flexShrink: 0 }}
        >
          {bottomCaption}
        </div>
      )}
    </div>
  );
};
