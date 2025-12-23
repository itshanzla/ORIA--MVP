# ORIA - Digital Music & NFT Marketplace

A mobile-first PWA for minting, collecting, and transferring audio NFTs on the Nexus blockchain.

## Project Status: MVP Development

### Completed Features

| Feature | Status | Description |
|---------|--------|-------------|
| User Authentication | ✅ Complete | Supabase auth with auto Nexus wallet creation |
| Audio Upload | ✅ Complete | Upload to Supabase Storage (50MB max) |
| Cover Art Upload | ✅ Complete | Image upload for NFT artwork |
| Asset Minting UI | ✅ Complete | 5-step wizard flow |
| Audio Player | ✅ Complete | Play/pause, seek, progress bar |
| Library View | ✅ Complete | View all minted assets |
| Asset Detail | ✅ Complete | Full asset view with playback |
| Transfer UI | ✅ Complete | Transfer ownership modal |
| Blockchain Integration | ✅ Complete | Nexus API integration (mock + real) |
| Database Schema | ✅ Complete | Supabase tables for assets & transfers |

## Tech Stack

### Backend
- **Node.js + Express** - API server
- **TypeScript** - Type safety
- **Supabase** - Auth, Database, Storage
- **Nexus API** - Blockchain integration
- **Multer** - File uploads

### Frontend
- **React 18 + TypeScript** - UI framework
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **PWA** - Installable mobile app
- **React Router** - Navigation

## Project Structure

```
ORIA--MVP/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── supabase.ts      # Supabase client
│   │   │   └── nexus.ts         # Nexus client (mock + real)
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts    # Auth + Nexus account creation
│   │   │   ├── mint.controller.ts    # Minting & transfers
│   │   │   ├── upload.controller.ts  # File uploads
│   │   │   └── nexus.controller.ts   # Nexus API endpoints
│   │   ├── services/
│   │   │   └── asset.service.ts      # Asset business logic
│   │   ├── routes/
│   │   └── index.ts
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.tsx        # Login with Nexus session
│   │   │   ├── Register.tsx     # Registration with PIN
│   │   │   ├── Home.tsx         # Marketplace home
│   │   │   ├── Discover.tsx     # Search & browse
│   │   │   ├── Mint.tsx         # 5-step minting wizard
│   │   │   ├── Library.tsx      # User's collection
│   │   │   ├── AssetDetail.tsx  # Asset view + player
│   │   │   └── Profile.tsx      # User profile
│   │   ├── components/
│   │   │   ├── BottomNav.tsx    # Navigation bar
│   │   │   └── Loader.tsx       # Loading spinner
│   │   └── services/
│   │       └── api.ts           # API client
│   └── .env
│
└── README.md
```

## Setup

### 1. Backend Setup

```bash
cd backend
npm install
```

Create `.env`:
```env
PORT=3001
NODE_ENV=development

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Nexus (use 'mock' for development)
NEXUS_BASE_URL=mock
NEXUS_API_KEY=
```

Run:
```bash
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create `.env`:
```env
VITE_API_URL=http://localhost:3001/api
```

Run:
```bash
npm run dev
```

### 3. Database Setup

Run this SQL in Supabase Dashboard → SQL Editor:

```sql
-- Assets table
CREATE TABLE assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    owner_genesis VARCHAR(256),
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255) NOT NULL,
    description TEXT,
    genre VARCHAR(100),
    price DECIMAL(18, 8) NOT NULL DEFAULT 0,
    is_limited BOOLEAN DEFAULT FALSE,
    limited_supply INTEGER,
    audio_url TEXT NOT NULL,
    audio_path TEXT NOT NULL,
    cover_url TEXT,
    cover_path TEXT,
    nexus_address VARCHAR(256) UNIQUE,
    nexus_name VARCHAR(255),
    nexus_txid VARCHAR(256),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    last_error TEXT,
    retry_count INTEGER DEFAULT 0
);

CREATE INDEX idx_assets_user_id ON assets(user_id);
CREATE INDEX idx_assets_nexus_address ON assets(nexus_address);
CREATE INDEX idx_assets_status ON assets(status);

-- Transfers table
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

CREATE INDEX idx_transfers_asset_id ON asset_transfers(asset_id);

-- If upgrading from older schema, add the to_user_id column:
-- ALTER TABLE asset_transfers ADD COLUMN IF NOT EXISTS to_user_id UUID;
```

Also create a storage bucket named `oria-assets` in Supabase Storage.

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register (creates Nexus wallet) |
| POST | `/api/auth/login` | Login (returns Nexus session) |
| POST | `/api/auth/logout` | Logout |

### Minting & Assets
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/mint` | Mint new asset (multipart) |
| GET | `/api/mint/my-assets` | Get user's assets |
| GET | `/api/mint/asset/:id` | Get asset with verification |
| GET | `/api/mint/verify/:address` | Verify on blockchain |
| POST | `/api/mint/confirm/:id` | Confirm registration |
| POST | `/api/mint/transfer` | Transfer asset |
| POST | `/api/mint/transfer/confirm/:id` | Confirm transfer |

### File Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload/audio` | Upload audio file |
| POST | `/api/upload/cover` | Upload cover image |
| POST | `/api/upload/asset` | Upload both files |

### Nexus
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/nexus/create-account` | Create Nexus account |
| POST | `/api/nexus/login` | Login to Nexus |
| GET | `/api/nexus/status` | Node status |

## User Flow

### Registration
```
User fills form (email, password, username, PIN)
         ↓
Backend creates Nexus blockchain account
         ↓
Backend creates Supabase account (stores nexus_genesis)
         ↓
User logged in with blockchain wallet ready
```

### Minting
```
Step 1: Upload Audio (.mp3, .wav, etc.)
Step 2: Upload Cover Art (optional)
Step 3: Enter Details (title, artist, description)
Step 4: Set Price (in NXS)
Step 5: Review & Mint
         ↓
Files uploaded to Supabase Storage
         ↓
Asset registered on Nexus blockchain
         ↓
Stored in database with txid & address
```

### Transfer
```
Owner initiates transfer → enters recipient username
         ↓
Verify ownership on blockchain
         ↓
Call Nexus transfer API
         ↓
Update database, record in transfers table
```

## Blockchain Modes

| Mode | `.env` Setting | Use Case |
|------|---------------|----------|
| Mock | `NEXUS_BASE_URL=mock` | Development without blockchain |
| Real | `NEXUS_BASE_URL=http://localhost:8080` | Production with Nexus node |

## Pending / Needs Client Input

1. **Nexus Node Access** - Need URL to real Nexus node
2. **NXS Coins** - Confirm if needed for transactions
3. **Testnet vs Mainnet** - Which network to use
4. **Transaction Fees** - Who pays (app or users)

## Screenshots

The app follows a dark theme with purple/blue gradients:

- **Home**: Search bar, category tabs, trending NFTs grid
- **Mint**: 5-step wizard with upload areas
- **Library**: Collection list with cover art
- **Asset Detail**: Full-screen artwork, audio player, provenance
- **Profile**: User info, menu, logout

## Scripts

### Backend
```bash
npm run dev      # Development
npm run build    # Compile TypeScript
npm start        # Production
```

### Frontend
```bash
npm run dev      # Development
npm run build    # Production build
npm run preview  # Preview build
```

## License

MIT

---

Built for ORIA - Digital Music & NFT Marketplace on Nexus Blockchain
