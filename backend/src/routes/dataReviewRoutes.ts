import { Router } from 'express';
import { dataReviewController } from '../controllers/dataReviewController';

const router = Router();

router.get('/pipeline', (req, res) => dataReviewController.getPipeline(req, res));
router.get('/history', (req, res) => dataReviewController.getHistory(req, res));
router.get('/readiness', (req, res) => dataReviewController.getReadiness(req, res));
router.get('/calendar', (req, res) => dataReviewController.getCalendarFeeds(req, res));
router.get('/transactions', (req, res) => dataReviewController.getTransactions(req, res));

router.get('/validation', (req, res) => dataReviewController.getValidationData(req, res));
router.post('/validation/mapping-gaps/:id/fix', (req, res) => dataReviewController.fixMappingGap(req, res));
router.post('/validation/mapping-gaps/fix-all', (req, res) => dataReviewController.fixAllMappingGaps(req, res));
router.post('/validation/null-values/:id/replace', (req, res) => dataReviewController.replaceNullValue(req, res));
router.post('/validation/null-values/replace-all', (req, res) => dataReviewController.fixAllNullValues(req, res));
router.post('/validation/rerun-integration', (req, res) => dataReviewController.rerunMissingIntegration(req, res));

router.get('/innovations', (req, res) => dataReviewController.getInnovations(req, res));
router.post('/innovations', (req, res) => dataReviewController.addInnovation(req, res));
router.delete('/innovations/:id', (req, res) => dataReviewController.deleteInnovation(req, res));

router.get('/combos', (req, res) => dataReviewController.getCombos(req, res));
router.post('/combos', (req, res) => dataReviewController.createCombo(req, res));
router.put('/combos/:id', (req, res) => dataReviewController.updateCombo(req, res));
router.delete('/combos/:id', (req, res) => dataReviewController.deleteCombo(req, res));

router.post('/pipeline/:id/load', (req, res) => dataReviewController.loadFeed(req, res));
router.patch('/readiness', (req, res) => dataReviewController.updateReadiness(req, res));
router.post('/signoff', (req, res) => dataReviewController.signoff(req, res));
router.post('/reopen', (req, res) => dataReviewController.reopen(req, res));

export default router;

