import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import Loader from '../components/Loader';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await authAPI.login(formData);

            if (response.data.success) {
                const { user, session } = response.data.data;
                localStorage.setItem('oria_user', JSON.stringify(user));
                localStorage.setItem('oria_token', session?.access_token || '');
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-oria-purple via-oria-blue to-oria-purple bg-clip-text text-transparent mb-2">
                        ORIA
                    </h1>
                </div>

                {/* Login Card */}
                <div className="bg-oria-gray rounded-3xl p-8 border border-gray-800 shadow-2xl">
                    <h2 className="text-3xl font-semibold text-white mb-8 text-center">
                        Log in
                    </h2>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm text-oria-blue mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-oria-blue focus:ring-2 focus:ring-oria-blue/20 transition-all"
                                placeholder="Enter your email"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-oria-blue mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-oria-blue focus:ring-2 focus:ring-oria-blue/20 transition-all"
                                placeholder="Enter your password"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-oria-gold to-yellow-600 hover:from-yellow-600 hover:to-oria-gold text-black font-semibold py-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-oria-gold/20"
                        >
                            {loading ? 'SIGNING IN...' : 'CONTINUE'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link
                            to="/register"
                            className="text-oria-purple hover:text-oria-blue transition-colors"
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
