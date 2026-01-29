import { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Record a play for an asset
 * POST /api/plays/:assetId
 *
 * Play counts increase only once per session per asset.
 * Uses a combination of user ID (if logged in) or session identifier.
 */
export const recordPlay = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { assetId } = req.params;
        const { userId, sessionId } = req.body;

        if (!assetId) {
            return errorResponse(res, 'Asset ID is required', 400);
        }

        // Create a unique play identifier to prevent duplicate counts
        const playIdentifier = userId || sessionId || req.ip || 'anonymous';
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // Check if this session already played this asset today
        const { data: existingPlay } = await supabase
            .from('asset_plays')
            .select('id')
            .eq('asset_id', assetId)
            .eq('play_identifier', playIdentifier)
            .gte('created_at', `${today}T00:00:00Z`)
            .limit(1)
            .single();

        if (existingPlay) {
            // Already played today, don't increment
            return successResponse(res, {
                counted: false,
                message: 'Play already counted for this session'
            }, 'Play already recorded');
        }

        // Record the play
        const { error: insertError } = await supabase
            .from('asset_plays')
            .insert({
                asset_id: assetId,
                user_id: userId || null,
                play_identifier: playIdentifier,
                completed: false
            });

        if (insertError) {
            console.error('Failed to record play:', insertError);
            // Don't fail the request, just log
        }

        // Increment play count on the asset
        const { error: updateError } = await supabase
            .rpc('increment_play_count', { asset_uuid: assetId });

        if (updateError) {
            console.error('Failed to increment play count:', updateError);
            // Fallback: update directly
            const { data: asset } = await supabase
                .from('assets')
                .select('play_count')
                .eq('id', assetId)
                .single();

            if (asset) {
                await supabase
                    .from('assets')
                    .update({ play_count: (asset.play_count || 0) + 1 })
                    .eq('id', assetId);
            }
        }

        return successResponse(res, {
            counted: true,
            assetId
        }, 'Play recorded successfully');

    } catch (error: any) {
        console.error('Record play error:', error);
        return errorResponse(res, error.message || 'Failed to record play', 500);
    }
};

/**
 * Record play completion
 * POST /api/plays/:assetId/complete
 */
export const recordPlayComplete = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { assetId } = req.params;
        const { userId, sessionId } = req.body;

        if (!assetId) {
            return errorResponse(res, 'Asset ID is required', 400);
        }

        const playIdentifier = userId || sessionId || req.ip || 'anonymous';
        const today = new Date().toISOString().split('T')[0];

        // Update the most recent play record for this session
        const { error } = await supabase
            .from('asset_plays')
            .update({ completed: true })
            .eq('asset_id', assetId)
            .eq('play_identifier', playIdentifier)
            .gte('created_at', `${today}T00:00:00Z`);

        if (error) {
            console.error('Failed to update play completion:', error);
        }

        return successResponse(res, { completed: true }, 'Play completion recorded');

    } catch (error: any) {
        console.error('Record play complete error:', error);
        return errorResponse(res, error.message || 'Failed to record completion', 500);
    }
};

/**
 * Get play statistics for an asset
 * GET /api/plays/:assetId/stats
 */
export const getPlayStats = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { assetId } = req.params;

        if (!assetId) {
            return errorResponse(res, 'Asset ID is required', 400);
        }

        // Get asset with play count
        const { data: asset, error: assetError } = await supabase
            .from('assets')
            .select('id, title, play_count')
            .eq('id', assetId)
            .single();

        if (assetError || !asset) {
            return errorResponse(res, 'Asset not found', 404);
        }

        // Get completion rate (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { count: totalPlays } = await supabase
            .from('asset_plays')
            .select('*', { count: 'exact', head: true })
            .eq('asset_id', assetId)
            .gte('created_at', thirtyDaysAgo.toISOString());

        const { count: completedPlays } = await supabase
            .from('asset_plays')
            .select('*', { count: 'exact', head: true })
            .eq('asset_id', assetId)
            .eq('completed', true)
            .gte('created_at', thirtyDaysAgo.toISOString());

        return successResponse(res, {
            assetId,
            title: asset.title,
            totalPlays: asset.play_count || 0,
            last30Days: {
                plays: totalPlays || 0,
                completions: completedPlays || 0,
                completionRate: totalPlays ? Math.round(((completedPlays || 0) / totalPlays) * 100) : 0
            }
        }, 'Play statistics retrieved');

    } catch (error: any) {
        console.error('Get play stats error:', error);
        return errorResponse(res, error.message || 'Failed to get statistics', 500);
    }
};
