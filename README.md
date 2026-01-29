# ORIA - Digital Music & NFT Marketplace

A mobile app for creating, collecting, and sharing digital music on the blockchain.

---

## What is ORIA?

ORIA lets musicians and fans:
- **Create** digital music NFTs (like owning a unique digital record)
- **Collect** music from your favorite artists
- **Transfer** ownership to others
- **Verify** authenticity on the blockchain

---

## Getting Started

### What You Need

1. **Node.js** (version 18 or higher) - [Download here](https://nodejs.org/)
2. **Supabase account** (free) - [Sign up here](https://supabase.com)
3. **A code editor** (optional) - Like VS Code

### Step 1: Download the Code

```bash
git clone <repository-url>
cd ORIA--MVP
```

### Step 2: Set Up the Backend (Server)

```bash
cd backend
npm install
```

Create a file called `.env` and add:
```
PORT=3001
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXUS_BASE_URL=mock
```

Start the server:
```bash
npm run dev
```

You should see: `ORIA Backend server running on port 3001`

### Step 3: Set Up the Frontend (App)

Open a new terminal window:
```bash
cd frontend
npm install
```

Create a file called `.env` and add:
```
VITE_API_URL=http://localhost:3001/api
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_key_here
```

Start the app:
```bash
npm run dev
```

### Step 4: Open the App

Go to: **http://localhost:3000** in your browser

---

## How to Use ORIA

### Creating an Account

1. Click **Sign Up**
2. Enter your email and password
3. Choose a username (lowercase, like `johndoe`)
4. Create a PIN (4+ numbers) - this is for blockchain transactions
5. Select if you're a **Creator** (making music) or **Listener** (collecting)
6. Click **Create Account**

Your blockchain wallet is created automatically!

### Minting (Creating) Music

1. Log in to your account
2. Tap the **+** button to Mint
3. **Step 1**: Upload your audio file (MP3, WAV, etc.)
4. **Step 2**: Add cover art (optional)
5. **Step 3**: Fill in details (title, artist name, description)
6. **Step 4**: Set a price (in NXS coins)
7. **Step 5**: Review and tap **Mint**

Your music is now on the blockchain!

### Viewing Your Collection

1. Go to **Library**
2. See all your minted and collected music
3. Tap any item to play and see details

### Transferring Music

1. Go to an asset you own
2. Tap **Transfer**
3. Enter the recipient's username
4. Confirm with your PIN
5. Done! The ownership is transferred.

---

## Features

| Feature | Status |
|---------|--------|
| User accounts | ✅ Ready |
| Blockchain wallet | ✅ Ready |
| Upload music | ✅ Ready |
| Upload cover art | ✅ Ready |
| Mint to blockchain | ✅ Ready |
| Audio player | ✅ Ready |
| View collection | ✅ Ready |
| Transfer ownership | ✅ Ready |
| Discover music | ✅ Ready |

---

## Project Structure (Simple)

```
ORIA--MVP/
├── backend/          <- The server (handles data & blockchain)
├── frontend/         <- The app (what users see)
├── docs/             <- Documentation
└── README.md         <- This file
```

---

## Testing the App

### Quick Test

1. Import the Postman collection: `ORIA-API.postman_collection.json`
2. Run the requests in order (Sign Up → Login → Mint → etc.)

### Full Automatic Test

```bash
cd backend
npx tsx scripts/e2e-test.ts
```

This tests the complete flow automatically.

---

## Common Questions

### "What is the blockchain?"
Think of it like a public record book that can't be changed. When you mint music, it's recorded there permanently.

### "What is NXS?"
NXS is the currency used on the Nexus blockchain. You'll need some to pay for transactions (like small fees).

### "What is mock mode?"
Mock mode lets developers test without using real blockchain. Set `NEXUS_BASE_URL=mock` in your backend `.env` file.

### "How do I switch to real blockchain?"
Change `NEXUS_BASE_URL` to your Nexus node address (like `http://your-node:8080`).

---

## Troubleshooting

### "Server won't start"

1. Make sure you're in the right folder (`backend` or `frontend`)
2. Run `npm install` first
3. Check your `.env` file has all required values

### "Can't connect to database"

1. Check your Supabase URL and keys are correct
2. Make sure your Supabase project is active

### "Minting fails"

1. Make sure you're logged in
2. Check the file is under 50MB
3. Try logging out and back in

### "Transfer doesn't work"

1. Make sure the recipient has an ORIA account
2. Check you typed their username correctly (lowercase)
3. Make sure you own the asset

---

## For Developers

More technical documentation:

- [Developer Notes](docs/DEVELOPER_NOTES.md) - Architecture & code details
- [Support Handoff](docs/SUPPORT_HANDOFF.md) - Support & maintenance guide
- [API Collection](ORIA-API.postman_collection.json) - All API endpoints

### Run Tests

```bash
# Test blockchain connection
cd backend
npx tsx scripts/test-nexus-connection.ts

# Full end-to-end test
npx tsx scripts/e2e-test.ts
```

### Build for Production

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm run preview
```

---

## API Quick Reference

| Action | Endpoint | Method |
|--------|----------|--------|
| Sign up | `/api/auth/signup` | POST |
| Log in | `/api/auth/login` | POST |
| Log out | `/api/auth/logout` | POST |
| Mint music | `/api/mint` | POST |
| My music | `/api/mint/my-assets` | GET |
| Browse music | `/api/mint/discover` | GET |
| Transfer | `/api/mint/transfer` | POST |
| Check transaction | `/api/tx/:hash` | GET |

---

## Support

- **Documentation**: Check the `docs/` folder
- **Issues**: Report bugs on GitHub
- **Support Period**: 15 days after handoff

---

## Tech Stack (What's Under the Hood)

| Part | Technology |
|------|------------|
| App | React, TypeScript |
| Server | Node.js, Express |
| Database | Supabase (PostgreSQL) |
| Blockchain | Nexus |
| Styling | TailwindCSS |
| Build Tool | Vite |

---

Built with ❤️ for ORIA - Digital Music on the Blockchain
