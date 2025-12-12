import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

interface AssetItem {
    id: string;
    title: string;
    artist: string;
    priceUSD: string;
    priceNXS: string;
    gradientClass: string;
}

const Discover: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    const categories = ['All', 'Trending', 'New', 'Verified'];

    // Sample assets
    const allAssets: AssetItem[] = [
        {
            id: '1',
            title: 'Serenity',
            artist: 'Sarah Jones',
            priceUSD: '$3.99',
            priceNXS: '0.93 NXS',
            gradientClass: 'from-violet-600 via-purple-500 to-fuchsia-500'
        },
        {
            id: '2',
            title: 'The City Lights',
            artist: 'Jason Reed',
            priceUSD: '$5.49',
            priceNXS: '1.29 NXS',
            gradientClass: 'from-cyan-400 via-blue-500 to-purple-600'
        },
        {
            id: '3',
            title: 'Into the Abyss',
            artist: 'Michelle Lee',
            priceUSD: '$7.99',
            priceNXS: '1.86 NXS',
            gradientClass: 'from-indigo-600 via-purple-700 to-pink-600'
        },
        {
            id: '4',
            title: 'Rhythm of the Night',
            artist: 'Alex Turner',
            priceUSD: '$6.99',
            priceNXS: '1.62 NXS',
            gradientClass: 'from-rose-500 via-purple-600 to-indigo-600'
        },
        {
            id: '5',
            title: 'Ocean Waves',
            artist: 'Luna Sky',
            priceUSD: '$4.50',
            priceNXS: '1.05 NXS',
            gradientClass: 'from-teal-400 via-cyan-500 to-blue-600'
        },
        {
            id: '6',
            title: 'Midnight Dreams',
            artist: 'Nova Star',
            priceUSD: '$3.25',
            priceNXS: '0.76 NXS',
            gradientClass: 'from-purple-600 via-violet-600 to-indigo-700'
        }
    ];

    const filteredAssets = searchQuery
        ? allAssets.filter(
              asset =>
                  asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  asset.artist.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : allAssets;

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
                        placeholder="Search artists, tracks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-900/80 border border-zinc-800 rounded-full py-3 pl-12 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center"
                        >
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Category Pills */}
            <div className="px-5 mb-6 overflow-x-auto scrollbar-hide">
                <div className="flex items-center gap-2 pb-2">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                activeCategory === category
                                    ? 'bg-white text-black'
                                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results */}
            <div className="px-5">
                {filteredAssets.length > 0 ? (
                    <>
                        <p className="text-zinc-500 text-sm mb-4">
                            {filteredAssets.length} {filteredAssets.length === 1 ? 'result' : 'results'}
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            {filteredAssets.map((asset) => (
                                <button
                                    key={asset.id}
                                    onClick={() => navigate(`/asset/${asset.id}`)}
                                    className="text-left group"
                                >
                                    {/* Album Art */}
                                    <div className={`aspect-square rounded-2xl bg-gradient-to-br ${asset.gradientClass} mb-3 relative overflow-hidden`}>
                                        <svg className="absolute inset-0 w-full h-full opacity-60" viewBox="0 0 100 100" preserveAspectRatio="none">
                                            <defs>
                                                <linearGradient id={`disc-wave-${asset.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="white" stopOpacity="0.1" />
                                                    <stop offset="100%" stopColor="white" stopOpacity="0.3" />
                                                </linearGradient>
                                            </defs>
                                            <path
                                                d="M0,50 Q25,30 50,50 T100,50 L100,100 L0,100 Z"
                                                fill={`url(#disc-wave-${asset.id})`}
                                            />
                                            <circle cx="70" cy="40" r="20" fill="white" fillOpacity="0.1" />
                                        </svg>
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/10 blur-xl" />
                                    </div>
                                    {/* Info */}
                                    <h3 className="text-white font-semibold text-base mb-0.5 group-hover:text-purple-400 transition-colors">
                                        {asset.title}
                                    </h3>
                                    <p className="text-zinc-500 text-sm mb-1">{asset.artist}</p>
                                    <p className="text-zinc-400 text-sm">
                                        {asset.priceUSD} <span className="text-zinc-600">({asset.priceNXS})</span>
                                    </p>
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <h3 className="text-white font-semibold text-lg mb-2">No results found</h3>
                        <p className="text-zinc-500 text-sm">Try searching for something else</p>
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
};

export default Discover;
