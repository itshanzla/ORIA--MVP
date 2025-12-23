import { supabase } from '../config/supabase.js';
import { nexusClient } from '../config/nexus.js';
import {
    canSponsorFee,
    recordSponsoredFee,
    isPlatformWalletConfigured
} from './platform-wallet.service.js';

// Asset status enum
export const AssetStatus = {
    PENDING: 'pending',           // Created locally, not yet on blockchain
    REGISTERING: 'registering',   // Nexus API called, waiting for response
    CONFIRMING: 'confirming',     // Got txid, waiting for blockchain confirmation
    CONFIRMED: 'confirmed',       // Fully confirmed on blockchain
    TRANSFER_PENDING: 'transfer_pending',
    TRANSFERRED: 'transferred',
    FAILED: 'failed'
} as const;

export interface CreateAssetInput {
    userId: string;
    title: string;
    artist: string;
    description?: string;
    genre?: string;
    price: number;
    isLimited?: boolean;
    limitedSupply?: number;
    audioUrl: string;
    audioPath: string;
    coverUrl?: string;
    coverPath?: string;
    // Nexus credentials
    nexusSession: string;
    nexusPin?: string;
}

export interface TransferAssetInput {
    assetId: string;
    userId: string;
    recipientUsername: string;
    nexusSession: string;
    nexusPin?: string;
}

// Nexus JSON field structure for asset creation
interface NexusJsonField {
    name: string;
    type: 'string' | 'uint8' | 'uint16' | 'uint32' | 'uint64' | 'bytes';
    value: string;
    mutable: boolean;
}

/**
 * Create and register a new asset
 */
