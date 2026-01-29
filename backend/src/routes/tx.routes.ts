import { Router } from 'express';
import { getTransaction, getTransactionStatus } from '../controllers/tx.controller.js';

const router = Router();

// Get transaction details by hash
router.get('/:hash', getTransaction);

// Get transaction status (simplified)
router.get('/:hash/status', getTransactionStatus);

export default router;
