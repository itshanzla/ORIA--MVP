import express, { Router } from 'express';
import {
    createAsset,
    updateAsset,
    transferAsset,
    getAsset,
    listAssets,
    getTransaction,
    getOperationStatus,
    getAssetHistory
} from '../controllers/assets.controller.js';

const router: Router = express.Router();

/**
 * Asset Routes
 *
 * These map to the Nexus API endpoints:
 * - assets/create/asset
 * - assets/update/asset
 * - assets/transfer/asset
 * - assets/get/asset
 * - assets/list/asset
 * - assets/history/asset
 * - ledger/get/transaction
 */

// Create a new asset (/register/create mapping)
router.post('/create', createAsset);

// Update an existing asset (/register/update mapping)
router.put('/update', updateAsset);

// Transfer an asset to another user (/token/transfer mapping)
router.post('/transfer', transferAsset);

// Get asset details
router.get('/list', listAssets);
router.get('/operation/:id', getOperationStatus);
router.get('/:addressOrName/history', getAssetHistory);
router.get('/:addressOrName', getAsset);

// Transaction endpoint (/tx/:hash mapping)
router.get('/tx/:hash', getTransaction);

export default router;
