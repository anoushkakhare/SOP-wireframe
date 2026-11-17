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
  const { measure } = useViewStore();
  const activeLevel = productLevelNum || (level === 'product' ? 5 : 3);
  const activeLevels = LEVELS.filter((l) => l.id <= activeLevel);
  const { rows: rowLabels } = labels.table;

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
      <table className="w-full text-left border-collapse text-xs">
        {/* ── Header ── primary-700 bg, white text */}
        <thead>
          <tr className="bg-primary-700 text-white text-[10px] font-semibold border-b border-primary-900">
            {activeLevels.map((lvl, idx) => (
              <th
                key={lvl.id}
                style={{ left: `${idx * 110}px` }}
                className="sticky z-20 bg-primary-700 py-2.5 px-3 w-[110px] min-w-[110px] max-w-[110px] border-r border-primary-900 whitespace-nowrap truncate"
              >
                {lvl.label}
              </th>
            ))}
            <th
              style={{ left: `${activeLevels.length * 110}px` }}
              className="sticky z-20 bg-primary-700 py-2.5 px-3 w-[100px] min-w-[100px] max-w-[100px] border-r border-primary-900 whitespace-nowrap truncate"
            >
              APG
            </th>
            <th
              style={{ left: `${activeLevels.length * 110 + 100}px` }}
              className="sticky z-20 bg-primary-700 py-2.5 px-3 w-[90px] min-w-[90px] max-w-[90px] border-r border-primary-900 text-center whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.15)]"
            >
              Definition
            </th>

            {/* Month / Week columns */}
            {period.map((m, idx) => {
              const isPast = idx < currentMonthIndex;
              const straddlingTooltip = getStraddlingTooltip(m);
              return (
                <th
                  key={m}
                  title={straddlingTooltip}
                  className={`py-2.5 px-3 text-center min-w-[85px] border-r border-primary-900 ${isPast ? 'bg-primary-900 text-primary-300' : 'bg-primary-700'
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
