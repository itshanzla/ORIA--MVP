import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import nexusRoutes from './routes/nexus.routes.js';
import assetsRoutes from './routes/assets.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import mintRoutes from './routes/mint.routes.js';
import { initializePlatformWallet, getDailyFeeStats, isPlatformWalletConfigured } from './services/platform-wallet.service.js';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'ORIA Backend API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        platformWallet: isPlatformWalletConfigured() ? 'configured' : 'not configured'
    });
});

// Platform fee stats endpoint (for admin/monitoring)
app.get('/api/platform/fees', (req: Request, res: Response) => {
    const stats = getDailyFeeStats();
    res.json({
        success: true,
        data: {
            configured: isPlatformWalletConfigured(),
            ...stats
        }
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/nexus', nexusRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/mint', mintRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.listen(PORT, async () => {
    console.log(`🚀 ORIA Backend server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}`);

    // Initialize platform wallet for sponsored fees
    await initializePlatformWallet();
});
