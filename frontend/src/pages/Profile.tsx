import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import BottomNav from '../components/BottomNav';

interface UserData {
    email?: string;
    user_metadata?: {
        name?: string;
        username?: string;
        bio?: string;
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
                <h2 className="text-2xl font-semibold text-white mb-4">
                    {user?.user_metadata?.name || 'User'}
                </h2>

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
