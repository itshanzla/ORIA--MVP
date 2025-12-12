import { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';
import crypto from 'crypto';

// Generate unique filename
const generateUniqueFilename = (originalName: string): string => {
    const ext = originalName.split('.').pop();
    const hash = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `${timestamp}-${hash}.${ext}`;
};

// Allowed audio MIME types
const ALLOWED_AUDIO_TYPES = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/aac',
    'audio/ogg',
    'audio/flac',
    'audio/x-m4a',
    'audio/mp4'
];

// Allowed image MIME types
const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
];

// Max file sizes (in bytes)
const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Upload Audio File
 * POST /api/upload/audio
 */
export const uploadAudio = async (req: Request, res: Response): Promise<Response> => {
    try {
        const file = req.file;

        if (!file) {
            return errorResponse(res, 'No audio file provided', 400);
        }

        // Validate MIME type
        if (!ALLOWED_AUDIO_TYPES.includes(file.mimetype)) {
            return errorResponse(res, `Invalid audio format. Allowed: MP3, WAV, AAC, OGG, FLAC, M4A`, 400);
        }

        // Validate file size
        if (file.size > MAX_AUDIO_SIZE) {
            return errorResponse(res, `Audio file too large. Maximum size is 50MB`, 400);
        }

        const filename = generateUniqueFilename(file.originalname);
        const filePath = `audio/${filename}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('oria-assets')
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('Supabase upload error:', error);
            return errorResponse(res, error.message || 'Failed to upload audio', 500);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('oria-assets')
            .getPublicUrl(filePath);

        return successResponse(res, {
            path: data.path,
            url: urlData.publicUrl,
            filename: filename,
            originalName: file.originalname,
            size: file.size,
            mimeType: file.mimetype
        }, 'Audio uploaded successfully', 201);

    } catch (error: any) {
        console.error('Upload error:', error);
        return errorResponse(res, 'Failed to upload audio file', 500, error);
    }
};

/**
 * Upload Cover Image
 * POST /api/upload/cover
 */
export const uploadCover = async (req: Request, res: Response): Promise<Response> => {
    try {
        const file = req.file;

        if (!file) {
            return errorResponse(res, 'No image file provided', 400);
        }

        // Validate MIME type
        if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
            return errorResponse(res, `Invalid image format. Allowed: JPEG, PNG, GIF, WebP`, 400);
        }

        // Validate file size
        if (file.size > MAX_IMAGE_SIZE) {
            return errorResponse(res, `Image file too large. Maximum size is 10MB`, 400);
        }

        const filename = generateUniqueFilename(file.originalname);
        const filePath = `covers/${filename}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('oria-assets')
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('Supabase upload error:', error);
            return errorResponse(res, error.message || 'Failed to upload image', 500);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('oria-assets')
            .getPublicUrl(filePath);

        return successResponse(res, {
            path: data.path,
            url: urlData.publicUrl,
            filename: filename,
            originalName: file.originalname,
            size: file.size,
            mimeType: file.mimetype
        }, 'Cover image uploaded successfully', 201);

    } catch (error: any) {
        console.error('Upload error:', error);
        return errorResponse(res, 'Failed to upload cover image', 500, error);
    }
};

/**
 * Upload Both Audio and Cover (multipart)
 * POST /api/upload/asset
 */
export const uploadAssetFiles = async (req: Request, res: Response): Promise<Response> => {
    try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

        if (!files || !files.audio || files.audio.length === 0) {
            return errorResponse(res, 'Audio file is required', 400);
        }

        const audioFile = files.audio[0];
        const coverFile = files.cover?.[0];

        // Validate audio
        if (!ALLOWED_AUDIO_TYPES.includes(audioFile.mimetype)) {
            return errorResponse(res, `Invalid audio format. Allowed: MP3, WAV, AAC, OGG, FLAC, M4A`, 400);
        }

        if (audioFile.size > MAX_AUDIO_SIZE) {
            return errorResponse(res, `Audio file too large. Maximum size is 50MB`, 400);
        }

        // Validate cover if provided
        if (coverFile) {
            if (!ALLOWED_IMAGE_TYPES.includes(coverFile.mimetype)) {
                return errorResponse(res, `Invalid cover image format. Allowed: JPEG, PNG, GIF, WebP`, 400);
            }
            if (coverFile.size > MAX_IMAGE_SIZE) {
                return errorResponse(res, `Cover image too large. Maximum size is 10MB`, 400);
            }
        }

        // Upload audio
        const audioFilename = generateUniqueFilename(audioFile.originalname);
        const audioPath = `audio/${audioFilename}`;

        const { data: audioData, error: audioError } = await supabase.storage
            .from('oria-assets')
            .upload(audioPath, audioFile.buffer, {
                contentType: audioFile.mimetype,
                cacheControl: '3600',
                upsert: false
            });

        if (audioError) {
            console.error('Audio upload error:', audioError);
            return errorResponse(res, audioError.message || 'Failed to upload audio', 500);
        }

        const { data: audioUrlData } = supabase.storage
            .from('oria-assets')
            .getPublicUrl(audioPath);

        let coverResult = null;

        // Upload cover if provided
        if (coverFile) {
            const coverFilename = generateUniqueFilename(coverFile.originalname);
            const coverPath = `covers/${coverFilename}`;

            const { data: coverData, error: coverError } = await supabase.storage
                .from('oria-assets')
                .upload(coverPath, coverFile.buffer, {
                    contentType: coverFile.mimetype,
                    cacheControl: '3600',
                    upsert: false
                });

            if (coverError) {
                console.error('Cover upload error:', coverError);
                // Continue without cover - audio is already uploaded
            } else {
                const { data: coverUrlData } = supabase.storage
                    .from('oria-assets')
                    .getPublicUrl(coverPath);

                coverResult = {
                    path: coverData.path,
                    url: coverUrlData.publicUrl,
                    filename: coverFilename,
                    originalName: coverFile.originalname,
                    size: coverFile.size,
                    mimeType: coverFile.mimetype
                };
            }
        }

        return successResponse(res, {
            audio: {
                path: audioData.path,
                url: audioUrlData.publicUrl,
                filename: audioFilename,
                originalName: audioFile.originalname,
                size: audioFile.size,
                mimeType: audioFile.mimetype
            },
            cover: coverResult
        }, 'Asset files uploaded successfully', 201);

    } catch (error: any) {
        console.error('Upload error:', error);
        return errorResponse(res, 'Failed to upload asset files', 500, error);
    }
};

/**
 * Delete a file from storage
 * DELETE /api/upload/:path
 */
export const deleteFile = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { path } = req.params;

        if (!path) {
            return errorResponse(res, 'File path is required', 400);
        }

        const { error } = await supabase.storage
            .from('oria-assets')
            .remove([path]);

        if (error) {
            console.error('Delete error:', error);
            return errorResponse(res, error.message || 'Failed to delete file', 500);
        }

        return successResponse(res, { path }, 'File deleted successfully');

    } catch (error: any) {
        console.error('Delete error:', error);
        return errorResponse(res, 'Failed to delete file', 500, error);
    }
};
