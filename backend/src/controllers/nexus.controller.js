import { nexusClient } from '../config/nexus.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const createNexusAccount = async (req, res) => {
    try {
        const { email, password, username } = req.body;

        if (!email || !password) {
            return errorResponse(res, 'Email and password are required', 400);
        }

        const response = await nexusClient.post('/create-account', {
            email,
            password,
            username
        });

        return successResponse(res, response.data, 'Nexus account created successfully', 201);

    } catch (error) {
        console.error('Nexus create account error:', error);
        return errorResponse(
            res,
            error.response?.data?.message || 'Failed to create Nexus account',
            error.response?.status || 500,
            error
        );
    }
};

export const loginToNexus = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return errorResponse(res, 'Email and password are required', 400);
        }

        const response = await nexusClient.post('/login', {
            email,
            password
        });

        return successResponse(res, response.data, 'Nexus login successful');

    } catch (error) {
        console.error('Nexus login error:', error);
        return errorResponse(
            res,
            error.response?.data?.message || 'Nexus login failed',
            error.response?.status || 500,
            error
        );
    }
};

export const getNexusStatus = async (req, res) => {
    try {
        const response = await nexusClient.get('/status');
        return successResponse(res, response.data, 'Nexus status retrieved');
    } catch (error) {
        console.error('Nexus status error:', error);
        return errorResponse(
            res,
            'Failed to get Nexus status',
            error.response?.status || 500,
            error
        );
    }
};
