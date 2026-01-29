/**
 * ORIA MVP - End-to-End Test Suite
 *
 * Tests the complete user flow:
 * 1. Sign up (creates Nexus wallet)
 * 2. Login
 * 3. Mint an asset
 * 4. Verify asset on blockchain
 * 5. Transfer asset to another user
 * 6. Verify transfer
 *
 * Run with: npx tsx scripts/e2e-test.ts
 *
 * Prerequisites:
 * - Backend server running on localhost:3001
 * - Valid Supabase credentials in .env
 * - Nexus configured (mock or testnet)
 */

import axios, { AxiosError, AxiosInstance } from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:3001/api';

// Test users
const timestamp = Date.now();
const TEST_USER_1 = {
    email: `testuser1_${timestamp}@oriatest.com`,
    password: 'TestPassword123!',
    username: `testuser1_${timestamp}`,
    name: 'Test User One',
    pin: '1234',
    role: 'creator'
};

const TEST_USER_2 = {
    email: `testuser2_${timestamp}@oriatest.com`,
    password: 'TestPassword456!',
    username: `testuser2_${timestamp}`,
    name: 'Test User Two',
    pin: '5678',
    role: 'listener'
};

interface TestResult {
    name: string;
    passed: boolean;
    message: string;
    duration: number;
    data?: any;
}

interface UserSession {
    userId: string;
    accessToken: string;
    nexusSession: string;
    nexusGenesis?: string;
}

const results: TestResult[] = [];
let user1Session: UserSession | null = null;
let user2Session: UserSession | null = null;
let mintedAssetId: string | null = null;
let mintedTxid: string | null = null;

// Create axios instance
const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000,
    validateStatus: () => true // Don't throw on any status
});

function log(message: string, type: 'info' | 'success' | 'error' | 'warn' | 'step' = 'info') {
    const prefix = {
        info: '   ',
        success: ' ✅ ',
        error: ' ❌ ',
        warn: ' ⚠️  ',
        step: '\n📋 '
    };
    console.log(`${prefix[type]}${message}`);
}

async function runTest(
    name: string,
    testFn: () => Promise<{ success: boolean; message: string; data?: any }>
): Promise<boolean> {
    const startTime = Date.now();
    try {
        const result = await testFn();
        const duration = Date.now() - startTime;

        results.push({
            name,
            passed: result.success,
            message: result.message,
            duration,
            data: result.data
        });

        if (result.success) {
            log(`${name} (${duration}ms)`, 'success');
        } else {
            log(`${name}: ${result.message}`, 'error');
        }

        return result.success;
    } catch (error: any) {
        const duration = Date.now() - startTime;
        results.push({
            name,
            passed: false,
            message: error.message,
            duration
        });
        log(`${name}: ${error.message}`, 'error');
        return false;
    }
}

// ==================== TEST FUNCTIONS ====================

async function testServerHealth() {
    return runTest('Server Health Check', async () => {
        const response = await api.get('/');

        if (response.status !== 200) {
            return { success: false, message: `Server returned status ${response.status}` };
        }

        // Health endpoint is at root, not /api
        const rootResponse = await axios.get('http://localhost:3001/');
        if (!rootResponse.data?.success) {
            return { success: false, message: 'Health check failed' };
        }

        return {
            success: true,
            message: 'Server is running',
            data: rootResponse.data
        };
    });
}

async function testSignupUser1() {
    return runTest('Sign Up User 1 (Creator)', async () => {
        const response = await api.post('/auth/signup', TEST_USER_1);

        if (response.status !== 201 || !response.data?.success) {
            return {
                success: false,
                message: response.data?.message || `Signup failed with status ${response.status}`
            };
        }

        const data = response.data.data;
        user1Session = {
            userId: data.user.id,
            accessToken: data.session?.access_token || '',
            nexusSession: data.nexusSession || '',
            nexusGenesis: data.nexus?.genesis
        };

        return {
            success: true,
            message: 'User 1 created with Nexus wallet',
            data: { userId: user1Session.userId, nexusGenesis: user1Session.nexusGenesis }
        };
    });
}

async function testSignupUser2() {
    return runTest('Sign Up User 2 (Listener)', async () => {
        const response = await api.post('/auth/signup', TEST_USER_2);

        if (response.status !== 201 || !response.data?.success) {
            return {
                success: false,
                message: response.data?.message || `Signup failed with status ${response.status}`
            };
        }

        const data = response.data.data;
        user2Session = {
            userId: data.user.id,
            accessToken: data.session?.access_token || '',
            nexusSession: data.nexusSession || '',
            nexusGenesis: data.nexus?.genesis
        };

        return {
            success: true,
            message: 'User 2 created with Nexus wallet',
            data: { userId: user2Session.userId }
        };
    });
}

