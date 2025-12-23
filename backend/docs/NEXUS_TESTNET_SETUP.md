# ORIA - Nexus Testnet Setup Guide

## Overview

ORIA uses the Nexus blockchain for registering and transferring audio assets. This document covers the complete testnet setup for the MVP.

---

## 1. Nexus Node Setup (Private Testnet)

### Prerequisites
- Windows, Linux, or macOS machine
- At least 4GB RAM
- 20GB free disk space
- Port 7080 available

### Option A: Windows with WSL (Current Setup)

The private testnet is currently running on a Windows laptop via WSL2.

**Steps:**
1. Install WSL2 with Ubuntu
2. Download Nexus core:
   ```bash
   wget https://github.com/Nexusoft/LLL-TAO/releases/download/5.1.3/nexus-5.1.3-x86_64-linux-gnu.tar.gz
   tar -xzf nexus-5.1.3-x86_64-linux-gnu.tar.gz
   cd nexus-5.1.3-x86_64-linux-gnu
   ```

3. Create config file `~/.Nexus/nexus.conf`:
   ```ini
   # Private Testnet Configuration
   testnet=1
   private=1
   mining=0

   # Auto-generate blocks (required for private testnet)
   generate=1

   # API settings
   apiauth=0
   apiconnect=0.0.0.0
   apiport=7080

   # Verbose logging for debugging
   verbose=2
   ```

4. Start the node:
   ```bash
   ./nexus -daemon
   ```

5. Verify node is running:
   ```bash
   curl http://localhost:7080/system/get/info
   ```

6. Set up port forwarding for WSL (from Windows PowerShell as Admin):
   ```powershell
   netsh interface portproxy add v4tov4 listenport=7080 listenaddress=0.0.0.0 connectport=7080 connectaddress=$(wsl hostname -I)
   ```

   Or use socat inside WSL:
   ```bash
   socat TCP-LISTEN:7080,fork,reuseaddr TCP:127.0.0.1:7080
   ```

### Option B: Docker (Recommended for Deployment)

```bash
docker run -d \
  --name nexus-testnet \
  -p 7080:7080 \
  -v nexus-data:/root/.Nexus \
  -e TESTNET=1 \
  -e PRIVATE=1 \
  -e GENERATE=1 \
  nexusoft/nexus-testnet:latest
```

---

## 2. Environment Configuration

### Backend `.env` File

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Nexus Blockchain Configuration
NEXUS_BASE_URL=http://192.168.100.55:7080
NEXUS_NETWORK=testnet
NEXUS_API_KEY=

# Platform Fee Wallet (optional - for sponsored fees)
NEXUS_PLATFORM_USERNAME=oria_platform
NEXUS_PLATFORM_PIN=1234
NEXUS_MAX_FEE_PER_TX=0.01
NEXUS_DAILY_FEE_LIMIT=10.0
```

### Frontend `.env` File

```env
VITE_API_URL=http://localhost:3001/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## 3. API Endpoints Used

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/profiles/create/master` | POST | Create new user account (sigchain) |
| `/sessions/create/local` | POST | Login and get session token |
| `/sessions/unlock/local` | POST | Unlock session for transactions |
| `/sessions/terminate/local` | POST | Logout and destroy session |

### Assets
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/assets/create/asset` | POST | Register new asset on blockchain |
| `/assets/get/asset` | GET | Retrieve asset by address/name |
| `/assets/transfer/asset` | POST | Transfer asset to another user |
| `/assets/list/accounts` | GET | List user's assets |

### System
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/system/get/info` | GET | Get node status and info |

---

## 4. API Request/Response Examples

### Create Account
```bash
curl -X POST http://192.168.100.55:7080/profiles/create/master \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "securepassword123",
    "pin": "1234"
  }'
```

Response:
```json
{
  "result": {
    "genesis": "a1b2c3d4...",
    "txid": "e5f6g7h8..."
  }
}
```

### Login
```bash
curl -X POST http://192.168.100.55:7080/sessions/create/local \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "securepassword123",
    "pin": "1234"
  }'
```

Response:
```json
{
  "result": {
    "genesis": "a1b2c3d4...",
    "session": "abc123def456..."
  }
}
```

### Create Asset
```bash
curl -X POST http://192.168.100.55:7080/assets/create/asset \
  -H "Content-Type: application/json" \
  -d '{
    "session": "abc123def456...",
    "pin": "1234",
    "name": "oria_my_song_1703330000000",
    "format": "JSON",
    "json": [
      {"name": "title", "type": "string", "value": "My Song", "mutable": false},
      {"name": "artist", "type": "string", "value": "Artist Name", "mutable": false},
      {"name": "audio_url", "type": "string", "value": "https://...", "mutable": false},
      {"name": "price", "type": "string", "value": "5.00", "mutable": true},
      {"name": "app", "type": "string", "value": "ORIA", "mutable": false}
    ]
  }'
