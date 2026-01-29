/**
 * ORIA MVP - Blockchain Flow Test Script
 *
 * This script tests the core Nexus blockchain functionality:
 * 1. Create User Account (Sigchain)
 * 2. Login & Get Session
 * 3. Mint an Asset
 * 4. Verify Asset on Blockchain
 * 5. Create Second User
 * 6. Transfer Asset
 * 7. Verify Transfer
 *
 * Run with: npx tsx scripts/test-blockchain-flow.ts
 *
 * This bypasses Supabase and tests Nexus directly to prove core functionality works.
 */

import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const NEXUS_BASE_URL = process.env.NEXUS_BASE_URL || 'http://localhost:8080';
const timestamp = Date.now();

// Test users
const USER_1 = {
    username: `oriatest_creator_${timestamp}`,
    password: 'TestCreator123!',
    pin: '1234'
};

const USER_2 = {
    username: `oriatest_listener_${timestamp}`,
    password: 'TestListener456!',
    pin: '5678'
};

interface TestResult {
    step: string;
    status: 'PASS' | 'FAIL' | 'SKIP';
    message: string;
    data?: any;
    duration: number;
}

const results: TestResult[] = [];
let user1Session: string | null = null;
let user1Genesis: string | null = null;
let user2Session: string | null = null;
let user2Genesis: string | null = null;
let assetAddress: string | null = null;
let assetTxid: string | null = null;
let transferTxid: string | null = null;

// Create Nexus client
const nexus: AxiosInstance = axios.create({
    baseURL: NEXUS_BASE_URL,
    timeout: 60000,
    headers: { 'Content-Type': 'application/json' }
});

function log(message: string, type: 'info' | 'success' | 'error' | 'warn' | 'header' = 'info') {
    const colors = {
        info: '\x1b[37m',    // white
        success: '\x1b[32m', // green
        error: '\x1b[31m',   // red
        warn: '\x1b[33m',    // yellow
        header: '\x1b[36m'   // cyan
    };
    const reset = '\x1b[0m';
    const prefix = type === 'success' ? '✅ ' : type === 'error' ? '❌ ' : type === 'warn' ? '⚠️  ' : type === 'header' ? '\n📋 ' : '   ';
    console.log(`${colors[type]}${prefix}${message}${reset}`);
}

async function runStep(
    stepName: string,
    fn: () => Promise<{ success: boolean; message: string; data?: any }>
): Promise<boolean> {
    const start = Date.now();
    try {
        const result = await fn();
        const duration = Date.now() - start;

        results.push({
            step: stepName,
            status: result.success ? 'PASS' : 'FAIL',
            message: result.message,
            data: result.data,
            duration
        });

        if (result.success) {
            log(`${stepName} (${duration}ms)`, 'success');
            if (result.data) {
                Object.entries(result.data).forEach(([key, value]) => {
                    const displayValue = typeof value === 'string' && value.length > 40
                        ? value.substring(0, 40) + '...'
                        : value;
                    log(`  ${key}: ${displayValue}`, 'info');
                });
            }
        } else {
            log(`${stepName}: ${result.message}`, 'error');
        }
        return result.success;
    } catch (err: any) {
        const duration = Date.now() - start;
        const message = err.response?.data?.error?.message || err.message;
        results.push({
            step: stepName,
            status: 'FAIL',
            message,
            duration
        });
        log(`${stepName}: ${message}`, 'error');
        return false;
    }
}

// ============== TEST STEPS ==============

async function testNodeConnection(): Promise<boolean> {
    return runStep('1. Node Connection', async () => {
        const response = await nexus.get('/system/get/info');
        const info = response.data.result;

        if (!info) {
            return { success: false, message: 'Invalid response from node' };
        }

        return {
            success: true,
            message: 'Connected to Nexus node',
            data: {
                version: info.version,
                network: info.testnet ? 'TESTNET' : 'MAINNET',
                blocks: info.blocks,
                syncing: info.syncing ? 'Yes' : 'No'
            }
        };
    });
}

