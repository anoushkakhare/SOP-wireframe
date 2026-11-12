import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { chartService } from '../services/chartService';
import { ProductLevel } from '../types';

export class ChartController {
  async getForecastLine(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const parent = req.query.parent as string | undefined;
      const data = await chartService.getForecastLine(parent);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error fetching forecast line data' });
    }
  }

  async getStackedBar(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const level = (req.query.level as ProductLevel) || 'brand';
      const parent = req.query.parent as string | undefined;
      const data = await chartService.getStackedBar(level, parent);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error fetching stacked bar data' });
    }
  }

  async getWaterfall(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const parent = req.query.parent as string | undefined;
      const data = await chartService.getWaterfall(parent);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error fetching waterfall data' });
    }
  }

  async getTreemap(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const level = (req.query.level as ProductLevel) || 'brand';
      const data = await chartService.getTreemap(level);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error fetching treemap data' });
    }
  }
}

export const chartController = new ChartController();

