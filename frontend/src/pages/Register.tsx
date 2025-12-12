import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import Loader from '../components/Loader';

interface FormData {
    name: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    pin: string;
}

type UserRole = 'creator' | 'listener';

const Register: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<FormData>({
        name: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        pin: ''
    });
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
    const [selectedRole, setSelectedRole] = useState<UserRole>('listener');
    const [agreeToTerms, setAgreeToTerms] = useState<boolean>(false);

    // Redirect if already logged in
    useEffect(() => {
        const user = localStorage.getItem('oria_user');
        if (user) {
            navigate('/home', { replace: true });
        }
    }, [navigate]);

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

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            setLoading(false);
            return;
        }

        if (!agreeToTerms) {
            setError('Please agree to the Terms & Privacy Policy');
            setLoading(false);
            return;
        }

        if (!formData.pin || formData.pin.length < 4) {
            setError('PIN must be at least 4 characters');
            setLoading(false);
            return;
        }

        try {
            const response = await authAPI.signup({
                name: formData.name,
                username: formData.username,
                email: formData.email,
                password: formData.password,
                pin: formData.pin
            });

            if (response.data.success) {
                const { user, session, nexusSession } = response.data.data;
                localStorage.setItem('oria_user', JSON.stringify(user));
                localStorage.setItem('oria_token', session?.access_token || '');
                // Store Nexus session for blockchain operations
                if (nexusSession) {
                    localStorage.setItem('oria_nexus_session', nexusSession);
                }
                navigate('/home', { replace: true });
            } else {
                setError(response.data.message || 'Registration failed');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getPasswordStrength = (): { label: string; color: string; width: string } => {
        const password = formData.password;
        if (!password) return { label: '', color: '', width: '0%' };
        if (password.length < 6) return { label: 'Weak', color: 'bg-status-error', width: '33%' };
        if (password.length < 10) return { label: 'Medium', color: 'bg-status-warning', width: '66%' };
        return { label: 'Strong', color: 'bg-status-success', width: '100%' };
    };

    const passwordStrength = getPasswordStrength();

    return (
        <div className="min-h-[100dvh] bg-surface-primary flex flex-col">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-40 w-80 h-80 bg-oria-purple/20 rounded-full blur-[100px]" />
                <div className="absolute top-1/3 -right-40 w-60 h-60 bg-oria-blue/15 rounded-full blur-[80px]" />
                <div className="absolute -bottom-40 left-1/4 w-60 h-60 bg-oria-gold/10 rounded-full blur-[80px]" />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-start px-6 py-8 relative z-10 overflow-y-auto">
                <div className="w-full max-w-[400px] animate-fade-in-up">

                    {/* Logo Section */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-oria-purple to-oria-blue mb-4 shadow-glow-purple">
                            <svg
                                className="w-7 h-7 text-white"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M12 2L2 7L12 12L22 7L12 2Z"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M2 17L12 22L22 17"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M2 12L12 17L22 12"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                        <h1 className="text-display-sm font-bold text-gradient-purple mb-1">
                            Join ORIA
                        </h1>
                        <p className="text-body-sm text-content-tertiary">
                            Create your account to get started
                        </p>
                    </div>

                    {/* Register Card */}
                    <div className="card p-6">
                        {/* Role Selection */}
                        <div className="mb-6">
                            <label className="block text-caption text-content-secondary font-medium mb-3">
                                I am a
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setSelectedRole('creator')}
                                    className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                                        selectedRole === 'creator'
                                            ? 'border-oria-purple bg-oria-purple/10'
                                            : 'border-stroke-primary bg-surface-tertiary hover:border-stroke-secondary'
                                    }`}
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                            selectedRole === 'creator' ? 'bg-oria-purple/20' : 'bg-surface-elevated'
                                        }`}>
                                            <svg className={`w-5 h-5 ${selectedRole === 'creator' ? 'text-oria-purple' : 'text-content-tertiary'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                            </svg>
                                        </div>
                                        <span className={`text-body-sm font-medium ${selectedRole === 'creator' ? 'text-content-primary' : 'text-content-secondary'}`}>
                                            Creator
                                        </span>
                                    </div>
                                    {selectedRole === 'creator' && (
                                        <div className="absolute top-2 right-2">
                                            <svg className="w-4 h-4 text-oria-purple" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setSelectedRole('listener')}
                                    className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                                        selectedRole === 'listener'
                                            ? 'border-oria-blue bg-oria-blue/10'
                                            : 'border-stroke-primary bg-surface-tertiary hover:border-stroke-secondary'
                                    }`}
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                            selectedRole === 'listener' ? 'bg-oria-blue/20' : 'bg-surface-elevated'
                                        }`}>
                                            <svg className={`w-5 h-5 ${selectedRole === 'listener' ? 'text-oria-blue' : 'text-content-tertiary'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                            </svg>
                                        </div>
                                        <span className={`text-body-sm font-medium ${selectedRole === 'listener' ? 'text-content-primary' : 'text-content-secondary'}`}>
                                            Listener
                                        </span>
                                    </div>
                                    {selectedRole === 'listener' && (
                                        <div className="absolute top-2 right-2">
                                            <svg className="w-4 h-4 text-oria-blue" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-5 p-4 bg-status-error/10 border border-status-error/20 rounded-xl flex items-start gap-3 animate-scale-in">
                                <svg className="w-5 h-5 text-status-error flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-body-sm text-status-error">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Name & Username Row */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="block text-caption text-content-secondary font-medium">
                                        Full name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        autoComplete="name"
                                        className="input"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-caption text-content-secondary font-medium">
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        required
                                        autoComplete="username"
                                        className="input"
                                        placeholder="johndoe"
                                    />
                                </div>
                            </div>

                            {/* Email Field */}
                            <div className="space-y-2">
                                <label className="block text-caption text-content-secondary font-medium">
                                    Email address
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-content-muted">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        autoComplete="email"
                                        className="input pl-12"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <label className="block text-caption text-content-secondary font-medium">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-content-muted">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        autoComplete="new-password"
                                        className="input pl-12 pr-12"
                                        placeholder="Min. 8 characters"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-secondary transition-colors"
                                    >
                                        {showPassword ? (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {/* Password Strength Indicator */}
                                {formData.password && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="flex-1 h-1 bg-surface-elevated rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${passwordStrength.color} transition-all duration-300`}
                                                style={{ width: passwordStrength.width }}
                                            />
                                        </div>
                                        <span className={`text-overline ${
                                            passwordStrength.label === 'Weak' ? 'text-status-error' :
                                            passwordStrength.label === 'Medium' ? 'text-status-warning' :
                                            'text-status-success'
                                        }`}>
                                            {passwordStrength.label}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password Field */}
                            <div className="space-y-2">
                                <label className="block text-caption text-content-secondary font-medium">
                                    Confirm password
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-content-muted">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                        autoComplete="new-password"
                                        className={`input pl-12 pr-12 ${
                                            formData.confirmPassword && formData.password !== formData.confirmPassword
                                                ? 'border-status-error focus:border-status-error focus:ring-status-error/20'
                                                : ''
                                        }`}
                                        placeholder="Re-enter password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-secondary transition-colors"
                                    >
                                        {showConfirmPassword ? (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                    <p className="text-caption text-status-error mt-1">Passwords do not match</p>
                                )}
                            </div>

                            {/* PIN Field */}
                            <div className="space-y-2">
                                <label className="block text-caption text-content-secondary font-medium">
                                    Transaction PIN
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-content-muted">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                        </svg>
                                    </div>
                                    <input
                                        type="password"
                                        name="pin"
                                        value={formData.pin}
                                        onChange={handleChange}
                                        required
                                        minLength={4}
                                        className="input pl-12"
                                        placeholder="Min. 4 characters"
                                    />
                                </div>
                                <p className="text-caption text-content-muted">
                                    Used for blockchain transactions (minting, transfers)
                                </p>
                            </div>

                            {/* Terms Agreement */}
                            <div className="flex items-start gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setAgreeToTerms(!agreeToTerms)}
                                    className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all ${
                                        agreeToTerms
                                            ? 'bg-oria-purple border-oria-purple'
                                            : 'border-stroke-secondary bg-transparent'
                                    }`}
                                >
                                    {agreeToTerms && (
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>
                                <p className="text-caption text-content-tertiary leading-relaxed">
                                    I agree to ORIA's{' '}
                                    <button type="button" className="text-oria-gold hover:underline">Terms of Service</button>
                                    {' '}and{' '}
                                    <button type="button" className="text-oria-gold hover:underline">Privacy Policy</button>
                                </p>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading || !agreeToTerms}
                                className="btn-secondary w-full h-14 text-body font-bold uppercase tracking-wider mt-4"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span>Creating account...</span>
                                    </div>
                                ) : (
                                    'Create Account'
                                )}
                            </button>
                        </form>

                        {/* Login Link */}
                        <div className="mt-6 text-center">
                            <span className="text-body-sm text-content-tertiary">
                                Already have an account?{' '}
                            </span>
                            <Link
                                to="/login"
                                className="text-body-sm font-semibold text-oria-purple hover:text-oria-purple-light transition-colors"
                            >
                                Sign in
                            </Link>
                        </div>
                    </div>

                    {/* Bottom Branding */}
                    <div className="mt-6 text-center pb-4">
                        <p className="text-caption text-content-muted">
                            Powered by Nexus Blockchain
                        </p>
                    </div>
                </div>
            </div>

            {loading && <Loader fullScreen text="Creating your account..." />}
        </div>
    );
};

export default Register;
