import { Router } from 'express';
import { tableController } from '../controllers/tableController';
import { authenticateJwt } from '../middleware/auth';

const router = Router();
router.get('/', authenticateJwt, tableController.getTable.bind(tableController));
router.post('/desegregate', authenticateJwt, tableController.desegregate.bind(tableController));

export default router;

