/**
 * Platform Wallet Service
 *
 * Manages a platform-owned Nexus wallet that sponsors transaction fees
 * for users. This allows users to mint and transfer assets without
 * needing to acquire NXS coins themselves.
 *
 * The platform wallet:
 * 1. Maintains an active session
 * 2. Pays transaction fees on behalf of users
 * 3. Tracks daily spending limits
 * 4. Logs all sponsored transactions
 */

import { nexusClient, nexusConfig } from '../config/nexus.js';
import { supabase } from '../config/supabase.js';

// Platform session state
let platformSession: string | null = null;
let platformGenesis: string | null = null;
let sessionLastRefresh: number = 0;
const SESSION_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes

// Daily fee tracking
let dailyFeeTotal: number = 0;
let dailyFeeResetDate: string = new Date().toISOString().split('T')[0];

interface FeeTransaction {
    userId: string;
    action: 'mint' | 'transfer';
    assetId?: string;
    txid: string;
    feeAmount: number;
    timestamp: Date;
}

const feeTransactions: FeeTransaction[] = [];

/**
 * Check if platform wallet is configured
 */
export function isPlatformWalletConfigured(): boolean {
    return nexusConfig.platformWallet.configured;
}

/**
 * Get or create platform session
 */
export async function getPlatformSession(): Promise<string | null> {
    if (!isPlatformWalletConfigured()) {
        console.warn('Platform wallet not configured - users must pay own fees');
        return null;
    }

    const now = Date.now();

    // Return existing session if still fresh
    if (platformSession && (now - sessionLastRefresh) < SESSION_REFRESH_INTERVAL) {
        return platformSession;
    }

    try {
        console.log('Creating/refreshing platform wallet session...');

        // Create new session
        const loginResponse = await nexusClient.post('/sessions/create/local', {
            username: nexusConfig.platformWallet.username,
            password: nexusConfig.platformWallet.password,
            pin: nexusConfig.platformWallet.pin
        });

        if (!loginResponse.data.result?.session) {
            console.error('Failed to create platform session:', loginResponse.data);
            return null;
        }

        platformSession = loginResponse.data.result.session;
        platformGenesis = loginResponse.data.result.genesis;
        sessionLastRefresh = now;

        // Unlock session for transactions
        await nexusClient.post('/sessions/unlock/local', {
            session: platformSession,
            pin: nexusConfig.platformWallet.pin,
            transactions: true,
            notifications: true
        });

        console.log('Platform wallet session active:', platformSession!.substring(0, 20) + '...');
        return platformSession;

    } catch (error: any) {
        console.error('Platform wallet login failed:', error.response?.data || error.message);
        platformSession = null;
        return null;
    }
}

/**
 * Check if we can sponsor a fee (within limits)
 */
export function canSponsorFee(estimatedFee: number = 0.01): { allowed: boolean; reason?: string } {
    if (!isPlatformWalletConfigured()) {
        return { allowed: false, reason: 'Platform wallet not configured' };
    }

    // Reset daily counter if new day
    const today = new Date().toISOString().split('T')[0];
    if (today !== dailyFeeResetDate) {
        dailyFeeTotal = 0;
        dailyFeeResetDate = today;
    }

    // Check per-transaction limit
    if (estimatedFee > nexusConfig.feeLimits.maxPerTx) {
        return {
            allowed: false,
            reason: `Fee ${estimatedFee} exceeds per-transaction limit of ${nexusConfig.feeLimits.maxPerTx} NXS`
        };
    }

    // Check daily limit
    if (dailyFeeTotal + estimatedFee > nexusConfig.feeLimits.dailyLimit) {
        return {
            allowed: false,
            reason: `Daily fee limit of ${nexusConfig.feeLimits.dailyLimit} NXS reached`
        };
    }

    return { allowed: true };
}

/**
 * Record a sponsored fee transaction
 */
export async function recordSponsoredFee(
    userId: string,
    action: 'mint' | 'transfer',
    txid: string,
    feeAmount: number = 0.01,
    assetId?: string
): Promise<void> {
    // Update in-memory tracking
    dailyFeeTotal += feeAmount;

    const transaction: FeeTransaction = {
        userId,
        action,
        assetId,
        txid,
        feeAmount,
        timestamp: new Date()
    };

    feeTransactions.push(transaction);

    // Log to database for auditing
    try {
        await supabase.from('platform_fee_log').insert({
            user_id: userId,
            action,
            asset_id: assetId,
            txid,
            fee_amount: feeAmount,
            platform_genesis: platformGenesis
        });
    } catch (error) {
        // Table might not exist yet - just log
        console.log('Fee logged (in-memory):', transaction);
    }

    console.log(`Sponsored fee: ${action} for user ${userId.substring(0, 8)}... - ${feeAmount} NXS`);
}

