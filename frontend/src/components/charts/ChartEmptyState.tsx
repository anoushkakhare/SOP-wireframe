import React from 'react';
import { labels } from '../../constants/labels';

interface ChartEmptyStateProps {
  isError?: boolean;
  statusCode?: number;
  onRetry?: () => void;
  children?: React.ReactNode;
}

/**
 * Unified empty / error state for chart cards.
 *
 * - isError=true  → "Something went wrong. Try again." + Retry button + collapsible HTTP status
 * - isError=false → "No data for the selected filters." (success but empty)
 */
export const ChartEmptyState: React.FC<ChartEmptyStateProps> = ({
  isError = false,
  statusCode,
  onRetry,
  children,
}) => {
  if (isError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-xs text-negative">
        <span>{labels.charts.error}</span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-3 py-1 rounded border border-negative text-negative hover:bg-negative/10 transition-colors text-xs font-medium"
          >
            Retry
          </button>
        )}
        {statusCode && (
          <details className="text-text-disabled mt-1">
            <summary className="cursor-pointer">Details</summary>
            <span>HTTP {statusCode}</span>
          </details>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-xs text-text-secondary gap-2">
      {children ?? <span>{labels.charts.noData}</span>}
    </div>
  );
};

