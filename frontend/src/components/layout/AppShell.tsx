import React from 'react';
import { StickyHeader } from './StickyHeader';
import { ScrollRegion } from './ScrollRegion';
import { FilterDrawer } from '../filters/FilterDrawer';
import { ScenarioSelectorDrawer } from '../scenarios/ScenarioSelectorDrawer';
import { SaveScenarioModal } from '../scenarios/SaveScenarioModal';
import { CommitConfirmModal } from '../scenarios/CommitConfirmModal';
import { ConfirmDialog } from './ConfirmDialog';
import { ToastContainer } from './ToastContainer';
import {
  MetaOptions,
  HierarchyNode,
  Uom,
} from '../../types';
import { ProductLevelNum } from '../../types';
import { CustomerViewOption } from '../../store/viewStore';
import { labels } from '../../constants/labels';

interface AppShellProps {
  children: React.ReactNode;
  roleTitle: string;
  userName?: string;
  metaOptions: MetaOptions | null;
  hierarchyNodes: HierarchyNode[];
  productLevel: ProductLevelNum;
  allowedLevels: ProductLevelNum[];
  customerView: CustomerViewOption;
  measure: Uom;
  apg: string[];
  onProductLevelChange: (val: ProductLevelNum) => void;
  onCustomerViewChange: (val: CustomerViewOption) => void;
  onMeasureChange: (val: Uom) => void;
  onApgChange: (val: string[]) => void;
  onResetHeaderOnly: () => void;

  isTableActive: boolean;
  onToggleTable: () => void;
  activeFilterCount?: number;

  isFilterOpen: boolean;
  onCloseFilter: () => void;
  onApplyFilter: () => void;
  onResetFilter: () => void;

  isScenarioOpen: boolean;
  onCloseScenario: () => void;
  isSaveModalOpen: boolean;
  onCloseSaveModal: () => void;
  onSaveScenario: (name: string) => Promise<void>;
  isCommitModalOpen: boolean;
  onCloseCommitModal: () => void;
  onConfirmCommit: () => Promise<void>;

  deleteTarget: { id: string; name: string } | null;
  onCloseDeleteModal: () => void;
  onConfirmDelete: () => Promise<void>;

  isDiscardModalOpen: boolean;
  onCloseDiscardModal: () => void;
  onConfirmDiscard: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  roleTitle,
  userName,
  metaOptions,
  hierarchyNodes,
  productLevel,
  allowedLevels,
  customerView,
  measure,
  apg,
  onProductLevelChange,
  onCustomerViewChange,
  onMeasureChange,
  onApgChange,
  onResetHeaderOnly,
  isTableActive,
  onToggleTable,
  activeFilterCount,
  isFilterOpen,
  onCloseFilter,
  onApplyFilter,
  onResetFilter,
  isScenarioOpen,
  onCloseScenario,
  isSaveModalOpen,
  onCloseSaveModal,
  onSaveScenario,
  isCommitModalOpen,
  onCloseCommitModal,
  onConfirmCommit,
  deleteTarget,
  onCloseDeleteModal,
  onConfirmDelete,
  isDiscardModalOpen,
  onCloseDiscardModal,
  onConfirmDiscard,
}) => {
  const { dialogs: d } = labels;

  return (
    <div className="min-h-screen bg-bg-page flex flex-col font-sans text-text-primary">
      <StickyHeader
        roleTitle={roleTitle}
        userName={userName}
        productLevel={productLevel}
        allowedLevels={allowedLevels}
        customerView={customerView}
        measure={measure}
        onProductLevelChange={onProductLevelChange}
        onCustomerViewChange={onCustomerViewChange}
        onMeasureChange={onMeasureChange}
        onResetHeaderOnly={onResetHeaderOnly}
        onSaveScenario={() => onCloseSaveModal()}
        onCommitScenario={() => onCloseCommitModal()}
        onToggleTable={onToggleTable}
        onOpenFilter={() => onCloseFilter()}
        onOpenScenarios={() => onCloseScenario()}
        isTableActive={isTableActive}
        activeFilterCount={activeFilterCount}
      />

      <ScrollRegion hasBottomDock={isTableActive}>
        {children}
      </ScrollRegion>

      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        onApply={onApplyFilter}
        onReset={onResetFilter}
        hierarchyNodes={hierarchyNodes}
      />

      <ScenarioSelectorDrawer isOpen={isScenarioOpen} onClose={onCloseScenario} />

      <SaveScenarioModal isOpen={isSaveModalOpen} onClose={onCloseSaveModal} onSave={onSaveScenario} />

      <CommitConfirmModal isOpen={isCommitModalOpen} onClose={onCloseCommitModal} onConfirm={onConfirmCommit} />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={onCloseDeleteModal}
        onConfirm={onConfirmDelete}
        title={d.delete.title}
        message={deleteTarget ? d.delete.body(deleteTarget.name) : ''}
        confirmLabel={d.delete.confirm}
        cancelLabel={d.delete.cancel}
        isDestructive
      />

      <ConfirmDialog
        isOpen={isDiscardModalOpen}
        onClose={onCloseDiscardModal}
        onConfirm={onConfirmDiscard}
        title={d.discard.title}
        message={d.discard.body}
        confirmLabel={d.discard.confirm}
        cancelLabel={d.discard.cancel}
        isDestructive
      />

      <ToastContainer />
    </div>
  );
};
