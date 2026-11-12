import React from 'react';
import { Check, RotateCcw, X } from 'lucide-react';
import { labels } from '../../constants/labels';

interface FilterActionsProps {
  onApply: () => void;
  onReset: () => void;
  onClose: () => void;
}

/**
 * FilterActions – three buttons at the bottom of the filter drawer.
 *
 * Button palette per spec:
 *   Apply  → primary solid   (#0F0E9A)
 *   Reset  → secondary        (white + primary border/text)
 *   Close  → neutral ghost    (grey text, no strong colour)
 */
export const FilterActions: React.FC<FilterActionsProps> = ({
  onApply,
  onReset,
  onClose,
}) => {
  const { actions } = labels.filterDrawer;

  return (
    <div className="flex items-center justify-between gap-2 pt-4 border-t border-border bg-surface">
      {/* Reset – secondary */}
      <button
        type="button"
        onClick={onReset}
        className="flex-1 py-2 px-2.5 bg-surface hover:bg-primary-50 text-primary-700 border border-primary-700 rounded-card text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        {actions.reset}
      </button>

      {/* Close – neutral ghost */}
      <button
        type="button"
        onClick={onClose}
        className="flex-1 py-2 px-2.5 bg-surface hover:bg-primary-50 text-text-secondary border border-border hover:border-border-strong rounded-card text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
        {actions.close}
      </button>

      {/* Apply – primary solid */}
      <button
        type="button"
        onClick={onApply}
        className="flex-1 py-2 px-2.5 bg-primary-700 hover:bg-primary-900 text-white rounded-card text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
      >
        <Check className="w-3.5 h-3.5" />
        {actions.apply}
      </button>
    </div>
  );
};
