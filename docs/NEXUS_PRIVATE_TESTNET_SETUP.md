# ORIA - Nexus Private Testnet Setup Guide

## Your Own Blockchain - Complete A-to-Z Setup

**Last Updated**: December 2024
**Author**: ORIA Development Team
**Purpose**: Set up your own private Nexus blockchain for ORIA MVP development and testing

---

## Table of Contents

1. [What is a Private Testnet?](#what-is-a-private-testnet)
2. [What You'll Get After Setup](#what-youll-get-after-setup)
3. [Prerequisites](#prerequisites)
4. [Part 1: Install WSL2 on Windows](#part-1-install-wsl2-on-windows)
5. [Part 2: Install Ubuntu 20.04](#part-2-install-ubuntu-2004)
6. [Part 3: Fix DNS (Important!)](#part-3-fix-dns-important)
7. [Part 4: Install Build Dependencies](#part-4-install-build-dependencies)
8. [Part 5: Download and Compile Nexus](#part-5-download-and-compile-nexus)
9. [Part 6: Configure Private Testnet](#part-6-configure-private-testnet)
10. [Part 7: Start Your Blockchain](#part-7-start-your-blockchain)
11. [Part 8: Start Mining (Generate Blocks & Coins)](#part-8-start-mining-generate-blocks--coins)
12. [Part 9: Create Platform Wallet](#part-9-create-platform-wallet)
13. [Part 10: Network Access Setup](#part-10-network-access-setup)
14. [Part 11: Connect ORIA Backend](#part-11-connect-oria-backend)
15. [Part 12: Run Verification Tests](#part-12-run-verification-tests)
16. [Part 13: Daily Operations](#part-13-daily-operations)
17. [Part 14: Client Remote Access (Phase 2)](#part-14-client-remote-access-phase-2)
18. [Troubleshooting](#troubleshooting)
19. [Quick Reference](#quick-reference)

---

## What is a Private Testnet?

A **Private Testnet** is your own personal Nexus blockchain that:

| Feature | Description |
|---------|-------------|
| **Isolated** | Runs independently - not connected to public Nexus network |
| **Self-contained** | You mine your own blocks and generate your own test coins |
| **Full functionality** | Works exactly like the real Nexus blockchain |
| **Your control** | Start, stop, reset anytime |
| **Client accessible** | Can be exposed to internet for client testing |

### Why Private Testnet for ORIA?

1. **Public testnet seed nodes are offline** - The official `testnet1.nexus-interactions.io` etc. don't resolve
2. **No external dependencies** - Your blockchain works whenever your laptop is on
3. **Unlimited test coins** - Mine as many as you need
4. **Faster development** - No waiting for external network
5. **Same code path** - Zero changes needed when switching to mainnet later

---

## What You'll Get After Setup

```
┌─────────────────────────────────────────────────────────────────┐
│                    YOUR PRIVATE BLOCKCHAIN                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Windows Laptop (WSL2 + Ubuntu)                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Nexus Private Testnet Node                                │ │
│  │  ├── Your own blockchain (blocks you mine)                 │ │
│  │  ├── Your own test NXS coins (unlimited)                   │ │
│  │  ├── API endpoint: http://<laptop-ip>:7080                 │ │
│  │  └── Full sigchain/asset/transfer support                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  ORIA Backend connects here                                │ │
│  │  - Create user accounts (sigchains)                        │ │
│  │  - Mint audio NFTs (assets)                                │ │
│  │  - Transfer ownership                                       │ │
│  │  - All on REAL blockchain (just private)                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

After completing this guide:

| Component | Details |
|-----------|---------|
| **Private Nexus Node** | Running on your Windows laptop via WSL2 |
| **Your Own Blockchain** | Mining blocks every ~10 seconds |
| **Test NXS Coins** | Generated by mining - unlimited supply |
| **Platform Wallet** | `oria_platform` with coins for fees |
| **API Endpoint** | `http://<laptop-ip>:7080` |
| **Working ORIA App** | Connected to real blockchain operations |

---

## Prerequisites

### Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **RAM** | 2GB | 4GB+ |
| **Storage** | 20GB free | 50GB free |
| **CPU** | 2 cores | 4+ cores |

### Software Requirements

- Windows 10 (version 2004+) or Windows 11
- Administrator access on the laptop
- Stable internet (for initial setup only)

### Time Required

| Phase | Time |
|-------|------|
| WSL2 + Ubuntu setup | 15-20 minutes |
| Compile Nexus | 15-45 minutes |
| Configuration | 10 minutes |
| First blocks | 5 minutes |
| **Total** | ~1-1.5 hours |

---

## Part 1: Install WSL2 on Windows

### Step 1.1: Open PowerShell as Administrator

1. Click Windows Start button
2. Type `PowerShell`
3. Right-click "Windows PowerShell"
4. Click "Run as administrator"
5. Click "Yes" when prompted

### Step 1.2: Install WSL

```powershell
wsl --install
```

Wait for completion.

### Step 1.3: Restart Computer

**You MUST restart!**

1. Save all work
2. Click Start → Power → Restart

### Step 1.4: Verify WSL (After Restart)

Open PowerShell as Administrator:

```powershell
wsl --version
```

You should see:
```
WSL version: 2.x.x
Kernel version: 5.15.x
```

If error, run: `wsl --update`

---

## Part 2: Install Ubuntu 20.04

### Step 2.1: Install Ubuntu 20.04

**IMPORTANT**: Use 20.04, NOT 22.04 (OpenSSL compatibility issue)

```powershell
wsl --install -d Ubuntu-20.04
```

Wait 5-10 minutes for download.

### Step 2.2: Create User Account

Ubuntu will open and ask for:

```
Enter new UNIX username:
```

1. Type a username (lowercase, no spaces): `oria`
2. Press Enter
3. Type a password (invisible while typing)
4. Press Enter
5. Re-type password
6. Press Enter

### Step 2.3: Save Your Credentials!

Write these down:

| Item | Your Value |
|------|------------|
| Ubuntu Username | _______________ |
| Ubuntu Password | _______________ |

### Step 2.4: Update Ubuntu

```bash
sudo apt update && sudo apt upgrade -y
```

Enter password when asked. Wait for completion (5-10 min).

---

## Part 3: Fix DNS (Important!)

WSL2 often has DNS issues. Let's fix it first.

### Step 3.1: Set Google DNS

```bash
sudo rm -f /etc/resolv.conf
sudo bash -c 'echo "nameserver 8.8.8.8" > /etc/resolv.conf'
sudo bash -c 'echo "nameserver 8.8.4.4" >> /etc/resolv.conf'
```

### Step 3.2: Prevent WSL from Overwriting

```bash
sudo bash -c 'echo "[network]" > /etc/wsl.conf'
sudo bash -c 'echo "generateResolvConf = false" >> /etc/wsl.conf'
```

### Step 3.3: Make DNS File Immutable

```bash
sudo chattr +i /etc/resolv.conf
```

### Step 3.4: Test DNS

```bash
ping -c 3 google.com
```

Should show responses. If not, restart WSL:

1. Exit Ubuntu: `exit`
2. In PowerShell: `wsl --shutdown`
3. Wait 5 seconds
4. Open Ubuntu again
5. Retry ping

---

## Part 4: Install Build Dependencies

### Step 4.1: Install All Required Packages

```bash
sudo apt-get install -y build-essential libssl-dev libdb-dev libdb++-dev libminiupnpc-dev git pkg-config
```

Wait for completion.

### Step 4.2: Verify Installation

```bash
g++ --version
```

Should show: `g++ (Ubuntu 9.x.x) 9.x.x`

---

## Part 5: Download and Compile Nexus

### Step 5.1: Go to Home Directory

```bash
cd ~
```

### Step 5.2: Clone Nexus Repository

```bash
git clone --branch merging https://github.com/Nexusoft/LLL-TAO
```

Wait for download.

### Step 5.3: Enter Directory

```bash
cd LLL-TAO
```

### Step 5.4: Clean Previous Builds

```bash
make -f makefile.cli clean
```

### Step 5.5: Compile Nexus

**This takes 15-45 minutes. Be patient!**

```bash
make -f makefile.cli -j4 AMD64=1 NO_WALLET=1
```

You'll see lots of output. Wait until you see the prompt again.

### Step 5.6: Verify Compilation

```bash
ls -la nexus
```

Should show the nexus executable file. If "No such file", compilation failed - check [Troubleshooting](#troubleshooting).

---

## Part 6: Configure Private Testnet

### Step 6.1: Remove Old Data (Fresh Start)

```bash
rm -rf ~/.Nexus
```

### Step 6.2: Create Config Directory

```bash
mkdir -p ~/.Nexus
```

### Step 6.3: Create Configuration File

```bash
nano ~/.Nexus/nexus.conf
```

### Step 6.4: Paste This Configuration

Copy this ENTIRE block:

```ini
# ===========================================
# ORIA PRIVATE TESTNET CONFIGURATION
# ===========================================
# This creates your own isolated blockchain
# No external network connection needed
# ===========================================

# ------------------------------------------
# PRIVATE TESTNET MODE
# ------------------------------------------
# Enable testnet mode
testnet=1

# IMPORTANT: Enable private mode (isolated blockchain)
private=1

# Disable external DNS seeding
nodns=1

# ------------------------------------------
# API ACCESS SETTINGS
# ------------------------------------------
# API authentication credentials
apiuser=oria_api
apipassword=OriaSecure2024!

# Enable API authentication
apiauth=1

# Allow remote API access
apiremote=1

# Allow connections from any IP (for LAN access)
llpallowip=0.0.0.0:7080

# ------------------------------------------
# NODE SETTINGS
# ------------------------------------------
# Run as background daemon
daemon=1

# Accept connections
server=1

# Multi-user mode (required for multiple sigchains)
multiuser=1

# Process notifications automatically
processnotifications=1

# ------------------------------------------
# MINING SETTINGS (Required for Private Testnet)
# ------------------------------------------
# Enable mining to generate blocks
mining=1

# Number of mining threads (1 is enough for testing)
miningthreads=1

# ------------------------------------------
# SECURITY
# ------------------------------------------
# Password to stop the node
system/stop=OriaStop2024!
```

### Step 6.5: Save the File

1. Press `Ctrl + X`
2. Press `Y`
3. Press `Enter`

### Step 6.6: Verify Configuration

```bash
cat ~/.Nexus/nexus.conf | head -20
```

Should show first 20 lines of your config.

### Step 6.7: Record Your Credentials

**SAVE THESE!**

| Setting | Value |
|---------|-------|
| API Username | `oria_api` |
| API Password | `OriaSecure2024!` |
| Stop Password | `OriaStop2024!` |

---

## Part 7: Start Your Blockchain

### Step 7.1: Navigate to Nexus

```bash
cd ~/LLL-TAO
```

### Step 7.2: Start the Node

```bash
./nexus
```

You should see:
```
Nexus server starting...
```

### Step 7.3: Wait for Initialization

```bash
sleep 15
```

### Step 7.4: Check Node Status

```bash
./nexus system/get/info
```

### Step 7.5: Verify Output

You should see something like:

```json
{
    "version": "5.1.6-rc1-1 Tritium++ CLI [LLD][x64]",
    "testnet": 3,
    "private": true,
    "multiuser": true,
    "blocks": 0,
    "connections": 0
}
```

**Key things to verify:**
- `"testnet": 3` or `"testnet": true` ✅
- `"private": true` ✅ (This confirms private mode!)
- `"connections": 0` ✅ (Expected - no external connections)

---

## Part 8: Start Mining (Generate Blocks & Coins)

Your private blockchain needs blocks to function. You'll mine them yourself!

### Step 8.1: Create a Mining Account

First, create an account to receive mining rewards:

```bash
cd ~/LLL-TAO
./nexus users/create/user username=oria_miner password=MinerPass2024! pin=1111
```

You should see:
```json
{
    "result": {
        "txid": "...",
        "genesis": "..."
    }
}
```

### Step 8.2: Wait for Genesis Transaction

```bash
sleep 10
```

### Step 8.3: Login to Miner Account

```bash
./nexus users/login/user username=oria_miner password=MinerPass2024! pin=1111
```

Note the `session` value in the response.

### Step 8.4: Start Mining

```bash
./nexus mining/start/prime
```

Or for CPU mining:
```bash
./nexus mining/start/hash
```

### Step 8.5: Check Mining Status

```bash
./nexus mining/get/info
```

You should see mining activity.

### Step 8.6: Watch Blocks Being Created

```bash
watch -n 5 './nexus system/get/info | grep blocks'
```

Press `Ctrl+C` to stop watching.

You should see `blocks` increasing every few seconds!

### Step 8.7: Check Miner Balance (After a Few Minutes)

```bash
./nexus finance/list/accounts username=oria_miner password=MinerPass2024! pin=1111
```

You should see NXS balance from mining rewards!

---

## Part 9: Create Platform Wallet

The platform wallet pays transaction fees for users.

### Step 9.1: Create Platform Account

```bash
./nexus users/create/user username=oria_platform password=PlatformPass2024! pin=1234
```

### Step 9.2: Wait for Confirmation

```bash
sleep 15
```

### Step 9.3: Verify Platform Account

```bash
./nexus users/login/user username=oria_platform password=PlatformPass2024! pin=1234
```

Should return a session.

### Step 9.4: Transfer Test Coins to Platform (Optional)

If the miner has coins, transfer some to platform:

```bash
# Login as miner first
./nexus users/login/user username=oria_miner password=MinerPass2024! pin=1111

# Send coins to platform (use the session from login)
./nexus finance/debit/account pin=1111 amount=100 name_to=oria_platform:default
```

### Step 9.5: Record Platform Credentials

| Setting | Value |
|---------|-------|
| Platform Username | `oria_platform` |
| Platform Password | `PlatformPass2024!` |
| Platform PIN | `1234` |

---

## Part 10: Network Access Setup

Allow your development machine to connect to the node.

### Step 10.1: Get WSL IP Address

In Ubuntu:

```bash
hostname -I
```

Note this IP (e.g., `172.25.xxx.xxx`)

**WSL IP = _______________**

### Step 10.2: Get Windows IP Address

Open PowerShell (not as admin is fine):

```powershell
ipconfig
```

Find "Wireless LAN adapter Wi-Fi" (or Ethernet):
```
IPv4 Address. . . . . . . . . . : 192.168.x.x
```

**Windows IP = _______________**

### Step 10.3: Setup Port Forwarding

Open **PowerShell as Administrator**:

```powershell
netsh interface portproxy add v4tov4 listenport=7080 listenaddress=0.0.0.0 connectport=7080 connectaddress=<WSL_IP>
```

Replace `<WSL_IP>` with your WSL IP from Step 10.1.

Example:
```powershell
netsh interface portproxy add v4tov4 listenport=7080 listenaddress=0.0.0.0 connectport=7080 connectaddress=172.25.123.45
```

### Step 10.4: Add Firewall Rule

```powershell
netsh advfirewall firewall add rule name="Nexus Private Testnet" dir=in action=allow protocol=tcp localport=7080
```

### Step 10.5: Verify Port Forwarding

```powershell
netsh interface portproxy show all
```

Should show:
```
Listen on ipv4:             Connect to ipv4:
Address         Port        Address         Port
--------------- ----------  --------------- ----------
0.0.0.0         7080        172.25.xxx.xxx  7080
```

### Step 10.6: Test Access from Windows

Open browser on Windows laptop:
```
http://localhost:7080/system/get/info
```

Should show JSON with node info.

### Step 10.7: Test Access from Dev Machine

On your OTHER computer (Mac/development machine):
```
http://192.168.x.x:7080/system/get/info
```

Replace with Windows IP from Step 10.2.

---

## Part 11: Connect ORIA Backend

### Step 11.1: Update Backend .env

On your development machine, edit `backend/.env`:

```env
# ===========================================
# NEXUS BLOCKCHAIN CONFIGURATION
# ===========================================

# Your Windows laptop's IP address
NEXUS_BASE_URL=http://192.168.x.x:7080

# Network (keep as testnet)
NEXUS_NETWORK=testnet

# Leave empty
NEXUS_API_KEY=

# ===========================================
# PLATFORM FEE WALLET
# ===========================================
NEXUS_PLATFORM_USERNAME=oria_platform
NEXUS_PLATFORM_PIN=1234

# Fee limits
NEXUS_MAX_FEE_PER_TX=0.01
NEXUS_DAILY_FEE_LIMIT=10.0
```

### Step 11.2: Restart Backend

```bash
cd /path/to/ORIA--MVP/backend
npm run dev
```

Should show:
```
🔗 Nexus connecting to: http://192.168.x.x:7080
   Network: testnet
```

---

## Part 12: Run Verification Tests

### Step 12.1: Run Test Script

```bash
cd /path/to/ORIA--MVP/backend
npx tsx scripts/test-nexus-connection.ts
```

### Step 12.2: Expected Results

```
╔════════════════════════════════════════════════════════╗
║     ORIA - Nexus Testnet Connection Verification       ║
╚════════════════════════════════════════════════════════╝

━━━ Test 1: Node Connection ━━━
 ✅ Node connection successful

━━━ Test 2: Account Creation (Sigchain) ━━━
 ✅ Account created successfully

━━━ Test 3: Login & Session ━━━
 ✅ Login successful

━━━ Test 4: Asset Registration (Mint) ━━━
 ✅ Asset minted successfully

━━━ Test 5: Asset Transfer ━━━
 ✅ Asset transferred successfully

━━━ Test 6: Asset Verification ━━━
 ✅ Asset verified on blockchain

🎉 All tests passed! Nexus Testnet integration is ready.
```

---

## Part 13: Daily Operations

### Starting Everything (After Reboot)

#### 1. Open Ubuntu

Search "Ubuntu" in Windows Start menu.

#### 2. Fix Port Forwarding (WSL IP changes after reboot)

In **PowerShell as Admin**:

```powershell
# Get new WSL IP
$wslIp = (wsl hostname -I).Trim()
Write-Host "WSL IP: $wslIp"

# Remove old forwarding
netsh interface portproxy delete v4tov4 listenport=7080 listenaddress=0.0.0.0

# Add new forwarding
netsh interface portproxy add v4tov4 listenport=7080 listenaddress=0.0.0.0 connectport=7080 connectaddress=$wslIp
```

#### 3. Start Nexus Node

In Ubuntu:

```bash
cd ~/LLL-TAO
./nexus
sleep 10
./nexus system/get/info
```

#### 4. Start Mining (if stopped)

```bash
./nexus users/login/user username=oria_miner password=MinerPass2024! pin=1111
./nexus mining/start/prime
```

### Stopping the Node

```bash
cd ~/LLL-TAO
./nexus system/stop password=OriaStop2024!
```

### Check Status

```bash
./nexus system/get/info
```

### View Logs

```bash
tail -f ~/.Nexus/testnet/debug.log
```

Press `Ctrl+C` to stop.

### Check Block Count

```bash
./nexus system/get/info | grep blocks
```

### Check Mining Status

```bash
./nexus mining/get/info
```

---

## Part 14: Client Remote Access (Phase 2)

When ready for your client in Europe/USA to test:

### Option A: Cloudflare Tunnel (Recommended - Free)

#### 1. Install Cloudflared

In Ubuntu:

```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared
sudo mv cloudflared /usr/local/bin/
```

#### 2. Login to Cloudflare

```bash
cloudflared tunnel login
```

This opens a browser - log in to your Cloudflare account.

#### 3. Create Tunnel

```bash
cloudflared tunnel create oria-testnet
```

Note the tunnel ID.

#### 4. Create Config File

```bash
mkdir -p ~/.cloudflared
nano ~/.cloudflared/config.yml
```

Paste:

```yaml
tunnel: oria-testnet
credentials-file: /home/<your-user>/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: testnet.yourdomain.com
    service: http://localhost:7080
  - service: http_status:404
```

#### 5. Add DNS Record

In Cloudflare Dashboard → DNS → Add Record:
- Type: CNAME
- Name: testnet
- Target: `<tunnel-id>.cfargotunnel.com`

#### 6. Start Tunnel

```bash
cloudflared tunnel run oria-testnet
```

#### 7. Client Access

Your client can now access:
```
https://testnet.yourdomain.com/system/get/info
```

### Option B: ngrok (Quick & Easy)

```bash
# Install
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok

# Authenticate (get token from ngrok.com)
ngrok config add-authtoken <your-token>

# Run
ngrok http 7080
```

Share the generated URL with your client.

---

## Troubleshooting

### Problem: Compilation Fails

```bash
cd ~/LLL-TAO
git pull
make -f makefile.cli clean
make -f makefile.cli -j2 AMD64=1 NO_WALLET=1
```

(Try `-j2` instead of `-j4` if memory issues)

### Problem: Node Won't Start

Check if already running:
```bash
ps aux | grep nexus
```

Kill if needed:
```bash
pkill -9 nexus
```

### Problem: "private: false" in Output

Configuration not loaded. Check:
```bash
cat ~/.Nexus/nexus.conf | grep private
```

Should show `private=1`. If not, recreate config.

### Problem: Mining Not Working

1. Check mining is enabled in config: `mining=1`
2. Login first: `./nexus users/login/user username=oria_miner ...`
3. Try different algorithm: `./nexus mining/start/hash`

### Problem: Can't Connect from Dev Machine

1. Check node is running: `./nexus system/get/info`
2. Check port forwarding: `netsh interface portproxy show all`
3. Check firewall rule exists
4. Try from Windows first: `http://localhost:7080/system/get/info`

### Problem: WSL IP Changed

After every Windows reboot, update port forwarding (see Part 13).

### Problem: No Blocks Being Mined

1. Ensure mining is started
2. Check mining status: `./nexus mining/get/info`
3. Wait a few minutes - first blocks take time

---

## Quick Reference

```
╔═══════════════════════════════════════════════════════════╗
║        ORIA PRIVATE TESTNET - QUICK REFERENCE             ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  START NODE:     cd ~/LLL-TAO && ./nexus                  ║
║  STOP NODE:      ./nexus system/stop password=OriaStop2024! ║
║  NODE STATUS:    ./nexus system/get/info                  ║
║  VIEW LOGS:      tail -f ~/.Nexus/testnet/debug.log       ║
║                                                           ║
║  START MINING:   ./nexus mining/start/prime               ║
║  STOP MINING:    ./nexus mining/stop                      ║
║  MINING STATUS:  ./nexus mining/get/info                  ║
║                                                           ║
║  API ENDPOINT:   http://<windows-ip>:7080                 ║
║                                                           ║
╠═══════════════════════════════════════════════════════════╣
║                     CREDENTIALS                           ║
╠═══════════════════════════════════════════════════════════╣
║  API User:       oria_api                                 ║
║  API Pass:       OriaSecure2024!                          ║
║  Stop Pass:      OriaStop2024!                            ║
║                                                           ║
║  Miner User:     oria_miner                               ║
║  Miner Pass:     MinerPass2024!                           ║
║  Miner PIN:      1111                                     ║
║                                                           ║
║  Platform User:  oria_platform                            ║
║  Platform Pass:  PlatformPass2024!                        ║
║  Platform PIN:   1234                                     ║
╚═══════════════════════════════════════════════════════════╝
```

---

## Success Checklist

After completing this guide, verify:

- [ ] WSL2 with Ubuntu 20.04 installed
- [ ] DNS working (`ping google.com` works)
- [ ] Nexus compiled successfully
- [ ] Node starts without errors
- [ ] `"private": true` in system/get/info
- [ ] Blocks increasing (mining working)
- [ ] Miner account has NXS balance
- [ ] Platform account created
- [ ] Port 7080 accessible from dev machine
- [ ] ORIA backend connects successfully
- [ ] All verification tests pass

**If all boxes checked, your private blockchain is ready!**

---

## Comparison: Private vs Public Testnet

| Aspect | Public Testnet | Your Private Testnet |
|--------|---------------|---------------------|
| Availability | ❌ Offline currently | ✅ Always available |
| Control | ❌ Nexus team | ✅ You |
| Test coins | ❌ Need to request | ✅ Mine your own |
| Speed | ❌ Network latency | ✅ Instant |
| Client access | ✅ Yes | ✅ Yes (via tunnel) |
| Same API | ✅ Yes | ✅ Yes |
| Code changes needed | None | None |

---

*Document Version: 1.0*
*Created for ORIA MVP - Private Testnet Setup*
