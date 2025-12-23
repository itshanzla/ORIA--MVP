import express, { Router } from 'express';
import {
    createNexusAccount,
    loginToNexus,
    logoutFromNexus,
    getNexusStatus,
    getNexusProfile,
    getNodeHealth
} from '../controllers/nexus.controller.js';

const router: Router = express.Router();

// Account management
router.post('/create-account', createNexusAccount);
router.post('/login', loginToNexus);
router.post('/logout', logoutFromNexus);

// Status & health
router.get('/status', getNexusStatus);
router.get('/health', getNodeHealth);  // Enhanced health check for testnet validation
router.get('/profile', getNexusProfile);

export default router;
