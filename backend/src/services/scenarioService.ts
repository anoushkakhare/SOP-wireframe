import { scenarioRepository } from '../repositories/scenarioRepository';
import { Scenario, CreateScenarioDto, User } from '../types';

export class ScenarioService {
  async listScenarios(userId: string): Promise<Scenario[]> {
    return scenarioRepository.listByUser(userId);
  }

  async createScenario(user: User, dto: CreateScenarioDto): Promise<Scenario> {
    const trimmedName = dto.name.trim();
    if (!trimmedName) {
      throw new Error('Scenario name cannot be empty');
    }

    const existing = await scenarioRepository.findByNameForUser(trimmedName, user.id);
    if (existing) {
      const err: any = new Error(`A scenario named "${trimmedName}" already exists.`);
      err.statusCode = 409;
      throw err;
    }

    const newScenario: Scenario = {
      id: `scen_${Date.now()}`,
      name: trimmedName,
      status: 'saved',
      lastModified: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
    };

    return scenarioRepository.create(newScenario);
  }

  async commitScenario(id: string): Promise<Scenario> {
    const committed = await scenarioRepository.commit(id);
    if (!committed) {
      const err: any = new Error('Scenario not found');
      err.statusCode = 404;
      throw err;
    }
    return committed;
  }

  async deleteScenario(id: string, userId: string): Promise<boolean> {
    const deleted = await scenarioRepository.delete(id, userId);
    if (!deleted) {
      const err: any = new Error('Scenario not found or cannot be deleted');
      err.statusCode = 404;
      throw err;
    }
    return true;
  }
}

export const scenarioService = new ScenarioService();

