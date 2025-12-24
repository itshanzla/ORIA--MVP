import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import BottomNav from '../components/BottomNav';
import { mintAPI } from '../services/api';

interface Asset {
    id: string;
    title: string;
    artist: string;
    price: number;
    cover_url?: string | null;
    audio_url?: string;
    status: string;
    created_at: string;
    genre?: string;
    nexus_address?: string;
}

type UserRole = 'creator' | 'listener';

const Home: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('Music');
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const [trendingAssets, setTrendingAssets] = useState<Asset[]>([]);
    const [newReleases, setNewReleases] = useState<Asset[]>([]);
    const [myAssets, setMyAssets] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userRole, setUserRole] = useState<UserRole>('listener');

    const categories = ['Music', 'Tickets', 'Art'];
    const filters = ['Night Drive', 'Chill', 'Energetic', 'Dark', 'Summer'];

    // Gradient classes for assets without cover images
    const gradientClasses = [
        'from-violet-600 via-purple-500 to-fuchsia-500',
        'from-cyan-400 via-blue-500 to-purple-600',
        'from-indigo-600 via-purple-700 to-pink-600',
        'from-rose-500 via-purple-600 to-indigo-600',
        'from-teal-400 via-cyan-500 to-blue-600',
        'from-purple-600 via-violet-600 to-indigo-700'
    ];

    const getGradientClass = (index: number) => {
        return gradientClasses[index % gradientClasses.length];
    };

    // Get user role on mount
    useEffect(() => {
        const userStr = localStorage.getItem('oria_user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                const role = user.user_metadata?.role || 'listener';
                setUserRole(role);
            } catch (e) {
                console.error('Failed to parse user data:', e);
            }
        }
    }, []);

    // Fetch assets based on role
    useEffect(() => {
        const fetchAssets = async () => {
            setIsLoading(true);
            try {
                if (userRole === 'creator') {
                    // Creators only see their own assets
                    const userStr = localStorage.getItem('oria_user');
                    if (userStr) {
                        const user = JSON.parse(userStr);
                        const response = await mintAPI.getMyAssets(user.id);
                        if (response.data.success && response.data.data) {
                            const assets = response.data.data.assets || response.data.data;
                            setMyAssets(Array.isArray(assets) ? assets : []);
                        }
                    }
                } else {
                    // Listeners see trending and discover
                    const [trendingRes, discoverRes] = await Promise.all([
                        mintAPI.trending(4),
                        mintAPI.discover(6, 0)
                    ]);

                    if (trendingRes.data.success && trendingRes.data.data?.assets) {
                        setTrendingAssets(trendingRes.data.data.assets);
                    }

                    if (discoverRes.data.success && discoverRes.data.data?.assets) {
                        // Get newest releases (skip trending ones)
                        const allAssets = discoverRes.data.data.assets;
                        const trendingIds = new Set(trendingAssets.map(a => a.id));
                        const releases = allAssets.filter((a: Asset) => !trendingIds.has(a.id)).slice(0, 4);
                        setNewReleases(releases.length > 0 ? releases : allAssets.slice(4, 8));
                    }
                }
            } catch (err) {
                console.error('Failed to fetch assets:', err);
                toast.error('Failed to load assets');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAssets();
    }, [userRole]);

    const formatPrice = (price: number) => {
        return `${price.toFixed(2)} NXS`;
    };

    const renderAssetCard = (asset: Asset, index: number) => (
        <button
            key={asset.id}
            onClick={() => navigate(`/asset/${asset.id}`)}
            className="text-left group"
        >
            {/* Album Art */}
            <div className={`aspect-square rounded-2xl mb-3 relative overflow-hidden ${
                !asset.cover_url ? `bg-gradient-to-br ${getGradientClass(index)}` : 'bg-zinc-900'
            }`}>
                {asset.cover_url ? (
                    <img
                        src={asset.cover_url}
                        alt={asset.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <>
                        <svg className="absolute inset-0 w-full h-full opacity-60" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id={`wave-${asset.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="white" stopOpacity="0.1" />
                                    <stop offset="100%" stopColor="white" stopOpacity="0.3" />
                                </linearGradient>
                            </defs>
                            <path
                                d="M0,50 Q25,30 50,50 T100,50 L100,100 L0,100 Z"
                                fill={`url(#wave-${asset.id})`}
                            />
                            <circle cx="70" cy="40" r="20" fill="white" fillOpacity="0.1" />
                            <circle cx="30" cy="60" r="15" fill="white" fillOpacity="0.15" />
                        </svg>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/10 blur-xl" />
                    </>
                )}
            </div>
            {/* Info */}
            <h3 className="text-white font-semibold text-base mb-0.5 group-hover:text-purple-400 transition-colors truncate">
                {asset.title}
            </h3>
            <p className="text-zinc-500 text-sm mb-1 truncate">{asset.artist}</p>
            <p className="text-zinc-400 text-sm">{formatPrice(asset.price)}</p>
        </button>
    );

    // Creator Dashboard - shows only their own assets
    if (userRole === 'creator') {
        return (
            <div className="min-h-[100dvh] bg-black pb-24">
                {/* Header */}
                <header className="pt-12 pb-4 px-5">
                    <h1 className="text-center text-2xl font-light tracking-wider">
                        <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-violet-400 bg-clip-text text-transparent">
                            ORIA
                        </span>
                    </h1>
                </header>

                {/* Creator Dashboard Title */}
                <div className="px-5 mb-6">
                    <h2 className="text-2xl font-bold text-white">My Dashboard</h2>
                    <p className="text-zinc-500 text-sm mt-1">{myAssets.length} assets created</p>
                </div>

                {/* Quick Stats */}
                <div className="px-5 mb-6">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                            <p className="text-zinc-500 text-sm">Total Assets</p>
                            <p className="text-2xl font-bold text-white">{myAssets.length}</p>
                        </div>
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                            <p className="text-zinc-500 text-sm">On Blockchain</p>
                            <p className="text-2xl font-bold text-purple-400">
                                {myAssets.filter(a => a.nexus_address).length}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Category Tabs */}
                <div className="px-5 mb-4">
                    <div className="flex items-center gap-6">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`text-base font-medium transition-colors ${
                                    activeCategory === category
                                        ? 'text-white'
                                        : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : myAssets.length === 0 ? (
                    <div className="px-5 text-center py-16">
                        <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                        </div>
                        <h3 className="text-white font-semibold text-lg mb-2">No assets yet</h3>
                        <p className="text-zinc-500 text-sm mb-6">Start by minting your first audio asset!</p>
                        <button
                            onClick={() => navigate('/mint')}
                            className="px-6 py-3 bg-purple-600 rounded-xl text-white font-medium hover:bg-purple-700 transition-colors"
                        >
                            Mint Asset
                        </button>
                    </div>
                ) : (
                    <section className="px-5 mb-8">
                        <h2 className="text-lg font-semibold text-white mb-4">My Assets</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {myAssets.map((asset, index) => renderAssetCard(asset, index))}
                        </div>
                    </section>
                )}

                <BottomNav />
            </div>
        );
    }

    // Listener Dashboard - shows explore/discover content
    return (
        <div className="min-h-[100dvh] bg-black pb-24">
            {/* Header */}
            <header className="pt-12 pb-4 px-5">
                <h1 className="text-center text-2xl font-light tracking-wider">
                    <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-violet-400 bg-clip-text text-transparent">
                        ORIA
                    </span>
                </h1>
            </header>

            {/* Search Bar */}
            <div className="px-5 mb-6">
                <div className="relative">
                    <svg
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-900/80 border border-zinc-800 rounded-full py-3 pl-12 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
                    />
                </div>
            </div>

            {/* Category Tabs */}
            <div className="px-5 mb-4">
                <div className="flex items-center gap-6">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`text-base font-medium transition-colors ${
                                activeCategory === category
                                    ? 'text-white'
                                    : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            {/* Filter Pills */}
            <div className="px-5 mb-6 overflow-x-auto scrollbar-hide">
                <div className="flex items-center gap-2 pb-2">
                    {filters.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(activeFilter === filter ? null : filter)}
                            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                activeFilter === filter
                                    ? 'bg-white text-black'
                                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
                            }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-10 h-10 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : trendingAssets.length === 0 && newReleases.length === 0 ? (
                <div className="px-5 text-center py-16">
                    <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-2">No assets yet</h3>
                    <p className="text-zinc-500 text-sm mb-6">No music available to explore yet.</p>
                </div>
            ) : (
                <>
                    {/* Trending Section */}
                    {trendingAssets.length > 0 && (
                        <section className="px-5 mb-8">
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                Trending <span className="text-orange-500">Hot Right Now</span>
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                {trendingAssets.map((asset, index) => renderAssetCard(asset, index))}
                            </div>
                        </section>
                    )}

                    {/* New Releases Section */}
                    {newReleases.length > 0 && (
                        <section className="px-5 mb-8">
                            <h2 className="text-lg font-semibold text-white mb-4">
                                New Releases
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                {newReleases.map((asset, index) => renderAssetCard(asset, index + 4))}
                            </div>
                        </section>
                    )}
                </>
            )}

            <BottomNav />
        </div>
    );
};

export default Home;