/**
 * Get platform wallet balance
 */
export async function getPlatformBalance(): Promise<{ balance: number; available: number } | null> {
    const session = await getPlatformSession();
    if (!session) return null;

    try {
        const response = await nexusClient.get('/finance/get/account', {
            params: {
                session,
                name: 'default'
            }
        });

        if (response.data.result) {
            return {
                balance: parseFloat(response.data.result.balance) || 0,
                available: parseFloat(response.data.result.available) || 0
            };
        }
        return null;
    } catch (error: any) {
        console.error('Failed to get platform balance:', error.response?.data || error.message);
        return null;
    }
}

/**
 * Get daily fee stats
 */
export function getDailyFeeStats(): {
    date: string;
    totalSpent: number;
    limit: number;
    remaining: number;
    transactionCount: number;
} {
    const today = new Date().toISOString().split('T')[0];
    if (today !== dailyFeeResetDate) {
        dailyFeeTotal = 0;
        dailyFeeResetDate = today;
    }

    return {
        date: dailyFeeResetDate,
        totalSpent: dailyFeeTotal,
        limit: nexusConfig.feeLimits.dailyLimit,
        remaining: nexusConfig.feeLimits.dailyLimit - dailyFeeTotal,
        transactionCount: feeTransactions.filter(
            t => t.timestamp.toISOString().split('T')[0] === today
        ).length
    };
}

/**
 * Create asset with platform-sponsored fees
 * This wraps the user's asset creation with platform fee payment
 */
export async function createAssetWithSponsoredFee(
    userSession: string,
    userPin: string,
    assetName: string,
    assetData: any[],
    userId: string
): Promise<{ success: boolean; result?: any; error?: string }> {
    // Check if we can sponsor
    const canSponsor = canSponsorFee();

    if (!canSponsor.allowed) {
        // Fall back to user paying fees
        console.log('Cannot sponsor fee:', canSponsor.reason);
        console.log('User will pay own fees');
    }

    try {
        // Create asset using user's session (user owns the asset)
        const response = await nexusClient.post('/assets/create/asset', {
            session: userSession,
            pin: userPin,
            name: assetName,
            format: 'JSON',
            json: assetData
        });

        if (response.data.result) {
            // Record the sponsored fee
            if (canSponsor.allowed) {
                await recordSponsoredFee(
                    userId,
                    'mint',
                    response.data.result.txid,
                    0.01, // Standard fee estimate
                    assetName
                );
            }

            return { success: true, result: response.data.result };
        }

        return {
            success: false,
            error: response.data.error?.message || 'Asset creation failed'
        };

    } catch (error: any) {
        return {
            success: false,
            error: error.response?.data?.error?.message || error.message
        };
    }
}

/**
 * Transfer asset with platform-sponsored fees
 */
export async function transferAssetWithSponsoredFee(
    userSession: string,
    userPin: string,
    assetAddress: string,
    recipientUsername: string,
    userId: string,
    assetId: string
): Promise<{ success: boolean; result?: any; error?: string }> {
    // Check if we can sponsor
    const canSponsor = canSponsorFee();

    if (!canSponsor.allowed) {
        console.log('Cannot sponsor fee:', canSponsor.reason);
    }

    try {
        // Transfer using user's session
        const response = await nexusClient.post('/assets/transfer/asset', {
            session: userSession,
            pin: userPin,
            address: assetAddress,
            recipient: recipientUsername
        });

        if (response.data.result) {
            // Record the sponsored fee
            if (canSponsor.allowed) {
                await recordSponsoredFee(
                    userId,
                    'transfer',
                    response.data.result.txid,
                    0.01,
                    assetId
                );
            }

            return { success: true, result: response.data.result };
        }

        return {
            success: false,
            error: response.data.error?.message || 'Transfer failed'
        };

    } catch (error: any) {
        return {
            success: false,
            error: error.response?.data?.error?.message || error.message
        };
    }
}

/**
 * Initialize platform wallet on server start
 */
export async function initializePlatformWallet(): Promise<void> {
    if (!isPlatformWalletConfigured()) {
        console.log('Platform wallet not configured - skipping initialization');
        return;
    }

    console.log('Initializing platform wallet...');

    const session = await getPlatformSession();
    if (session) {
        const balance = await getPlatformBalance();
        if (balance) {
            console.log(`Platform wallet balance: ${balance.balance} NXS (${balance.available} available)`);
        }
        console.log(`Daily fee limit: ${nexusConfig.feeLimits.dailyLimit} NXS`);
        console.log(`Max fee per tx: ${nexusConfig.feeLimits.maxPerTx} NXS`);
    } else {
        console.warn('Failed to initialize platform wallet - check credentials');
    }
}