async function createUser1(): Promise<boolean> {
    return runStep('2. Create Creator Account', async () => {
        const response = await nexus.post('/profiles/create/master', {
            username: USER_1.username,
            password: USER_1.password,
            pin: USER_1.pin
        });

        const result = response.data.result;
        if (!result?.txid && !result?.success) {
            return { success: false, message: 'Account creation failed' };
        }

        return {
            success: true,
            message: 'Creator account created on blockchain',
            data: {
                username: USER_1.username,
                txid: result.txid
            }
        };
    });
}

async function loginUser1(): Promise<boolean> {
    return runStep('3. Login Creator', async () => {
        const response = await nexus.post('/sessions/create/local', {
            username: USER_1.username,
            password: USER_1.password,
            pin: USER_1.pin
        });

        const result = response.data.result;
        if (!result?.session) {
            return { success: false, message: response.data.error?.message || 'Login failed - no session returned' };
        }

        user1Session = result.session;
        user1Genesis = result.genesis;

        // Try to unlock session for transactions (may already be unlocked)
        try {
            await nexus.post('/sessions/unlock/local', {
                session: user1Session,
                pin: USER_1.pin
            });
        } catch (err: any) {
            // Ignore unlock errors - session might already be unlocked
            log(`  Unlock note: ${err.response?.data?.error?.message || 'already unlocked'}`, 'info');
        }

        return {
            success: true,
            message: 'Creator logged in with active session',
            data: {
                session: user1Session?.substring(0, 20) + '...',
                genesis: user1Genesis?.substring(0, 20) + '...'
            }
        };
    });
}

async function mintAsset(): Promise<boolean> {
    return runStep('4. Mint Audio Asset', async () => {
        if (!user1Session) {
            return { success: false, message: 'No session available' };
        }

        const assetName = `ORIA_TEST_TRACK_${timestamp}`;

        const response = await nexus.post('/assets/create/asset', {
            session: user1Session,
            pin: USER_1.pin,
            name: assetName,
            format: 'JSON',
            json: [
                { name: 'title', type: 'string', value: 'Test Track', mutable: false },
                { name: 'artist', type: 'string', value: 'ORIA Test Suite', mutable: false },
                { name: 'description', type: 'string', value: 'Automated test asset', mutable: false },
                { name: 'genre', type: 'string', value: 'Electronic', mutable: false },
                { name: 'price', type: 'string', value: '10', mutable: true },
                { name: 'audio_url', type: 'string', value: 'https://storage.example.com/test.mp3', mutable: false },
                { name: 'cover_url', type: 'string', value: '-', mutable: false },
                { name: 'type', type: 'string', value: 'audio', mutable: false },
                { name: 'app', type: 'string', value: 'ORIA', mutable: false },
                { name: 'created_at', type: 'string', value: new Date().toISOString(), mutable: false }
            ]
        });

        const result = response.data.result;
        if (!result?.address || !result?.txid) {
            return {
                success: false,
                message: response.data.error?.message || 'Mint failed - no address returned'
            };
        }

        assetAddress = result.address;
        assetTxid = result.txid;

        return {
            success: true,
            message: 'Asset minted successfully on blockchain!',
            data: {
                name: assetName,
                address: assetAddress,
                txid: assetTxid
            }
        };
    });
}

async function verifyAsset(): Promise<boolean> {
    return runStep('5. Verify Asset on Blockchain', async () => {
        if (!assetAddress) {
            return { success: false, message: 'No asset address to verify' };
        }

        const response = await nexus.get('/assets/get/asset', {
            params: { address: assetAddress }
        });

        const result = response.data.result;
        if (!result) {
            return { success: false, message: 'Asset not found on blockchain' };
        }

        return {
            success: true,
            message: 'Asset verified on blockchain!',
            data: {
                owner: result.owner?.substring(0, 20) + '...',
                name: result.name,
                address: result.address?.substring(0, 20) + '...'
            }
        };
    });
}

async function createUser2(): Promise<boolean> {
    return runStep('6. Create Listener Account', async () => {
        const response = await nexus.post('/profiles/create/master', {
            username: USER_2.username,
            password: USER_2.password,
            pin: USER_2.pin
        });

        const result = response.data.result;
        if (!result?.txid && !result?.success) {
            return { success: false, message: 'Account creation failed' };
        }

        return {
            success: true,
            message: 'Listener account created on blockchain',
            data: {
                username: USER_2.username,
                txid: result.txid
            }
        };
    });
}

