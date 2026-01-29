# ORIA MVP - Developer Notes

This document contains important technical details, architecture decisions, and implementation notes for developers working on the ORIA MVP.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Key Design Decisions](#key-design-decisions)
3. [Nexus Blockchain Integration](#nexus-blockchain-integration)
4. [Database Schema](#database-schema)
5. [API Design](#api-design)
6. [Authentication Flow](#authentication-flow)
7. [Asset Lifecycle](#asset-lifecycle)
8. [Error Handling](#error-handling)
9. [Testing](#testing)
10. [Common Issues & Solutions](#common-issues--solutions)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (PWA)                          │
│  React + TypeScript + Vite + TailwindCSS                        │
│  └── Pages: Login, Register, Home, Mint, Library, AssetDetail  │
└─────────────────────────────────┬───────────────────────────────┘
                                  │ HTTP/REST
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend (Express API)                       │
│  Node.js + TypeScript + ES Modules                              │
│  ├── Controllers: auth, mint, upload, nexus, tx                 │
│  ├── Services: asset.service, platform-wallet.service           │
│  └── Config: supabase, nexus (mock + real)                      │
└───────────────┬─────────────────────────────┬───────────────────┘
                │                             │
                ▼                             ▼
┌───────────────────────────┐   ┌─────────────────────────────────┐
│      Supabase             │   │     Nexus Blockchain            │
│  ├── Authentication       │   │  ├── Account Creation           │
│  ├── PostgreSQL DB        │   │  ├── Session Management         │
│  └── File Storage         │   │  ├── Asset Registration         │
│      (audio + images)     │   │  └── Asset Transfer             │
└───────────────────────────┘   └─────────────────────────────────┘
```

## Key Design Decisions

### 1. Dual Account System

Users have both:
- **Supabase account** - For app authentication, profile data
- **Nexus sigchain** - For blockchain operations (created automatically on signup)

**Rationale**: This provides familiar email/password auth while maintaining full blockchain ownership.

### 2. PIN for Transactions

Users set a 4+ digit PIN during registration, stored as base64 in user metadata.

**Rationale**: Nexus requires a PIN to unlock sessions for transactions. Storing it allows seamless blockchain operations without repeated PIN entry.

### 3. Mock Mode for Development

Set `NEXUS_BASE_URL=mock` to run without a real blockchain node.

**Rationale**: Developers can work on the app without running a Nexus node or consuming testnet resources.

### 4. Platform Fee Sponsorship

The platform wallet can pay transaction fees on behalf of users.

**Rationale**: Removes friction for new users who don't have NXS tokens yet.

---

## Nexus Blockchain Integration

### API Endpoints Used

| Nexus API | Purpose | Our Wrapper |
|-----------|---------|-------------|
| `profiles/create/master` | Create sigchain (account) | `POST /api/auth/signup` |
| `sessions/create/local` | Login, get session | `POST /api/auth/login` |
| `sessions/unlock/local` | Enable transactions | Called after login |
| `assets/create/asset` | Mint NFT | `POST /api/mint` |
| `assets/transfer/asset` | Transfer ownership | `POST /api/mint/transfer` |
| `assets/get/asset` | Verify asset | `GET /api/mint/verify/:addr` |
| `ledger/get/transaction` | Lookup transaction | `GET /api/tx/:hash` |
| `system/get/info` | Node status | `GET /api/nexus/status` |

### Asset JSON Schema

When creating assets, we use JSON format with these fields:

```typescript
const nexusJsonFields = [
    { name: 'title', type: 'string', value: title, mutable: false },
    { name: 'artist', type: 'string', value: artist, mutable: false },
    { name: 'description', type: 'string', value: description, mutable: false },
    { name: 'genre', type: 'string', value: genre, mutable: false },
    { name: 'price', type: 'string', value: price.toString(), mutable: true },
    { name: 'audio_url', type: 'string', value: audioUrl, mutable: false },
    { name: 'cover_url', type: 'string', value: coverUrl, mutable: false },
    { name: 'is_limited', type: 'string', value: 'false', mutable: false },
    { name: 'limited_supply', type: 'string', value: '0', mutable: false },
    { name: 'created_by', type: 'string', value: userId, mutable: false },
    { name: 'created_at', type: 'string', value: isoDate, mutable: false },
    { name: 'app', type: 'string', value: 'ORIA', mutable: false }
];
```

**Important**: Nexus does NOT allow empty string values. Use `'-'` as placeholder.

### Session Management

1. Sessions expire after inactivity
2. Sessions must be "unlocked" before transactions
3. Session tokens should be stored client-side (localStorage)
4. Re-login if session becomes invalid

---

## Database Schema

### `assets` Table

```sql
CREATE TABLE assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,              -- Current owner (Supabase user ID)
    owner_genesis VARCHAR(256),          -- Nexus genesis hash of owner
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255) NOT NULL,
    description TEXT,
    genre VARCHAR(100),
    price DECIMAL(18, 8) DEFAULT 0,
    is_limited BOOLEAN DEFAULT FALSE,
    limited_supply INTEGER,
    audio_url TEXT NOT NULL,            -- Supabase Storage URL
    audio_path TEXT NOT NULL,           -- Storage path for deletion
    cover_url TEXT,
    cover_path TEXT,
    nexus_address VARCHAR(256) UNIQUE,  -- Blockchain address
    nexus_name VARCHAR(255),            -- Blockchain name
    nexus_txid VARCHAR(256),            -- Creation transaction
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    last_error TEXT,
    retry_count INTEGER DEFAULT 0
);
```

### `asset_transfers` Table

```sql
CREATE TABLE asset_transfers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    asset_id UUID REFERENCES assets(id),
    from_user_id UUID NOT NULL,
    from_genesis VARCHAR(256),
    to_user_id UUID,
    to_username VARCHAR(255),
    to_genesis VARCHAR(256),
    nexus_txid VARCHAR(256),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    error TEXT
);
```

### Asset Status Flow

```
pending → registering → confirming → confirmed
                ↓                        ↓
              failed              transfer_pending → transferred
```

---

## API Design

### Response Format

All API responses follow this structure:

```typescript
// Success
{
    success: true,
    message: "Operation completed",
    data: { ... }
}

// Error
{
    success: false,
    message: "Error description",
    error: "detailed error" // Only in development
}
```

### Authentication

Most endpoints require the Supabase JWT in the Authorization header:

```
Authorization: Bearer <access_token>
```

For blockchain operations, also include:
- `nexusSession` - From login response
- `nexusPin` - User's transaction PIN

---

## Authentication Flow

### Registration

```
1. User submits: email, password, username, PIN, role
2. Backend creates Nexus sigchain (profiles/create/master)
3. Backend creates Supabase auth user with nexus metadata
4. Backend creates Nexus session (sessions/create/local)
5. Backend unlocks session for transactions
6. Return: user, session, nexusSession, nexus genesis
```

### Login

```
1. User submits: email, password
2. Backend authenticates with Supabase
3. Backend retrieves nexus_username and pin_hash from metadata
4. Backend creates Nexus session
5. Backend unlocks session
6. Return: user, session, nexusSession
```

---

## Asset Lifecycle

### Minting

```
1. Upload audio file to Supabase Storage
2. Upload cover art (optional)
3. Insert asset record (status: registering)
4. Call Nexus assets/create/asset with retry logic
5. Update record with nexus_address, nexus_txid
6. Status: confirming
7. Frontend can poll /confirm/:id for confirmation
8. Status: confirmed (once verified on blockchain)
```

### Transfer

```
1. Verify ownership in database
2. Find recipient by username/email
3. Create transfer record (status: pending)
4. Update asset (status: transfer_pending)
5. Call Nexus assets/transfer/asset
6. Update transfer record with txid
7. Update asset user_id to recipient
8. Status: confirmed
```

---

## Error Handling

### Nexus API Errors

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| `duplicate genesis-id` | Account not confirmed | Wait 5-10s and retry |
| `Session not found` | Expired session | Re-login |
| `Insufficient funds` | No NXS for fees | Use platform wallet |
| `Asset not found` | Wrong address/name | Check address format |

### Retry Logic

Asset creation has built-in retry (3 attempts, 5s delay):

```typescript
for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
        const response = await nexusClient.post('/assets/create/asset', {...});
        if (response.data.result) break;
    } catch (err) {
        if (shouldRetry(err) && attempt < maxRetries) {
            await sleep(5000);
            continue;
        }
        throw err;
    }
}
```

---

## Testing

### Unit Tests

Currently no unit test framework. Recommended: Jest or Vitest.

### E2E Tests

Run the full flow test:

```bash
cd backend
npx tsx scripts/e2e-test.ts
```

Tests cover:
- User registration
- Login
- Asset minting
- Blockchain verification
- Asset transfer
- Transaction lookup

### Nexus Connection Test

```bash
cd backend
npx tsx scripts/test-nexus-connection.ts
```

### Manual Testing

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Import Postman collection: `ORIA-API.postman_collection.json`
4. Run through the collection in order

---

## Common Issues & Solutions

### 1. "Unable to connect to blockchain node"

**Cause**: Nexus node not running or wrong URL

**Solution**:
- Use `NEXUS_BASE_URL=mock` for development
- Ensure node is running on configured port
- Check firewall/network settings

### 2. "This username is already registered"

**Cause**: Username exists on Nexus (even from previous tests)

**Solution**:
- Use unique usernames with timestamps
- Try a different username

### 3. Asset stuck in "registering" status

**Cause**: Nexus API failed but no error recorded

**Solution**:
- Check backend logs for errors
- Use `/retry/:id` endpoint
- Verify Nexus session is valid

### 4. Transfer fails with "Recipient not found"

**Cause**: Username lookup failed

**Solution**:
- Ensure recipient has registered
- Try email instead of username
- Check case sensitivity (usernames are lowercase)

### 5. "Nexus session unavailable" on login

**Cause**: Nexus node down or session creation failed

**Solution**:
- App still works for viewing assets
- Re-login when node is available
- Check nexusError field in response

---

## Environment Variables

### Backend (.env)

```env
PORT=3001
NODE_ENV=development

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Nexus
NEXUS_BASE_URL=mock  # or http://localhost:8080
NEXUS_API_KEY=       # optional
NEXUS_NETWORK=testnet

# Platform wallet (optional - for fee sponsorship)
NEXUS_PLATFORM_USERNAME=
NEXUS_PLATFORM_PASSWORD=
NEXUS_PLATFORM_PIN=
NEXUS_MAX_FEE_PER_TX=0.01
NEXUS_DAILY_FEE_LIMIT=10.0
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3001/api
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## File Structure Reference

```
backend/src/
├── config/
│   ├── supabase.ts      # Supabase client (service role)
│   └── nexus.ts         # Nexus client (mock + real modes)
├── controllers/
│   ├── auth.controller.ts    # Signup, login, logout
│   ├── mint.controller.ts    # Minting, transfers, discovery
│   ├── tx.controller.ts      # Transaction lookup
│   ├── upload.controller.ts  # File uploads
│   └── nexus.controller.ts   # Direct Nexus API access
├── services/
│   ├── asset.service.ts           # Core asset logic
│   └── platform-wallet.service.ts # Fee sponsorship
├── routes/
│   ├── auth.routes.ts
│   ├── mint.routes.ts
│   ├── tx.routes.ts
│   └── ...
├── utils/
│   └── response.ts      # Standard response helpers
├── scripts/
│   ├── e2e-test.ts              # Full flow test
│   └── test-nexus-connection.ts  # Nexus connectivity test
└── index.ts             # Express app entry point
```

---

## Future Considerations

1. **Caching** - Add Redis for session caching
2. **Queue System** - Use Bull/BullMQ for background jobs
3. **WebSockets** - Real-time status updates
4. **Rate Limiting** - Protect API endpoints
5. **Monitoring** - Add Sentry or similar
6. **CI/CD** - Automated testing and deployment

---

*Last updated: January 2025*
