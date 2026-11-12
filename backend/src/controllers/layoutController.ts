import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { layoutService } from '../services/layoutService';
import { Role } from '../types';

export class LayoutController {
  async getLayout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const role = (req.query.role as Role) || req.user?.role || 'demand_planner';
      const layout = await layoutService.getLayout(role);
      if (!layout) {
        res.status(404).json({ error: 'Layout manifest not found for role' });
        return;
      }
      res.json(layout);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error fetching layout' });
    }
  }
}

export const layoutController = new LayoutController();

