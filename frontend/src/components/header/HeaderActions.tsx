import React from 'react';
import { Save, CloudUpload, Table, Filter, Menu } from 'lucide-react';
import { HeaderIconButton } from './HeaderIconButton';
import { labels } from '../../constants/labels';

interface HeaderActionsProps {
  onSaveScenario: () => void;
  onCommitScenario: () => void;
  onToggleTable: () => void;
  onOpenFilter: () => void;
  onOpenScenarios: () => void;
  isTableActive?: boolean;
  hasActiveFilters?: boolean;
}

export const HeaderActions: React.FC<HeaderActionsProps> = ({
  onSaveScenario,
  onCommitScenario,
  onToggleTable,
  onOpenFilter,
  onOpenScenarios,
  isTableActive = false,
  hasActiveFilters = false,
}) => {
  const { actions } = labels.header;

  return (
    <div className="flex items-center gap-2">
      {/* Save scenario */}
      <HeaderIconButton
        icon={<Save className="w-4 h-4" />}
        tooltip={actions.saveScenario}
        onClick={onSaveScenario}
        ariaLabel={actions.saveScenario}
      />

      {/* Commit scenario */}
      <HeaderIconButton
        icon={<CloudUpload className="w-4 h-4" />}
        tooltip={actions.commitScenario}
        onClick={onCommitScenario}
        ariaLabel={actions.commitScenario}
      />

      {/* Table view */}
      <HeaderIconButton
        icon={<Table className="w-4 h-4" />}
        tooltip={actions.tableView}
        onClick={onToggleTable}
        active={isTableActive}
        ariaLabel={actions.tableView}
      />

      {/* Filters */}
      <HeaderIconButton
        icon={<Filter className="w-4 h-4" />}
        tooltip={actions.filters}
        onClick={onOpenFilter}
        badge={
          hasActiveFilters ? (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-warning border border-primary-700" />
          ) : null
        }
        ariaLabel={actions.filters}
      />

      {/* Scenarios */}
      <HeaderIconButton
        icon={<Menu className="w-4 h-4" />}
        tooltip={actions.scenarios}
        onClick={onOpenScenarios}
        ariaLabel={actions.scenarios}
      />
    </div>
  );
};
