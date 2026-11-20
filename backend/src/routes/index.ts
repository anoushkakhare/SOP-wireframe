import { Router, Request, Response } from 'express';
import authRoutes from './authRoutes';
import layoutRoutes from './layoutRoutes';
import metaRoutes from './metaRoutes';
import kpiRoutes from './kpiRoutes';
import chartRoutes from './chartRoutes';
import scenarioRoutes from './scenarioRoutes';
import tableRoutes from './tableRoutes';
import dataReviewRoutes from './dataReviewRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/layout', layoutRoutes);
router.use('/meta', metaRoutes);
router.use('/kpis', kpiRoutes);
router.use('/charts', chartRoutes);
router.use('/scenarios', scenarioRoutes);
router.use('/table', tableRoutes);
router.use('/data-review', dataReviewRoutes);

// Convenience health route at /api/health (also served from app-level)
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;

