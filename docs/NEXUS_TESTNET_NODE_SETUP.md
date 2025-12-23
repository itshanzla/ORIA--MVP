# ORIA - Nexus Testnet Node Setup Guide

## Complete A-to-Z Setup Documentation

**Last Updated**: December 2024
**Author**: ORIA Development Team
**Purpose**: Set up a Nexus Testnet node on Windows laptop with WSL2 for ORIA MVP blockchain integration

---

## Table of Contents

1. [What You'll Get After Setup](#what-youll-get-after-setup)
2. [Prerequisites Checklist](#prerequisites-checklist)
3. [Part 1: Windows Preparation](#part-1-windows-preparation)
4. [Part 2: Install WSL2](#part-2-install-wsl2)
5. [Part 3: Install Ubuntu 20.04](#part-3-install-ubuntu-2004)
6. [Part 4: Install Nexus Dependencies](#part-4-install-nexus-dependencies)
7. [Part 5: Download and Compile Nexus](#part-5-download-and-compile-nexus)
8. [Part 6: Configure Nexus Node](#part-6-configure-nexus-node)
9. [Part 7: Start the Node](#part-7-start-the-node)
10. [Part 8: Network Setup (Access from Other Machines)](#part-8-network-setup-access-from-other-machines)
11. [Part 9: Create Platform Wallet](#part-9-create-platform-wallet)
12. [Part 10: Configure ORIA Backend](#part-10-configure-oria-backend)
13. [Part 11: Run Verification Tests](#part-11-run-verification-tests)
14. [Part 12: Daily Operations](#part-12-daily-operations)
15. [Troubleshooting](#troubleshooting)
16. [Phase 2: Remote Access for Client Testing](#phase-2-remote-access-for-client-testing)

---

## What You'll Get After Setup

After completing this guide, you will have:

| Component | Details |
|-----------|---------|
| **Nexus Testnet Node** | Running on your Windows laptop via WSL2 |
| **API Endpoint** | `http://<your-laptop-ip>:7080` accessible from your network |
| **Platform Wallet** | `oria_platform` account for paying transaction fees |
| **Test NXS Coins** | For testing minting and transfers |
| **Working ORIA App** | Connected to real blockchain (testnet) |

**What This Means:**
- Users can create real blockchain accounts (sigchains)
- Assets are minted on actual Nexus testnet
- Transfers happen on real blockchain
- All data persists (not mock/temporary)

---

## Prerequisites Checklist

Before starting, verify you have:

- [ ] Windows 10 (version 2004+) or Windows 11 laptop
- [ ] At least 4GB RAM (2GB minimum, 4GB recommended)
- [ ] At least 30GB free disk space
- [ ] Stable internet connection
- [ ] Administrator access on the laptop
- [ ] Both laptops on the same WiFi network

**Time Required**: 1-2 hours (mostly waiting for downloads/compilation)

---

## Part 1: Windows Preparation

### Step 1.1: Check Windows Version

1. Press `Windows + R` on your keyboard
2. Type `winver` and press Enter
3. A window will pop up showing your Windows version

**Required**: Version 2004 or higher, or Windows 11

If your version is lower, update Windows first:
- Go to Settings → Update & Security → Windows Update → Check for updates

### Step 1.2: Check Virtualization is Enabled

1. Press `Ctrl + Shift + Esc` to open Task Manager
2. Click on "Performance" tab
3. Click on "CPU" on the left
4. Look at the bottom right - find "Virtualization"

**Required**: Virtualization: Enabled

If it says "Disabled", you need to enable it in BIOS:
1. Restart your laptop
2. Press F2, F10, F12, or DEL during startup (depends on laptop brand)
3. Find "Virtualization" or "VT-x" or "AMD-V" setting
4. Enable it
5. Save and exit BIOS

---

## Part 2: Install WSL2

### Step 2.1: Open PowerShell as Administrator

1. Click the Windows Start button
2. Type `PowerShell`
3. Right-click on "Windows PowerShell"
4. Click "Run as administrator"
5. Click "Yes" when prompted

### Step 2.2: Enable WSL

Copy and paste this command, then press Enter:

```powershell
wsl --install
```

**Wait for it to complete.** You'll see messages about installing components.

### Step 2.3: Restart Your Computer

**IMPORTANT**: You MUST restart after this step.

1. Save any open work
2. Click Start → Power → Restart

### Step 2.4: Verify WSL Installation

After restart:

1. Open PowerShell as Administrator again
2. Run this command:

```powershell
wsl --version
```

You should see version information like:
```
WSL version: 2.0.x
Kernel version: 5.15.x
```

If you see an error, run:
```powershell
wsl --update
```

---

## Part 3: Install Ubuntu 20.04

### Step 3.1: Install Ubuntu 20.04 (NOT 22.04!)

**IMPORTANT**: We specifically need Ubuntu 20.04. Ubuntu 22.04 has OpenSSL compatibility issues with Nexus.

Open PowerShell as Administrator and run:

```powershell
wsl --install -d Ubuntu-20.04
```

Wait for download and installation (may take 5-10 minutes).

### Step 3.2: Create Ubuntu User Account

After installation, Ubuntu will open automatically and ask:

```
Enter new UNIX username:
```

1. Type a username (lowercase, no spaces). Example: `oria`
2. Press Enter
3. Type a password (you won't see it as you type - this is normal)
4. Press Enter
5. Re-type the password
6. Press Enter

**SAVE THESE CREDENTIALS!** You'll need them.

| Item | Your Value |
|------|------------|
| Ubuntu Username | _____________ |
| Ubuntu Password | _____________ |

### Step 3.3: Verify Ubuntu Installation

You should now see a prompt like:

```
oria@LAPTOP-XXXXX:~$
```

Run this command to verify:

```bash
lsb_release -a
```

You should see:
```
Distributor ID: Ubuntu
Description:    Ubuntu 20.04.x LTS
Release:        20.04
```

### Step 3.4: Update Ubuntu

Run these commands (copy one line at a time):

```bash
sudo apt update
```

Enter your password when prompted (you won't see it as you type).

Then run:

```bash
sudo apt upgrade -y
```

Wait for updates to complete (5-10 minutes).

---

## Part 4: Install Nexus Dependencies

### Step 4.1: Install Build Tools

Run this command (it's one long line - copy it all):

```bash
sudo apt-get install -y build-essential libssl-dev libdb-dev libdb++-dev libminiupnpc-dev git pkg-config
```

Wait for installation to complete.

### Step 4.2: Verify Installation

Run:

```bash
g++ --version
```

You should see something like:
```
g++ (Ubuntu 9.4.0-1ubuntu1~20.04.1) 9.4.0
```

If you see an error, re-run Step 4.1.

---

## Part 5: Download and Compile Nexus

### Step 5.1: Create Working Directory

```bash
cd ~
```

This takes you to your home directory.

### Step 5.2: Clone Nexus Repository

```bash
git clone --branch merging https://github.com/Nexusoft/LLL-TAO
```

Wait for download to complete. You'll see progress like:
```
Cloning into 'LLL-TAO'...
remote: Enumerating objects: 12345, done.
...
```

### Step 5.3: Enter the Directory

```bash
cd LLL-TAO
```

### Step 5.4: Clean Any Previous Builds

```bash
make -f makefile.cli clean
```

### Step 5.5: Compile Nexus Core

**This is the longest step - takes 15-45 minutes depending on your laptop.**

```bash
make -f makefile.cli -j4 AMD64=1 NO_WALLET=1
```

**Explanation:**
- `-j4` = Use 4 CPU cores (faster compilation)
- `AMD64=1` = Build for 64-bit Intel/AMD processor
- `NO_WALLET=1` = Skip legacy wallet (we use sigchains)

You'll see lots of compilation output. This is normal.

**Wait until you see the command prompt again** (`oria@LAPTOP:~/LLL-TAO$`).

### Step 5.6: Verify Compilation

```bash
ls -la nexus
```

You should see something like:
```
-rwxr-xr-x 1 oria oria 12345678 Dec 21 10:30 nexus
```

If you see "No such file or directory", compilation failed. Check [Troubleshooting](#troubleshooting).

---

## Part 6: Configure Nexus Node

### Step 6.1: Create Data Directory

```bash
mkdir -p ~/.Nexus
```

### Step 6.2: Create Configuration File

```bash
nano ~/.Nexus/nexus.conf
```

This opens a text editor.

### Step 6.3: Paste Configuration

Copy this ENTIRE block and paste it into the editor:

```ini
# ===========================================
# ORIA Nexus Testnet Node Configuration
# Created: December 2024
# ===========================================

# ------------------------------------------
# API ACCESS SETTINGS
# ------------------------------------------
# Username for API authentication
apiuser=oria_api

# Password for API authentication (CHANGE THIS!)
apipassword=OriaSecure2024!

# Enable API authentication (1=yes, 0=no)
apiauth=1

# Allow remote API access (1=yes, 0=no)
apiremote=1

# Allow API connections from any IP on port 7080
# For production, replace 0.0.0.0 with specific IPs
llpallowip=0.0.0.0:7080

# ------------------------------------------
# NETWORK SETTINGS
# ------------------------------------------
# Enable testnet mode (REQUIRED - do not change)
testnet=1

# Disable DNS seeding (we specify nodes manually)
nodns=1

# Run as background daemon
daemon=1

# Accept incoming connections
server=1

# ------------------------------------------
# TESTNET SEED NODES
# ------------------------------------------
connect=testnet1.nexus-interactions.io
connect=testnet2.nexus-interactions.io
connect=testnet3.nexus-interactions.io

# ------------------------------------------
# ADVANCED SETTINGS
# ------------------------------------------
# Enable multi-user mode (required for platform wallet)
multiuser=1

# Process incoming notifications automatically
processnotifications=1

# ------------------------------------------
# SECURITY
# ------------------------------------------
# Password required to stop the node (CHANGE THIS!)
system/stop=OriaStop2024!
```

### Step 6.4: Save the File

1. Press `Ctrl + X` (exit)
2. Press `Y` (yes, save changes)
3. Press `Enter` (confirm filename)

### Step 6.5: Verify Configuration

```bash
cat ~/.Nexus/nexus.conf
```

You should see the configuration you just pasted.

### Step 6.6: Record Your Credentials

**SAVE THESE - YOU WILL NEED THEM!**

| Setting | Value |
|---------|-------|
| API Username | `oria_api` |
| API Password | `OriaSecure2024!` |
| Stop Password | `OriaStop2024!` |

---

## Part 7: Start the Node

### Step 7.1: Navigate to Nexus Directory

```bash
cd ~/LLL-TAO
```

### Step 7.2: Start the Daemon

```bash
./nexus
```

You should see:
```
Nexus server starting...
```

And then return to the command prompt.

### Step 7.3: Wait 10 Seconds

The node needs a moment to initialize.

```bash
sleep 10
```

### Step 7.4: Check Node Status

```bash
./nexus system/get/info
```

You should see JSON output like:

```json
{
    "result": {
        "version": "5.1.0-rc1 Tritium++ CLI [LLD][x64]",
        "protocolversion": 30000,
        "walletversion": 10001,
        "testnet": true,
        "private": false,
        "multiuser": true,
        "blocks": 12345,
        "synchronizing": true,
        "synccomplete": 15,
        "connections": 3
    }
}
```

**Key things to verify:**
- `"testnet": true` ← MUST be true
- `"connections": X` ← Should be > 0 (connected to network)
- `"synchronizing": true` ← Normal at first

### Step 7.5: Monitor Sync Progress

The node needs to download the testnet blockchain. Check progress:

```bash
./nexus system/get/info | grep -E "(blocks|synccomplete|synchronizing)"
```

Run this periodically to see progress:
- `synccomplete` = percentage (0-100)
- `synchronizing` = will become `false` when done

**First sync takes 30 minutes to 2 hours.**

You can continue to the next steps while syncing.

---

## Part 8: Network Setup (Access from Other Machines)

This section allows your development machine to connect to the node.

### Step 8.1: Get WSL IP Address

In Ubuntu (WSL), run:

```bash
hostname -I
```

You'll see something like: `172.25.123.45`

Record this: **WSL IP = _______________**

### Step 8.2: Get Windows Laptop IP Address

Open a NEW PowerShell window (not as admin is fine) and run:

```powershell
ipconfig
```

Look for "Wireless LAN adapter Wi-Fi" (or Ethernet if wired):

```
IPv4 Address. . . . . . . . . . : 192.168.1.105
```

Record this: **Windows IP = _______________**

### Step 8.3: Set Up Port Forwarding (PowerShell as Admin)

Open PowerShell as Administrator and run:

**Replace `172.25.123.45` with YOUR WSL IP from Step 8.1:**

```powershell
netsh interface portproxy add v4tov4 listenport=7080 listenaddress=0.0.0.0 connectport=7080 connectaddress=172.25.123.45
```

### Step 8.4: Add Firewall Rule

Still in PowerShell as Administrator:

```powershell
netsh advfirewall firewall add rule name="Nexus Testnet API" dir=in action=allow protocol=tcp localport=7080
```

### Step 8.5: Verify Port Forwarding

```powershell
netsh interface portproxy show all
```

You should see:

```
Listen on ipv4:             Connect to ipv4:
Address         Port        Address         Port
--------------- ----------  --------------- ----------
0.0.0.0         7080        172.25.123.45   7080
```

### Step 8.6: Test Local Access (from Windows)

Open a web browser on the Windows laptop and go to:

```
http://localhost:7080/system/get/info
```

You should see JSON with node information.

### Step 8.7: Test Network Access (from Dev Machine)

On your OTHER machine (development machine), open a browser and go to:

```
http://192.168.1.105:7080/system/get/info
```

**Replace `192.168.1.105` with your Windows laptop IP from Step 8.2.**

You should see the same JSON response.

If it doesn't work, check [Troubleshooting](#troubleshooting).

---

## Part 9: Create Platform Wallet

The platform wallet will pay transaction fees so users don't need NXS.

### Step 9.1: Wait for Sync (Optional but Recommended)

Check if sync is complete:

```bash
cd ~/LLL-TAO
./nexus system/get/info | grep synchronizing
```

If it shows `"synchronizing": false`, you're synced.

You CAN create the wallet while syncing, but some operations may fail until sync completes.

### Step 9.2: Create Platform Account

Run this command:

```bash
./nexus users/create/user username=oria_platform password=PlatformPass2024! pin=1234
```

You should see:

```json
{
    "result": {
        "txid": "abc123...",
        "genesis": "def456..."
    }
}
```

**SAVE THESE CREDENTIALS!**

| Setting | Value |
|---------|-------|
| Platform Username | `oria_platform` |
| Platform Password | `PlatformPass2024!` |
| Platform PIN | `1234` |
| Genesis Hash | _______________ |

### Step 9.3: Wait for Confirmation

Wait 30 seconds for the transaction to confirm:

```bash
sleep 30
```

### Step 9.4: Test Login

```bash
./nexus users/login/user username=oria_platform password=PlatformPass2024! pin=1234
```

You should see a `session` token in the response:

```json
{
    "result": {
        "genesis": "...",
        "session": "abc123def456..."
    }
}
```

### Step 9.5: Check Account

```bash
./nexus users/list/accounts username=oria_platform password=PlatformPass2024! pin=1234
```

This shows the default NXS account (will have 0 balance on testnet initially).

---

## Part 10: Configure ORIA Backend

Now let's connect your ORIA application to the testnet node.

### Step 10.1: Open Backend .env File

On your **development machine** (not the laptop running the node):

```bash
cd /Users/user/Documents/Projects/ORIA--MVP/backend
```

Open the `.env` file in your editor.

### Step 10.2: Update Nexus Configuration

Find and update these lines:

```env
# ===========================================
# NEXUS BLOCKCHAIN CONFIGURATION
# ===========================================

# Replace with your Windows laptop IP
NEXUS_BASE_URL=http://192.168.1.105:7080

# Keep as testnet
NEXUS_NETWORK=testnet

# Leave empty (we use apiuser/apipassword in nexus.conf)
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

### Step 10.3: Save the File

Save and close the `.env` file.

### Step 10.4: Restart Backend

```bash
# Stop any running backend
# Then start fresh
npm run dev
```

You should see in the console:

```
🔗 Nexus connecting to: http://192.168.1.105:7080
   Network: testnet
```

---

## Part 11: Run Verification Tests

### Step 11.1: Navigate to Backend

```bash
cd /Users/user/Documents/Projects/ORIA--MVP/backend
```

### Step 11.2: Run Test Script

```bash
npx tsx scripts/test-nexus-connection.ts
```

### Step 11.3: Expected Output

```
╔════════════════════════════════════════════════════════╗
║     ORIA - Nexus Testnet Connection Verification       ║
╚════════════════════════════════════════════════════════╝

Target: http://192.168.1.105:7080
Time: 2024-12-21T10:30:00.000Z

━━━ Test 1: Node Connection ━━━
   Version: 5.1.0-rc1 Tritium++ CLI [LLD][x64]
   Testnet: true
   Syncing: false
   Blocks: 123456
 ✅ Node connection successful

━━━ Test 2: Account Creation (Sigchain) ━━━
   Creating user: oriatest_1703152200000
   Genesis: abc123...
   TxID: def456...
 ✅ Account created successfully

━━━ Test 3: Login & Session ━━━
   Logging in as: oriatest_1703152200000
   Session: ghi789...
 ✅ Login successful

━━━ Test 4: Asset Registration (Mint) ━━━
   Creating asset: ORIA_TEST_1703152200000
   Address: jkl012...
   TxID: mno345...
 ✅ Asset minted successfully

━━━ Test 5: Asset Transfer ━━━
   Transferring asset to: oriatest2_1703152200000
   Transfer TxID: pqr678...
 ✅ Asset transferred successfully

━━━ Test 6: Asset Verification ━━━
   Verifying asset: jkl012...
   Owner: stu901...
 ✅ Asset verified on blockchain

╔════════════════════════════════════════════════════════╗
║                    TEST SUMMARY                        ║
╠════════════════════════════════════════════════════════╣
║ ✅ PASS │ Node Connection      │ Connected to testnet   ║
║ ✅ PASS │ Account Creation     │ Sigchain created       ║
║ ✅ PASS │ Login                │ Session obtained       ║
║ ✅ PASS │ Asset Mint           │ Asset on blockchain    ║
║ ✅ PASS │ Asset Transfer       │ Ownership transferred  ║
║ ✅ PASS │ Asset Verification   │ Asset exists on chain  ║
╠════════════════════════════════════════════════════════╣
║ Total: 6 passed, 0 failed                              ║
╚════════════════════════════════════════════════════════╝

🎉 All tests passed! Nexus Testnet integration is ready.
```

If all tests pass, **congratulations!** Your ORIA app is now connected to real blockchain.

---

## Part 12: Daily Operations

### Starting the Node (After Reboot)

1. Open Ubuntu (search "Ubuntu" in Windows Start menu)
2. Run:

```bash
cd ~/LLL-TAO
./nexus
```

3. Verify it's running:

```bash
./nexus system/get/info
```

### Stopping the Node

```bash
cd ~/LLL-TAO
./nexus system/stop password=OriaStop2024!
```

### Checking Node Status

```bash
./nexus system/get/info
```

### Viewing Logs

```bash
tail -f ~/.Nexus/testnet/debug.log
```

Press `Ctrl + C` to stop viewing logs.

### Checking Sync Status

```bash
./nexus system/get/info | grep -E "(blocks|synccomplete|synchronizing)"
```

### Re-apply Port Forwarding (After Windows Reboot)

The port forwarding rule may need to be re-applied after Windows restarts.

1. Get new WSL IP: `wsl hostname -I`
2. Open PowerShell as Admin
3. Remove old rule: `netsh interface portproxy delete v4tov4 listenport=7080 listenaddress=0.0.0.0`
4. Add new rule: `netsh interface portproxy add v4tov4 listenport=7080 listenaddress=0.0.0.0 connectport=7080 connectaddress=<NEW_WSL_IP>`

---

## Troubleshooting

### Problem: Compilation Fails

**Error**: `make: *** No rule to make target`

**Solution**:
```bash
cd ~/LLL-TAO
git pull
make -f makefile.cli clean
make -f makefile.cli -j4 AMD64=1 NO_WALLET=1
```

### Problem: Node Won't Start

**Error**: `Nexus server failed to start`

**Solution**: Check if port is in use:
```bash
sudo lsof -i :7080
```

If something is using it, kill it:
```bash
sudo kill -9 <PID>
```

### Problem: Can't Connect from Dev Machine

**Symptoms**: Browser shows "connection refused"

**Check 1**: Is node running?
```bash
./nexus system/get/info
```

**Check 2**: Is port forwarding set up?
```powershell
netsh interface portproxy show all
```

**Check 3**: Is firewall allowing port 7080?
```powershell
netsh advfirewall firewall show rule name="Nexus Testnet API"
```

**Check 4**: Can you ping the Windows laptop from dev machine?
```bash
ping 192.168.1.105
```

### Problem: "testnet: false" in Response

**This is critical!** You're connected to mainnet.

**Solution**:
1. Stop the node immediately
2. Check `~/.Nexus/nexus.conf` has `testnet=1`
3. Delete any mainnet data: `rm -rf ~/.Nexus/mainnet`
4. Restart node

### Problem: WSL IP Changes After Reboot

This is normal. WSL gets a new IP each time.

**Solution**: Create a script to auto-update:

1. Create file `update-port-forward.ps1`:
```powershell
$wslIp = wsl hostname -I
$wslIp = $wslIp.Trim()
netsh interface portproxy delete v4tov4 listenport=7080 listenaddress=0.0.0.0
netsh interface portproxy add v4tov4 listenport=7080 listenaddress=0.0.0.0 connectport=7080 connectaddress=$wslIp
Write-Host "Port forwarding updated to WSL IP: $wslIp"
```

2. Run as Admin after each Windows reboot

### Problem: Node Shows 0 Connections

**Cause**: Can't reach testnet seed nodes

**Solution**:
1. Check internet connection
2. Verify DNS works: `ping testnet1.nexus-interactions.io`
3. Wait 5-10 minutes (nodes may take time to connect)
4. Check firewall isn't blocking outgoing connections

---

## Phase 2: Remote Access for Client Testing

When you're ready to let your client (in Europe/America) test the app:

### Option 1: Cloudflare Tunnel (Recommended - Free)

1. Create free Cloudflare account at https://cloudflare.com
2. Add your domain (or use theirs)
3. Install cloudflared in WSL:

```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared
sudo mv cloudflared /usr/local/bin/
```

4. Authenticate:
```bash
cloudflared tunnel login
```

5. Create tunnel:
```bash
cloudflared tunnel create oria-node
```

6. Configure tunnel (`~/.cloudflared/config.yml`):
```yaml
tunnel: oria-node
credentials-file: /home/oria/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: node.yourdomain.com
    service: http://localhost:7080
  - service: http_status:404
```

7. Run tunnel:
```bash
cloudflared tunnel run oria-node
```

8. Update DNS in Cloudflare dashboard

9. Client can now access: `https://node.yourdomain.com/system/get/info`

### Option 2: ngrok (Quick Testing)

1. Sign up at https://ngrok.com
2. Install ngrok
3. Run: `ngrok http 7080`
4. Share the generated URL with client

**Note**: ngrok URLs change each time (on free plan).

---

## Quick Reference Card

Print this for easy access:

```
╔═══════════════════════════════════════════════════════════╗
║           ORIA NEXUS NODE - QUICK REFERENCE               ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  START NODE:     cd ~/LLL-TAO && ./nexus                  ║
║  STOP NODE:      ./nexus system/stop password=<pass>      ║
║  CHECK STATUS:   ./nexus system/get/info                  ║
║  VIEW LOGS:      tail -f ~/.Nexus/testnet/debug.log       ║
║                                                           ║
║  API ENDPOINT:   http://<windows-ip>:7080                 ║
║  API USERNAME:   oria_api                                 ║
║  API PASSWORD:   OriaSecure2024!                          ║
║                                                           ║
║  PLATFORM USER:  oria_platform                            ║
║  PLATFORM PIN:   1234                                     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

---

## Credentials Summary

**IMPORTANT: Store these securely!**

### Node API Access
| Setting | Value |
|---------|-------|
| API URL | `http://<windows-ip>:7080` |
| API Username | `oria_api` |
| API Password | `OriaSecure2024!` |
| Stop Password | `OriaStop2024!` |

### Platform Wallet
| Setting | Value |
|---------|-------|
| Username | `oria_platform` |
| Password | `PlatformPass2024!` |
| PIN | `1234` |

### Ubuntu (WSL)
| Setting | Value |
|---------|-------|
| Username | _____________ |
| Password | _____________ |

---

## Success Checklist

After completing this guide, verify:

- [ ] WSL2 with Ubuntu 20.04 installed
- [ ] Nexus compiled successfully
- [ ] Node starts without errors
- [ ] Node shows `testnet: true`
- [ ] Node has connections > 0
- [ ] Port 7080 accessible from dev machine
- [ ] Platform wallet created
- [ ] ORIA backend `.env` updated
- [ ] All verification tests pass

**If all boxes are checked, you're ready to use ORIA with real blockchain!**

---

## Support

If you encounter issues not covered here:

1. Check Nexus Discord: https://discord.gg/nexus
2. Nexus Documentation: https://nexus-wiki.org
3. GitHub Issues: https://github.com/Nexusoft/LLL-TAO/issues

---

*Document Version: 1.0*
*Created for ORIA MVP - Nexus Testnet Integration*
