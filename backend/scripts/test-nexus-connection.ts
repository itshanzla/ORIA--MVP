/**
 * Nexus Testnet Connection Verification Script
 *
 * Run with: npx tsx scripts/test-nexus-connection.ts
 *
 * This script verifies:
 * 1. Node connectivity
 * 2. Account creation (sigchain)
 * 3. Login/session
 * 4. Asset registration (mint)
 * 5. Asset transfer
 */

import axios, { AxiosError } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const NEXUS_BASE_URL = process.env.NEXUS_BASE_URL || 'http://localhost:8080';

// Test credentials (for testnet only!)
const TEST_USER_1 = {
  username: `oriatest_${Date.now()}`,
  password: 'TestPassword123!',
  pin: '1234'
};

const TEST_USER_2 = {
  username: `oriatest2_${Date.now()}`,
  password: 'TestPassword456!',
  pin: '5678'
};

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  data?: any;
}

const results: TestResult[] = [];

function log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') {
  const prefix = {
    info: '   ',
    success: ' ✅ ',
    error: ' ❌ ',
    warn: ' ⚠️  '
  };
  console.log(`${prefix[type]}${message}`);
}

async function testNodeConnection(): Promise<boolean> {
  console.log('\n━━━ Test 1: Node Connection ━━━');

  try {
    const response = await axios.get(`${NEXUS_BASE_URL}/system/get/info`, {
      timeout: 10000
    });

    const info = response.data.result;

    if (!info) {
      log('Invalid response from node', 'error');
      results.push({ name: 'Node Connection', passed: false, message: 'Invalid response' });
      return false;
    }

    log(`Version: ${info.version}`, 'info');
    log(`Testnet: ${info.testnet}`, 'info');
    log(`Syncing: ${info.syncing}`, 'info');
    log(`Blocks: ${info.blocks}`, 'info');

    if (!info.testnet) {
      log('WARNING: Node is NOT on testnet!', 'warn');
      results.push({ name: 'Node Connection', passed: false, message: 'Not on testnet' });
      return false;
    }

    if (info.syncing) {
      log('WARNING: Node is still syncing', 'warn');
    }

    log('Node connection successful', 'success');
    results.push({ name: 'Node Connection', passed: true, message: 'Connected to testnet', data: info });
    return true;

  } catch (error) {
    const err = error as AxiosError;
    log(`Failed to connect: ${err.message}`, 'error');
    results.push({ name: 'Node Connection', passed: false, message: err.message });
    return false;
  }
}

async function testAccountCreation(): Promise<{ genesis: string; txid: string } | null> {
  console.log('\n━━━ Test 2: Account Creation (Sigchain) ━━━');

  try {
    log(`Creating user: ${TEST_USER_1.username}`, 'info');

    const response = await axios.post(`${NEXUS_BASE_URL}/profiles/create/master`, {
      username: TEST_USER_1.username,
      password: TEST_USER_1.password,
      pin: TEST_USER_1.pin
    }, { timeout: 30000 });

    const result = response.data.result || response.data;

    if (!result?.txid && !result?.success) {
      log('Invalid response - missing txid', 'error');
      results.push({ name: 'Account Creation', passed: false, message: 'Invalid response' });
      return null;
    }

    log(`TxID: ${result.txid || 'created'}`, 'info');
    log('Account created successfully', 'success');

    results.push({ name: 'Account Creation', passed: true, message: 'Sigchain created', data: result });
    return { genesis: result.genesis || 'pending', txid: result.txid };

  } catch (error) {
    const err = error as AxiosError<any>;
    const errMsg = err.response?.data?.error?.message || err.message;
    log(`Failed: ${errMsg}`, 'error');
    results.push({ name: 'Account Creation', passed: false, message: errMsg });
    return null;
  }
}

