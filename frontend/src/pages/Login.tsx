import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import Loader from '../components/Loader';

interface FormData {
    email: string;
    password: string;
}

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<FormData>({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await authAPI.login(formData);

            if (response.data.success) {
                const { user, session } = response.data.data;
                localStorage.setItem('oria_user', JSON.stringify(user));
                localStorage.setItem('oria_token', session?.access_token || '');
                navigate('/home');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
            <div className="w-full max-w-md relative">
                {/* Logo */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-medium text-oria-purple tracking-wide mb-2">
                        ORIA
                    </h1>
                </div>

                {/* Login Card */}
                <div className="bg-[#0A0A0A] rounded-[2rem] p-8 border border-gray-800/50 shadow-2xl relative overflow-hidden">
                    <h2 className="text-3xl font-medium text-white mb-8 text-center tracking-tight">
                        Log in
                    </h2>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm text-oria-blue mb-2 font-medium ml-1">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full bg-[#111111] border border-gray-800 rounded-xl px-4 py-4 text-gray-200 placeholder-gray-500 focus:border-oria-blue focus:ring-1 focus:ring-oria-blue/50 transition-all outline-none"
                                placeholder="Enter your email"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-oria-blue mb-2 font-medium ml-1">
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="w-full bg-[#111111] border border-gray-800 rounded-xl px-4 py-4 text-gray-200 placeholder-gray-500 focus:border-oria-blue focus:ring-1 focus:ring-oria-blue/50 transition-all outline-none"
                                placeholder="Enter your password"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-black font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-oria-gold/20 mt-4 tracking-wide uppercase text-sm"
                        >
                            {loading ? 'Signing In...' : 'Continue'}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <Link
                            to="/register"
                            className="text-[#8B5CF6] hover:text-[#7C3AED] transition-colors font-medium text-sm"
                        >
                            Create an account
                        </Link>
                    </div>
                </div>
            </div>

            {loading && <Loader fullScreen text="Signing you in..." />}
        </div>
    );
};

export default Login;
