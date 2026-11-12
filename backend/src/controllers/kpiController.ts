import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { kpiService } from '../services/kpiService';
import { ProductLevel, CustomerLevel, Uom } from '../types';

export class KpiController {
  async getKpis(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { productLevel, customerLevel, uom, parent, scenarioId } = req.query;
      const kpis = await kpiService.getKpis({
        productLevel: productLevel as ProductLevel,
        customerLevel: customerLevel as CustomerLevel,
        uom: uom as Uom,
        parent: parent as string,
        scenarioId: scenarioId as string,
      });
      res.json(kpis);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error fetching KPIs' });
    }
  }
}

export const kpiController = new KpiController();

