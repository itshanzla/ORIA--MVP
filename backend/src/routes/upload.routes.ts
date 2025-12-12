import { Router } from 'express';
import multer from 'multer';
import {
    uploadAudio,
    uploadCover,
    uploadAssetFiles,
    deleteFile
} from '../controllers/upload.controller.js';

const router = Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max
    }
});

// Single audio upload
router.post('/audio', upload.single('audio'), uploadAudio);

// Single cover image upload
router.post('/cover', upload.single('cover'), uploadCover);

// Combined upload (audio + cover)
router.post('/asset', upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'cover', maxCount: 1 }
]), uploadAssetFiles);

// Delete file
router.delete('/:path(*)', deleteFile);

export default router;
