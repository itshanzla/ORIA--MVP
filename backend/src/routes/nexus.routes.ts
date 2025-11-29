import express, { Router } from 'express';
import { createNexusAccount, loginToNexus, getNexusStatus } from '../controllers/nexus.controller.js';

const router: Router = express.Router();

router.post('/create-account', createNexusAccount);
router.post('/login', loginToNexus);
router.get('/status', getNexusStatus);

export default router;
