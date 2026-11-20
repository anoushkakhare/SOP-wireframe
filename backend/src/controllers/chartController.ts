import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { chartService } from '../services/chartService';
import { DataQueryParams } from '../types';

function extractParams(req: AuthenticatedRequest): DataQueryParams {
  return {
    productLevel: req.query.productLevel ? Number(req.query.productLevel) as any : undefined,
    scope: req.query.scope as string | undefined,
    apg: req.query.apg as string | undefined,
    timeGrain: req.query.timeGrain as string | undefined,
    measure: (req.query.measure || req.query.uom) as string | undefined,
    from: req.query.from as string | undefined,
    to: req.query.to as string | undefined,
    planningCycle: req.query.planningCycle as string | undefined,
    compareTo: req.query.compareTo as string | undefined,
    activity: req.query.activity as string | undefined,
  };
}

export class ChartController {
  async getForecastLine(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = await chartService.getForecastLine(extractParams(req));
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error fetching forecast line data' });
    }
  }

  async getStackedBar(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = await chartService.getStackedBar(extractParams(req));
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error fetching stacked bar data' });
    }
  }

  async getWaterfall(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = await chartService.getWaterfall(extractParams(req));
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error fetching waterfall data' });
    }
  }

  async getTreemap(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = await chartService.getTreemap(extractParams(req));
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error fetching treemap data' });
    }
  }
}

export const chartController = new ChartController();
