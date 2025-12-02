import React, { useState } from 'react';
import BottomNav from '../components/BottomNav';
import NFTCard from '../components/NFTCard';

const Home: React.FC = () => {
    const [activeTab, setActiveTab] = useState('Music');

    return (
        <div className="min-h-screen bg-black pb-24">
            {/* Top Bar */}
            <div className="fixed top-0 left-0 right-0 bg-black/90 backdrop-blur-md z-40 px-6 pt-12 pb-4">
                <div className="flex items-center justify-between mb-6">
                    <button className="text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <h1 className="text-2xl font-medium text-[#8B5CF6] tracking-wide">ORIA</h1>

                    <button className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex items-center justify-between px-2">
                    {['Music', 'Tickets', 'Art'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`relative pb-2 text-sm font-medium transition-colors ${activeTab === tab ? 'text-white' : 'text-gray-500'
                                }`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-0.5 bg-[#8B5CF6] rounded-full" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Grid */}
            <div className="pt-40 px-4 grid grid-cols-2 gap-4">
                <NFTCard
                    title="Night Drive"
                    artist="Lucas Miller"
                    price="$1.07"
                    nexusPrice="0.25 NXS"
                    imageGradient="from-blue-600 to-purple-600"
                    isLimited={true}
                />
                <NFTCard
                    title="Abstract Beats"
                    artist="Sarah Jones"
                    price="$1.07"
                    nexusPrice="0.25 NXS"
                    imageGradient="from-red-600 to-orange-600"
                />
                <NFTCard
                    title="City Lights"
                    artist="Robert King"
                    price="$1.07"
                    nexusPrice="0.25 NXS"
                    imageGradient="from-indigo-900 to-blue-900"
                />
                <NFTCard
                    title="Into the Void"
                    artist="Emily Wilson"
                    price="$1.07"
                    nexusPrice="0.25 NXS"
                    imageGradient="from-red-900 to-pink-900"
                />
                <NFTCard
                    title="Neon Dreams"
                    artist="Alex Chen"
                    price="$2.50"
                    nexusPrice="0.55 NXS"
                    imageGradient="from-green-600 to-teal-600"
                    isLimited={true}
                />
                <NFTCard
                    title="Solar Flare"
                    artist="Mike Ross"
                    price="$1.80"
                    nexusPrice="0.40 NXS"
                    imageGradient="from-yellow-600 to-orange-600"
                />
            </div>

            <BottomNav />
        </div>
    );
};

export default Home;