async function testLogin(): Promise<string | null> {
  console.log('\n━━━ Test 3: Login & Session ━━━');

  try {
    log(`Logging in as: ${TEST_USER_1.username}`, 'info');

    const response = await axios.post(`${NEXUS_BASE_URL}/sessions/create/local`, {
      username: TEST_USER_1.username,
      password: TEST_USER_1.password,
      pin: TEST_USER_1.pin
    }, { timeout: 15000 });

    const result = response.data.result;

    if (!result?.session) {
      log('Invalid response - missing session', 'error');
      results.push({ name: 'Login', passed: false, message: 'No session token' });
      return null;
    }

    log(`Session: ${result.session.substring(0, 20)}...`, 'info');
    log(`Genesis: ${result.genesis}`, 'info');
    log('Login successful', 'success');

    results.push({ name: 'Login', passed: true, message: 'Session obtained', data: { genesis: result.genesis } });
    return result.session;

  } catch (error) {
    const err = error as AxiosError<any>;
    const errMsg = err.response?.data?.error?.message || err.message;
    log(`Failed: ${errMsg}`, 'error');
    results.push({ name: 'Login', passed: false, message: errMsg });
    return null;
  }
}

async function testAssetMint(session: string): Promise<{ address: string; txid: string } | null> {
  console.log('\n━━━ Test 4: Asset Registration (Mint) ━━━');

  const assetName = `ORIA_TEST_${Date.now()}`;

  try {
    log(`Creating asset: ${assetName}`, 'info');

    const response = await axios.post(`${NEXUS_BASE_URL}/assets/create/asset`, {
      session,
      pin: TEST_USER_1.pin,
      name: assetName,
      format: 'JSON',
      json: [
        { name: 'title', type: 'string', value: 'Test Track', mutable: false },
        { name: 'artist', type: 'string', value: 'ORIA Test Suite', mutable: false },
        { name: 'type', type: 'string', value: 'audio', mutable: false },
        { name: 'app', type: 'string', value: 'ORIA', mutable: false }
      ]
    }, { timeout: 30000 });

    const result = response.data.result;

    if (!result?.address || !result?.txid) {
      log('Invalid response - missing address or txid', 'error');
      results.push({ name: 'Asset Mint', passed: false, message: 'Invalid response' });
      return null;
    }

    log(`Address: ${result.address}`, 'info');
    log(`TxID: ${result.txid}`, 'info');
    log('Asset minted successfully', 'success');

    results.push({ name: 'Asset Mint', passed: true, message: 'Asset created on blockchain', data: result });
    return result;

  } catch (error) {
    const err = error as AxiosError<any>;
    const errMsg = err.response?.data?.error?.message || err.message;
    log(`Failed: ${errMsg}`, 'error');
    results.push({ name: 'Asset Mint', passed: false, message: errMsg });
    return null;
  }
}

async function createSecondUser(): Promise<string | null> {
  console.log('\n━━━ Test 5a: Create Second User for Transfer ━━━');

  try {
    // Create second user
    log(`Creating second user: ${TEST_USER_2.username}`, 'info');

    await axios.post(`${NEXUS_BASE_URL}/profiles/create/master`, {
      username: TEST_USER_2.username,
      password: TEST_USER_2.password,
      pin: TEST_USER_2.pin
    }, { timeout: 30000 });

    log('Second user created', 'success');
    return TEST_USER_2.username;

  } catch (error) {
    const err = error as AxiosError<any>;
    const errMsg = err.response?.data?.error?.message || err.message;
    log(`Failed: ${errMsg}`, 'error');
    return null;
  }
}

async function testAssetTransfer(session: string, assetAddress: string, toUsername: string): Promise<boolean> {
  console.log('\n━━━ Test 5b: Asset Transfer ━━━');

  try {
    log(`Transferring asset to: ${toUsername}`, 'info');

    const response = await axios.post(`${NEXUS_BASE_URL}/assets/transfer/asset`, {
      session,
      pin: TEST_USER_1.pin,
      address: assetAddress,
      recipient: toUsername
    }, { timeout: 30000 });

    const result = response.data.result;

    if (!result?.txid) {
      log('Invalid response - missing txid', 'error');
      results.push({ name: 'Asset Transfer', passed: false, message: 'Invalid response' });
      return false;
    }

    log(`Transfer TxID: ${result.txid}`, 'info');
    log('Asset transferred successfully', 'success');

    results.push({ name: 'Asset Transfer', passed: true, message: 'Ownership transferred', data: result });
    return true;

  } catch (error) {
    const err = error as AxiosError<any>;
    const errMsg = err.response?.data?.error?.message || err.message;
    log(`Failed: ${errMsg}`, 'error');
    results.push({ name: 'Asset Transfer', passed: false, message: errMsg });
    return false;
  }
}

