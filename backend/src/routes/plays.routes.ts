import { Router } from 'express';
import { recordPlay, recordPlayComplete, getPlayStats } from '../controllers/plays.controller.js';

const router = Router();

// Record a play start
router.post('/:assetId', recordPlay);

// Record play completion
router.post('/:assetId/complete', recordPlayComplete);

// Get play statistics
router.get('/:assetId/stats', getPlayStats);

export default router;
