import React from 'react';
import { StickyHeader } from './StickyHeader';
import { ScrollRegion } from './ScrollRegion';
import { FilterDrawer } from '../filters/FilterDrawer';
import { ScenarioSelectorDrawer } from '../scenarios/ScenarioSelectorDrawer';
import { SaveScenarioModal } from '../scenarios/SaveScenarioModal';
import { CommitConfirmModal } from '../scenarios/CommitConfirmModal';
import { ConfirmDialog } from './ConfirmDialog';
import { ToastContainer } from './ToastContainer';
import { MetaOptions, ProductLevel, CustomerLevel, Uom } from '../../types';
import { labels } from '../../constants/labels';

interface AppShellProps {
  children: React.ReactNode;
  roleTitle: string;
  userName?: string;
  metaOptions: MetaOptions | null;
  productLevel: ProductLevel;
  customerLevel: CustomerLevel;
  uom: Uom;
  onProductLevelChange: (val: ProductLevel) => void;
  onCustomerLevelChange: (val: CustomerLevel) => void;
  onUomChange: (val: Uom) => void;

  // Header Actions
  isTableActive: boolean;
  onToggleTable: () => void;
  hasActiveFilters?: boolean;

  // Filter Drawer
  isFilterOpen: boolean;
  onCloseFilter: () => void;
  onApplyFilter: () => void;
  onResetFilter: () => void;

  // Scenario Drawer & Modals
  isScenarioOpen: boolean;
  onCloseScenario: () => void;
  isSaveModalOpen: boolean;
  onCloseSaveModal: () => void;
  onSaveScenario: (name: string) => Promise<void>;
  isCommitModalOpen: boolean;
  onCloseCommitModal: () => void;
  onConfirmCommit: () => Promise<void>;

  // Delete Scenario Confirmation
  deleteTarget: { id: string; name: string } | null;
  onCloseDeleteModal: () => void;
  onConfirmDelete: () => Promise<void>;

  // Discard Unsaved Edits Modal
  isDiscardModalOpen: boolean;
  onCloseDiscardModal: () => void;
  onConfirmDiscard: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  roleTitle,
  userName,
  metaOptions,
  productLevel,
  customerLevel,
  uom,
  onProductLevelChange,
  onCustomerLevelChange,
  onUomChange,
  isTableActive,
  onToggleTable,
  hasActiveFilters,
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
      {/* Sticky Header */}
      <StickyHeader
        roleTitle={roleTitle}
        userName={userName}
        metaOptions={metaOptions}
        productLevel={productLevel}
        customerLevel={customerLevel}
        uom={uom}
        onProductLevelChange={onProductLevelChange}
        onCustomerLevelChange={onCustomerLevelChange}
        onUomChange={onUomChange}
        onSaveScenario={() => onCloseSaveModal()}
        onCommitScenario={() => onCloseCommitModal()}
        onToggleTable={onToggleTable}
        onOpenFilter={() => onCloseFilter()}
        onOpenScenarios={() => onCloseScenario()}
        isTableActive={isTableActive}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Main Scrollable Canvas */}
      <ScrollRegion hasBottomDock={isTableActive}>
        {children}
      </ScrollRegion>

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        onApply={onApplyFilter}
        onReset={onResetFilter}
        metaOptions={metaOptions}
      />

      {/* Scenario Selector Drawer */}
      <ScenarioSelectorDrawer
        isOpen={isScenarioOpen}
        onClose={onCloseScenario}
      />

      {/* Save Scenario Modal */}
      <SaveScenarioModal
        isOpen={isSaveModalOpen}
        onClose={onCloseSaveModal}
        onSave={onSaveScenario}
      />

      {/* Commit Confirm Modal */}
      <CommitConfirmModal
        isOpen={isCommitModalOpen}
        onClose={onCloseCommitModal}
        onConfirm={onConfirmCommit}
      />

      {/* Delete Scenario Confirmation */}
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

      {/* Discard Unsaved Edits Modal */}
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

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
};