async function testLoginUser1() {
    return runTest('Login User 1', async () => {
        const response = await api.post('/auth/login', {
            email: TEST_USER_1.email,
            password: TEST_USER_1.password
        });

        if (response.status !== 200 || !response.data?.success) {
            return {
                success: false,
                message: response.data?.message || 'Login failed'
            };
        }

        const data = response.data.data;

        // Update session with fresh tokens
        if (user1Session) {
            user1Session.accessToken = data.session?.access_token || user1Session.accessToken;
            user1Session.nexusSession = data.nexusSession || user1Session.nexusSession;
        }

        return {
            success: true,
            message: 'Login successful with Nexus session',
            data: { hasNexusSession: !!data.nexusSession }
        };
    });
}

async function testMintAsset() {
    return runTest('Mint Audio Asset', async () => {
        if (!user1Session) {
            return { success: false, message: 'User 1 not logged in' };
        }

        // Create a simple test audio file (just bytes for testing)
        const testAudioBuffer = Buffer.from('RIFF....WAVEfmt test audio data for ORIA MVP testing');

        const formData = new FormData();
        formData.append('audio', testAudioBuffer, {
            filename: 'test-track.wav',
            contentType: 'audio/wav'
        });
        formData.append('title', `E2E Test Track ${timestamp}`);
        formData.append('artist', 'ORIA Test Suite');
        formData.append('description', 'Automated E2E test asset');
        formData.append('genre', 'Test');
        formData.append('price', '5');
        formData.append('isLimited', 'false');
        formData.append('userId', user1Session.userId);
        formData.append('nexusSession', user1Session.nexusSession);
        formData.append('nexusPin', TEST_USER_1.pin);

        const response = await api.post('/mint', formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${user1Session.accessToken}`
            },
            timeout: 120000 // 2 minute timeout for minting
        });

        if (response.status !== 201 || !response.data?.success) {
            return {
                success: false,
                message: response.data?.message || `Mint failed with status ${response.status}`
            };
        }

        const asset = response.data.data.asset;
        mintedAssetId = asset.id;
        mintedTxid = asset.nexus_txid;

        return {
            success: true,
            message: 'Asset minted successfully',
            data: {
                assetId: mintedAssetId,
                txid: mintedTxid,
                status: asset.status,
                nexusAddress: asset.nexus_address
            }
        };
    });
}

async function testGetMyAssets() {
    return runTest('Get User Assets', async () => {
        if (!user1Session) {
            return { success: false, message: 'User 1 not logged in' };
        }

        const response = await api.get(`/mint/my-assets?userId=${user1Session.userId}`, {
            headers: { 'Authorization': `Bearer ${user1Session.accessToken}` }
        });

        if (response.status !== 200 || !response.data?.success) {
            return {
                success: false,
                message: response.data?.message || 'Failed to get assets'
            };
        }

        const assets = response.data.data.assets;
        const hasTestAsset = assets.some((a: any) => a.id === mintedAssetId);

        return {
            success: hasTestAsset,
            message: hasTestAsset ? `Found ${assets.length} assets including test asset` : 'Test asset not found',
            data: { assetCount: assets.length }
        };
    });
}

async function testVerifyAsset() {
    return runTest('Verify Asset on Blockchain', async () => {
        if (!mintedAssetId) {
            return { success: false, message: 'No asset to verify' };
        }

        // Get asset details first
        const assetResponse = await api.get(`/mint/asset/${mintedAssetId}`);

        if (!assetResponse.data?.success) {
            return { success: false, message: 'Failed to get asset details' };
        }

        const asset = assetResponse.data.data.asset;

        if (!asset.nexus_address) {
            return { success: false, message: 'Asset has no blockchain address' };
        }

        // Verify on blockchain
        const verifyResponse = await api.get(`/mint/verify/${asset.nexus_address}`);

        return {
            success: verifyResponse.data?.success && verifyResponse.data?.data?.verified,
            message: verifyResponse.data?.data?.verified
                ? 'Asset verified on blockchain'
                : (verifyResponse.data?.data?.error || 'Verification pending'),
            data: verifyResponse.data?.data
        };
    });
}

async function testGetTransaction() {
    return runTest('Get Transaction by Hash', async () => {
        if (!mintedTxid) {
            return { success: false, message: 'No transaction to lookup' };
        }

        const response = await api.get(`/tx/${mintedTxid}`);

        if (response.status !== 200 || !response.data?.success) {
            return {
                success: false,
                message: response.data?.message || 'Transaction lookup failed'
            };
        }

        return {
            success: true,
            message: 'Transaction found',
            data: {
                type: response.data.data.type,
                status: response.data.data.status,
                confirmations: response.data.data.confirmations
            }
        };
    });
}

async function testTransferAsset() {
    return runTest('Transfer Asset to User 2', async () => {
        if (!user1Session || !user2Session || !mintedAssetId) {
            return { success: false, message: 'Missing session or asset for transfer' };
        }

        const response = await api.post('/mint/transfer', {
            assetId: mintedAssetId,
            userId: user1Session.userId,
            recipientUsername: TEST_USER_2.username,
            nexusSession: user1Session.nexusSession,
            nexusPin: TEST_USER_1.pin
        }, {
            headers: { 'Authorization': `Bearer ${user1Session.accessToken}` },
            timeout: 60000
        });

        if (response.status !== 200 || !response.data?.success) {
            return {
                success: false,
                message: response.data?.message || `Transfer failed with status ${response.status}`
            };
        }

        return {
            success: true,
            message: 'Asset transferred successfully',
            data: {
                transferId: response.data.data.transferId,
                txid: response.data.data.txid
            }
        };
    });
}

async function testVerifyTransfer() {
    return runTest('Verify Transfer (User 2 owns asset)', async () => {
        if (!user2Session || !mintedAssetId) {
            return { success: false, message: 'Missing session or asset' };
        }

        const response = await api.get(`/mint/my-assets?userId=${user2Session.userId}`, {
            headers: { 'Authorization': `Bearer ${user2Session.accessToken}` }
        });

        if (response.status !== 200 || !response.data?.success) {
            return {
                success: false,
                message: 'Failed to get user 2 assets'
            };
        }

        const assets = response.data.data.assets;
        const hasTransferredAsset = assets.some((a: any) => a.id === mintedAssetId);

        return {
            success: hasTransferredAsset,
            message: hasTransferredAsset
                ? 'Transfer verified - User 2 now owns the asset'
                : 'Transfer not yet reflected in User 2 library',
            data: { user2AssetCount: assets.length }
        };
    });
}

async function testDiscoverAssets() {
    return runTest('Discover Public Assets', async () => {
        const response = await api.get('/mint/discover?limit=10');

        if (response.status !== 200 || !response.data?.success) {
            return {
                success: false,
                message: 'Failed to discover assets'
            };
        }

        const assets = response.data.data.assets;

        return {
            success: true,
            message: `Found ${assets.length} public assets`,
            data: { assetCount: assets.length }
        };
    });
}

async function testLogout() {
    return runTest('Logout User 1', async () => {
        if (!user1Session) {
            return { success: true, message: 'No session to logout' };
        }

        const response = await api.post('/auth/logout', {}, {
            headers: { 'Authorization': `Bearer ${user1Session.accessToken}` }
        });

        return {
            success: response.data?.success !== false,
            message: 'Logout successful'
        };
    });
}

// ==================== MAIN TEST RUNNER ====================

async function runE2ETests() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║           ORIA MVP - End-to-End Test Suite                 ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`\nAPI: ${API_BASE_URL}`);
    console.log(`Time: ${new Date().toISOString()}\n`);

    const startTime = Date.now();

    // Test Groups
    log('PHASE 1: Server & Health Checks', 'step');
    await testServerHealth();

    log('PHASE 2: User Registration', 'step');
    const signup1Ok = await testSignupUser1();
    if (!signup1Ok) {
        log('Cannot proceed without User 1. Stopping tests.', 'error');
        printSummary(startTime);
        return;
    }

    // Wait for Nexus account confirmation
    log('Waiting 3s for blockchain confirmation...', 'info');
    await new Promise(r => setTimeout(r, 3000));

    await testSignupUser2();

    log('PHASE 3: Authentication', 'step');
    await testLoginUser1();

    log('PHASE 4: Asset Minting', 'step');
    const mintOk = await testMintAsset();

    if (mintOk) {
        // Wait for mint to process
        log('Waiting 3s for mint confirmation...', 'info');
        await new Promise(r => setTimeout(r, 3000));

        await testGetMyAssets();
        await testVerifyAsset();
        await testGetTransaction();
    }

    log('PHASE 5: Asset Transfer', 'step');
    if (mintOk && user2Session) {
        await testTransferAsset();

        // Wait for transfer to process
        log('Waiting 2s for transfer confirmation...', 'info');
        await new Promise(r => setTimeout(r, 2000));

        await testVerifyTransfer();
    } else {
        log('Skipping transfer tests (mint failed or user 2 not created)', 'warn');
    }

    log('PHASE 6: Discovery & Cleanup', 'step');
    await testDiscoverAssets();
    await testLogout();

    printSummary(startTime);
}

function printSummary(startTime: number) {
    const totalDuration = Date.now() - startTime;
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                     TEST SUMMARY                            ║');
    console.log('╠════════════════════════════════════════════════════════════╣');

    results.forEach(r => {
        const status = r.passed ? '✅ PASS' : '❌ FAIL';
        const name = r.name.substring(0, 35).padEnd(35);
        const time = `${r.duration}ms`.padStart(8);
        console.log(`║ ${status} │ ${name} │ ${time} ║`);
    });

    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║ Total: ${passed} passed, ${failed} failed │ Duration: ${totalDuration}ms`.padEnd(61) + '║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    if (failed === 0) {
        console.log('\n🎉 All E2E tests passed! Full flow working correctly.');
    } else {
        console.log(`\n⚠️  ${failed} test(s) failed. Review the output above.`);
    }

    // Exit with appropriate code
    process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runE2ETests().catch(err => {
    console.error('\n💥 Test suite crashed:', err.message);
    process.exit(1);
});
