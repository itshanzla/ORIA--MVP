# 🚀 ORIA MVP - Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- npm package manager
- Supabase account

## 🎯 Setup Instructions

### 1. Backend Setup (TypeScript)

```bash
cd backend
npm install
```

**Configure Environment:**
```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:
```
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
NEXUS_BASE_URL=your_nexus_url (optional)
NEXUS_API_KEY=your_nexus_key (optional)
```

**Build and Run:**
```bash
npm run build    # Compile TypeScript
npm start        # Run production build

# OR for development with auto-reload:
npm run dev
```

Backend runs on: `http://localhost:3001`

---

### 2. Frontend Setup (React + TypeScript)

```bash
cd frontend
npm install
```

**Configure Environment:**
```bash
cp .env.example .env
```

Edit `.env` and add:
```
VITE_API_URL=http://localhost:3001/api
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Run Development Server:**
```bash
npm run dev
```

Frontend runs on: `http://localhost:3000`

---

## 📱 UI Features

The frontend includes:
- ✅ **Login Page** - Matching your mockup with gradient button
- ✅ **Signup Page** - All form fields with validation
- ✅ **Dashboard** - Stats, Nexus integration, Quick actions
- ✅ **Dark Theme** - Full black background with purple/blue gradients
- ✅ **PWA Support** - Installable on mobile devices
- ✅ **Mobile-First** - Responsive design
- ✅ **TypeScript** - Full type safety

## 🔧 Tech Stack

### Backend
- TypeScript + Express.js
- Supabase (Authentication)
- Nexus API Integration
- ES Modules

### Frontend
- React 18 + TypeScript
- Vite (Build tool)
- TailwindCSS (Styling)
- React Router (Navigation)
- PWA (Progressive Web App)

## 📊 API Endpoints

**Authentication:**
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`

**Nexus Integration:**
- `POST /api/nexus/create-account`
- `POST /api/nexus/login`
- `GET /api/nexus/status`

## 🧪 Testing

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Open `http://localhost:3000`
4. Try signup/login

## 🔐 Supabase Setup

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy your project URL and anon key
4. Add them to both backend and frontend `.env` files

## 📦 Production Build

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

## 🎨 Color Scheme

- Purple: `#8B5CF6`
- Blue: `#3B82F6`
- Gold: `#F59E0B`
- Dark BG: `#0A0A0A`
- Gray BG: `#1A1A1A`

## ✅ Next Steps

1. Configure your Supabase credentials
2. (Optional) Add Nexus API credentials
3. Run `npm install` in both directories
4. Start development servers
5. Test the authentication flow

---

Built with TypeScript + React + Express 🔥
