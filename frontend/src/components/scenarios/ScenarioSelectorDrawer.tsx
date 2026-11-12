import React from 'react';
import { Drawer } from '../layout/Drawer';
import { ScenarioCard } from './ScenarioCard';
import { Scenario } from '../../types';
import { useScenarios } from '../../hooks/useScenarios';
import { useScenarioStore } from '../../store/scenarioStore';
import { useUiStore } from '../../store/uiStore';
import { labels } from '../../constants/labels';

interface ScenarioSelectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScenarioSelectorDrawer: React.FC<ScenarioSelectorDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const { scenarios, isLoading } = useScenarios();
  const { activeScenario, setActiveScenario } = useScenarioStore();
  const { setDeleteScenarioTarget } = useUiStore();
  const { scenarioDrawer: l } = labels;

  const handleSelect = (scenario: Scenario) => {
    setActiveScenario(scenario);
    onClose();
  };

  const handleDelete = (scenario: Scenario) => {
    setDeleteScenarioTarget({ id: scenario.id, name: scenario.name });
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={l.title}>
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-20 bg-surface border border-border rounded-card p-3 animate-pulse"
              />
            ))}
          </div>
        ) : scenarios.length === 0 ? (
          <div className="p-6 text-center text-xs text-text-secondary bg-primary-50 border border-border rounded-card">
            {l.emptyState}
          </div>
        ) : (
          scenarios.map((scen) => (
            <ScenarioCard
              key={scen.id}
              scenario={scen}
              isActive={activeScenario?.id === scen.id}
              onSelect={handleSelect}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </Drawer>
  );
};
