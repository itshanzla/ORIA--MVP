import { Router } from 'express';
import multer from 'multer';
import {
    mintAsset,
    getMyAssets,
    getAsset,
    verifyAssetEndpoint,
    confirmAsset,
    transferAssetEndpoint,
    confirmTransferEndpoint,
    retryMint,
    getTransferHistory,
    discoverAssets,
    getTrending
} from '../controllers/mint.controller.js';

const router = Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max
    }
});

// Mint a new asset (upload + register on blockchain)
router.post('/',
    upload.fields([
        { name: 'audio', maxCount: 1 },
        { name: 'cover', maxCount: 1 }
    ]),
    mintAsset
);

// Get user's assets
router.get('/my-assets', getMyAssets);

// Discover all public assets (marketplace)
router.get('/discover', discoverAssets);

// Get trending assets for home page
router.get('/trending', getTrending);

// Get single asset with blockchain verification
router.get('/asset/:id', getAsset);

// Verify asset on blockchain
router.get('/verify/:addressOrName', verifyAssetEndpoint);

// Confirm asset registration
router.post('/confirm/:id', confirmAsset);

// Transfer asset
router.post('/transfer', transferAssetEndpoint);

// Confirm transfer
router.post('/transfer/confirm/:transferId', confirmTransferEndpoint);

// Retry failed registration
router.post('/retry/:id', retryMint);

// Get transfer history
router.get('/transfers/:assetId', getTransferHistory);

export default router;
