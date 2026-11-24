import React from 'react';
import { PlanningTableRow, ProductLevel } from '../../types';
import { TableMode, DraftCellEdit, makeDraftKey } from '../../store/tableStore';
import { EditableCell } from './EditableCell';
import { DeltaCell } from './DeltaCell';
import { formatCompactNumber } from '../../utils/formatters';
import { labels } from '../../constants/labels';
import { LEVELS, LEVEL_MAP } from '../../constants/hierarchy';
import { useViewStore } from '../../store/viewStore';
import { getStraddlingTooltip } from '../../utils/weekSplit';

interface PlanningTableProps {
  rows: PlanningTableRow[];
  period: string[];
  currentMonthIndex: number;
  level: ProductLevel;
  productLevelNum?: number;
  mode: TableMode;
  draftEdits: Record<string, DraftCellEdit>;
  onCellEdit: (row: PlanningTableRow, defType: 'opportunity' | 'actualFcst' | 'risk', month: string, deltaBase: number) => void;
  onCellRevert?: (row: PlanningTableRow, defType: 'opportunity' | 'actualFcst' | 'risk', month: string) => void;
  isLoading?: boolean;
}

/**
 * PlanningTable – the main data grid in the BottomDock.
 *
 * Styling per spec:
 * - Header row: primary-700 bg, white text (not black)
 * - Past-month actual cells: light grey bg (#F1F2F7) spanning all 3 sub-rows
 * - Editable forecast cells: white bg + primary-300 border
 * - Changed cells: positive/negative tinted bg
 * - Row hover: primary-50
 * - Opportunity label: positive green italic
 * - Risk label: negative red italic
 * - Zero zebra striping
 */
