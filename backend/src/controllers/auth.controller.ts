import { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { nexusClient } from '../config/nexus.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const signup = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { email, password, username, name, pin } = req.body;

        if (!email || !password) {
            return errorResponse(res, 'Email and password are required', 400);
        }

        if (!username) {
            return errorResponse(res, 'Username is required', 400);
        }

        if (!pin || pin.length < 4) {
            return errorResponse(res, 'PIN (minimum 4 characters) is required for blockchain transactions', 400);
        }

        // Step 1: Create Nexus blockchain account first
        let nexusGenesis = null;
        let nexusTxid = null;
        let nexusError = null;

        try {
            const nexusResponse = await nexusClient.post('/users/create/user', {
                username: username.toLowerCase().replace(/[^a-z0-9]/g, ''),
                password,
                pin
            });

            if (nexusResponse.data.result) {
                nexusGenesis = nexusResponse.data.result.genesis;
                nexusTxid = nexusResponse.data.result.txid;
            } else {
                nexusError = nexusResponse.data.error?.message || 'Nexus account creation failed';
            }
        } catch (err: any) {
            nexusError = err.response?.data?.error?.message || err.message || 'Failed to create blockchain account';
            console.error('Nexus account creation error:', nexusError);
        }

        // If Nexus failed, don't proceed
        if (!nexusGenesis) {
            return errorResponse(res, `Blockchain account creation failed: ${nexusError}`, 400);
        }

        // Step 2: Create Supabase account with Nexus info in metadata
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username,
                    name,
                    nexus_username: username.toLowerCase().replace(/[^a-z0-9]/g, ''),
                    nexus_genesis: nexusGenesis,
                    nexus_txid: nexusTxid,
                    pin_hash: Buffer.from(pin).toString('base64') // Store PIN encoded (not secure, but simple for MVP)
                }
            }
        });

        if (error) {
            // TODO: Ideally we should rollback Nexus account here, but Nexus doesn't support deletion
            return errorResponse(res, error.message, 400, error);
        }

        return successResponse(res, {
            user: data.user,
            session: data.session,
            nexus: {
                genesis: nexusGenesis,
                username: username.toLowerCase().replace(/[^a-z0-9]/g, '')
            }
        }, 'Account created successfully with blockchain wallet', 201);

    } catch (error: any) {
        console.error('Signup error:', error);
        return errorResponse(res, 'Registration failed', 500, error);
    }
};

export const login = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return errorResponse(res, 'Email and password are required', 400);
        }

        // Step 1: Login to Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            return errorResponse(res, error.message, 401, error);
        }

        // Step 2: Get Nexus session for blockchain operations
        let nexusSession = null;
        const nexusUsername = data.user?.user_metadata?.nexus_username;
        const pinHash = data.user?.user_metadata?.pin_hash;

        if (nexusUsername && pinHash) {
            try {
                const pin = Buffer.from(pinHash, 'base64').toString();
                const nexusResponse = await nexusClient.post('/users/login/user', {
                    username: nexusUsername,
                    password,
                    pin
                });

                if (nexusResponse.data.result?.session) {
                    nexusSession = nexusResponse.data.result.session;
                }
            } catch (nexusErr: any) {
                console.error('Nexus login error:', nexusErr.response?.data?.error?.message || nexusErr.message);
                // Don't fail login if Nexus fails - user can still use app, just not blockchain features
            }
        }

        return successResponse(res, {
            user: data.user,
            session: data.session,
            nexusSession // Include Nexus session for blockchain operations
        }, 'Login successful');

    } catch (error: any) {
        console.error('Login error:', error);
        return errorResponse(res, 'Login failed', 500, error);
    }
};

export const logout = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            return errorResponse(res, error.message, 400, error);
        }

        return successResponse(res, null, 'Logout successful');

    } catch (error: any) {
        console.error('Logout error:', error);
        return errorResponse(res, 'Logout failed', 500, error);
    }
};