export async function createAsset(input: CreateAssetInput) {
    const {
        userId,
        title,
        artist,
        description,
        genre,
        price,
        isLimited,
        limitedSupply,
        audioUrl,
        audioPath,
        coverUrl,
        coverPath,
        nexusSession,
        nexusPin
    } = input;

    // Generate a unique name for Nexus
    const timestamp = Date.now();
    const safeName = title.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30);
    const nexusAssetName = `oria_${safeName}_${timestamp}`;

    // Step 1: Insert into database with pending status
    const { data: dbAsset, error: dbError } = await supabase
        .from('assets')
        .insert({
            user_id: userId,
            title,
            artist,
            description: description || '',
            genre: genre || '',
            price,
            is_limited: isLimited || false,
            limited_supply: limitedSupply || null,
            audio_url: audioUrl,
            audio_path: audioPath,
            cover_url: coverUrl || null,
            cover_path: coverPath || null,
            nexus_name: nexusAssetName,
            status: AssetStatus.REGISTERING
        })
        .select()
        .single();

    if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
    }

    try {
        // Step 2: Create asset on Nexus blockchain
        // Nexus API requires format: 'JSON' with json: [] array of field objects
        // IMPORTANT: Nexus does NOT allow empty string values - use '-' as placeholder
        const safeValue = (val: string | undefined | null): string => val && val.trim() ? val : '-';

        const nexusJsonFields = [
            { name: 'title', type: 'string', value: safeValue(title), mutable: false },
            { name: 'artist', type: 'string', value: safeValue(artist), mutable: false },
            { name: 'description', type: 'string', value: safeValue(description), mutable: false },
            { name: 'genre', type: 'string', value: safeValue(genre), mutable: false },
            { name: 'price', type: 'string', value: price.toString() || '0', mutable: true },
            { name: 'audio_url', type: 'string', value: safeValue(audioUrl), mutable: false },
            { name: 'cover_url', type: 'string', value: safeValue(coverUrl), mutable: false },
            { name: 'is_limited', type: 'string', value: (isLimited || false).toString(), mutable: false },
            { name: 'limited_supply', type: 'string', value: (limitedSupply || 0).toString(), mutable: false },
            { name: 'created_by', type: 'string', value: safeValue(userId), mutable: false },
            { name: 'created_at', type: 'string', value: new Date().toISOString(), mutable: false },
            { name: 'app', type: 'string', value: 'ORIA', mutable: false }
        ];

        console.log('Creating Nexus asset:', nexusAssetName);
        console.log('Session:', nexusSession?.substring(0, 20) + '...');
        console.log('JSON fields count:', nexusJsonFields.length);

        // Retry logic for newly created accounts that may not be fully confirmed
        let nexusResult: any = null;
        let lastError = '';
        const maxRetries = 3;
        const retryDelay = 5000; // 5 seconds between retries

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Asset creation attempt ${attempt}/${maxRetries}`);

                const nexusResponse = await nexusClient.post('/assets/create/asset', {
                    session: nexusSession,
                    pin: nexusPin,
                    name: nexusAssetName,
                    format: 'JSON',
                    json: nexusJsonFields
                });

                console.log('Nexus asset response:', JSON.stringify(nexusResponse.data));
                nexusResult = nexusResponse.data;

                if (nexusResult.result) {
                    // Success!
                    break;
                } else {
                    lastError = nexusResult.error?.message || 'Nexus API returned no result';
                    console.error(`Attempt ${attempt} failed:`, lastError);

                    // Check if it's a genesis/timing issue - if so, retry
                    if (lastError.includes('duplicate genesis-id') || lastError.includes('Failed to accept')) {
                        if (attempt < maxRetries) {
                            console.log(`Waiting ${retryDelay/1000}s before retry (genesis may not be confirmed yet)...`);
                            await new Promise(resolve => setTimeout(resolve, retryDelay));
                            continue;
                        }
                    }
                    // For other errors, don't retry
                    break;
                }
            } catch (err: any) {
                lastError = err.response?.data?.error?.message || err.message || 'Unknown error';
                console.error(`Attempt ${attempt} threw error:`, lastError);

                // Check if it's a timing issue
                if (lastError.includes('duplicate genesis-id') || lastError.includes('Failed to accept')) {
                    if (attempt < maxRetries) {
                        console.log(`Waiting ${retryDelay/1000}s before retry...`);
                        await new Promise(resolve => setTimeout(resolve, retryDelay));
                        continue;
                    }
                }
                break;
            }
        }

        if (!nexusResult?.result) {
            console.error('Nexus asset creation failed after all retries:', lastError);
            throw new Error(lastError || 'Failed to create asset on blockchain');
        }

        // Record platform-sponsored fee
        const feeCheck = canSponsorFee();
        if (feeCheck.allowed) {
            await recordSponsoredFee(
                userId,
                'mint',
                nexusResult.result.txid,
                0.01, // Standard mint fee
                dbAsset.id
            );
            console.log('Fee sponsored by platform for mint:', nexusResult.result.txid);
        } else {
            console.log('Fee paid by user (platform limit reached or not configured)');
        }

        // Step 3: Update database with Nexus info
        const { error: updateError } = await supabase
            .from('assets')
            .update({
                nexus_address: nexusResult.result.address,
                nexus_txid: nexusResult.result.txid,
                status: AssetStatus.CONFIRMING,
                updated_at: new Date().toISOString()
            })
            .eq('id', dbAsset.id);

        if (updateError) {
            console.error('Failed to update asset with Nexus info:', updateError);
        }

        return {
            success: true,
            asset: {
                ...dbAsset,
                nexus_address: nexusResult.result.address,
                nexus_txid: nexusResult.result.txid,
                status: AssetStatus.CONFIRMING
            },
            nexus: nexusResult.result
        };

    } catch (nexusError: any) {
        // Update database with error
        await supabase
            .from('assets')
            .update({
                status: AssetStatus.FAILED,
                last_error: nexusError.message || 'Nexus registration failed',
                retry_count: dbAsset.retry_count + 1,
                updated_at: new Date().toISOString()
            })
            .eq('id', dbAsset.id);

        throw new Error(`Nexus registration failed: ${nexusError.response?.data?.error?.message || nexusError.message}`);
    }
}

/**
 * Verify asset exists on Nexus blockchain
 */
export async function verifyAsset(addressOrName: string) {
    try {
        const isAddress = addressOrName.length === 64 && /^[0-9a-fA-F]+$/.test(addressOrName);
        const params = isAddress ? { address: addressOrName } : { name: addressOrName };

        const response = await nexusClient.get('/assets/get/asset', { params });

        if (!response.data.result) {
            return { verified: false, error: 'Asset not found on blockchain' };
        }

        return {
            verified: true,
            asset: response.data.result,
            owner: response.data.result.owner,
            data: response.data.result.data
        };
    } catch (error: any) {
        return {
            verified: false,
            error: error.response?.data?.error?.message || error.message
        };
    }
}

/**
 * Confirm asset registration (check if transaction is confirmed)
 */
export async function confirmAssetRegistration(assetId: string) {
    // Get asset from database
    const { data: asset, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', assetId)
        .single();

    if (error || !asset) {
        throw new Error('Asset not found');
    }

    if (!asset.nexus_address) {
        return { confirmed: false, error: 'Asset has no blockchain address' };
    }

    // Verify on Nexus
    const verification = await verifyAsset(asset.nexus_address);

    if (verification.verified) {
        // Update status to confirmed
        await supabase
            .from('assets')
            .update({
                status: AssetStatus.CONFIRMED,
                owner_genesis: verification.owner,
                confirmed_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', assetId);

        return { confirmed: true, asset: verification.asset };
    }

    return { confirmed: false, error: verification.error };
}

/**
 * Transfer asset to another user
 */
export async function transferAsset(input: TransferAssetInput) {
    const { assetId, userId, recipientUsername, nexusSession, nexusPin } = input;

    // Step 1: Get asset and verify ownership
    const { data: asset, error: fetchError } = await supabase
        .from('assets')
        .select('*')
        .eq('id', assetId)
        .single();

    if (fetchError || !asset) {
        throw new Error('Asset not found');
    }

    if (asset.user_id !== userId) {
        throw new Error('You do not own this asset');
    }

    if (asset.status !== AssetStatus.CONFIRMED && asset.status !== AssetStatus.CONFIRMING) {
        throw new Error(`Asset cannot be transferred. Current status: ${asset.status}`);
    }

    if (!asset.nexus_address) {
        throw new Error('Asset has no blockchain address');
    }

    // Step 2: Find recipient user by username or email
    // First try to find by nexus_username in profiles table
    let recipientUserId: string | null = null;

    // Try finding by nexus_username
    const { data: profileByUsername } = await supabase
        .from('profiles')
        .select('id')
        .eq('nexus_username', recipientUsername)
        .single();

    if (profileByUsername) {
        recipientUserId = profileByUsername.id;
    } else {
        // Try finding by email in auth.users (via profiles or direct lookup)
        const { data: profileByEmail } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', recipientUsername)
            .single();

        if (profileByEmail) {
            recipientUserId = profileByEmail.id;
        }
    }

    if (!recipientUserId) {
        throw new Error(`Recipient "${recipientUsername}" not found. Make sure they have an ORIA account.`);
    }

    // At this point recipientUserId is guaranteed to be a string
    const recipientId: string = recipientUserId;

    if (recipientId === userId) {
        throw new Error('Cannot transfer asset to yourself');
    }

    // Step 3: Verify ownership on Nexus
    const verification = await verifyAsset(asset.nexus_address);
    if (!verification.verified) {
        throw new Error('Could not verify asset on blockchain');
    }

    // Step 4: Create transfer record
    const { data: transferRecord, error: transferDbError } = await supabase
        .from('asset_transfers')
        .insert({
            asset_id: assetId,
            from_user_id: userId,
            from_genesis: asset.owner_genesis,
            to_user_id: recipientId,
            to_username: recipientUsername,
            status: 'pending'
        })
        .select()
        .single();

    if (transferDbError) {
        throw new Error(`Database error: ${transferDbError.message}`);
    }

    // Step 5: Update asset status
    await supabase
        .from('assets')
        .update({
            status: AssetStatus.TRANSFER_PENDING,
            updated_at: new Date().toISOString()
        })
        .eq('id', assetId);

    try {
        // Step 5: Call Nexus transfer API
        const nexusResponse = await nexusClient.post('/assets/transfer/asset', {
            address: asset.nexus_address,
            recipient: recipientUsername,
            session: nexusSession,
            pin: nexusPin
        });

        const nexusResult = nexusResponse.data;

        if (!nexusResult.result) {
            throw new Error(nexusResult.error?.message || 'Transfer failed');
        }

        // Record platform-sponsored fee for transfer
        const feeCheck = canSponsorFee();
        if (feeCheck.allowed) {
            await recordSponsoredFee(
                userId,
                'transfer',
                nexusResult.result.txid,
                0.01, // Standard transfer fee
                assetId
            );
            console.log('Fee sponsored by platform for transfer:', nexusResult.result.txid);
        }

        // Step 7: Update transfer record with txid and mark as confirmed
        await supabase
            .from('asset_transfers')
            .update({
                nexus_txid: nexusResult.result.txid,
                to_genesis: nexusResult.result.recipient || null,
                status: 'confirmed',
                confirmed_at: new Date().toISOString()
            })
            .eq('id', transferRecord.id);

        // Step 8: Transfer ownership in database - change user_id to recipient
        // This allows the asset to appear in recipient's Library
        await supabase
            .from('assets')
            .update({
                user_id: recipientId,
                owner_genesis: nexusResult.result.recipient || null,
                status: AssetStatus.CONFIRMED, // Keep as confirmed so recipient can see it
                updated_at: new Date().toISOString()
            })
            .eq('id', assetId);

        console.log(`Asset ${assetId} transferred from ${userId} to ${recipientId}`);

        return {
            success: true,
            transferId: transferRecord.id,
            txid: nexusResult.result.txid,
            recipientUserId: recipientId
        };

    } catch (nexusError: any) {
        // Rollback: Update status back and record error
        await supabase
            .from('assets')
            .update({
                status: AssetStatus.CONFIRMED,
                updated_at: new Date().toISOString()
            })
            .eq('id', assetId);

        await supabase
            .from('asset_transfers')
            .update({
                status: 'failed',
                error: nexusError.message
            })
            .eq('id', transferRecord.id);

        throw new Error(`Transfer failed: ${nexusError.response?.data?.error?.message || nexusError.message}`);
    }
}

/**
 * Confirm transfer completion
 */
export async function confirmTransfer(transferId: string) {
    const { data: transfer, error } = await supabase
        .from('asset_transfers')
        .select('*, assets(*)')
        .eq('id', transferId)
        .single();

    if (error || !transfer) {
        throw new Error('Transfer not found');
    }

    // Verify new ownership on Nexus
    const verification = await verifyAsset(transfer.assets.nexus_address);

    if (verification.verified && verification.owner !== transfer.from_genesis) {
        // Ownership has changed - transfer confirmed
        await supabase
            .from('asset_transfers')
            .update({
                status: 'confirmed',
                to_genesis: verification.owner,
                confirmed_at: new Date().toISOString()
            })
            .eq('id', transferId);

        await supabase
            .from('assets')
            .update({
                status: AssetStatus.TRANSFERRED,
                owner_genesis: verification.owner,
                updated_at: new Date().toISOString()
            })
            .eq('id', transfer.asset_id);

        return { confirmed: true, newOwner: verification.owner };
    }

    return { confirmed: false, currentOwner: verification.owner };
}

/**
 * Get user's assets from database
 */
export async function getUserAssets(userId: string) {
    const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', userId)
        .neq('status', AssetStatus.TRANSFERRED)
        .order('created_at', { ascending: false });

    if (error) {
        throw new Error(`Database error: ${error.message}`);
    }

    return data;
}

/**
 * Get all public assets for discovery (confirmed assets only)
 */
export async function getAllPublicAssets(limit: number = 50, offset: number = 0) {
    const { data, error } = await supabase
        .from('assets')
        .select('*')
        .in('status', [AssetStatus.CONFIRMED, AssetStatus.CONFIRMING])
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        throw new Error(`Database error: ${error.message}`);
    }

    return data;
}

/**
 * Get trending assets (most recent confirmed assets)
 */
export async function getTrendingAssets(limit: number = 10) {
    const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('status', AssetStatus.CONFIRMED)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        throw new Error(`Database error: ${error.message}`);
    }

    return data;
}

/**
 * Get asset by ID with blockchain verification
 */
export async function getAssetWithVerification(assetId: string) {
    const { data: asset, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', assetId)
        .single();

    if (error || !asset) {
        throw new Error('Asset not found');
    }

    // If confirmed, verify on blockchain
    let blockchainStatus = null;
    if (asset.nexus_address) {
        blockchainStatus = await verifyAsset(asset.nexus_address);
    }

    return {
        ...asset,
        blockchain: blockchainStatus
    };
}

/**
 * Retry failed asset registration
 */
export async function retryAssetRegistration(
    assetId: string,
    nexusSession: string,
    nexusPin?: string
) {
    const { data: asset, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', assetId)
        .single();

    if (error || !asset) {
        throw new Error('Asset not found');
    }

    if (asset.status !== AssetStatus.FAILED) {
        throw new Error('Asset is not in failed status');
    }

    if (asset.retry_count >= 5) {
        throw new Error('Maximum retry attempts reached');
    }

    // Re-attempt registration
    return createAsset({
        userId: asset.user_id,
        title: asset.title,
        artist: asset.artist,
        description: asset.description,
        genre: asset.genre,
        price: asset.price,
        isLimited: asset.is_limited,
        limitedSupply: asset.limited_supply,
        audioUrl: asset.audio_url,
        audioPath: asset.audio_path,
        coverUrl: asset.cover_url,
        coverPath: asset.cover_path,
        nexusSession,
        nexusPin
    });
}
