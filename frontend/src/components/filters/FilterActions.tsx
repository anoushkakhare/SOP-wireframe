import React from 'react';
import { Check, RotateCcw, X } from 'lucide-react';
import { labels } from '../../constants/labels';

interface FilterActionsProps {
  onApply: () => void;
  onReset: () => void;
  onClose: () => void;
  isApplyDisabled?: boolean;
  hasChanges?: boolean;
}

/**
 * FilterActions – three buttons at the bottom of the filter drawer.
 *
 * Button palette per spec:
 *   Apply  → primary solid   (#0F0E9A) – disabled when no changes
 *   Reset  → secondary        (white + primary border/text) – clears draft only
 *   Close  → neutral ghost    (grey text, no strong colour) – discards draft
 */
export const FilterActions: React.FC<FilterActionsProps> = ({
  onApply,
  onReset,
  onClose,
  isApplyDisabled = false,
  hasChanges = false,
}) => {
  const { actions } = labels.filterDrawer;

  return (
    <div className="pt-4 border-t border-border bg-surface space-y-2">
      {hasChanges && (
        <div className="flex items-center justify-end px-1">
          <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Unapplied changes
          </span>
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        {/* Reset – secondary */}
        <button
          type="button"
          onClick={onReset}
          className="flex-1 py-2 px-2.5 bg-surface hover:bg-primary-50 text-primary-700 border border-primary-700 rounded-card text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {actions.reset}
        </button>

        {/* Close – neutral ghost */}
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2 px-2.5 bg-surface hover:bg-primary-50 text-text-secondary border border-border hover:border-border-strong rounded-card text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          {actions.close}
        </button>

        {/* Apply – primary solid */}
        <button
          type="button"
          onClick={onApply}
          disabled={isApplyDisabled}
          className={`flex-1 py-2 px-2.5 rounded-card text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            isApplyDisabled
              ? 'bg-primary-300 text-white/70 cursor-not-allowed opacity-50'
              : 'bg-primary-700 hover:bg-primary-900 text-white shadow-sm cursor-pointer'
          }`}
        >
          <Check className="w-3.5 h-3.5" />
          {actions.apply}
        </button>
      </div>
    </div>
  );
};
