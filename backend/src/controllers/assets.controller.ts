import { Request, Response } from 'express';
import { nexusClient } from '../config/nexus.js';
import { successResponse, errorResponse } from '../utils/response.js';

// Queue for retry logic
interface QueuedOperation {
    id: string;
    operation: string;
    data: any;
    retries: number;
    maxRetries: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    error?: string;
    result?: any;
    createdAt: Date;
    updatedAt: Date;
}

const operationQueue: Map<string, QueuedOperation> = new Map();

// Helper to generate unique IDs
const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Retry helper with exponential backoff
const retryWithBackoff = async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;
            if (attempt < maxRetries) {
                const delay = baseDelay * Math.pow(2, attempt);
                console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError;
};

// Log operation for audit trail
const logOperation = (operation: string, data: any, result: any, success: boolean) => {
    console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        operation,
        success,
        data: { ...data, password: data.password ? '[REDACTED]' : undefined },
        result: success ? result : undefined,
        error: !success ? result : undefined
    }));
};

/**
 * Create Asset (assets/create/asset)
 * POST /api/assets/create
 *
 * Creates a new asset on the Nexus blockchain
 */
export const createAsset = async (req: Request, res: Response): Promise<Response> => {
    const operationId = generateId();

    try {
        const {
            name,
            data,
            pin,           // PIN for the Nexus sigchain
            session,       // Session token from login
            format = 'JSON'
        } = req.body;

        // Validation
        if (!name) {
            return errorResponse(res, 'Asset name is required', 400);
        }

        if (!data) {
            return errorResponse(res, 'Asset data is required', 400);
        }

        if (!session) {
            return errorResponse(res, 'Session token is required', 400);
        }

        // Queue the operation
        const queuedOp: QueuedOperation = {
            id: operationId,
            operation: 'assets/create/asset',
            data: { name, format },
            retries: 0,
            maxRetries: 3,
            status: 'processing',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        operationQueue.set(operationId, queuedOp);

        // Execute with retry logic
        const result = await retryWithBackoff(async () => {
            const response = await nexusClient.post('/assets/create/asset', {
                name,
                data,
                pin,
                session,
                format
            });
            return response.data;
        }, 3);

        // Update queue status
        queuedOp.status = 'completed';
        queuedOp.result = result;
        queuedOp.updatedAt = new Date();

        logOperation('assets/create/asset', { name, format }, result, true);

        return successResponse(res, {
            operationId,
            ...result
        }, 'Asset created successfully', 201);

    } catch (error: any) {
        const queuedOp = operationQueue.get(operationId);
        if (queuedOp) {
            queuedOp.status = 'failed';
            queuedOp.error = error.message;
            queuedOp.updatedAt = new Date();
        }

        logOperation('assets/create/asset', req.body, error.message, false);

        return errorResponse(
            res,
            error.response?.data?.error?.message || 'Failed to create asset',
            error.response?.status || 500,
            error
        );
    }
};

/**
 * Update Asset (assets/update/asset)
 * PUT /api/assets/update
 *
 * Updates an existing asset on the Nexus blockchain
 */
export const updateAsset = async (req: Request, res: Response): Promise<Response> => {
    const operationId = generateId();

    try {
        const {
            address,       // Asset register address
            name,          // Asset name (alternative to address)
            data,          // New data to update
            pin,
            session
        } = req.body;

        // Validation
        if (!address && !name) {
            return errorResponse(res, 'Asset address or name is required', 400);
        }

        if (!session) {
            return errorResponse(res, 'Session token is required', 400);
        }

        // Queue the operation
        const queuedOp: QueuedOperation = {
            id: operationId,
            operation: 'assets/update/asset',
            data: { address, name },
            retries: 0,
            maxRetries: 3,
            status: 'processing',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        operationQueue.set(operationId, queuedOp);

        // Execute with retry logic
        const result = await retryWithBackoff(async () => {
            const response = await nexusClient.post('/assets/update/asset', {
                address,
                name,
                data,
                pin,
                session
            });
            return response.data;
        }, 3);

        // Update queue status
        queuedOp.status = 'completed';
        queuedOp.result = result;
        queuedOp.updatedAt = new Date();

        logOperation('assets/update/asset', { address, name }, result, true);

        return successResponse(res, {
            operationId,
            ...result
        }, 'Asset updated successfully');

    } catch (error: any) {
        const queuedOp = operationQueue.get(operationId);
        if (queuedOp) {
            queuedOp.status = 'failed';
            queuedOp.error = error.message;
            queuedOp.updatedAt = new Date();
        }

        logOperation('assets/update/asset', req.body, error.message, false);

        return errorResponse(
            res,
            error.response?.data?.error?.message || 'Failed to update asset',
            error.response?.status || 500,
            error
        );
    }
};

/**
 * Transfer Asset (assets/transfer/asset)
 * POST /api/assets/transfer
 *
 * Transfers an asset to another user
 */
export const transferAsset = async (req: Request, res: Response): Promise<Response> => {
    const operationId = generateId();

    try {
        const {
            address,       // Asset register address
            name,          // Asset name (alternative to address)
            recipient,     // Recipient username or genesis hash
            pin,
            session,
            expires       // Optional expiration time in UNIX timestamp
        } = req.body;

        // Validation
        if (!address && !name) {
            return errorResponse(res, 'Asset address or name is required', 400);
        }

        if (!recipient) {
            return errorResponse(res, 'Recipient is required', 400);
        }

        if (!session) {
            return errorResponse(res, 'Session token is required', 400);
        }

        // Queue the operation
        const queuedOp: QueuedOperation = {
            id: operationId,
            operation: 'assets/transfer/asset',
            data: { address, name, recipient },
            retries: 0,
            maxRetries: 3,
            status: 'processing',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        operationQueue.set(operationId, queuedOp);

        // Execute with retry logic
        const result = await retryWithBackoff(async () => {
            const response = await nexusClient.post('/assets/transfer/asset', {
                address,
                name,
                recipient,
                pin,
                session,
                expires
            });
            return response.data;
        }, 3);

        // Update queue status
        queuedOp.status = 'completed';
        queuedOp.result = result;
        queuedOp.updatedAt = new Date();

        logOperation('assets/transfer/asset', { address, name, recipient }, result, true);

        return successResponse(res, {
            operationId,
            ...result
        }, 'Asset transferred successfully');

    } catch (error: any) {
        const queuedOp = operationQueue.get(operationId);
        if (queuedOp) {
            queuedOp.status = 'failed';
            queuedOp.error = error.message;
            queuedOp.updatedAt = new Date();
        }

        logOperation('assets/transfer/asset', req.body, error.message, false);

        return errorResponse(
            res,
            error.response?.data?.error?.message || 'Failed to transfer asset',
            error.response?.status || 500,
            error
        );
    }
};

/**
 * Get Asset (assets/get/asset)
 * GET /api/assets/:addressOrName
 *
 * Retrieves asset information
 */
export const getAsset = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { addressOrName } = req.params;

        if (!addressOrName) {
            return errorResponse(res, 'Asset address or name is required', 400);
        }

        // Determine if it's an address or name
        const isAddress = addressOrName.length === 64 && /^[0-9a-fA-F]+$/.test(addressOrName);

        const params: any = isAddress
            ? { address: addressOrName }
            : { name: addressOrName };

        const response = await nexusClient.get('/assets/get/asset', { params });

        logOperation('assets/get/asset', params, response.data, true);

        return successResponse(res, response.data, 'Asset retrieved successfully');

    } catch (error: any) {
        logOperation('assets/get/asset', req.params, error.message, false);

        return errorResponse(
            res,
            error.response?.data?.error?.message || 'Failed to get asset',
            error.response?.status || 500,
            error
        );
    }
};

/**
 * List Assets (assets/list/asset)
 * GET /api/assets/list
 *
 * Lists all assets for a user
 */
export const listAssets = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { session, page = 0, limit = 100, sort, order } = req.query;

        if (!session) {
            return errorResponse(res, 'Session token is required', 400);
        }

        const response = await nexusClient.get('/assets/list/asset', {
            params: {
                session,
                page,
                limit,
                sort,
                order
            }
        });

        logOperation('assets/list/asset', { page, limit }, response.data, true);

        return successResponse(res, response.data, 'Assets listed successfully');

    } catch (error: any) {
        logOperation('assets/list/asset', req.query, error.message, false);

        return errorResponse(
            res,
            error.response?.data?.error?.message || 'Failed to list assets',
            error.response?.status || 500,
            error
        );
    }
};