export const PlanningTable: React.FC<PlanningTableProps> = ({
  rows,
  period,
  currentMonthIndex,
  level,
  productLevelNum,
  mode,
  draftEdits,
  onCellEdit,
  onCellRevert,
  isLoading = false,
}) => {
  const { measure, compare } = useViewStore();
  const isComparing = compare.on && Boolean(compare.b);
  const nameA = 'Current cycle';
  const nameB = compare.b;

  const activeLevel = productLevelNum || (level === 'product' ? 5 : 3);
  const activeLevels = LEVELS.filter((l) => l.id <= activeLevel);
  const { rows: rowLabels } = labels.table;

  const renderSplitCell = (
    valA: number,
    valB: number,
    periodLabel: string,
    rowSpan?: number
  ) => {
    const delta = valB - valA;
    const isPos = delta >= 0;
    const pct = valA !== 0 ? ((delta / Math.abs(valA)) * 100).toFixed(1) : '0.0';
    const formattedA = formatCompactNumber(valA, { isNeutral: true, measure });
    const formattedB = formatCompactNumber(valB, { isNeutral: true, measure });
    const formattedDelta = `${isPos ? '+' : ''}${formatCompactNumber(delta, { measure })} (${isPos ? '+' : ''}${pct}%)`;
    const ariaLabel = `${periodLabel}: ${nameA} is ${formattedA}, ${nameB} is ${formattedB}, delta is ${formattedDelta}`;
    const title = `A (${nameA}): ${formattedA}\nB (${nameB}): ${formattedB}\nΔ (B - A): ${formattedDelta}`;

    return (
      <td
        key={periodLabel}
        rowSpan={rowSpan}
        aria-label={ariaLabel}
        title={title}
        style={{
          background: 'linear-gradient(135deg, transparent calc(50% - 1px), #CBD5E1 calc(50% - 0.5px), #CBD5E1 calc(50% + 0.5px), transparent calc(50% + 1px))',
        }}
        className="relative p-1 border-r border-border min-w-[90px] h-[34px] cursor-help select-none hover:bg-amber-50/40 transition-colors align-middle"
      >
        <div className="absolute top-1 left-1.5 text-[10px] font-bold text-primary-700 leading-none tabular-nums">
          {formattedA}
        </div>
        <div className="absolute bottom-1 right-1.5 text-[10px] font-bold text-[#D97706] leading-none tabular-nums">
          {formattedB}
        </div>
      </td>
    );
  };

  const toMeasure = (baseUnits: number, upc: number, prc: number) => {
    if (measure === 'cases') return Math.round(baseUnits / upc);
    if (measure === 'value') return Math.round(baseUnits * prc);
    return Math.round(baseUnits);
  };

  const toBase = (valInMeasure: number, upc: number, prc: number) => {
    if (measure === 'cases') return Math.round(valInMeasure * upc);
    if (measure === 'value') return Math.round(valInMeasure / prc);
    return Math.round(valInMeasure);
  };

  function getLevelValue(row: PlanningTableRow, levelId: number): string {
    switch (levelId) {
      case 1: return row.category || '—';
      case 2: return row.sop || '—';
      case 3: return row.brand || '—';
      case 4: return row.forecastGroup || '—';
      case 5: return row.forecastUnit || row.product || '—';
      default: return '—';
    }
  }

  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-surface border border-border animate-pulse text-xs text-text-secondary">
        {labels.table.loading}
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="w-full h-48 flex items-center justify-center bg-surface border border-border text-xs text-text-secondary">
        {labels.table.noData}
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto border-t border-border-strong select-text bg-surface">
      {isComparing && (
        <div className="bg-amber-50/90 border-b border-amber-200 px-4 py-1.5 flex items-center justify-between text-xs text-amber-950 font-medium">
          <div className="flex items-center gap-3">
            <span className="font-semibold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
              Compare Mode (View-Only)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-primary-700"></span>
              <span><strong>A (Top-Left):</strong> {nameA}</span>
            </span>
            <span className="text-amber-400 font-bold">⧸</span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#D97706]"></span>
              <span><strong>B (Bottom-Right):</strong> {nameB}</span>
            </span>
          </div>
          <div className="text-[11px] text-amber-800">
            Hover any split cell to view Δ (B - A)
          </div>
        </div>
      )}
      <table className="w-full text-left border-collapse text-xs">
        {/* ── Header ── primary-700 bg, white text */}
        <thead className="sticky top-0 z-20">
          <tr className="bg-primary-700 text-white text-[10px] font-semibold border-b border-primary-900">
            {activeLevels.map((lvl, idx) => (
              <th
                key={lvl.id}
                style={{ left: `${idx * 110}px` }}
                className="sticky top-0 z-30 bg-primary-700 py-2.5 px-3 w-[110px] min-w-[110px] max-w-[110px] border-r border-primary-900 whitespace-nowrap truncate"
              >
                {lvl.label}
              </th>
            ))}
            <th
              style={{ left: `${activeLevels.length * 110}px` }}
              className="sticky top-0 z-30 bg-primary-700 py-2.5 px-3 w-[100px] min-w-[100px] max-w-[100px] border-r border-primary-900 whitespace-nowrap truncate"
            >
              APG
            </th>
            <th
              style={{ left: `${activeLevels.length * 110 + 100}px` }}
              className="sticky top-0 z-30 bg-primary-700 py-2 px-2 w-[100px] min-w-[100px] max-w-[100px] border-r border-primary-900 text-center whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.15)]"
            >
              {isComparing ? (
                <div className="flex flex-col items-center justify-center leading-tight">
                  <span className="text-[10px] text-white font-bold">A ⧸ B Legend</span>
                  <span className="text-[8px] text-amber-300 font-normal truncate max-w-[95px]" title={`A: ${nameA} / B: ${nameB}`}>
                    A:Top ⧸ B:Btm
                  </span>
                </div>
              ) : (
                'Definition'
              )}
            </th>

            {/* Month / Week columns */}
            {period.map((m, idx) => {
              const isPast = idx < currentMonthIndex;
              const straddlingTooltip = getStraddlingTooltip(m);
              return (
                <th
                  key={m}
                  title={straddlingTooltip}
                  className={`sticky top-0 z-10 py-2.5 px-3 text-center min-w-[85px] border-r border-primary-900 ${isPast ? 'bg-primary-900 text-primary-300' : 'bg-primary-700'
                    }`}
                >
                  <div className="font-semibold flex items-center justify-center gap-1">
                    <span>{m}</span>
                    {straddlingTooltip && (
                      <span className="text-[8px] px-1 py-0.2 rounded bg-amber-400/20 text-amber-200 border border-amber-300/30 uppercase tracking-wider font-bold">
                        split
                      </span>
                    )}
                  </div>
                  <div className="text-[8px] font-normal opacity-70">
                    {isPast ? rowLabels.actual : rowLabels.forecast}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        {/* ── Body ── */}
        <tbody>
          {rows.map((row) => {
            const upc = row.unitsPerCase || 12;
            const prc = row.price || 100;
            return (
              <React.Fragment key={row.id}>
                {/* Sub-row 1 – Opportunity */}
                <tr className="border-t border-border hover:bg-primary-50 transition-colors">
                  {/* Product level columns 1..productLevel */}
                  {activeLevels.map((lvl, lvlIdx) => (
                    <td
                      key={lvl.id}
                      rowSpan={3}
                      style={{ left: `${lvlIdx * 110}px` }}
                      className="sticky z-10 py-2 px-3 align-top font-medium text-text-primary border-r border-border bg-surface w-[110px] min-w-[110px] max-w-[110px] whitespace-nowrap truncate"
                    >
                      {getLevelValue(row, lvl.id)}
                    </td>
                  ))}
                  {/* APG column */}
                  <td
                    rowSpan={3}
                    style={{ left: `${activeLevels.length * 110}px` }}
                    className="sticky z-10 py-2 px-3 align-top text-text-secondary border-r border-border bg-surface w-[100px] min-w-[100px] max-w-[100px] whitespace-nowrap truncate"
                  >
                    {row.apg || row.customerGroup || 'All'}
                  </td>

                  {/* Definition label */}
                  <td
                    style={{ left: `${activeLevels.length * 110 + 100}px` }}
                    className="sticky z-10 py-1.5 px-2.5 font-semibold italic text-positive border-r border-border text-center bg-positive-bg/20 w-[90px] min-w-[90px] max-w-[90px] whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.06)]"
                  >
                    {rowLabels.opportunity}
                  </td>

                  {/* Opportunity month cells */}
                  {period.map((m, mIdx) => {
                    const isPast = mIdx < currentMonthIndex;

                    if (isPast) {
                      // Past actual – merged, light grey bg
                      const pastVal = row.pastActuals?.[m] ?? 0;
                      if (isComparing) {
                        const pastValB = row.pastActualsB?.[m] ?? pastVal;
                        return renderSplitCell(pastVal, pastValB, `${m} (Actuals)`, 3);
                      }
                      return (
                        <td
                          key={m}
                          rowSpan={3}
                          className="py-2 px-2.5 text-center font-semibold text-text-primary tabular-nums border-r border-border align-middle"
                          style={{ backgroundColor: '#F1F2F7' }}
                        >
                          {formatCompactNumber(pastVal, { isNeutral: true, measure })}
                        </td>
                      );
                    }

                    if (isComparing) {
                      const valA = row.definitions.opportunity[m] ?? 0;
                      const valB = row.definitionsB?.opportunity?.[m] ?? 0;
                      return renderSplitCell(valA, valB, `${m} Opportunity`);
                    }

                    const fu = row.forecastUnit || row.product || row.forecastGroup || row.brand || row.id;
                    const apg = row.apg || 'All';
                    const draftKey = makeDraftKey(fu, apg, m);
                    const cellDelta = draftEdits[draftKey];
                    const baseOpp = row.definitions.opportunity[m] ?? 0;
                    const oppDeltaBase = cellDelta?.opportunity;
                    const hasOppEdit = oppDeltaBase !== undefined && oppDeltaBase !== 0;
                    const currentOpp = oppDeltaBase !== undefined ? baseOpp + toMeasure(oppDeltaBase, upc, prc) : baseOpp;
                    const oppDiff = hasOppEdit ? toMeasure(oppDeltaBase, upc, prc) : (row.diffs?.opportunity?.[m] ?? 0);

                    if (mode === 'delta') {
                      return (
                        <td key={m} className="py-1 px-1.5 text-center border-r border-border">
                          <DeltaCell delta={oppDiff} measure={measure} />
                        </td>
                      );
                    }

                    return (
                      <td
                        key={m}
                        className={`py-1.5 px-2 text-center text-positive font-semibold tabular-nums border-r border-border ${
                          hasOppEdit
                            ? oppDiff > 0
                              ? 'bg-positive-bg/40'
                              : 'bg-negative-bg/40'
                            : mode === 'edit'
                              ? 'bg-surface border-primary-300'
                              : ''
                        }`}
                      >
                        <EditableCell
                          value={currentOpp}
                          originalValue={baseOpp}
                          isEditable={mode === 'edit'}
                          rowType="opportunity"
                          measure={measure}
                          hasEdit={hasOppEdit}
                          onChange={(newVal) => {
                            const deltaBase = toBase(newVal, upc, prc) - toBase(baseOpp, upc, prc);
                            onCellEdit(row, 'opportunity', m, deltaBase);
                          }}
                          onRevert={() => onCellRevert?.(row, 'opportunity', m)}
                        />
                      </td>
                    );
                  })}
                </tr>

                {/* Sub-row 2 – Forecast / Actual */}
                <tr className="hover:bg-primary-50 transition-colors">
                  <td
                    style={{ left: `${activeLevels.length * 110 + 100}px` }}
                    className="sticky z-10 py-1.5 px-2.5 font-bold text-text-primary border-r border-border text-center bg-surface w-[90px] min-w-[90px] max-w-[90px] whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.06)]"
                  >
                    {rowLabels.forecast}
                  </td>

                  {period.map((m, mIdx) => {
                    const isPast = mIdx < currentMonthIndex;
                    if (isPast) return null; // covered by rowSpan={3}

                    if (isComparing) {
                      const valA = row.definitions.actualFcst[m] ?? 0;
                      const valB = row.definitionsB?.actualFcst?.[m] ?? 0;
                      return renderSplitCell(valA, valB, `${m} Forecast`);
                    }

                    const fu = row.forecastUnit || row.product || row.forecastGroup || row.brand || row.id;
                    const apg = row.apg || 'All';
                    const draftKey = makeDraftKey(fu, apg, m);
                    const cellDelta = draftEdits[draftKey];
                    const baseFcst = row.definitions.actualFcst[m] ?? 0;
                    const fcstDeltaBase = cellDelta?.forecast;
                    const hasFcstEdit = fcstDeltaBase !== undefined && fcstDeltaBase !== 0;
                    const currentFcst = fcstDeltaBase !== undefined ? baseFcst + toMeasure(fcstDeltaBase, upc, prc) : baseFcst;
                    const fcstDiff = hasFcstEdit ? toMeasure(fcstDeltaBase, upc, prc) : (row.diffs?.actualFcst?.[m] ?? 0);

                    if (mode === 'delta') {
                      return (
                        <td key={m} className="py-1 px-1.5 text-center border-r border-border">
                          <DeltaCell delta={fcstDiff} measure={measure} />
                        </td>
                      );
                    }

                    return (
                      <td
                        key={m}
                        className={`py-1.5 px-2 text-center border-r border-border ${
                          hasFcstEdit
                            ? fcstDiff > 0
                              ? 'bg-positive-bg/40'
                              : 'bg-negative-bg/40'
                            : mode === 'edit'
                              ? 'bg-surface border-primary-300'
                              : ''
                        }`}
                      >
                        <EditableCell
                          value={currentFcst}
                          originalValue={baseFcst}
                          isEditable={mode === 'edit'}
                          rowType="forecast"
                          measure={measure}
                          hasEdit={hasFcstEdit}
                          onChange={(newVal) => {
                            const deltaBase = toBase(newVal, upc, prc) - toBase(baseFcst, upc, prc);
                            onCellEdit(row, 'actualFcst', m, deltaBase);
                          }}
                          onRevert={() => onCellRevert?.(row, 'actualFcst', m)}
                        />
                      </td>
                    );
                  })}
                </tr>

                {/* Sub-row 3 – Risk */}
                <tr className="hover:bg-primary-50 transition-colors">
                  <td
                    style={{ left: `${activeLevels.length * 110 + 100}px` }}
                    className="sticky z-10 py-1.5 px-2.5 font-semibold italic text-negative border-r border-border text-center bg-negative-bg/20 w-[90px] min-w-[90px] max-w-[90px] whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.06)]"
                  >
                    {rowLabels.risk}
                  </td>

                  {period.map((m, mIdx) => {
                    const isPast = mIdx < currentMonthIndex;
                    if (isPast) return null; // covered by rowSpan={3}

                    if (isComparing) {
                      const valA = row.definitions.risk[m] ?? 0;
                      const valB = row.definitionsB?.risk?.[m] ?? 0;
                      return renderSplitCell(valA, valB, `${m} Risk`);
                    }

                    const fu = row.forecastUnit || row.product || row.forecastGroup || row.brand || row.id;
                    const apg = row.apg || 'All';
                    const draftKey = makeDraftKey(fu, apg, m);
                    const cellDelta = draftEdits[draftKey];
                    const baseRisk = row.definitions.risk[m] ?? 0;
                    const riskDeltaBase = cellDelta?.risk;
                    const hasRiskEdit = riskDeltaBase !== undefined && riskDeltaBase !== 0;
                    const currentRisk = riskDeltaBase !== undefined ? baseRisk + toMeasure(riskDeltaBase, upc, prc) : baseRisk;
                    const riskDiff = hasRiskEdit ? toMeasure(riskDeltaBase, upc, prc) : (row.diffs?.risk?.[m] ?? 0);

                    if (mode === 'delta') {
                      return (
                        <td key={m} className="py-1 px-1.5 text-center border-r border-border">
                          <DeltaCell delta={riskDiff} measure={measure} />
                        </td>
                      );
                    }

                    return (
                      <td
                        key={m}
                        className={`py-1.5 px-2 text-center text-negative font-semibold tabular-nums border-r border-border ${
                          hasRiskEdit
                            ? riskDiff > 0
                              ? 'bg-positive-bg/40'
                              : 'bg-negative-bg/40'
                            : mode === 'edit'
                              ? 'bg-surface border-primary-300'
                              : ''
                        }`}
                      >
                        <EditableCell
                          value={currentRisk}
                          originalValue={baseRisk}
                          isEditable={mode === 'edit'}
                          rowType="risk"
                          measure={measure}
                          isNegative
                          hasEdit={hasRiskEdit}
                          onChange={(newVal) => {
                            const deltaBase = toBase(newVal, upc, prc) - toBase(baseRisk, upc, prc);
                            onCellEdit(row, 'risk', m, deltaBase);
                          }}
                          onRevert={() => onCellRevert?.(row, 'risk', m)}
                        />
                      </td>
                    );
                  })}
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
