import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { Role } from '../types';

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { role } = req.body as { role?: Role };
      const result = await authService.login(role || 'demand_planner');
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Login failed' });
    }
  }
}

export const authController = new AuthController();