async function testAssetVerification(assetAddress: string): Promise<boolean> {
  console.log('\n━━━ Test 6: Asset Verification ━━━');

  try {
    log(`Verifying asset: ${assetAddress}`, 'info');

    const response = await axios.get(`${NEXUS_BASE_URL}/assets/get/asset`, {
      params: { address: assetAddress },
      timeout: 15000
    });

    const result = response.data.result;

    if (!result) {
      log('Asset not found', 'error');
      results.push({ name: 'Asset Verification', passed: false, message: 'Asset not found' });
      return false;
    }

    log(`Owner: ${result.owner}`, 'info');
    log(`Name: ${result.name}`, 'info');
    log('Asset verified on blockchain', 'success');

    results.push({ name: 'Asset Verification', passed: true, message: 'Asset exists on chain', data: result });
    return true;

  } catch (error) {
    const err = error as AxiosError<any>;
    const errMsg = err.response?.data?.error?.message || err.message;
    log(`Failed: ${errMsg}`, 'error');
    results.push({ name: 'Asset Verification', passed: false, message: errMsg });
    return false;
  }
}

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     ORIA - Nexus Testnet Connection Verification       ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`\nTarget: ${NEXUS_BASE_URL}`);
  console.log(`Time: ${new Date().toISOString()}`);

  // Test 1: Node Connection
  const nodeOk = await testNodeConnection();
  if (!nodeOk) {
    console.log('\n🛑 Stopping tests - Node not accessible');
    printSummary();
    return;
  }

  // Test 2: Account Creation
  const account = await testAccountCreation();
  if (!account) {
    console.log('\n🛑 Stopping tests - Account creation failed');
    printSummary();
    return;
  }

  // Wait for transaction to confirm
  console.log('\n⏳ Waiting 5 seconds for transaction confirmation...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Test 3: Login
  const session = await testLogin();
  if (!session) {
    console.log('\n🛑 Stopping tests - Login failed');
    printSummary();
    return;
  }

  // Wait for session to fully initialize
  console.log('\n⏳ Waiting 10 seconds for session initialization...');
  await new Promise(resolve => setTimeout(resolve, 10000));

  // Test 4: Asset Mint
  const asset = await testAssetMint(session);
  if (!asset) {
    console.log('\n🛑 Stopping tests - Minting failed');
    printSummary();
    return;
  }

  // Wait for mint transaction
  console.log('\n⏳ Waiting 5 seconds for mint confirmation...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Test 5: Asset Transfer
  const secondUser = await createSecondUser();
  if (secondUser) {
    console.log('\n⏳ Waiting 10 seconds for second user confirmation...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    await testAssetTransfer(session, asset.address, secondUser);
  }

  // Test 6: Verify Asset
  await testAssetVerification(asset.address);

  printSummary();
}

function printSummary() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║                    TEST SUMMARY                        ║');
  console.log('╠════════════════════════════════════════════════════════╣');

  let passed = 0;
  let failed = 0;

  results.forEach(r => {
    const status = r.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`║ ${status} │ ${r.name.padEnd(20)} │ ${r.message.substring(0, 20).padEnd(20)} ║`);
    if (r.passed) passed++;
    else failed++;
  });

  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║ Total: ${passed} passed, ${failed} failed ${' '.repeat(32)}║`);
  console.log('╚════════════════════════════════════════════════════════╝');

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Nexus Testnet integration is ready.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the configuration.');
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test suite crashed:', err);
  process.exit(1);
});
