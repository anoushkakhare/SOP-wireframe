import React from 'react';
import { Pencil, Eye, X, Check } from 'lucide-react';
import { TableMode } from '../../store/tableStore';
import { labels } from '../../constants/labels';

interface TableFloatingButtonsProps {
    mode: TableMode;
    onToggleEdit: () => void;
    onToggleDelta: () => void;
    onCloseOrSave: () => void;
    canEdit?: boolean;
}

/**
 * TableFloatingButtons – three circular icon buttons in the table dock bar.
 *
 * Button 1: Edit forecast ↔ Switch to view
 * Button 2: Show/hide change log (±)
 * Button 3: Save changes (edit mode) ↔ Close table
 *
 * Active states use primary-700 fill; save uses primary-700; close is neutral.
 */
export const TableFloatingButtons: React.FC<TableFloatingButtonsProps> = ({
    mode,
    onToggleEdit,
    onToggleDelta,
    onCloseOrSave,
    canEdit = true,
}) => {
    const isEditing = mode === 'edit';
    const isDelta = mode === 'delta';
    const { floatingButtons: l } = labels.table;

    const editTooltip = !canEdit
        ? 'Switch to Month or Week to edit'
        : isEditing
        ? l.switchToView
        : l.editForecast;

    return (
        <div className="flex items-center gap-2">
            {/* 1. Edit ↔ View */}
            <button
                type="button"
                onClick={canEdit ? onToggleEdit : undefined}
                disabled={!canEdit}
                title={editTooltip}
                aria-label={editTooltip}
                className={`w-8 h-8 rounded-full border flex items-center justify-center shadow-sm transition-all ${
                    !canEdit
                        ? 'opacity-40 cursor-not-allowed bg-surface text-text-secondary border-border'
                        : isEditing
                        ? 'bg-primary-700 text-white border-primary-700 hover:scale-105'
                        : 'bg-surface text-text-secondary border-border hover:border-primary-700 hover:text-primary-700 hover:bg-primary-50 hover:scale-105'
                }`}
            >
                {isEditing ? <Eye className="w-4 h-4" /> : <Pencil className="w-3.5 h-3.5" />}
            </button>

            {/* 2. Change log toggle */}
            <button
                type="button"
                onClick={onToggleDelta}
                title={isDelta ? l.hideChangeLog : l.showChangeLog}
                aria-label={isDelta ? l.hideChangeLog : l.showChangeLog}
                className={`w-8 h-8 rounded-full border flex items-center justify-center shadow-sm transition-all hover:scale-105 ${isDelta
                        ? 'bg-primary-700 text-white border-primary-700 font-bold'
                        : 'bg-surface text-text-secondary border-border hover:border-primary-700 hover:text-primary-700 hover:bg-primary-50 font-semibold'
                    }`}
            >
                <span className="text-sm leading-none font-bold">±</span>
            </button>

            {/* 3. Save (edit) ↔ Close */}
            <button
                type="button"
                onClick={onCloseOrSave}
                title={isEditing ? l.saveChanges : l.closeTable}
                aria-label={isEditing ? l.saveChanges : l.closeTable}
                className={`w-8 h-8 rounded-full border flex items-center justify-center shadow-sm transition-all hover:scale-105 ${isEditing
                        ? 'bg-primary-700 text-white border-primary-700 hover:bg-primary-900'
                        : 'bg-surface text-text-secondary border-border hover:border-negative hover:text-negative hover:bg-negative-bg'
                    }`}
            >
                {isEditing ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            </button>
        </div>
    );
};
