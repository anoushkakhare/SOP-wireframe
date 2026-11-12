import React from 'react';
import { TableMode } from '../../store/tableStore';
import { labels } from '../../constants/labels';

interface ModeHintProps {
  mode: TableMode;
  isDesegregated?: boolean;
}

/**
 * ModeHint – shows the current table mode as a small chip plus an optional
 * info banner when drill-down is active.
 *
 * Mode chip replaces the old long hint strings per spec.
 */
export const ModeHint: React.FC<ModeHintProps> = ({ mode, isDesegregated = false }) => {
  const { modeChip, drillDownBanner } = labels.table;

  const chip: Record<TableMode, string> = {
    view:  modeChip.view,
    edit:  modeChip.edit,
    delta: modeChip.delta,
  };

  const chipColour: Record<TableMode, string> = {
    view:  'bg-primary-50 text-primary-700 border-primary-300',
    edit:  'bg-warning-bg text-warning border-warning/50',
    delta: 'bg-primary-100 text-primary-700 border-primary-300',
  };

  return (
    <div className="flex flex-col gap-1">
      {/* Mode chip */}
      <span
        className={`inline-flex items-center self-start px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${chipColour[mode]}`}
      >
        {chip[mode]}
      </span>

      {/* Drill-down info banner */}
      {isDesegregated && mode !== 'edit' && (
        <p className="text-[11px] text-primary-700 font-medium">
          {drillDownBanner}
        </p>
      )}
    </div>
  );
};
