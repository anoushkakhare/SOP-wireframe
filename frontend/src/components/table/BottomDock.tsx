import React from 'react';
import { PlanningTable } from './PlanningTable';
import { ModeHint } from './ModeHint';
import { TableFloatingButtons } from './TableFloatingButtons';
import { TableResponse, ProductLevel, ProductLevelNum } from '../../types';
import { useTableStore } from '../../store/tableStore';
import { useUiStore } from '../../store/uiStore';
import { useViewStore } from '../../store/viewStore';
import { labels } from '../../constants/labels';

interface BottomDockProps {
  tableData?: TableResponse;
  level: ProductLevel;
  productLevelNum?: ProductLevelNum;
  isLoading?: boolean;
}

/**
 * BottomDock – fixed panel that slides up from the bottom containing
 * the PlanningTable plus the mode chip and floating action buttons.
 */
export const BottomDock: React.FC<BottomDockProps> = ({
  tableData,
  level,
  productLevelNum,
  isLoading = false,
}) => {
  const {
    isDockOpen,
    mode,
    draftEdits,
    isDesegregated,
    setMode,
    setCellEdit,
    revertCellEdit,
    saveEdits,
    discardEdits,
    closeDock,
    hasUnsavedEdits,
  } = useTableStore();

  const { timeGrain, compare } = useViewStore();
  const canEdit = !compare.on && (timeGrain === 'month' || timeGrain === 'week');
  const disabledReason = compare.on
    ? 'Table editing disabled in compare mode'
    : 'Switch to Month or Week to edit';

  const { setDiscardConfirmModalOpen, addToast } = useUiStore();

  const hasDraft = Object.keys(draftEdits).length > 0;

  React.useEffect(() => {
    if (mode === 'edit' && !canEdit) {
      setMode('view');
    }
  }, [mode, canEdit, setMode]);

  if (!isDockOpen) return null;

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
      if (hasDraft) {
        discardEdits();
      }
      closeDock();
    }
  };

  return (
    <div className="fixed bottom-14 md:bottom-0 left-0 md:left-[72px] right-0 z-30 bg-surface border-t border-border-strong shadow-dock flex flex-col h-[380px] max-h-[50vh] transition-all animate-in slide-in-from-bottom duration-200">
      {/* Top control bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-primary-50 border-b border-border">
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

      {/* Table body */}
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