async function loginUser2(): Promise<boolean> {
    return runStep('7. Login Listener', async () => {
        const response = await nexus.post('/sessions/create/local', {
            username: USER_2.username,
            password: USER_2.password,
            pin: USER_2.pin
        });

        const result = response.data.result;
        if (!result?.session) {
            return { success: false, message: 'Login failed' };
        }

        user2Session = result.session;
        user2Genesis = result.genesis;

        return {
            success: true,
            message: 'Listener logged in',
            data: {
                session: user2Session?.substring(0, 20) + '...',
                genesis: user2Genesis?.substring(0, 20) + '...'
            }
        };
    });
}

async function transferAsset(): Promise<boolean> {
    return runStep('8. Transfer Asset to Listener', async () => {
        if (!user1Session || !assetAddress) {
            return { success: false, message: 'Missing session or asset' };
        }
        if (!user2Genesis) {
            return { success: false, message: 'Missing listener genesis ID' };
        }

        // Transfer using username as recipient
        const response = await nexus.post('/assets/transfer/asset', {
            session: user1Session,
            pin: USER_1.pin,
            address: assetAddress,
            recipient: USER_2.username  // Use username as recipient
        });

        const result = response.data.result;
        if (!result?.txid) {
            return {
                success: false,
                message: response.data.error?.message || 'Transfer failed'
            };
        }

        transferTxid = result.txid;

        return {
            success: true,
            message: 'Asset transferred to Listener!',
            data: {
                from: USER_1.username,
                to: `${USER_2.username} (${user2Genesis?.substring(0, 16)}...)`,
                txid: transferTxid
            }
        };
    });
}

async function claimTransfer(): Promise<boolean> {
    return runStep('9. Claim Transfer (Recipient)', async () => {
        if (!user2Session || !transferTxid) {
            return { success: false, message: 'Missing session or transfer txid' };
        }

        // Recipient claims the incoming transfer
        const response = await nexus.post('/assets/claim/asset', {
            session: user2Session,
            pin: USER_2.pin,
            txid: transferTxid
        });

        const result = response.data.result;
        if (!result?.txid) {
            // If claim fails with "no notifications", the transfer may have been auto-claimed
            // or already processed
            const errorMsg = response.data.error?.message || 'Claim failed';
            if (errorMsg.includes('notification') || errorMsg.includes('nothing to claim')) {
                return {
                    success: true,
                    message: 'Transfer auto-claimed or already processed',
                    data: { note: 'No explicit claim needed' }
                };
            }
            return { success: false, message: errorMsg };
        }

        return {
            success: true,
            message: 'Transfer claimed by recipient!',
            data: {
                claimTxid: result.txid
            }
        };
    });
}

async function verifyTransfer(): Promise<boolean> {
    return runStep('10. Verify New Ownership', async () => {
        if (!assetAddress || !user2Genesis) {
            return { success: false, message: 'Missing asset or user data' };
        }

        const response = await nexus.get('/assets/get/asset', {
            params: { address: assetAddress }
        });

        const result = response.data.result;
        if (!result) {
            return { success: false, message: 'Asset not found' };
        }

        const newOwner = result.owner;
        const ownershipTransferred = newOwner === user2Genesis;

        return {
            success: ownershipTransferred,
            message: ownershipTransferred
                ? 'Ownership successfully transferred to Listener!'
                : 'Transfer initiated (awaiting claim confirmation)',
            data: {
                asset: assetAddress?.substring(0, 20) + '...',
                currentOwner: newOwner?.substring(0, 20) + '...',
                status: ownershipTransferred ? 'COMPLETE' : 'PENDING_CLAIM'
            }
        };
    });
}

async function getTransaction(): Promise<boolean> {
    return runStep('11. Verify Transaction on Ledger', async () => {
        if (!assetTxid) {
            return { success: false, message: 'No transaction to verify' };
        }

        const response = await nexus.get('/ledger/get/transaction', {
            params: { hash: assetTxid }
        });

        const result = response.data.result;
        if (!result) {
            return { success: false, message: 'Transaction not found' };
        }

        return {
            success: true,
            message: 'Transaction verified on ledger!',
            data: {
                txid: assetTxid?.substring(0, 20) + '...',
                confirmations: result.confirmations || 0,
                type: result.type
            }
        };
    });
}

