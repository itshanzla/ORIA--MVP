import axios, { AxiosInstance, AxiosResponse } from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const NEXUS_BASE_URL = process.env.NEXUS_BASE_URL;
const NEXUS_API_KEY = process.env.NEXUS_API_KEY;

// Check if running in mock mode
const isMockMode = NEXUS_BASE_URL === 'mock';

if (isMockMode) {
    console.log('🔧 Nexus running in MOCK MODE - no real blockchain');
} else if (!NEXUS_BASE_URL) {
    console.warn('Warning: Nexus environment variables not configured');
}

// Generate random hex string
const randomHex = (length: number): string => crypto.randomBytes(length).toString('hex');

// Mock Nexus client for development
const createMockClient = () => {
    const mockSessions: Map<string, { username: string; genesis: string }> = new Map();
    const mockAssets: Map<string, any> = new Map();

    return {
        post: async (url: string, data?: any): Promise<AxiosResponse> => {
            console.log(`[MOCK NEXUS] POST ${url}`, data);

            // users/create/user - Create account
            if (url.includes('/users/create/user')) {
                const genesis = randomHex(32);
                const txid = randomHex(32);
                return {
                    data: {
                        result: {
                            genesis,
                            txid,
                            username: data.username
                        }
                    },
                    status: 200,
                    statusText: 'OK',
                    headers: {},
                    config: {} as any
                };
            }

            // users/login/user - Login
            if (url.includes('/users/login/user')) {
                const session = randomHex(32);
                const genesis = randomHex(32);
                mockSessions.set(session, { username: data.username, genesis });
                return {
                    data: {
                        result: {
                            session,
                            genesis
                        }
                    },
                    status: 200,
                    statusText: 'OK',
                    headers: {},
                    config: {} as any
                };
            }

            // users/logout/user - Logout
            if (url.includes('/users/logout/user')) {
                mockSessions.delete(data.session);
                return {
                    data: { result: { success: true } },
                    status: 200,
                    statusText: 'OK',
                    headers: {},
                    config: {} as any
                };
            }

            // assets/create/asset - Create asset
            if (url.includes('/assets/create/asset')) {
                const address = randomHex(32);
                const txid = randomHex(32);
                mockAssets.set(address, {
                    address,
                    name: data.name,
                    data: data.data,
                    owner: mockSessions.get(data.session)?.genesis || randomHex(32)
                });
                return {
                    data: {
                        result: {
                            address,
                            txid
                        }
                    },
                    status: 200,
                    statusText: 'OK',
                    headers: {},
                    config: {} as any
                };
            }

            // assets/transfer/asset - Transfer asset
            if (url.includes('/assets/transfer/asset')) {
                const txid = randomHex(32);
                return {
                    data: {
                        result: {
                            txid,
                            recipient: randomHex(32)
                        }
                    },
                    status: 200,
                    statusText: 'OK',
                    headers: {},
                    config: {} as any
                };
            }

            // Default response
            return {
                data: { result: { success: true } },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {} as any
            };
        },

        get: async (url: string, config?: any): Promise<AxiosResponse> => {
            console.log(`[MOCK NEXUS] GET ${url}`, config?.params);

            // system/get/info - System status
            if (url.includes('/system/get/info')) {
                return {
                    data: {
                        result: {
                            version: '5.1.0-mock',
                            blocks: 1000000,
                            connections: 10,
                            synchronizing: false
                        }
                    },
                    status: 200,
                    statusText: 'OK',
                    headers: {},
                    config: {} as any
                };
            }

            // assets/get/asset - Get asset
            if (url.includes('/assets/get/asset')) {
                const address = config?.params?.address;
                const asset = mockAssets.get(address);
                if (asset) {
                    return {
                        data: { result: asset },
                        status: 200,
                        statusText: 'OK',
                        headers: {},
                        config: {} as any
                    };
                }
                // Return mock asset anyway for development
                return {
                    data: {
                        result: {
                            address: address || randomHex(32),
                            owner: randomHex(32),
                            data: {}
                        }
                    },
                    status: 200,
                    statusText: 'OK',
                    headers: {},
                    config: {} as any
                };
            }

            // users/get/status - User status
            if (url.includes('/users/get/status')) {
                const session = config?.params?.session;
                const user = mockSessions.get(session);
                return {
                    data: {
                        result: {
                            username: user?.username || 'mock_user',
                            genesis: user?.genesis || randomHex(32)
                        }
                    },
                    status: 200,
                    statusText: 'OK',
                    headers: {},
                    config: {} as any
                };
            }

            // Default response
            return {
                data: { result: {} },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {} as any
            };
        }
    };
};

// Export either real or mock client
export const nexusClient: AxiosInstance | ReturnType<typeof createMockClient> = isMockMode
    ? createMockClient()
    : axios.create({
        baseURL: NEXUS_BASE_URL,
        headers: {
            'Content-Type': 'application/json',
            ...(NEXUS_API_KEY && { 'Authorization': `Bearer ${NEXUS_API_KEY}` })
        },
        timeout: 30000
    });

export const nexusConfig = {
    baseUrl: NEXUS_BASE_URL,
    apiKey: NEXUS_API_KEY,
    isMockMode
};
