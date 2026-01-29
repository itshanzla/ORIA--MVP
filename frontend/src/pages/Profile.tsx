import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import BottomNav from '../components/BottomNav';

type UserRole = 'creator' | 'listener';

interface UserData {
    email?: string;
    user_metadata?: {
        name?: string;
        username?: string;
        bio?: string;
        role?: UserRole;
    };
}

interface ProfileFormData {
    name: string;
    username: string;
    email: string;
    bio: string;
}

const Profile: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<UserData | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [currentRole, setCurrentRole] = useState<UserRole>('listener');

    const [formData, setFormData] = useState<ProfileFormData>({
        name: '',
        username: '',
        email: '',
        bio: ''
    });

    useEffect(() => {
        const userData = localStorage.getItem('oria_user');
        if (userData) {
            const parsed = JSON.parse(userData);
            setUser(parsed);
            setCurrentRole(parsed.user_metadata?.role || 'listener');
            setFormData({
                name: parsed.user_metadata?.name || '',
                username: parsed.user_metadata?.username || '',
                email: parsed.email || '',
                bio: parsed.user_metadata?.bio || ''
            });
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('oria_user');
        localStorage.removeItem('oria_token');
        localStorage.removeItem('oria_nexus_session');
        localStorage.removeItem('oria_assets');
        toast.success('Logged out successfully');
        navigate('/login');
    };

    const handleSave = () => {
        // Validate username is lowercase
        if (formData.username !== formData.username.toLowerCase()) {
            toast.error('Username must be in lowercase');
            return;
        }

        // Update local storage with new data
        const updatedUser = {
            ...user,
            email: formData.email,
            user_metadata: {
                ...user?.user_metadata,
                name: formData.name,
                username: formData.username.toLowerCase(),
                bio: formData.bio
            }
        };
        localStorage.setItem('oria_user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setIsEditing(false);
        toast.success('Profile updated successfully');
    };

    const handleRoleChange = (newRole: UserRole) => {
        // Update role in localStorage
        const updatedUser = {
            ...user,
            user_metadata: {
                ...user?.user_metadata,
                role: newRole
            }
        };
        localStorage.setItem('oria_user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setCurrentRole(newRole);
        setShowRoleModal(false);
        toast.success(`Role changed to ${newRole === 'creator' ? 'Creator' : 'Listener'}`);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const menuItems = [
        { label: 'Collected', path: '/library' },
        { label: 'Offers', path: '/offers' },
        { label: 'History', path: '/history' },
        { label: 'Settings', path: '/settings' }
    ];

    // Edit Profile View
    if (isEditing) {
        return (
            <div className="min-h-[100dvh] bg-black pb-24">
                {/* Header */}
                <header className="flex items-center justify-between px-5 pt-12 pb-4">
                    <button onClick={() => setIsEditing(false)} className="w-10 h-10 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-light tracking-wider">
                        <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-violet-400 bg-clip-text text-transparent">
                            ORIA
                        </span>
                    </h1>
                    <button onClick={handleSave} className="text-blue-400 font-medium">
                        Save
                    </button>
                </header>

                {/* Avatar */}
                <div className="flex justify-center mt-8 mb-8">
                    <div className="relative">
                        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                            <span className="text-3xl font-semibold text-white">
                                {formData.name ? formData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                            </span>
                        </div>
                        <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Form Fields */}
                <div className="px-5 space-y-6">
                    <div>
                        <label className="block text-zinc-500 text-sm mb-2">Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full bg-transparent border-b border-zinc-800 py-3 text-white text-lg focus:outline-none focus:border-zinc-600"
                            placeholder="Your name"
                        />
                    </div>
                    <div>
                        <label className="block text-zinc-500 text-sm mb-2">Username</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            className="w-full bg-transparent border-b border-zinc-800 py-3 text-white text-lg focus:outline-none focus:border-zinc-600"
                            placeholder="@username"
                        />
                    </div>
                    <div>
                        <label className="block text-zinc-500 text-sm mb-2">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full bg-transparent border-b border-zinc-800 py-3 text-white text-lg focus:outline-none focus:border-zinc-600"
                            placeholder="email@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-zinc-500 text-sm mb-2">Bio</label>
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleInputChange}
                            rows={2}
                            className="w-full bg-transparent border-b border-zinc-800 py-3 text-white text-lg focus:outline-none focus:border-zinc-600 resize-none"
                            placeholder="Tell us about yourself"
                        />
                    </div>
                </div>

                <BottomNav />
            </div>
        );
    }

    // Main Profile View
    return (
        <div className="min-h-[100dvh] bg-black pb-24">
            {/* Header */}
            <header className="pt-12 pb-4 px-5">
                <h1 className="text-center text-xl font-light tracking-wider">
                    <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-violet-400 bg-clip-text text-transparent">
                        ORIA
                    </span>
                </h1>
            </header>

            {/* Profile Section */}
            <div className="flex flex-col items-center mt-8 mb-8">
                {/* Avatar */}
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-4">
                    <span className="text-3xl font-semibold text-white">
                        {user?.user_metadata?.name
                            ? user.user_metadata.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                            : user?.email?.[0]?.toUpperCase() || 'U'}
                    </span>
                </div>

                {/* Name */}
                <h2 className="text-2xl font-semibold text-white mb-2">
                    {user?.user_metadata?.name || 'User'}
                </h2>

                {/* Role Badge */}
                <div className={`px-3 py-1 rounded-full text-xs font-medium mb-4 ${
                    currentRole === 'creator'
                        ? 'bg-purple-900/50 text-purple-300 border border-purple-700'
                        : 'bg-blue-900/50 text-blue-300 border border-blue-700'
                }`}>
                    {currentRole === 'creator' ? 'Creator' : 'Listener'}
                </div>

                {/* Edit Profile Button */}
                <button
                    onClick={() => setIsEditing(true)}
                    className="px-8 py-3 bg-zinc-900 border border-zinc-800 rounded-full text-white font-medium hover:bg-zinc-800 transition-colors"
                >
                    Edit Profile
                </button>
            </div>

            {/* Divider */}
            <div className="h-px bg-zinc-900 mx-5" />

            {/* Menu Items */}
            <div className="px-5 mt-4">
                {/* Change Role Option */}
                <button
                    onClick={() => setShowRoleModal(true)}
                    className="w-full flex items-center justify-between py-4 border-b border-zinc-900 hover:bg-zinc-900/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            currentRole === 'creator' ? 'bg-purple-900/50' : 'bg-blue-900/50'
                        }`}>
                            {currentRole === 'creator' ? (
                                <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                </svg>
                            )}
                        </div>
                        <span className="text-white text-lg">Change Role</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-zinc-500 text-sm capitalize">{currentRole}</span>
                        <svg className="w-5 h-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </button>

                {menuItems.map((item) => (
                    <button
                        key={item.label}
                        onClick={() => navigate(item.path)}
                        className="w-full flex items-center justify-between py-4 border-b border-zinc-900 hover:bg-zinc-900/50 transition-colors"
                    >
                        <span className="text-white text-lg">{item.label}</span>
                        <svg className="w-5 h-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                ))}

                {/* Logout */}
                <button
                    onClick={() => setShowLogoutModal(true)}
                    className="w-full flex items-center justify-between py-4 mt-4 hover:bg-zinc-900/50 transition-colors"
                >
                    <span className="text-red-500 text-lg">Log Out</span>
                </button>
            </div>

            {/* Role Change Modal */}
            {showRoleModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={() => setShowRoleModal(false)}
                    />
                    <div className="relative w-full bg-zinc-900 rounded-t-3xl p-6 pb-10">
                        <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-6" />

                        <h2 className="text-xl font-semibold text-white mb-2 text-center">
                            Change Your Role
                        </h2>
                        <p className="text-sm text-zinc-500 mb-6 text-center">
                            Choose how you want to use ORIA
                        </p>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <button
                                onClick={() => handleRoleChange('creator')}
                                className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                                    currentRole === 'creator'
                                        ? 'border-purple-500 bg-purple-500/10'
                                        : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                                }`}
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                        currentRole === 'creator' ? 'bg-purple-500/20' : 'bg-zinc-700'
                                    }`}>
                                        <svg className={`w-6 h-6 ${currentRole === 'creator' ? 'text-purple-400' : 'text-zinc-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                        </svg>
                                    </div>
                                    <span className={`text-base font-medium ${currentRole === 'creator' ? 'text-white' : 'text-zinc-300'}`}>
                                        Creator
                                    </span>
                                    <span className="text-xs text-zinc-500 text-center">
                                        Mint & sell music
                                    </span>
                                </div>
                                {currentRole === 'creator' && (
                                    <div className="absolute top-2 right-2">
                                        <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </button>

                            <button
                                onClick={() => handleRoleChange('listener')}
                                className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                                    currentRole === 'listener'
                                        ? 'border-blue-500 bg-blue-500/10'
                                        : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                                }`}
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                        currentRole === 'listener' ? 'bg-blue-500/20' : 'bg-zinc-700'
                                    }`}>
                                        <svg className={`w-6 h-6 ${currentRole === 'listener' ? 'text-blue-400' : 'text-zinc-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                        </svg>
                                    </div>
                                    <span className={`text-base font-medium ${currentRole === 'listener' ? 'text-white' : 'text-zinc-300'}`}>
                                        Listener
                                    </span>
                                    <span className="text-xs text-zinc-500 text-center">
                                        Discover & collect
                                    </span>
                                </div>
                                {currentRole === 'listener' && (
                                    <div className="absolute top-2 right-2">
                                        <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </button>
                        </div>

                        <button
                            onClick={() => setShowRoleModal(false)}
                            className="w-full py-3 text-zinc-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Logout Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={() => setShowLogoutModal(false)}
                    />
                    <div className="relative w-full max-w-sm bg-zinc-900 rounded-2xl p-6">
                        <h3 className="text-xl font-semibold text-white text-center mb-2">Log Out?</h3>
                        <p className="text-zinc-500 text-center mb-6">Are you sure you want to log out?</p>
                        <div className="space-y-3">
                            <button
                                onClick={handleLogout}
                                className="w-full py-3 bg-red-600 rounded-xl text-white font-semibold hover:bg-red-700 transition-colors"
                            >
                                Log Out
                            </button>
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="w-full py-3 bg-zinc-800 rounded-xl text-white font-medium hover:bg-zinc-700 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
};

export default Profile;
