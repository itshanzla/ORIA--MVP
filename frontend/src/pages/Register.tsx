import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import Loader from '../components/Loader';

interface FormData {
    name: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}

const Register: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<FormData>({
        name: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
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

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const response = await authAPI.signup({
                name: formData.name,
                username: formData.username,
                email: formData.email,
                password: formData.password
            });

            if (response.data.success) {
                const { user, session } = response.data.data;
                localStorage.setItem('oria_user', JSON.stringify(user));
                localStorage.setItem('oria_token', session?.access_token || '');
                navigate('/dashboard');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-8">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-oria-purple via-oria-blue to-oria-purple bg-clip-text text-transparent mb-2">
                        ORIA
                    </h1>
                </div>

                {/* Signup Card */}
                <div className="bg-oria-gray rounded-3xl p-8 border border-gray-800 shadow-2xl">
                    <h2 className="text-3xl font-semibold text-white mb-6 text-center">
                        Signup
                    </h2>

                    {error && (
                        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Name"
                                required
                                className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-oria-purple focus:ring-2 focus:ring-oria-purple/20 transition-all"
                            />
                        </div>

                        <div>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="Username"
                                required
                                className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-oria-purple focus:ring-2 focus:ring-oria-purple/20 transition-all"
                            />
                        </div>

                        <div>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Email"
                                required
                                className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-oria-purple focus:ring-2 focus:ring-oria-purple/20 transition-all"
                            />
                        </div>

                        <div>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Password"
                                required
                                className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-oria-purple focus:ring-2 focus:ring-oria-purple/20 transition-all"
                            />
                        </div>

                        <div>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm Password"
                                required
                                className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-oria-purple focus:ring-2 focus:ring-oria-purple/20 transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-oria-purple hover:bg-purple-600 text-white font-semibold py-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-oria-purple/20 mt-6"
                        >
                            {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <span className="text-gray-400">Already have an account?</span>{' '}
                        <Link
                            to="/login"
                            className="text-oria-purple hover:text-oria-blue transition-colors font-semibold"
                        >
                            Log in
                        </Link>
                    </div>

                    <p className="text-xs text-gray-500 text-center mt-6">
                        By signing up you agree to ORIA's<br />
                        Terms & Privacy.
                    </p>
                </div>
            </div>

            {loading && <Loader fullScreen text="Creating your account..." />}
        </div>
    );
};

export default Register;
