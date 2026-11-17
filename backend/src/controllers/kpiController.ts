import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { kpiService } from '../services/kpiService';
import { Uom } from '../types';

export class KpiController {
  async getKpis(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { productLevel, scope, apg, uom, scenarioId } = req.query;
      const kpis = await kpiService.getKpis({
        productLevel: productLevel ? Number(productLevel) : undefined,
        scope: scope as string,
        apg: apg as string,
        uom: uom as Uom,
        scenarioId: scenarioId as string,
      });
      res.json(kpis);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error fetching KPIs' });
    }
  }
}

export const kpiController = new KpiController();
