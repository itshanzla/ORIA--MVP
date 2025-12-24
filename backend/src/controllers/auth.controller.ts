import { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { nexusClient, nexusConfig } from '../config/nexus.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const signup = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { email, password, username, name, pin, role } = req.body;

        // Validation
        if (!email || !password) {
            return errorResponse(res, 'Email and password are required', 400);
        }

        if (!username || username.length < 3) {
            return errorResponse(res, 'Username is required (minimum 3 characters)', 400);
        }

        // Enforce lowercase username
        const lowercaseUsername = username.toLowerCase();
        if (username !== lowercaseUsername) {
            return errorResponse(res, 'Username must be in lowercase', 400);
        }

        // Validate username format (alphanumeric only for Nexus)
        const nexusUsername = lowercaseUsername.replace(/[^a-z0-9]/g, '');
        if (nexusUsername.length < 3) {
            return errorResponse(res, 'Username must contain at least 3 alphanumeric characters', 400);
        }

        if (!pin || pin.length < 4) {
            return errorResponse(res, 'PIN (minimum 4 digits) is required for blockchain transactions', 400);
        }

        // Check if email already exists in Supabase first
        const { data: existingByEmail } = await supabase
            .from('profiles')
            .select('email')
            .eq('email', email)
            .limit(1);

        if (existingByEmail && existingByEmail.length > 0) {
            return errorResponse(res, 'An account with this email already exists', 400);
        }

        // Check if username already exists (case-insensitive)
        const { data: existingByUsername } = await supabase
            .from('profiles')
            .select('username')
            .ilike('username', lowercaseUsername)
            .limit(1);

        if (existingByUsername && existingByUsername.length > 0) {
            return errorResponse(res, 'This username is already taken', 400);
        }

        // Step 1: Create Nexus blockchain account
        let nexusGenesis: string | null = null;
        let nexusTxid: string | null = null;

        try {
            console.log(`Creating Nexus account for: ${nexusUsername}`);

            // Nexus API uses profiles/create/master for account creation
            const nexusResponse = await nexusClient.post('/profiles/create/master', {
                username: nexusUsername,
                password,
                pin
            });

            console.log('Nexus response:', JSON.stringify(nexusResponse.data));

            if (nexusResponse.data.result) {
                nexusTxid = nexusResponse.data.result.txid;
                nexusGenesis = nexusResponse.data.result.genesis || `pending:${nexusUsername}`;
            } else if (nexusResponse.data.error) {
                const nexusError = nexusResponse.data.error.message || 'Unknown error';

                // Check for specific Nexus errors
                if (nexusError.toLowerCase().includes('already exists') ||
                    nexusError.toLowerCase().includes('duplicate')) {
                    return errorResponse(res, 'This username is already registered on the blockchain', 400);
                }

                return errorResponse(res, `Blockchain error: ${nexusError}`, 400);
            }
        } catch (err: any) {
            console.error('Nexus API error:', err.response?.data || err.message);

            // Handle network errors
            if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.message?.includes('fetch failed')) {
                return errorResponse(res, 'Unable to connect to blockchain node. Please try again later.', 503);
            }

            // Handle Nexus API errors (axios wraps the response)
            const nexusErrorMsg = err.response?.data?.error?.message;
            if (nexusErrorMsg) {
                // Map Nexus errors to user-friendly messages
                if (nexusErrorMsg.toLowerCase().includes('already exists')) {
                    return errorResponse(res, 'This username is already registered on the blockchain', 400);
                }
                if (nexusErrorMsg.toLowerCase().includes('password must be')) {
                    return errorResponse(res, nexusErrorMsg, 400);
                }
                if (nexusErrorMsg.toLowerCase().includes('pin must be')) {
                    return errorResponse(res, nexusErrorMsg, 400);
                }
                if (nexusErrorMsg.toLowerCase().includes('username must be')) {
                    return errorResponse(res, nexusErrorMsg, 400);
                }
                return errorResponse(res, `Blockchain error: ${nexusErrorMsg}`, 400);
            }

            return errorResponse(res, 'Failed to create blockchain account. Please try again.', 500);
        }

        // If Nexus failed without throwing, don't proceed
        if (!nexusGenesis) {
            return errorResponse(res, 'Blockchain account creation failed. Please try again.', 500);
        }

        // Validate role
        const userRole = role === 'listener' ? 'listener' : 'creator';

        // Step 2: Create Supabase account with Nexus info
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: lowercaseUsername,
                    name: name || lowercaseUsername,
                    role: userRole,
                    nexus_username: nexusUsername,
                    nexus_genesis: nexusGenesis,
                    nexus_txid: nexusTxid,
                    pin_hash: Buffer.from(pin).toString('base64')
                }
            }
        });

        if (error) {
            // Handle specific Supabase errors
            if (error.message.includes('already registered') || error.message.includes('already exists')) {
                return errorResponse(res, 'An account with this email already exists', 400);
            }
            if (error.message.includes('password')) {
                return errorResponse(res, 'Password must be at least 6 characters', 400);
            }
            return errorResponse(res, error.message, 400);
        }

        // Step 3: Create Nexus session so user can mint immediately
        let nexusSession = null;
        try {
            console.log('Creating Nexus session after signup...');
            const loginResponse = await nexusClient.post('/sessions/create/local', {
                username: nexusUsername,
                password,
                pin
            });

            if (loginResponse.data.result?.session) {
                nexusSession = loginResponse.data.result.session;
                console.log('Nexus session created:', nexusSession.substring(0, 20) + '...');

                // Unlock for transactions
                await nexusClient.post('/sessions/unlock/local', {
                    session: nexusSession,
                    pin,
                    transactions: true,
                    notifications: true
                });
                console.log('Nexus session unlocked');
            }
        } catch (sessionErr: any) {
            console.error('Failed to create Nexus session after signup:', sessionErr.response?.data || sessionErr.message);
            // Don't fail signup if session creation fails - user can login again
        }

        return successResponse(res, {
            user: data.user,
            session: data.session,
            nexusSession, // Include session so user can mint immediately
            nexus: {
                genesis: nexusGenesis,
                username: nexusUsername,
                txid: nexusTxid
            }
        }, 'Account created successfully with blockchain wallet', 201);

    } catch (error: any) {
        console.error('Signup error:', error);
        return errorResponse(res, 'Registration failed. Please try again.', 500);
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
            if (error.message.includes('Invalid login')) {
                return errorResponse(res, 'Invalid email or password', 401);
            }
            return errorResponse(res, error.message, 401);
        }

        // Step 2: Get Nexus session for blockchain operations
        let nexusSession = null;
        let nexusError = null;
        const nexusUsername = data.user?.user_metadata?.nexus_username;
        const pinHash = data.user?.user_metadata?.pin_hash;

        if (nexusUsername && pinHash) {
            try {
                const pin = Buffer.from(pinHash, 'base64').toString();
                console.log(`Nexus login attempt for: ${nexusUsername}`);

                // Nexus API uses sessions/create/local for login
                const nexusResponse = await nexusClient.post('/sessions/create/local', {
                    username: nexusUsername,
                    password,
                    pin
                });

                console.log('Nexus login response:', JSON.stringify(nexusResponse.data));

                if (nexusResponse.data.result?.session) {
                    nexusSession = nexusResponse.data.result.session;
                    console.log('Nexus session obtained:', nexusSession.substring(0, 20) + '...');

                    // Unlock session for transactions
                    try {
                        await nexusClient.post('/sessions/unlock/local', {
                            session: nexusSession,
                            pin,
                            transactions: true,
                            notifications: true
                        });
                        console.log('Nexus session unlocked for transactions');
                    } catch (unlockErr: any) {
                        console.error('Failed to unlock session:', unlockErr.response?.data || unlockErr.message);
                    }
                } else {
                    console.error('Nexus login - no session in response');
                }
            } catch (nexusErr: any) {
                console.error('Nexus login error:', nexusErr.response?.data || nexusErr.message);
                nexusError = nexusErr.response?.data?.error?.message || 'Blockchain session unavailable';
                // Don't fail login if Nexus fails - user can still use app
            }
        } else {
            console.log('Nexus login skipped - missing username or pin:', { nexusUsername, hasPinHash: !!pinHash });
        }

        return successResponse(res, {
            user: data.user,
            session: data.session,
            nexusSession,
            nexusError // Let frontend know if blockchain isn't available
        }, 'Login successful');

    } catch (error: any) {
        console.error('Login error:', error);
        return errorResponse(res, 'Login failed. Please try again.', 500);
    }
};

export const logout = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            return errorResponse(res, error.message, 400);
        }

        return successResponse(res, null, 'Logout successful');

    } catch (error: any) {
        console.error('Logout error:', error);
        return errorResponse(res, 'Logout failed', 500);
    }
};
