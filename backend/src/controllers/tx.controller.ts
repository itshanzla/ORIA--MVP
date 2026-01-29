import { Request, Response } from 'express';
import { nexusClient, nexusConfig } from '../config/nexus.js';
import { supabase } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Get transaction details by hash/txid
 * GET /api/tx/:hash
 */
export const getTransaction = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { hash } = req.params;

        if (!hash) {
            return errorResponse(res, 'Transaction hash is required', 400);
        }

        // Validate hash format (should be 64 hex characters for Nexus)
        if (!/^[0-9a-fA-F]{64}$/.test(hash)) {
            return errorResponse(res, 'Invalid transaction hash format', 400);
        }

        // First, check if we have this transaction in our database
        const { data: localAsset } = await supabase
            .from('assets')
            .select('*')
            .eq('nexus_txid', hash)
            .single();

        const { data: localTransfer } = await supabase
            .from('asset_transfers')
            .select('*, assets(*)')
            .eq('nexus_txid', hash)
            .single();

        // Try to get transaction from Nexus blockchain
        let blockchainTx = null;
        let blockchainError = null;

        if (!nexusConfig.isMockMode) {
            try {
                const response = await nexusClient.get('/ledger/get/transaction', {
                    params: { hash }
                });

                if (response.data?.result) {
                    blockchainTx = response.data.result;
                }
            } catch (err: any) {
                blockchainError = err.response?.data?.error?.message || err.message;
                console.log('Blockchain tx lookup failed:', blockchainError);
            }
        } else {
            // Mock mode - generate mock transaction data
            blockchainTx = {
                txid: hash,
                type: 'OBJECT',
                version: 1,
                sequence: 1,
                timestamp: Math.floor(Date.now() / 1000) - 3600,
                confirmations: Math.floor(Math.random() * 100) + 1,
                genesis: localAsset?.owner_genesis || 'mock-genesis-hash',
                contracts: [
                    {
                        id: 0,
                        type: 'CREATE',
                        address: localAsset?.nexus_address || 'mock-address'
                    }
                ]
            };
        }

        // Determine transaction type and status
        let txType = 'unknown';
        let txStatus = 'unknown';
        let relatedAsset = null;

        if (localAsset) {
            txType = 'mint';
            txStatus = localAsset.status;
            relatedAsset = {
                id: localAsset.id,
                title: localAsset.title,
                artist: localAsset.artist,
                nexus_address: localAsset.nexus_address
            };
        } else if (localTransfer) {
            txType = 'transfer';
            txStatus = localTransfer.status;
            relatedAsset = localTransfer.assets ? {
                id: localTransfer.assets.id,
                title: localTransfer.assets.title,
                artist: localTransfer.assets.artist,
                nexus_address: localTransfer.assets.nexus_address
            } : null;
        }

        return successResponse(res, {
            txid: hash,
            type: txType,
            status: txStatus,
            blockchain: blockchainTx,
            blockchainError,
            local: {
                asset: relatedAsset,
                transfer: localTransfer ? {
                    id: localTransfer.id,
                    from_user_id: localTransfer.from_user_id,
                    to_user_id: localTransfer.to_user_id,
                    to_username: localTransfer.to_username,
                    status: localTransfer.status,
                    created_at: localTransfer.created_at,
                    confirmed_at: localTransfer.confirmed_at
                } : null
            },
            timestamp: blockchainTx?.timestamp
                ? new Date(blockchainTx.timestamp * 1000).toISOString()
                : null,
            confirmations: blockchainTx?.confirmations || 0
        }, 'Transaction retrieved successfully');

    } catch (error: any) {
        console.error('Transaction lookup error:', error);
        return errorResponse(res, error.message || 'Failed to get transaction', 500);
    }
};

/**
 * Get transaction status (simplified)
 * GET /api/tx/:hash/status
 */
export const getTransactionStatus = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { hash } = req.params;

        if (!hash) {
            return errorResponse(res, 'Transaction hash is required', 400);
        }

        // Check local database first
        const { data: localAsset } = await supabase
            .from('assets')
            .select('status, nexus_address')
            .eq('nexus_txid', hash)
            .single();

        const { data: localTransfer } = await supabase
            .from('asset_transfers')
            .select('status')
            .eq('nexus_txid', hash)
            .single();

        let status = 'not_found';
        let confirmations = 0;

        if (localAsset) {
            status = localAsset.status;
        } else if (localTransfer) {
            status = localTransfer.status;
        }

        // Try to get confirmations from blockchain
        if (!nexusConfig.isMockMode && (localAsset || localTransfer)) {
            try {
                const response = await nexusClient.get('/ledger/get/transaction', {
                    params: { hash }
                });
                if (response.data?.result?.confirmations) {
                    confirmations = response.data.result.confirmations;
                }
            } catch (err) {
                // Ignore blockchain errors for status check
            }
        } else if (nexusConfig.isMockMode) {
            confirmations = status === 'confirmed' ? 10 : (status === 'confirming' ? 1 : 0);
        }

        return successResponse(res, {
            txid: hash,
            status,
            confirmations,
            confirmed: status === 'confirmed' || confirmations >= 6
        }, 'Transaction status retrieved');

    } catch (error: any) {
        console.error('Transaction status error:', error);
        return errorResponse(res, error.message || 'Failed to get transaction status', 500);
    }
};
