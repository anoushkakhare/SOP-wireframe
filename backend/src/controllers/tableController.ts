import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { tableService } from '../services/tableService';
import { ProductLevel } from '../types';

export class TableController {
  async getTable(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const level = (req.query.level as ProductLevel) || 'brand';
      const parent = req.query.parent as string | undefined;
      const data = await tableService.getTable({ level, parent, filters: req.query });
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error fetching table data' });
    }
  }

  async desegregate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const parent = req.body?.parent || (req.query.parent as string);
      const data = await tableService.desegregate(parent);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error running desegregation' });
    }
  }
}

export const tableController = new TableController();

