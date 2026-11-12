import { Router } from 'express';
import { kpiController } from '../controllers/kpiController';
import { authenticateJwt } from '../middleware/auth';

const router = Router();
router.get('/', authenticateJwt, kpiController.getKpis.bind(kpiController));

export default router;

