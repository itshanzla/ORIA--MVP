import { supabase } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const signup = async (req, res) => {
    try {
        const { email, password, username, name } = req.body;

        if (!email || !password) {
            return errorResponse(res, 'Email and password are required', 400);
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username,
                    name
                }
            }
        });

        if (error) {
            return errorResponse(res, error.message, 400, error);
        }

        return successResponse(res, {
            user: data.user,
            session: data.session
        }, 'User registered successfully', 201);

    } catch (error) {
        console.error('Signup error:', error);
        return errorResponse(res, 'Registration failed', 500, error);
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return errorResponse(res, 'Email and password are required', 400);
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            return errorResponse(res, error.message, 401, error);
        }

        return successResponse(res, {
            user: data.user,
            session: data.session
        }, 'Login successful');

    } catch (error) {
        console.error('Login error:', error);
        return errorResponse(res, 'Login failed', 500, error);
    }
};

export const logout = async (req, res) => {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            return errorResponse(res, error.message, 400, error);
        }

        return successResponse(res, null, 'Logout successful');

    } catch (error) {
        console.error('Logout error:', error);
        return errorResponse(res, 'Logout failed', 500, error);
    }
};
