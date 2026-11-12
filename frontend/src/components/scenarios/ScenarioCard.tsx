import React from 'react';
import { Scenario } from '../../types';
import { StatusBadge } from './StatusBadge';
import { formatRelativeTime } from '../../utils/relativeTime';
import { Edit2, Trash2 } from 'lucide-react';
import { labels } from '../../constants/labels';

interface ScenarioCardProps {
  scenario: Scenario;
  isActive?: boolean;
  onSelect: (scenario: Scenario) => void;
  onDelete: (scenario: Scenario) => void;
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({
  scenario,
  isActive = false,
  onSelect,
  onDelete,
}) => {
  const { card, actions } = labels.scenarioDrawer;

  return (
    <div
      className={`p-3.5 bg-surface border rounded-card shadow-card transition-all ${
        isActive
          ? 'border-2 border-primary-700 bg-primary-50'
          : 'border-border hover:border-border-strong hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="text-xs font-semibold text-text-primary truncate" title={scenario.name}>
              {scenario.name}
            </h4>
            <StatusBadge status={scenario.status} />
          </div>
          <div className="text-[11px] text-text-secondary">
            {card.modifiedAgo(formatRelativeTime(scenario.lastModified))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
          <button
            type="button"
            onClick={() => onSelect(scenario)}
            title={actions.edit}
            aria-label={`${actions.edit}: ${scenario.name}`}
            className="w-7 h-7 flex items-center justify-center rounded-card border border-border hover:border-primary-700 hover:bg-primary-50 text-text-secondary hover:text-primary-700 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(scenario)}
            title={actions.delete}
            aria-label={`${actions.delete}: ${scenario.name}`}
            className="w-7 h-7 flex items-center justify-center rounded-card border border-border hover:border-negative hover:bg-negative-bg text-text-secondary hover:text-negative transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
