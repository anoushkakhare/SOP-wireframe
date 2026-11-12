import { Router } from 'express';
import authRoutes from './authRoutes';
import layoutRoutes from './layoutRoutes';
import metaRoutes from './metaRoutes';
import kpiRoutes from './kpiRoutes';
import chartRoutes from './chartRoutes';
import scenarioRoutes from './scenarioRoutes';
import tableRoutes from './tableRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/layout', layoutRoutes);
router.use('/meta', metaRoutes);
router.use('/kpis', kpiRoutes);
router.use('/charts', chartRoutes);
router.use('/scenarios', scenarioRoutes);
router.use('/table', tableRoutes);

export default router;

