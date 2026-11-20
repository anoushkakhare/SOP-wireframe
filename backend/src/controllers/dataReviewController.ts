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

  async getValidationData(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = await dataReviewService.getValidationData();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error fetching validation data' });
    }
  }

  async fixMappingGap(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { fixType } = req.body || {};
      const updated = await dataReviewService.fixMappingGap(id, fixType);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error fixing mapping gap' });
    }
  }

  async fixAllMappingGaps(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const updated = await dataReviewService.fixAllMappingGaps();
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error fixing all mapping gaps' });
    }
  }

  async replaceNullValue(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { method } = req.body || {};
      const updated = await dataReviewService.replaceNullValue(id, method || 'mean');
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error replacing null value' });
    }
  }

  async fixAllNullValues(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { method } = req.body || {};
      const updated = await dataReviewService.fixAllNullValues(method || 'mean');
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error fixing all null values' });
    }
  }

  async rerunMissingIntegration(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await dataReviewService.rerunMissingIntegration();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error re-running integration' });
    }
  }

  async getInnovations(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const prods = await dataReviewService.getInnovations();
      res.json(prods);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error fetching innovation products' });
    }
  }

  async addInnovation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const created = await dataReviewService.addInnovation(req.body);
      res.status(201).json(created);
    } catch (err: any) {
      const status = err.statusCode || 400;
      res.status(status).json({ error: err.message || 'Error adding innovation product' });
    }
  }

  async deleteInnovation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const ok = await dataReviewService.deleteInnovation(id);
      if (!ok) {
        res.status(404).json({ error: 'Innovation not found' });
        return;
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error deleting innovation' });
    }
  }

  async getCombos(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const combos = await dataReviewService.getCombos();
      res.json(combos);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error fetching combo packs' });
    }
  }

  async createCombo(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const created = await dataReviewService.createCombo(req.body);
      res.status(201).json(created);
    } catch (err: any) {
      const status = err.statusCode || 400;
      res.status(status).json({ error: err.message || 'Error creating combo pack' });
    }
  }

  async updateCombo(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await dataReviewService.updateCombo(id, req.body);
      if (!updated) {
        res.status(404).json({ error: 'Combo pack not found' });
        return;
      }
      res.json(updated);
    } catch (err: any) {
      const status = err.statusCode || 400;
      res.status(status).json({ error: err.message || 'Error updating combo pack' });
    }
  }

  async deleteCombo(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const ok = await dataReviewService.deleteCombo(id);
      if (!ok) {
        res.status(404).json({ error: 'Combo pack not found' });
        return;
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error deleting combo pack' });
    }
  }
}

export const dataReviewController = new DataReviewController();

