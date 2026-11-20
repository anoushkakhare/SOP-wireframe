/**
 * BottomDockInline – same logic as BottomDock but rendered inline
 * (no fixed positioning). Used inside FullscreenSplitLayout.
 * Shares the same tableStore / viewStore state as the regular BottomDock.
 */
import React from 'react';
import { PlanningTable } from './PlanningTable';
import { ModeHint } from './ModeHint';
import { TableFloatingButtons } from './TableFloatingButtons';
import { TableResponse, ProductLevel, ProductLevelNum } from '../../types';
import { useTableStore } from '../../store/tableStore';
import { useUiStore } from '../../store/uiStore';
import { useViewStore } from '../../store/viewStore';
import { labels } from '../../constants/labels';

interface BottomDockInlineProps {
  tableData?: TableResponse;
  level: ProductLevel;
  productLevelNum?: ProductLevelNum;
  isLoading?: boolean;
}

export const BottomDockInline: React.FC<BottomDockInlineProps> = ({
  tableData,
  level,
  productLevelNum,
  isLoading = false,
}) => {
  const {
    mode,
    draftEdits,
    isDesegregated,
    setMode,
    setCellEdit,
    revertCellEdit,
    saveEdits,
    discardEdits,
    hasUnsavedEdits,
    closeDock,
  } = useTableStore();

  const { timeGrain, compare } = useViewStore();
  const canEdit = !compare.on && (timeGrain === 'month' || timeGrain === 'week');
  const disabledReason = compare.on
    ? 'Table editing disabled in compare mode'
    : 'Switch to Month or Week to edit';

  const { setDiscardConfirmModalOpen, addToast } = useUiStore();
  const hasDraft = Object.keys(draftEdits).length > 0;

  React.useEffect(() => {
    if (mode === 'edit' && !canEdit) setMode('view');
  }, [mode, canEdit, setMode]);

  const handleToggleEdit = () => {
    if (!canEdit) return;
    if (mode === 'edit') {
      if (hasDraft || hasUnsavedEdits()) {
        setDiscardConfirmModalOpen(true);
      } else {
        setMode('view');
      }
    } else {
      setMode('edit');
    }
  };

  const handleToggleDelta = () => {
    setMode(mode === 'delta' ? 'view' : 'delta');
  };

  const handleCloseOrSave = () => {
    if (mode === 'edit') {
      saveEdits();
      addToast(labels.toasts.editSaved, 'success');
    } else {
      if (hasDraft) discardEdits();
      closeDock();
    }
  };

  return (
    // flex-col fills the parent container's height
    <div className="flex flex-col h-full bg-surface">
      {/* Control bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-primary-50 border-b border-border shrink-0">
        <div className="flex-1 mr-4">
          <ModeHint mode={mode} isDesegregated={isDesegregated} />
        </div>
        <div className="shrink-0 flex items-center gap-3">
          {hasDraft && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 shadow-sm animate-in fade-in">
              Previewing unsaved edits
            </span>
          )}
          <TableFloatingButtons
            mode={mode}
            onToggleEdit={handleToggleEdit}
            onToggleDelta={handleToggleDelta}
            onCloseOrSave={handleCloseOrSave}
            canEdit={canEdit}
            disabledTooltip={disabledReason}
          />
        </div>
      </div>

      {/* Table body — overflow: auto for both axes */}
      <div className="flex-1 overflow-auto bg-surface">
        <PlanningTable
          rows={tableData?.rows || []}
          period={tableData?.period || []}
          currentMonthIndex={tableData?.currentMonthIndex || 5}
          level={level}
          productLevelNum={productLevelNum}
          mode={mode}
          draftEdits={draftEdits}
          onCellEdit={(row, defType, month, deltaBase) => {
            const fu = row.forecastUnit || row.product || row.forecastGroup || row.brand || row.id;
            const apg = row.apg || 'All';
            setCellEdit(
              {
                forecastUnit: fu,
                apg,
                period: month,
                defType,
                rowMeta: {
                  fuId: row.id,
                  forecastUnit: fu,
                  forecastGroup: row.forecastGroup,
                  brand: row.brand,
                  sop: row.sop,
                  category: row.category,
                  unitsPerCase: row.unitsPerCase || 12,
                  price: row.price || 100,
                },
              },
              deltaBase
            );
          }}
          onCellRevert={(row, defType, month) => {
            const fu = row.forecastUnit || row.product || row.forecastGroup || row.brand || row.id;
            const apg = row.apg || 'All';
            revertCellEdit({ forecastUnit: fu, apg, period: month, defType });
          }}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};
