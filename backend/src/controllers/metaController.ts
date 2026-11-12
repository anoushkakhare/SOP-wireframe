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
}

export const metaController = new MetaController();

