# ORIA MVP - Monorepo (TypeScript)

A full-stack TypeScript application for ORIA - Digital Music & NFT Marketplace.

## 📁 Project Structure

```
oria-mvp/
├── backend/          # Express.js API (TypeScript)
├── frontend/         # React + Vite (TypeScript)
├── docs/            # Documentation
├── QUICKSTART.md    # Quick setup guide
└── README.md        # This file
```

## 🚀 Quick Start

See [QUICKSTART.md](./QUICKSTART.md) for detailed setup instructions.

**TL;DR:**
```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your Supabase credentials
npm run dev

# Frontend (in new terminal)
cd frontend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

## 🛠️ Tech Stack

### Backend
- **TypeScript** - Type-safe JavaScript
- **Express.js** - Web framework
- **Supabase** - Authentication & database
- **Nexus API** - Blockchain integration
- **Axios** - HTTP client

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **React Router** - Navigation
- **PWA** - Progressive Web App

## 📱 Features

-Dark theme UI matching ORIA brand
- ✅ User authentication (Supabase)
- ✅ Protected routes
- ✅ PWA support for mobile
- ✅ Responsive design
- ✅ TypeScript throughout
- ✅ Nexus blockchain integration

## 🎯 Milestone 1 Complete

✅ Monorepo setup
✅ Backend with TypeScript + Express + Supabase + Nexus
✅ Frontend with React + TypeScript + Vite + PWA
✅ Authentication system
✅ UI matching mockups
✅ Full type safety

## 📚 Documentation

- [Quick Start Guide](./QUICKSTART.md)
- [Backend Documentation](./docs/README.md)
- Environment setup in `.env.example` files

## 🔐 Environment Variables

See `.env.example` files in both `backend` and `frontend` directories.

You'll need:
- Supabase URL and API key (required)
- Nexus API credentials (optional)

## 📦 Scripts

### Backend
```bash
npm run dev    # Development with auto-reload
npm run build  # Compile TypeScript
npm start      # Run production build
```

### Frontend
```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
```

## 🎨 UI Pages

1. **Login** - Dark theme with gradient gold button
2. **Register** - Full signup form
3. **Dashboard** - Stats, Nexus status, quick actions

All pages are fully responsive and PWA-ready.

## 📄 License

MIT

---

Built with TypeScript 💙
