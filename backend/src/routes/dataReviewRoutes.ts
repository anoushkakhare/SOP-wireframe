import { Router } from 'express';
import { dataReviewController } from '../controllers/dataReviewController';

const router = Router();

router.get('/pipeline', (req, res) => dataReviewController.getPipeline(req, res));
router.get('/history', (req, res) => dataReviewController.getHistory(req, res));
router.get('/readiness', (req, res) => dataReviewController.getReadiness(req, res));
router.get('/calendar', (req, res) => dataReviewController.getCalendarFeeds(req, res));

router.post('/pipeline/:id/load', (req, res) => dataReviewController.loadFeed(req, res));
router.patch('/readiness', (req, res) => dataReviewController.updateReadiness(req, res));
router.post('/signoff', (req, res) => dataReviewController.signoff(req, res));
router.post('/reopen', (req, res) => dataReviewController.reopen(req, res));

export default router;

