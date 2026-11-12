import masterData from '../data/masterData.json';
import { Scenario } from '../types';

export class ScenarioRepository {
  private scenarios: Scenario[] = masterData.scenarios.map((s) => {
    if (s.id === 'scen_1') {
      return { ...s, lastModified: new Date(Date.now() - 120000).toISOString() } as Scenario;
    }
    if (s.id === 'scen_2') {
      return { ...s, lastModified: new Date(Date.now() - 86400000).toISOString() } as Scenario;
    }
    return s as Scenario;
  });

  async listByUser(userId: string): Promise<Scenario[]> {
    return this.scenarios.filter((s) => s.userId === userId || s.status === 'committed');
  }

  async findById(id: string): Promise<Scenario | undefined> {
    return this.scenarios.find((s) => s.id === id);
  }

  async findByNameForUser(name: string, userId: string): Promise<Scenario | undefined> {
    return this.scenarios.find((s) => s.userId === userId && s.name.trim().toLowerCase() === name.trim().toLowerCase());
  }

  async create(scenario: Scenario): Promise<Scenario> {
    this.scenarios.unshift(scenario);
    return scenario;
  }

  async update(id: string, updates: Partial<Scenario>): Promise<Scenario | undefined> {
    const index = this.scenarios.findIndex((s) => s.id === id);
    if (index === -1) return undefined;
    this.scenarios[index] = { ...this.scenarios[index], ...updates };
    return this.scenarios[index];
  }

  async commit(id: string): Promise<Scenario | undefined> {
    const scenario = await this.findById(id);
    if (!scenario) return undefined;
    scenario.status = 'committed';
    scenario.lastModified = new Date().toISOString();
    return scenario;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const index = this.scenarios.findIndex((s) => s.id === id && (s.userId === userId || s.status !== 'committed'));
    if (index === -1) return false;
    this.scenarios.splice(index, 1);
    return true;
  }
}

export const scenarioRepository = new ScenarioRepository();
