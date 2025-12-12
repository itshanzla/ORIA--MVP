import express, { Router } from 'express';
import {
    createNexusAccount,
    loginToNexus,
    logoutFromNexus,
    getNexusStatus,
    getNexusProfile
} from '../controllers/nexus.controller.js';

const router: Router = express.Router();

// Account management
router.post('/create-account', createNexusAccount);
router.post('/login', loginToNexus);
router.post('/logout', logoutFromNexus);

// Status & info
router.get('/status', getNexusStatus);
router.get('/profile', getNexusProfile);

export default router;
