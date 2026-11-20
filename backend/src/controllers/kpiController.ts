import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { kpiService } from '../services/kpiService';
import { Uom } from '../types';

export class KpiController {
  async getKpis(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { productLevel, scope, apg, uom, measure, timeGrain, from, to, scenarioId, planningCycle, compareTo, activity } = req.query;
      const kpis = await kpiService.getKpis({
        productLevel: productLevel ? Number(productLevel) : undefined,
        scope: scope as string,
        apg: apg as string,
        uom: uom as Uom,
        measure: (measure || uom) as string,
        timeGrain: timeGrain as string,
        from: from as string,
        to: to as string,
        scenarioId: scenarioId as string,
        planningCycle: planningCycle as string,
        compareTo: compareTo as string,
        activity: activity as string,
      });
      res.json(kpis);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error fetching KPIs' });
    }
  }
}

export const kpiController = new KpiController();
