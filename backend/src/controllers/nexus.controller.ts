import { Request, Response } from 'express';
import { nexusClient, nexusConfig, validateNodeConnection } from '../config/nexus.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Create a Nexus user account (sigchain)
 * POST /api/nexus/create-account
 *
 * Nexus API: users/create/user
 */
export const createNexusAccount = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { username, password, pin } = req.body;

        if (!username || !password || !pin) {
            return errorResponse(res, 'Username, password, and PIN are required', 400);
        }

        // Nexus API uses profiles/create/master for account creation
        const response = await nexusClient.post('/profiles/create/master', {
            username,
            password,
            pin
        });

        if (!response.data.result) {
            throw new Error(response.data.error?.message || 'Account creation failed');
        }

        return successResponse(res, {
            genesis: response.data.result.genesis,
            username: response.data.result.username,
            txid: response.data.result.txid
        }, 'Nexus account created successfully', 201);

    } catch (error: any) {
        console.error('Nexus create account error:', error);
        return errorResponse(
            res,
            error.response?.data?.error?.message || error.message || 'Failed to create Nexus account',
            error.response?.status || 500,
            error
        );
    }
};

/**
 * Login to Nexus and get session token
 * POST /api/nexus/login
 *
 * Nexus API: users/login/user
 */
export const loginToNexus = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { username, password, pin } = req.body;

        if (!username || !password) {
            return errorResponse(res, 'Username and password are required', 400);
        }

        // Nexus API uses sessions/create/local for login
        const response = await nexusClient.post('/sessions/create/local', {
            username,
            password,
            pin // PIN is optional for login but needed for transactions
        });

        if (!response.data.result) {
            throw new Error(response.data.error?.message || 'Login failed');
        }

        return successResponse(res, {
            session: response.data.result.session,
            genesis: response.data.result.genesis,
            username: username
        }, 'Nexus login successful');

    } catch (error: any) {
        console.error('Nexus login error:', error);
        return errorResponse(
            res,
            error.response?.data?.error?.message || error.message || 'Nexus login failed',
            error.response?.status || 500,
            error
        );
    }
};

/**
 * Logout from Nexus
 * POST /api/nexus/logout
 *
 * Nexus API: users/logout/user
 */
export const logoutFromNexus = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { session } = req.body;

        if (!session) {
            return errorResponse(res, 'Session is required', 400);
        }

        // Nexus API uses sessions/terminate/local for logout
        const response = await nexusClient.post('/sessions/terminate/local', { session });

        return successResponse(res, response.data.result, 'Nexus logout successful');

    } catch (error: any) {
        console.error('Nexus logout error:', error);
        return errorResponse(
            res,
            error.response?.data?.error?.message || 'Logout failed',
            error.response?.status || 500,
            error
        );
    }
};

/**
 * Get Nexus system status
 * GET /api/nexus/status
 *
 * Nexus API: system/get/info
 */
export const getNexusStatus = async (req: Request, res: Response): Promise<Response> => {
    try {
        const response = await nexusClient.get('/system/get/info');

        return successResponse(res, {
            version: response.data.result?.version,
            blocks: response.data.result?.blocks,
            connections: response.data.result?.connections,
            synchronizing: response.data.result?.synchronizing
        }, 'Nexus status retrieved');

    } catch (error: any) {
        console.error('Nexus status error:', error);
        return errorResponse(
            res,
            'Failed to connect to Nexus node. Is it running?',
            error.response?.status || 503,
            error
        );
    }
};

/**
 * Health check endpoint for blockchain connectivity
 * GET /api/nexus/health
 *
 * Validates:
 * - Node is reachable
 * - Node is on testnet (required for MVP)
 * - Node is synced
 */
export const getNodeHealth = async (req: Request, res: Response): Promise<Response> => {
    try {
        const health = await validateNodeConnection();

        const status = {
            connected: health.connected,
            network: nexusConfig.network,
            testnet: health.testnet,
            synced: health.synced,
            version: health.version,
            mockMode: nexusConfig.isMockMode,
            platformWalletConfigured: nexusConfig.platformWallet.configured,
            feeLimits: nexusConfig.feeLimits
        };

        // Determine overall health
        const isHealthy = health.connected && health.testnet && health.synced;

        if (!health.connected) {
            return errorResponse(res, 'Node not reachable', 503, { ...status, error: health.error });
        }

        if (!health.testnet && !nexusConfig.isMockMode) {
            return errorResponse(res, 'Node is not on testnet - mainnet not allowed for MVP', 503, status);
        }

        if (!health.synced) {
            return successResponse(res, { ...status, warning: 'Node is still syncing' }, 'Node syncing', 200);
        }

        return successResponse(res, status, isHealthy ? 'Blockchain healthy' : 'Blockchain degraded');

    } catch (error: any) {
        console.error('Health check error:', error);
        return errorResponse(res, 'Health check failed', 500, error);
    }
};

/**
 * Get user's Nexus profile info
 * GET /api/nexus/profile
 *
 * Nexus API: users/get/status
 */
export const getNexusProfile = async (req: Request, res: Response): Promise<Response> => {
    try {
        const session = req.query.session as string;

        if (!session) {
            return errorResponse(res, 'Session is required', 400);
        }

        // Nexus API uses sessions/status/local for session status
        const response = await nexusClient.get('/sessions/status/local', {
            params: { session }
        });

        if (!response.data.result) {
            throw new Error('Could not get user status');
        }

        return successResponse(res, response.data.result, 'Profile retrieved');

    } catch (error: any) {
        return errorResponse(
            res,
            error.response?.data?.error?.message || 'Failed to get profile',
            error.response?.status || 500,
            error
        );
    }
};
