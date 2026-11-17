import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { LEVELS, LEVEL_MAP } from '../../constants/hierarchy';

export interface DrillToolbarProps {
  level: number;
  minLevel?: number;
  maxLevel?: number;
  drillOn: boolean;
  onUp: () => void;
  onToggleDown: () => void;
  drillHistoryEmpty?: boolean;
}

export const DrillToolbar: React.FC<DrillToolbarProps> = ({
  level,
  minLevel = 1,
  maxLevel = 5,
  drillOn,
  onUp,
  onToggleDown,
  drillHistoryEmpty = true,
}) => {
  const isUpDisabled = level <= minLevel && drillHistoryEmpty;
  const isDownDisabled = level >= maxLevel;

  const upTargetLabel = LEVEL_MAP[level - 1]?.label || (level > 1 ? LEVELS[level - 2]?.label : '');
  const downTargetLabel = LEVEL_MAP[level + 1]?.label || (level < maxLevel ? LEVELS[level]?.label : '');

  const upTooltip = `Drill up to ${upTargetLabel}`;
  const downTooltip = drillOn
    ? 'Drill mode is on: click a bar to drill down'
    : `Drill down to ${downTargetLabel}`;

  return (
    <div className="flex items-center gap-1 select-none">
      <button
        type="button"
        disabled={isUpDisabled}
        onClick={onUp}
        title={upTooltip}
        aria-label={upTooltip}
        className={`w-7 h-7 flex items-center justify-center rounded-card transition-colors border ${isUpDisabled
            ? 'opacity-40 cursor-not-allowed text-text-secondary border-transparent'
            : 'text-text-secondary hover:text-primary-700 hover:bg-primary-50 border-transparent hover:border-border'
          }`}
      >
        <ArrowUp className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        disabled={isDownDisabled}
        onClick={onToggleDown}
        title={downTooltip}
        aria-label={downTooltip}
        className={`w-7 h-7 flex items-center justify-center rounded-card transition-all ${isDownDisabled
            ? 'opacity-40 cursor-not-allowed text-text-secondary border border-transparent'
            : drillOn
              ? 'bg-primary-700 text-white hover:bg-primary-800 border border-primary-700 shadow-sm'
              : 'text-text-secondary hover:text-primary-700 hover:bg-primary-50 border border-transparent hover:border-border'
          }`}
      >
        <ArrowDown className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
