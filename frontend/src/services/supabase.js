import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export const supabaseAuth = {
    getCurrentUser: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    },

    getSession: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    },

    signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        localStorage.removeItem('oria_user');
        localStorage.removeItem('oria_token');
    },
};

export default supabase;