/**
 * Get Transaction (ledger/get/transaction)
 * GET /api/tx/:hash
 *
 * Retrieves transaction details by hash
 */
export const getTransaction = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { hash } = req.params;

        if (!hash) {
            return errorResponse(res, 'Transaction hash is required', 400);
        }

        const response = await nexusClient.get('/ledger/get/transaction', {
            params: { hash }
        });

        logOperation('ledger/get/transaction', { hash }, response.data, true);

        return successResponse(res, response.data, 'Transaction retrieved successfully');

    } catch (error: any) {
        logOperation('ledger/get/transaction', req.params, error.message, false);

        return errorResponse(
            res,
            error.response?.data?.error?.message || 'Failed to get transaction',
            error.response?.status || 500,
            error
        );
    }
};

/**
 * Get Operation Status
 * GET /api/assets/operation/:id
 *
 * Gets the status of a queued operation
 */
export const getOperationStatus = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;

        const operation = operationQueue.get(id);

        if (!operation) {
            return errorResponse(res, 'Operation not found', 404);
        }

        return successResponse(res, operation, 'Operation status retrieved');

    } catch (error: any) {
        return errorResponse(res, 'Failed to get operation status', 500, error);
    }
};

/**
 * Asset History (assets/history/asset)
 * GET /api/assets/:addressOrName/history
 *
 * Gets the transaction history for an asset
 */
export const getAssetHistory = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { addressOrName } = req.params;
        const { page = 0, limit = 100 } = req.query;

        if (!addressOrName) {
            return errorResponse(res, 'Asset address or name is required', 400);
        }

        const isAddress = addressOrName.length === 64 && /^[0-9a-fA-F]+$/.test(addressOrName);

        const params: any = {
            ...(isAddress ? { address: addressOrName } : { name: addressOrName }),
            page,
            limit
        };

        const response = await nexusClient.get('/assets/history/asset', { params });

        logOperation('assets/history/asset', params, response.data, true);

        return successResponse(res, response.data, 'Asset history retrieved successfully');

    } catch (error: any) {
        logOperation('assets/history/asset', req.params, error.message, false);

        return errorResponse(
            res,
            error.response?.data?.error?.message || 'Failed to get asset history',
            error.response?.status || 500,
            error
        );
    }
};
