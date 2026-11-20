import React from 'react';
import { formatCompactNumber } from '../../utils/formatters';

interface DeltaCellProps {
  delta: number;
  measure?: string;
}

/**
 * DeltaCell – shows a signed delta value in the change-log view.
 * Positive → positive-green tinted bg; Negative → negative-red tinted bg.
 */
export const DeltaCell: React.FC<DeltaCellProps> = ({ delta, measure }) => {
  if (delta === 0 || isNaN(delta)) {
    return <span className="text-text-secondary text-xs tabular-nums">0</span>;
  }

  const isPositive = delta > 0;
  const formatted  = formatCompactNumber(delta, { withSign: true, measure });

  return (
    <div
      className={`px-1.5 py-0.5 rounded text-xs font-semibold text-center inline-block min-w-[48px] tabular-nums ${
        isPositive
          ? 'bg-positive-bg text-positive border border-positive/30'
          : 'bg-negative-bg text-negative border border-negative/30'
      }`}
    >
      {formatted}
    </div>
  );
};
