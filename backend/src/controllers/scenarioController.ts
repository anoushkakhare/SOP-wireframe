import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { scenarioService } from '../services/scenarioService';

export class ScenarioController {
  async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const scenarios = await scenarioService.listScenarios(req.user.id);
      res.json(scenarios);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error listing scenarios' });
    }
  }

  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const { name } = req.body;
      const created = await scenarioService.createScenario(req.user, { name });
      res.status(201).json(created);
    } catch (err: any) {
      res.status(err.statusCode || 400).json({ error: err.message || 'Error creating scenario' });
    }
  }

  async commit(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const committed = await scenarioService.commitScenario(id);
      res.json(committed);
    } catch (err: any) {
      res.status(err.statusCode || 400).json({ error: err.message || 'Error committing scenario' });
    }
  }

  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const { id } = req.params;
      await scenarioService.deleteScenario(id, req.user.id);
      res.json({ success: true, message: 'Scenario deleted successfully' });
    } catch (err: any) {
      res.status(err.statusCode || 400).json({ error: err.message || 'Error deleting scenario' });
    }
  }
}

export const scenarioController = new ScenarioController();

