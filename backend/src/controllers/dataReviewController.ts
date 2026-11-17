import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { dataReviewService } from '../services/dataReviewService';

export class DataReviewController {
  async getPipeline(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const pipeline = await dataReviewService.getPipeline();
      res.json(pipeline);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error fetching pipeline' });
    }
  }

  async getHistory(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const history = await dataReviewService.getHistory();
      res.json(history);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error fetching history' });
    }
  }

  async getReadiness(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const readiness = await dataReviewService.getReadiness();
      res.json(readiness);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error fetching readiness' });
    }
  }

  async getCalendarFeeds(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const feeds = await dataReviewService.getCalendarFeeds();
      res.json(feeds);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error fetching calendar feeds' });
    }
  }

  async loadFeed(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await dataReviewService.loadFeed(id);
      if (!updated) {
        res.status(404).json({ error: `Feed ${id} not found` });
        return;
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error loading feed' });
    }
  }

  async updateReadiness(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const readiness = await dataReviewService.updateReadiness(req.body);
      res.json(readiness);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error updating readiness' });
    }
  }

  async signoff(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userName = req.body?.signedBy || req.user?.name || 'Demand Planner';
      const readiness = await dataReviewService.signoff(req.body || {}, userName);
      res.json(readiness);
    } catch (err: any) {
      const status = err.statusCode || 400;
      res.status(status).json({
        error: err.message || 'Error signing off',
        blockingItems: err.blockingItems || [],
      });
    }
  }

  async reopen(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const readiness = await dataReviewService.reopen();
      res.json(readiness);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error reopening signoff' });
    }
  }

  async getTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { measure, groupBy, from, to } = req.query as {
        measure?: 'cases' | 'units' | 'value';
        groupBy?: 'category' | 'sop' | 'brand';
        from?: string;
        to?: string;
      };
      const result = await dataReviewService.getTransactions({ measure, groupBy, from, to });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error fetching transactions review' });
    }
  }
}

export const dataReviewController = new DataReviewController();

