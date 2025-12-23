import axios, { AxiosInstance, AxiosResponse } from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const NEXUS_BASE_URL = process.env.NEXUS_BASE_URL;
const NEXUS_API_KEY = process.env.NEXUS_API_KEY;
const NEXUS_NETWORK = process.env.NEXUS_NETWORK || 'testnet';

// Platform fee wallet credentials (for sponsored transaction fees)
const NEXUS_PLATFORM_USERNAME = process.env.NEXUS_PLATFORM_USERNAME;
const NEXUS_PLATFORM_PASSWORD = process.env.NEXUS_PLATFORM_PASSWORD;
const NEXUS_PLATFORM_PIN = process.env.NEXUS_PLATFORM_PIN;

// Fee limits (in NXS)
const NEXUS_MAX_FEE_PER_TX = parseFloat(process.env.NEXUS_MAX_FEE_PER_TX || '0.01');
const NEXUS_DAILY_FEE_LIMIT = parseFloat(process.env.NEXUS_DAILY_FEE_LIMIT || '10.0');

// Check if running in mock mode
const isMockMode = NEXUS_BASE_URL === 'mock';

// Network safety check - prevent accidental mainnet usage
if (NEXUS_NETWORK === 'mainnet') {
    console.error('⛔ MAINNET IS NOT ENABLED FOR MVP');
    console.error('   Set NEXUS_NETWORK=testnet in your .env file');
    console.error('   Mainnet will only be enabled after explicit approval.');
    process.exit(1);
}

if (isMockMode) {
    console.log('🔧 Nexus running in MOCK MODE - no real blockchain');
    console.log('   To connect to testnet, set NEXUS_BASE_URL to your node URL');
} else if (!NEXUS_BASE_URL) {
    console.warn('⚠️  Warning: NEXUS_BASE_URL not configured');
    console.warn('   Set NEXUS_BASE_URL=mock for development');
    console.warn('   Set NEXUS_BASE_URL=http://<node-ip>:8080 for testnet');
} else {
    console.log(`🔗 Nexus connecting to: ${NEXUS_BASE_URL}`);
    console.log(`   Network: ${NEXUS_NETWORK}`);

    // Warn if platform wallet not configured (needed for fee sponsorship)
    if (!NEXUS_PLATFORM_USERNAME || !NEXUS_PLATFORM_PASSWORD || !NEXUS_PLATFORM_PIN) {
        console.warn('⚠️  Platform fee wallet not configured');
        console.warn('   Users will need to pay their own transaction fees');
        console.warn('   Set NEXUS_PLATFORM_USERNAME, NEXUS_PLATFORM_PASSWORD, and NEXUS_PLATFORM_PIN in .env');
    } else {
        console.log('💰 Platform fee wallet configured for sponsored transactions');
    }
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

            // profiles/create/master - Create account (sigchain)
            if (url.includes('/profiles/create/master')) {
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

            // sessions/create/local - Login
            if (url.includes('/sessions/create/local')) {
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

            // sessions/terminate/local - Logout
            if (url.includes('/sessions/terminate/local')) {
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
                            testnet: true,
                            blocks: 1000000,
                            connections: 10,
                            syncing: false,
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

            // sessions/status/local - Session status
            if (url.includes('/sessions/status/local')) {
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
    isMockMode,
    network: NEXUS_NETWORK,
    platformWallet: {
        username: NEXUS_PLATFORM_USERNAME,
        password: NEXUS_PLATFORM_PASSWORD,
        pin: NEXUS_PLATFORM_PIN,
        configured: !!(NEXUS_PLATFORM_USERNAME && NEXUS_PLATFORM_PASSWORD && NEXUS_PLATFORM_PIN)
    },
    feeLimits: {
        maxPerTx: NEXUS_MAX_FEE_PER_TX,
        dailyLimit: NEXUS_DAILY_FEE_LIMIT
    }
};

// Helper to check if we're in testnet mode (always true for MVP)
export const isTestnet = (): boolean => NEXUS_NETWORK === 'testnet';

// Helper to validate node connection
export const validateNodeConnection = async (): Promise<{
    connected: boolean;
    testnet: boolean;
    synced: boolean;
    version?: string;
    error?: string;
}> => {
    if (isMockMode) {
        return { connected: true, testnet: true, synced: true, version: 'mock' };
    }

    try {
        const response = await nexusClient.get('/system/get/info');
        const info = response.data?.result;

        if (!info) {
            return { connected: false, testnet: false, synced: false, error: 'Invalid response' };
        }

        return {
            connected: true,
            testnet: info.testnet === true,
            synced: !info.syncing,
            version: info.version
        };
    } catch (err: any) {
        return {
            connected: false,
            testnet: false,
            synced: false,
            error: err.message
        };
    }
};
