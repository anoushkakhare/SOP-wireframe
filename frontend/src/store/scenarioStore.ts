import { create } from 'zustand';
import { Scenario } from '../types';

interface ScenarioState {
  activeScenario: Scenario | null;
  scenarios: Scenario[];
  setActiveScenario: (scenario: Scenario | null) => void;
  setScenarios: (scenarios: Scenario[]) => void;
  addScenario: (scenario: Scenario) => void;
  updateScenarioInList: (scenario: Scenario) => void;
  removeScenarioFromList: (id: string) => void;
}

export const useScenarioStore = create<ScenarioState>((set) => ({
  activeScenario: null,
  scenarios: [],

  setActiveScenario: (scenario) => set({ activeScenario: scenario }),
  setScenarios: (scenarios) => set({ scenarios }),
  addScenario: (scenario) => set((s) => ({ scenarios: [scenario, ...s.scenarios] })),
  updateScenarioInList: (updated) =>
    set((s) => ({
      scenarios: s.scenarios.map((item) => (item.id === updated.id ? updated : item)),
      activeScenario: s.activeScenario?.id === updated.id ? updated : s.activeScenario,
    })),
  removeScenarioFromList: (id) =>
    set((s) => ({
      scenarios: s.scenarios.filter((item) => item.id !== id),
      activeScenario: s.activeScenario?.id === id ? null : s.activeScenario,
    })),
}));

