import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { nexusAPI } from '../services/api';
import Loader from '../components/Loader';

interface User {
    email: string;
    [key: string]: any;
}

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [nexusStatus, setNexusStatus] = useState<any>(null);

    useEffect(() => {
        const userData = localStorage.getItem('oria_user');
        if (!userData) {
            navigate('/login');
            return;
        }

        setUser(JSON.parse(userData));
        checkNexusStatus();
    }, [navigate]);

    const checkNexusStatus = async (): Promise<void> => {
        try {
            const response = await nexusAPI.getStatus();
            setNexusStatus(response.data);
        } catch (error) {
            console.error('Failed to fetch Nexus status:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Loader fullScreen text="Loading dashboard..." />;
    }

    return (
        <div className="min-h-screen bg-black pt-20 pb-24 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">
                        Welcome back!
                    </h1>
                    <p className="text-gray-400">
                        {user?.email}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-oria-purple/10 to-oria-purple/5 border border-oria-purple/20 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-400 font-medium">Account Status</h3>
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                        <p className="text-3xl font-bold text-white">Active</p>
                    </div>

                    <div className="bg-gradient-to-br from-oria-blue/10 to-oria-blue/5 border border-oria-blue/20 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-400 font-medium">Collections</h3>
                            <svg className="w-6 h-6 text-oria-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <p className="text-3xl font-bold text-white">0</p>
                    </div>

                    <div className="bg-gradient-to-br from-oria-gold/10 to-oria-gold/5 border border-oria-gold/20 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-400 font-medium">Total Value</h3>
                            <svg className="w-6 h-6 text-oria-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-3xl font-bold text-white">$0.00</p>
                    </div>
                </div>

                {/* Nexus Integration Section */}
                <div className="bg-oria-gray rounded-2xl p-6 border border-gray-800 mb-8">
                    <h2 className="text-2xl font-semibold text-white mb-4">
                        Nexus Integration
                    </h2>

                    {nexusStatus ? (
                        <div className="space-y-2">
                            <p className="text-green-400 flex items-center">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                Connected to Nexus
                            </p>
                            <p className="text-sm text-gray-400">
                                Nexus API is operational and ready to use.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-yellow-400 flex items-center">
                                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                                Nexus not configured
                            </p>
                            <p className="text-sm text-gray-400">
                                Configure your Nexus API credentials in the backend to enable integration.
                            </p>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="bg-oria-gray rounded-2xl p-6 border border-gray-800">
                    <h2 className="text-2xl font-semibold text-white mb-6">
                        Quick Actions
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button className="bg-gradient-to-r from-oria-purple to-purple-600 hover:from-purple-600 hover:to-oria-purple text-white font-semibold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] text-left">
                            <div className="text-lg mb-1">Explore Collections</div>
                            <div className="text-sm opacity-80">Browse available NFTs</div>
                        </button>

                        <button className="bg-gradient-to-r from-oria-blue to-blue-600 hover:from-blue-600 hover:to-oria-blue text-white font-semibold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] text-left">
                            <div className="text-lg mb-1">My Wallet</div>
                            <div className="text-sm opacity-80">Manage your assets</div>
                        </button>

                        <button className="bg-gradient-to-r from-oria-gold to-yellow-600 hover:from-yellow-600 hover:to-oria-gold text-black font-semibold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] text-left">
                            <div className="text-lg mb-1">Create NFT</div>
                            <div className="text-sm opacity-80">Mint your own collection</div>
                        </button>

                        <button className="bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] text-left">
                            <div className="text-lg mb-1">Settings</div>
                            <div className="text-sm opacity-80">Configure your account</div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
