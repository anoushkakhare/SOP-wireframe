import { Request, Response } from 'express';
import { metaService } from '../services/metaService';

export class MetaController {
  async getOptions(_req: Request, res: Response): Promise<void> {
    try {
      const options = await metaService.getOptions();
      res.json(options);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error fetching meta options' });
    }
  }

  async getHierarchy(_req: Request, res: Response): Promise<void> {
    try {
      const nodes = await metaService.getHierarchy();
      res.json(nodes);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error fetching hierarchy' });
    }
  }
}

export const metaController = new MetaController();
