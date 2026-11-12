import React from 'react';
import { ScenarioStatus } from '../../types';
import { labels } from '../../constants/labels';

interface StatusBadgeProps {
  status: ScenarioStatus;
}

/**
 * StatusBadge – pill-shaped status indicator.
 * Committed → positive tones (tinted bg + darker text >= 4.5:1 contrast)
 * Saved → warning tones (tinted bg + darker text >= 4.5:1 contrast)
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const isCommitted = status === 'committed';

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
        isCommitted
          ? 'bg-positive-bg text-[#166E46]'
          : 'bg-warning-bg text-[#8A5800]'
      }`}
    >
      {isCommitted ? labels.status.committed : labels.status.saved}
    </span>
  );
};
