import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { tableService } from '../services/tableService';

export class TableController {
  async getTable(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const productLevel = req.query.productLevel ? Number(req.query.productLevel) : undefined;
      const scope = req.query.scope as string | undefined;
      const apg = req.query.apg as string | undefined;
      const timeGrain = req.query.timeGrain as string | undefined;
      const measure = (req.query.measure || req.query.uom) as string | undefined;
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;
      const planningCycle = req.query.planningCycle as string | undefined;
      const activity = req.query.activity as string | undefined;
      const data = await tableService.getTable({ productLevel, scope, apg, timeGrain, measure, from, to, planningCycle, activity, filters: req.query });
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error fetching table data' });
    }
  }

  async desegregate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const scope = req.body?.scope || (req.query.scope as string);
      const data = await tableService.desegregate(scope, {
        timeGrain: req.query.timeGrain as string,
        measure: (req.query.measure || req.query.uom) as string,
        from: req.query.from as string,
        to: req.query.to as string,
        planningCycle: req.query.planningCycle as string,
        activity: req.query.activity as string,
      });
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error running desegregation' });
    }
  }
}

export const tableController = new TableController();
