import { Router } from 'express';
import { metaController } from '../controllers/metaController';
import { authenticateJwt } from '../middleware/auth';

const router = Router();
router.get('/options',   authenticateJwt, metaController.getOptions.bind(metaController));
router.get('/hierarchy', authenticateJwt, metaController.getHierarchy.bind(metaController));

export default router;