// ============== MAIN ==============

async function runTests() {
    console.log('\n');
    console.log('\x1b[36m╔══════════════════════════════════════════════════════════════╗\x1b[0m');
    console.log('\x1b[36m║     ORIA MVP - Blockchain Flow Test                          ║\x1b[0m');
    console.log('\x1b[36m║     Testing: Mint & Transfer on Nexus Blockchain             ║\x1b[0m');
    console.log('\x1b[36m╚══════════════════════════════════════════════════════════════╝\x1b[0m');
    console.log(`\n   Nexus Node: ${NEXUS_BASE_URL}`);
    console.log(`   Timestamp: ${new Date().toISOString()}\n`);

    const startTime = Date.now();

    // Step 1: Connect to node
    log('PHASE 1: CONNECTION', 'header');
    const nodeOk = await testNodeConnection();
    if (!nodeOk) {
        log('Cannot connect to Nexus node. Stopping.', 'error');
        printSummary(startTime);
        return;
    }

    // Step 2-3: Create and login creator
    log('PHASE 2: CREATOR ACCOUNT', 'header');
    const user1Created = await createUser1();
    if (!user1Created) {
        log('Creator account creation failed. Stopping.', 'error');
        printSummary(startTime);
        return;
    }

    log('Waiting 15s for account confirmation on blockchain...', 'warn');
    await sleep(15000);

    const user1LoggedIn = await loginUser1();
    if (!user1LoggedIn) {
        log('Creator login failed. Stopping.', 'error');
        printSummary(startTime);
        return;
    }

    // Wait for session to fully initialize
    log('Waiting 5s for session initialization...', 'warn');
    await sleep(5000);

    // Step 4-5: Mint and verify
    log('PHASE 3: MINT ASSET', 'header');
    const minted = await mintAsset();
    if (!minted) {
        log('Minting failed. Stopping.', 'error');
        printSummary(startTime);
        return;
    }

    log('Waiting 5s for mint confirmation...', 'warn');
    await sleep(5000);

    await verifyAsset();

    // Step 6-7: Create and login listener
    log('PHASE 4: LISTENER ACCOUNT', 'header');
    const user2Created = await createUser2();
    if (!user2Created) {
        log('Listener account creation failed. Skipping transfer.', 'warn');
        printSummary(startTime);
        return;
    }

    // Wait for a new block to confirm the listener account on the blockchain
    const blockBefore = await getCurrentBlock();
    log(`Current block: ${blockBefore}. Waiting for next block to confirm account...`, 'warn');
    const blockAfter = await waitForNewBlock(blockBefore, 120000); // Wait up to 2 minutes
    if (blockAfter > blockBefore) {
        log(`New block mined: ${blockAfter}. Account should be confirmed.`, 'success');
    } else {
        log(`Timeout waiting for block. Attempting anyway...`, 'warn');
    }

    await loginUser2();

    // Wait for another block to ensure listener is fully registered
    const blockAfterLogin = await getCurrentBlock();
    log(`After login block: ${blockAfterLogin}. Waiting for one more confirmation...`, 'warn');
    const blockFinal = await waitForNewBlock(blockAfterLogin, 120000);
    if (blockFinal > blockAfterLogin) {
        log(`Block ${blockFinal} mined. Proceeding with transfer.`, 'success');
    }

    // Step 8-9: Transfer and verify
    log('PHASE 5: TRANSFER ASSET', 'header');
    const transferred = await transferAsset();

    if (transferred) {
        // Wait for transfer to be confirmed in a new block
        const blockAfterTransfer = await getCurrentBlock();
        log(`Waiting for block confirmation of transfer (current: ${blockAfterTransfer})...`, 'warn');
        const blockConfirmed = await waitForNewBlock(blockAfterTransfer, 120000);
        if (blockConfirmed > blockAfterTransfer) {
            log(`Transfer confirmed in block ${blockConfirmed}.`, 'success');
        }

        // Recipient claims the transfer
        await claimTransfer();

        // Wait for claim to be confirmed
        log('Waiting for claim confirmation...', 'warn');
        await sleep(5000);

        // Verify ownership
        await verifyTransfer();
    }

    // Step 11: Verify transaction
    log('PHASE 6: TRANSACTION VERIFICATION', 'header');
    await getTransaction();

    printSummary(startTime);
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForNewBlock(currentBlock: number, maxWaitMs: number = 90000): Promise<number> {
    const startTime = Date.now();
    const checkInterval = 5000; // Check every 5 seconds

    while (Date.now() - startTime < maxWaitMs) {
        try {
            const response = await nexus.get('/system/get/info');
            const newBlock = response.data.result?.blocks;
            if (newBlock && newBlock > currentBlock) {
                return newBlock;
            }
        } catch (e) {
            // Ignore and retry
        }
        await sleep(checkInterval);
    }
    return currentBlock; // Return same block if timeout
}

async function getCurrentBlock(): Promise<number> {
    try {
        const response = await nexus.get('/system/get/info');
        return response.data.result?.blocks || 0;
    } catch (e) {
        return 0;
    }
}

function printSummary(startTime: number) {
    const totalDuration = Date.now() - startTime;
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const skipped = results.filter(r => r.status === 'SKIP').length;

    console.log('\n');
    console.log('\x1b[36m╔══════════════════════════════════════════════════════════════╗\x1b[0m');
    console.log('\x1b[36m║                      TEST SUMMARY                             ║\x1b[0m');
    console.log('\x1b[36m╠══════════════════════════════════════════════════════════════╣\x1b[0m');

    results.forEach(r => {
        const statusColor = r.status === 'PASS' ? '\x1b[32m' : r.status === 'FAIL' ? '\x1b[31m' : '\x1b[33m';
        const status = r.status === 'PASS' ? '✅ PASS' : r.status === 'FAIL' ? '❌ FAIL' : '⏭️ SKIP';
        const step = r.step.padEnd(35);
        const time = `${r.duration}ms`.padStart(8);
        console.log(`\x1b[36m║\x1b[0m ${statusColor}${status}\x1b[0m │ ${step} │ ${time} \x1b[36m║\x1b[0m`);
    });

    console.log('\x1b[36m╠══════════════════════════════════════════════════════════════╣\x1b[0m');
    console.log(`\x1b[36m║\x1b[0m Results: \x1b[32m${passed} passed\x1b[0m, \x1b[31m${failed} failed\x1b[0m, \x1b[33m${skipped} skipped\x1b[0m`.padEnd(70) + `\x1b[36m║\x1b[0m`);
    console.log(`\x1b[36m║\x1b[0m Total Duration: ${totalDuration}ms`.padEnd(62) + `\x1b[36m║\x1b[0m`);
    console.log('\x1b[36m╚══════════════════════════════════════════════════════════════╝\x1b[0m');

    if (failed === 0 && passed > 0) {
        console.log('\n\x1b[32m🎉 ALL BLOCKCHAIN TESTS PASSED!\x1b[0m');
        console.log('\x1b[32m   ✓ Account creation works\x1b[0m');
        console.log('\x1b[32m   ✓ Session management works\x1b[0m');
        console.log('\x1b[32m   ✓ Asset minting works\x1b[0m');
        console.log('\x1b[32m   ✓ Asset transfer works\x1b[0m');
        console.log('\x1b[32m   ✓ Blockchain verification works\x1b[0m');
        console.log('\n\x1b[33m   Note: Supabase integration is separate from blockchain.\x1b[0m');
        console.log('\x1b[33m   The core Nexus functionality is fully operational!\x1b[0m');
    } else if (passed > 0) {
        console.log('\n\x1b[33m⚠️  Some tests passed. Core functionality may be working.\x1b[0m');
    } else {
        console.log('\n\x1b[31m❌ Tests failed. Check Nexus node connection.\x1b[0m');
    }

    // Print key data for reference
    if (assetAddress || assetTxid) {
        console.log('\n\x1b[36m📦 Created Asset:\x1b[0m');
        if (assetAddress) console.log(`   Address: ${assetAddress}`);
        if (assetTxid) console.log(`   Mint TX: ${assetTxid}`);
        if (transferTxid) console.log(`   Transfer TX: ${transferTxid}`);
    }

    console.log('\n');
    process.exit(failed > 0 ? 1 : 0);
}

// Run
runTests().catch(err => {
    console.error('\n💥 Test crashed:', err.message);
    process.exit(1);
});
