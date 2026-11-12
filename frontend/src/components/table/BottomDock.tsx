import React from 'react';
import { PlanningTable } from './PlanningTable';
import { ModeHint } from './ModeHint';
import { TableFloatingButtons } from './TableFloatingButtons';
import { TableResponse, ProductLevel } from '../../types';
import { useTableStore } from '../../store/tableStore';
import { useUiStore } from '../../store/uiStore';
import { labels } from '../../constants/labels';

interface BottomDockProps {
  tableData?: TableResponse;
  level: ProductLevel;
  isLoading?: boolean;
}

/**
 * BottomDock – fixed panel that slides up from the bottom containing
 * the PlanningTable plus the mode chip and floating action buttons.
 */
export const BottomDock: React.FC<BottomDockProps> = ({
  tableData,
  level,
  isLoading = false,
}) => {
  const {
    isDockOpen,
    mode,
    draftEdits,
    isDesegregated,
    setMode,
    setCellEdit,
    saveEdits,
    closeDock,
    hasUnsavedEdits,
  } = useTableStore();

  const { setDiscardConfirmModalOpen, addToast } = useUiStore();

  if (!isDockOpen) return null;

  const handleToggleEdit = () => {
    if (mode === 'edit') {
      if (hasUnsavedEdits()) {
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
      closeDock();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-border-strong shadow-dock flex flex-col h-[380px] max-h-[50vh] transition-all animate-in slide-in-from-bottom duration-200">
      {/* Top control bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-primary-50 border-b border-border">
        <div className="flex-1 mr-4">
          <ModeHint mode={mode} isDesegregated={isDesegregated} />
        </div>
        <div className="shrink-0">
          <TableFloatingButtons
            mode={mode}
            onToggleEdit={handleToggleEdit}
            onToggleDelta={handleToggleDelta}
            onCloseOrSave={handleCloseOrSave}
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
          mode={mode}
          draftEdits={draftEdits}
          onCellEdit={(rowId, defType, month, val) =>
            setCellEdit({ rowId, defType, month }, val)
          }
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};
