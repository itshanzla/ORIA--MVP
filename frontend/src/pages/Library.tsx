import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { mintAPI } from '../services/api';

type LibraryTab = 'Music' | 'Tickets' | 'Art';

interface MintedAsset {
    id: string;
    title: string;
    artist: string;
    description?: string;
    genre?: string;
    price: string;
    isLimited?: boolean;
    limitedSupply?: string;
    audioUrl?: string;
    audio_url?: string;
    audioPath?: string;
    audio_path?: string;
    coverUrl?: string | null;
    cover_url?: string | null;
    coverPath?: string | null;
    cover_path?: string | null;
    createdAt?: string;
    created_at?: string;
    status: string;
    nexus_address?: string;
    nexus_txid?: string;
}

const Library: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<LibraryTab>('Music');
    const [mintedAssets, setMintedAssets] = useState<MintedAsset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const tabs: LibraryTab[] = ['Music', 'Tickets', 'Art'];

    // Load minted assets from backend API
    useEffect(() => {
        const loadAssets = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const userStr = localStorage.getItem('oria_user');
                if (!userStr) {
                    setMintedAssets([]);
                    setIsLoading(false);
                    return;
                }

                const user = JSON.parse(userStr);
                const response = await mintAPI.getMyAssets(user.id);

                if (response.data.success && response.data.data) {
                    // Backend returns { assets: [...] } inside data
                    const assets = response.data.data.assets || response.data.data;
                    setMintedAssets(Array.isArray(assets) ? assets : []);
                } else {
                    setMintedAssets([]);
                }
            } catch (err: any) {
                console.error('Failed to load assets:', err);
                setError('Failed to load your assets');
                setMintedAssets([]);
            } finally {
                setIsLoading(false);
            }
        };

        loadAssets();
    }, []);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'minted':
                return <span className="text-xs text-green-500">Minted</span>;
            case 'verified':
                return <span className="text-xs text-green-500">Verified</span>;
            case 'pending':
                return <span className="text-xs text-yellow-500">Pending</span>;
            case 'transferred':
                return <span className="text-xs text-blue-500">Transferred</span>;
            default:
                return null;
        }
    };

    // Gradient classes for assets without cover images
    const gradientClasses = [
        'from-cyan-500 via-blue-600 to-purple-700',
        'from-rose-500 via-purple-600 to-indigo-600',
        'from-violet-600 via-purple-500 to-fuchsia-500',
        'from-teal-400 via-cyan-500 to-blue-600',
        'from-orange-500 via-red-500 to-pink-600'
    ];

    const getGradientClass = (index: number) => {
        return gradientClasses[index % gradientClasses.length];
    };

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

            {/* Title */}
            <div className="px-5 mb-6">
                <h2 className="text-2xl font-bold text-white">My Collection</h2>
                <p className="text-zinc-500 text-sm mt-1">{mintedAssets.length} items</p>
            </div>

            {/* Category Tabs */}
            <div className="px-5 mb-6">
                <div className="flex items-center gap-6">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`text-base font-medium transition-colors ${
                                activeTab === tab
                                    ? 'text-white'
                                    : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Assets List */}
            <div className="px-5 space-y-4">
                {isLoading ? (
                    <div className="text-center py-16">
                        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-zinc-500">Loading your collection...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-16">
                        <p className="text-red-400 mb-4">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-zinc-800 rounded-lg text-white text-sm"
                        >
                            Retry
                        </button>
                    </div>
                ) : mintedAssets.length > 0 ? (
                    mintedAssets.map((asset, index) => {
                        const coverImage = asset.coverUrl || asset.cover_url;
                        return (
                            <button
                                key={asset.id}
                                onClick={() => navigate(`/asset/${asset.id}`)}
                                className="w-full flex items-center gap-4 p-3 bg-zinc-900/50 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors"
                            >
                                {/* Artwork */}
                                <div className={`w-16 h-16 rounded-xl flex-shrink-0 relative overflow-hidden ${
                                    !coverImage ? `bg-gradient-to-br ${getGradientClass(index)}` : ''
                                }`}>
                                    {coverImage ? (
                                        <img
                                            src={coverImage}
                                            alt={asset.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <svg className="w-8 h-8 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 text-left min-w-0">
                                    <h3 className="text-white font-medium truncate">{asset.title}</h3>
                                    <p className="text-zinc-500 text-sm truncate">{asset.artist}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-zinc-400 text-sm">{asset.price} NXS</span>
                                        {getStatusBadge(asset.status)}
                                        {asset.nexus_address && (
                                            <span className="text-xs text-purple-400">On-Chain</span>
                                        )}
                                    </div>
                                </div>

                                {/* Action */}
                                <div className="flex-shrink-0">
                                    <div className="px-4 py-2 border border-zinc-700 rounded-lg text-white text-sm font-medium">
                                        View
                                    </div>
                                </div>
                            </button>
                        );
                    })
                ) : (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h3 className="text-white font-semibold text-lg mb-2">No items yet</h3>
                        <p className="text-zinc-500 text-sm mb-6">Start by minting your first audio asset</p>
                        <button
                            onClick={() => navigate('/mint')}
                            className="px-6 py-3 bg-purple-600 rounded-xl text-white font-medium hover:bg-purple-700 transition-colors"
                        >
                            Mint Asset
                        </button>
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
};

export default Library;
