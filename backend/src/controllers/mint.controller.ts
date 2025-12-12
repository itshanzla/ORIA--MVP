import { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import {
    createAsset,
    verifyAsset,
    confirmAssetRegistration,
    transferAsset,
    confirmTransfer,
    getUserAssets,
    getAssetWithVerification,
    retryAssetRegistration
} from '../services/asset.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import crypto from 'crypto';

// Generate unique filename
const generateUniqueFilename = (originalName: string): string => {
    const ext = originalName.split('.').pop();
    const hash = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `${timestamp}-${hash}.${ext}`;
};

/**
 * Mint a new asset (upload + register on Nexus)
 * POST /api/mint
 */
export const mintAsset = async (req: Request, res: Response): Promise<Response> => {
    try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

        // Validate files
        if (!files || !files.audio || files.audio.length === 0) {
            return errorResponse(res, 'Audio file is required', 400);
        }

        const audioFile = files.audio[0];
        const coverFile = files.cover?.[0];

        // Validate required fields
        const {
            title,
            artist,
            description,
            genre,
            price,
            isLimited,
            limitedSupply,
            userId,
            nexusSession,
            nexusPin
        } = req.body;

        if (!title || !artist || !userId) {
            return errorResponse(res, 'Title, artist, and userId are required', 400);
        }

        if (!nexusSession) {
            return errorResponse(res, 'Nexus session is required for blockchain registration', 400);
        }

        // Step 1: Upload audio to Supabase Storage
        const audioFilename = generateUniqueFilename(audioFile.originalname);
        const audioPath = `audio/${audioFilename}`;

        const { error: audioError } = await supabase.storage
            .from('oria-assets')
            .upload(audioPath, audioFile.buffer, {
                contentType: audioFile.mimetype,
                cacheControl: '3600'
            });

        if (audioError) {
            return errorResponse(res, `Audio upload failed: ${audioError.message}`, 500);
        }

        const { data: audioUrlData } = supabase.storage
            .from('oria-assets')
            .getPublicUrl(audioPath);

        // Step 2: Upload cover if provided
        let coverUrl: string | undefined;
        let coverPath: string | undefined;

        if (coverFile) {
            const coverFilename = generateUniqueFilename(coverFile.originalname);
            coverPath = `covers/${coverFilename}`;

            const { error: coverError } = await supabase.storage
                .from('oria-assets')
                .upload(coverPath, coverFile.buffer, {
                    contentType: coverFile.mimetype,
                    cacheControl: '3600'
                });

            if (!coverError) {
                const { data: coverUrlData } = supabase.storage
                    .from('oria-assets')
                    .getPublicUrl(coverPath);
                coverUrl = coverUrlData.publicUrl;
            }
        }

        // Step 3: Create asset and register on Nexus
        const result = await createAsset({
            userId,
            title,
            artist,
            description,
            genre,
            price: parseFloat(price) || 0,
            isLimited: isLimited === 'true' || isLimited === true,
            limitedSupply: limitedSupply ? parseInt(limitedSupply) : undefined,
            audioUrl: audioUrlData.publicUrl,
            audioPath,
            coverUrl,
            coverPath,
            nexusSession,
            nexusPin
        });

        return successResponse(res, result, 'Asset minted and registered on blockchain', 201);

    } catch (error: any) {
        console.error('Mint error:', error);
        return errorResponse(res, error.message || 'Failed to mint asset', 500);
    }
};

/**
 * Get user's assets
 * GET /api/mint/my-assets
 */
export const getMyAssets = async (req: Request, res: Response): Promise<Response> => {
    try {
        const userId = req.query.userId as string;

        if (!userId) {
            return errorResponse(res, 'userId is required', 400);
        }

        const assets = await getUserAssets(userId);

        return successResponse(res, { assets }, 'Assets retrieved successfully');

    } catch (error: any) {
        return errorResponse(res, error.message || 'Failed to get assets', 500);
    }
};

/**
 * Get single asset with blockchain verification
 * GET /api/mint/asset/:id
 */
