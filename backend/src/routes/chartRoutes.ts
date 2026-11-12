import { Router } from 'express';
import { chartController } from '../controllers/chartController';
import { authenticateJwt } from '../middleware/auth';

const router = Router();
router.get('/forecast-line', authenticateJwt, chartController.getForecastLine.bind(chartController));
router.get('/stacked-bar', authenticateJwt, chartController.getStackedBar.bind(chartController));
router.get('/waterfall', authenticateJwt, chartController.getWaterfall.bind(chartController));
router.get('/treemap', authenticateJwt, chartController.getTreemap.bind(chartController));

export default router;

