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
                navigate('/home');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-8">
            <div className="w-full max-w-md relative">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-medium text-oria-purple tracking-wide mb-2">
                        ORIA
                    </h1>
                </div>

                {/* Signup Card */}
                <div className="bg-[#0A0A0A] rounded-[2rem] p-8 border border-gray-800/50 shadow-2xl relative overflow-hidden">
                    <h2 className="text-3xl font-medium text-white mb-8 text-center tracking-tight">
                        Signup
                    </h2>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm">
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
                                className="w-full bg-[#111111] border border-gray-800 rounded-xl px-4 py-4 text-gray-200 placeholder-gray-500 focus:border-oria-purple focus:ring-1 focus:ring-oria-purple/50 transition-all outline-none"
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
                                className="w-full bg-[#111111] border border-gray-800 rounded-xl px-4 py-4 text-gray-200 placeholder-gray-500 focus:border-oria-purple focus:ring-1 focus:ring-oria-purple/50 transition-all outline-none"
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
                                className="w-full bg-[#111111] border border-gray-800 rounded-xl px-4 py-4 text-gray-200 placeholder-gray-500 focus:border-oria-purple focus:ring-1 focus:ring-oria-purple/50 transition-all outline-none"
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
                                className="w-full bg-[#111111] border border-gray-800 rounded-xl px-4 py-4 text-gray-200 placeholder-gray-500 focus:border-oria-purple focus:ring-1 focus:ring-oria-purple/50 transition-all outline-none"
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
                                className="w-full bg-[#111111] border border-gray-800 rounded-xl px-4 py-4 text-gray-200 placeholder-gray-500 focus:border-oria-purple focus:ring-1 focus:ring-oria-purple/50 transition-all outline-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-8 tracking-wide uppercase text-sm"
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <span className="text-gray-500 text-sm">Already have an account?</span>{' '}
                        <Link
                            to="/login"
                            className="text-[#8B5CF6] hover:text-[#7C3AED] transition-colors font-medium text-sm ml-1"
                        >
                            Log in
                        </Link>
                    </div>

                    <p className="text-xs text-gray-500 text-center mt-8 leading-relaxed">
                        By signing up you agree to ORIA's<br />
                        <span className="text-[#F59E0B] cursor-pointer hover:underline">Terms & Privacy</span>.
                    </p>
                </div>
            </div>

            {loading && <Loader fullScreen text="Creating your account..." />}
        </div>
    );
};

export default Register;
