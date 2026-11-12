import { Router } from 'express';
import { layoutController } from '../controllers/layoutController';
import { authenticateJwt } from '../middleware/auth';

const router = Router();
router.get('/', authenticateJwt, layoutController.getLayout.bind(layoutController));

export default router;