```

Response:
```json
{
  "result": {
    "address": "8abc123...",
    "txid": "9def456..."
  }
}
```

---

## 5. Test Checklist

### Pre-requisites
- [ ] Nexus node running and accessible
- [ ] Backend server running (`npm run dev`)
- [ ] Frontend running (`npm run dev`)
- [ ] Supabase project active

### Account Creation Test
1. [ ] Register new user via `/signup`
2. [ ] Verify Nexus account created (check node logs)
3. [ ] Verify Supabase profile created
4. [ ] Login with created credentials
5. [ ] Verify Nexus session obtained

### Asset Minting Test
1. [ ] Navigate to Mint page
2. [ ] Upload audio file (MP3/WAV)
3. [ ] Fill in asset details
4. [ ] Click "Mint Asset"
5. [ ] Verify asset appears in Library
6. [ ] Verify asset registered on blockchain:
   ```bash
   curl "http://192.168.100.55:7080/assets/get/asset?name=oria_<asset_name>"
   ```

### Asset Playback Test
1. [ ] Navigate to asset detail page
2. [ ] Click play button
3. [ ] Verify audio plays
4. [ ] Test seek functionality
5. [ ] Test pause/resume

### Asset Discovery Test
1. [ ] Navigate to Home page
2. [ ] Verify minted assets appear
3. [ ] Navigate to Discover page
4. [ ] Test search functionality
5. [ ] Test category filters

### Transfer Test (Optional)
1. [ ] Create second user account
2. [ ] Open asset owned by first user
3. [ ] Click "Transfer Asset"
4. [ ] Enter recipient username
5. [ ] Confirm transfer
6. [ ] Verify ownership changed on blockchain

---

## 6. Troubleshooting

### Common Errors

**"duplicate genesis-id"**
- Cause: Account not fully confirmed on blockchain
- Solution: Wait 30 seconds for block confirmation, retry

**"variable format must be variable(`params`)"**
- Cause: Empty string values in JSON fields
- Solution: Use `-` as placeholder for empty fields (already fixed)

**"Failed to accept"**
- Cause: Transaction timing issue on private testnet
- Solution: Retry with delay (built-in retry logic handles this)

**"session not found" or "session expired"**
- Cause: Session timed out or not properly unlocked
- Solution: Re-login to get fresh session

### Checking Node Status
```bash
curl http://192.168.100.55:7080/system/get/info | jq
```

### Viewing Node Logs
```bash
tail -f ~/.Nexus/debug.log
```

---

## 7. Security Notes

- **TESTNET ONLY**: All credentials and coins are for testing only
- **Never use real NXS**: Testnet uses valueless test coins
- **PIN storage**: PINs are base64 encoded in Supabase (improve for production)
- **Session tokens**: Stored in localStorage (use secure cookies for production)

---

## 8. Moving to Mainnet (Future)

Requirements before mainnet deployment:
1. [ ] All features tested on testnet
2. [ ] Client explicit approval received
3. [ ] Platform wallet funded with real NXS
4. [ ] Fee limits properly configured
5. [ ] Security audit completed
6. [ ] PIN encryption improved
7. [ ] Rate limiting implemented

---

## Current Status

| Component | Status |
|-----------|--------|
| Private Testnet Node | Running on 192.168.100.55:7080 |
| Account Creation | Working |
| Login/Session | Working |
| Asset Minting | Working |
| Asset Playback | Working |
| Asset Discovery | Working |
| Asset Transfer | Implemented (needs testing) |
| Platform-Sponsored Fees | Implemented |

---

## 9. Platform-Sponsored Fees

The platform covers transaction fees so users don't need to acquire NXS coins.

### How It Works

1. **Platform Wallet**: A Nexus account owned by the platform
2. **Fee Tracking**: Daily spending limits prevent runaway costs
3. **Automatic Logging**: All sponsored fees are recorded for auditing

### Setup Steps

1. **Create Platform Account** (run once on the Nexus node):
```bash
curl -X POST http://192.168.100.55:7080/profiles/create/master \
  -H "Content-Type: application/json" \
  -d '{
    "username": "oria_platform",
    "password": "YourSecurePlatformPassword123!",
    "pin": "1234"
  }'
```

2. **Fund the Account** (on private testnet, coins are auto-generated):
```bash
# Check balance
curl -X POST http://192.168.100.55:7080/sessions/create/local \
  -d '{"username":"oria_platform","password":"YourSecurePlatformPassword123!","pin":"1234"}' | jq
```

3. **Configure Environment**:
```env
NEXUS_PLATFORM_USERNAME=oria_platform
NEXUS_PLATFORM_PASSWORD=YourSecurePlatformPassword123!
NEXUS_PLATFORM_PIN=1234
NEXUS_MAX_FEE_PER_TX=0.01
NEXUS_DAILY_FEE_LIMIT=10.0
```

4. **Verify on Server Start**:
```
💰 Platform fee wallet configured for sponsored transactions
Platform wallet balance: 1000.00 NXS (1000.00 available)
Daily fee limit: 10.0 NXS
Max fee per tx: 0.01 NXS
```

### Monitoring Fees

```bash
# Check daily fee stats
curl http://localhost:3001/api/platform/fees
```

Response:
```json
{
  "success": true,
  "data": {
    "configured": true,
    "date": "2024-12-23",
    "totalSpent": 0.05,
    "limit": 10.0,
    "remaining": 9.95,
    "transactionCount": 5
  }
}
```

### Fee Limits

| Limit | Default | Purpose |
|-------|---------|---------|
| Max per transaction | 0.01 NXS | Prevent abuse on single tx |
| Daily limit | 10.0 NXS | Cap total daily spending |

When limits are reached, users will need to wait until the next day or the limit can be increased in the `.env` file.

---

*Last Updated: December 2024*
