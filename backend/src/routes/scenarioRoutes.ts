import { Router } from 'express';
import { scenarioController } from '../controllers/scenarioController';
import { authenticateJwt } from '../middleware/auth';

const router = Router();
router.get('/', authenticateJwt, scenarioController.list.bind(scenarioController));
router.post('/', authenticateJwt, scenarioController.create.bind(scenarioController));
router.post('/:id/commit', authenticateJwt, scenarioController.commit.bind(scenarioController));
router.delete('/:id', authenticateJwt, scenarioController.delete.bind(scenarioController));

export default router;

