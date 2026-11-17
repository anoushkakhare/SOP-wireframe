import React from 'react';
import { PlanningTableRow, ProductLevel } from '../../types';
import { TableMode } from '../../store/tableStore';
import { EditableCell } from './EditableCell';
import { DeltaCell } from './DeltaCell';
import { formatCompactNumber } from '../../utils/formatters';
import { labels } from '../../constants/labels';
import { LEVELS, LEVEL_MAP } from '../../constants/hierarchy';

interface PlanningTableProps {
  rows: PlanningTableRow[];
  period: string[];
  currentMonthIndex: number;
  level: ProductLevel;
  productLevelNum?: number;
  mode: TableMode;
  draftEdits: Record<string, number>;
  onCellEdit: (rowId: string, defType: 'opportunity' | 'actualFcst' | 'risk', month: string, val: number) => void;
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
  isLoading = false,
}) => {
  const isProductLevel = level === 'product';
  const { columns, rows: rowLabels } = labels.table;

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
            <th className="py-2.5 px-3 sticky left-0 z-20 bg-primary-700 min-w-[100px] border-r border-primary-900">
              {columns.category}
            </th>
            <th className="py-2.5 px-3 sticky left-[100px] z-20 bg-primary-700 min-w-[90px] border-r border-primary-900">
              {columns.brand}
            </th>
            {isProductLevel && (
              <th className="py-2.5 px-3 sticky left-[190px] z-20 bg-primary-700 min-w-[100px] border-r border-primary-900">
                {columns.product}
              </th>
            )}
            <th className="py-2.5 px-3 min-w-[120px] border-r border-primary-900">
              {columns.customerGroup}
            </th>
            <th className="py-2.5 px-3 min-w-[110px] border-r border-primary-900">
              {columns.customer}
            </th>
            <th className="py-2.5 px-3 min-w-[110px] border-r border-primary-900 text-center">
              {columns.measure}
            </th>

            {/* Month columns */}
            {period.map((m, idx) => {
              const isPast = idx < currentMonthIndex;
              return (
                <th
                  key={m}
                  className={`py-2.5 px-3 text-center min-w-[85px] border-r border-primary-900 ${
                    isPast ? 'bg-primary-900 text-primary-300' : 'bg-primary-700'
                  }`}
                >
                  <div className="font-semibold">{m}</div>
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
          {rows.map((row) => (
            <React.Fragment key={row.id}>
              {/* Sub-row 1 – Opportunity */}
              <tr className="border-t border-border hover:bg-primary-50 transition-colors">
                {/* Dimension cells – span 3 sub-rows */}
                <td
                  rowSpan={3}
                  className="py-2 px-3 align-top font-semibold text-text-primary border-r border-border-strong sticky left-0 z-10 bg-surface shadow-[1px_0_0_0_#E0E3EC]"
                >
                  {row.category}
                </td>
                <td
                  rowSpan={3}
                  className="py-2 px-3 align-top font-medium text-text-primary border-r border-border sticky left-[100px] z-10 bg-surface shadow-[1px_0_0_0_#E0E3EC]"
                >
                  {row.brand}
                </td>
                {isProductLevel && (
                  <td
                    rowSpan={3}
                    className="py-2 px-3 align-top text-text-primary border-r border-border sticky left-[190px] z-10 bg-surface shadow-[1px_0_0_0_#E0E3EC]"
                  >
                    {row.product || '—'}
                  </td>
                )}
                <td rowSpan={3} className="py-2 px-3 align-top text-text-secondary border-r border-border">
                  {row.customerGroup}
                </td>
                <td rowSpan={3} className="py-2 px-3 align-top text-text-secondary border-r border-border">
                  {row.customer}
                </td>

                {/* Opportunity measure label */}
                <td className="py-1.5 px-2.5 font-semibold italic text-positive border-r border-border text-center bg-positive-bg/20">
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
                        {formatCompactNumber(pastVal, { isNeutral: true })}
                      </td>
                    );
                  }

                  const baseOpp = row.definitions.opportunity[m] ?? 0;
                  const diffVal = row.diffs?.opportunity?.[m];

                  if (mode === 'delta') {
                    return (
                      <td key={m} className="py-1 px-1.5 text-center border-r border-border">
                        <DeltaCell delta={diffVal !== undefined ? diffVal : 0} />
                      </td>
                    );
                  }

                  return (
                    <td key={m} className="py-1.5 px-2 text-center text-positive font-semibold tabular-nums border-r border-border">
                      {formatCompactNumber(baseOpp, { withSign: true })}
                    </td>
                  );
                })}
              </tr>

              {/* Sub-row 2 – Forecast / Actual */}
              <tr className="hover:bg-primary-50 transition-colors">
                <td className="py-1.5 px-2.5 font-bold text-text-primary border-r border-border text-center">
                  {rowLabels.forecast}
                </td>

                {period.map((m, mIdx) => {
                  const isPast = mIdx < currentMonthIndex;
                  if (isPast) return null; // covered by rowSpan={3}

                  const editKey   = `${row.id}_actualFcst_${m}`;
                  const baseFcst  = row.definitions.actualFcst[m] ?? 0;
                  const currentFcst = draftEdits[editKey] !== undefined ? draftEdits[editKey] : baseFcst;
                  const hasEdit   = draftEdits[editKey] !== undefined;
                  const diffVal   = row.diffs?.actualFcst?.[m] || (currentFcst - baseFcst);

                  if (mode === 'delta') {
                    return (
                      <td key={m} className="py-1 px-1.5 text-center border-r border-border">
                        <DeltaCell delta={diffVal} />
                      </td>
                    );
                  }

                  return (
                    <td
                      key={m}
                      className={`py-1.5 px-2 text-center border-r border-border ${
                        hasEdit
                          ? diffVal > 0
                            ? 'bg-positive-bg/40'
                            : 'bg-negative-bg/40'
                          : mode === 'edit'
                          ? 'bg-surface border-primary-300'
                          : ''
                      }`}
                    >
                      <EditableCell
                        value={currentFcst}
                        isEditable={mode === 'edit'}
                        onChange={(newVal) => onCellEdit(row.id, 'actualFcst', m, newVal)}
                      />
                    </td>
                  );
                })}
              </tr>

              {/* Sub-row 3 – Risk */}
              <tr className="hover:bg-primary-50 transition-colors">
                <td className="py-1.5 px-2.5 font-semibold italic text-negative border-r border-border text-center bg-negative-bg/20">
                  {rowLabels.risk}
                </td>

                {period.map((m, mIdx) => {
                  const isPast = mIdx < currentMonthIndex;
                  if (isPast) return null; // covered by rowSpan={3}

                  const baseRisk = row.definitions.risk[m] ?? 0;
                  const diffVal  = row.diffs?.risk?.[m];

                  if (mode === 'delta') {
                    return (
                      <td key={m} className="py-1 px-1.5 text-center border-r border-border">
                        <DeltaCell delta={diffVal !== undefined ? diffVal : 0} />
                      </td>
                    );
                  }

                  return (
                    <td key={m} className="py-1.5 px-2 text-center text-negative font-semibold tabular-nums border-r border-border">
                      {formatCompactNumber(baseRisk, { withSign: true })}
                    </td>
                  );
                })}
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};