export const getAsset = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;

        if (!id) {
            return errorResponse(res, 'Asset ID is required', 400);
        }

        const asset = await getAssetWithVerification(id);

        return successResponse(res, { asset }, 'Asset retrieved successfully');

    } catch (error: any) {
        return errorResponse(res, error.message || 'Failed to get asset', 500);
    }
};

/**
 * Verify asset on blockchain
 * GET /api/mint/verify/:addressOrName
 */
export const verifyAssetEndpoint = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { addressOrName } = req.params;

        if (!addressOrName) {
            return errorResponse(res, 'Asset address or name is required', 400);
        }

        const result = await verifyAsset(addressOrName);

        if (result.verified) {
            return successResponse(res, result, 'Asset verified on blockchain');
        } else {
            return errorResponse(res, result.error || 'Asset not found on blockchain', 404);
        }

    } catch (error: any) {
        return errorResponse(res, error.message || 'Verification failed', 500);
    }
};

/**
 * Confirm asset registration (poll for blockchain confirmation)
 * POST /api/mint/confirm/:id
 */
export const confirmAsset = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;

        if (!id) {
            return errorResponse(res, 'Asset ID is required', 400);
        }

        const result = await confirmAssetRegistration(id);

        if (result.confirmed) {
            return successResponse(res, result, 'Asset confirmed on blockchain');
        } else {
            return successResponse(res, result, 'Asset not yet confirmed');
        }

    } catch (error: any) {
        return errorResponse(res, error.message || 'Confirmation check failed', 500);
    }
};

/**
 * Transfer asset to another user
 * POST /api/mint/transfer
 */
export const transferAssetEndpoint = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { assetId, userId, recipientUsername, nexusSession, nexusPin } = req.body;

        if (!assetId || !userId || !recipientUsername) {
            return errorResponse(res, 'assetId, userId, and recipientUsername are required', 400);
        }

        if (!nexusSession) {
            return errorResponse(res, 'Nexus session is required for transfer', 400);
        }

        const result = await transferAsset({
            assetId,
            userId,
            recipientUsername,
            nexusSession,
            nexusPin
        });

        return successResponse(res, result, 'Transfer initiated successfully');

    } catch (error: any) {
        return errorResponse(res, error.message || 'Transfer failed', 500);
    }
};

/**
 * Confirm transfer completion
 * POST /api/mint/transfer/confirm/:transferId
 */
export const confirmTransferEndpoint = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { transferId } = req.params;

        if (!transferId) {
            return errorResponse(res, 'Transfer ID is required', 400);
        }

        const result = await confirmTransfer(transferId);

        if (result.confirmed) {
            return successResponse(res, result, 'Transfer confirmed');
        } else {
            return successResponse(res, result, 'Transfer not yet confirmed');
        }

    } catch (error: any) {
        return errorResponse(res, error.message || 'Confirmation check failed', 500);
    }
};

/**
 * Retry failed asset registration
 * POST /api/mint/retry/:id
 */
export const retryMint = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;
        const { nexusSession, nexusPin } = req.body;

        if (!id) {
            return errorResponse(res, 'Asset ID is required', 400);
        }

        if (!nexusSession) {
            return errorResponse(res, 'Nexus session is required', 400);
        }

        const result = await retryAssetRegistration(id, nexusSession, nexusPin);

        return successResponse(res, result, 'Asset registration retried');

    } catch (error: any) {
        return errorResponse(res, error.message || 'Retry failed', 500);
    }
};

/**
 * Get transfer history for an asset
 * GET /api/mint/transfers/:assetId
 */
export const getTransferHistory = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { assetId } = req.params;

        if (!assetId) {
            return errorResponse(res, 'Asset ID is required', 400);
        }

        const { data: transfers, error } = await supabase
            .from('asset_transfers')
            .select('*')
            .eq('asset_id', assetId)
            .order('created_at', { ascending: false });

        if (error) {
            return errorResponse(res, error.message, 500);
        }

        return successResponse(res, { transfers }, 'Transfer history retrieved');

    } catch (error: any) {
        return errorResponse(res, error.message || 'Failed to get transfer history', 500);
    }
};
