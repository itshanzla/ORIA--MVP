import React from 'react';

interface NFTCardProps {
    title: string;
    artist: string;
    price: string;
    nexusPrice: string;
    imageGradient: string;
    isLimited?: boolean;
}

const NFTCard: React.FC<NFTCardProps> = ({
    title,
    artist,
    price,
    nexusPrice,
    imageGradient,
    isLimited = false
}) => {
    return (
        <div className="bg-black rounded-3xl p-4 border border-gray-800/50 relative overflow-hidden group">
            {/* Limited Tag */}
            {isLimited && (
                <div className="absolute top-4 left-4 z-10">
                    <span className="text-[#F59E0B] text-[10px] font-bold tracking-widest uppercase">Limited</span>
                </div>
            )}

            {/* Image Area */}
            <div className={`h-40 w-full rounded-2xl bg-gradient-to-br ${imageGradient} mb-4 relative overflow-hidden`}>
                {/* Abstract Wave Effect */}
                <div className="absolute inset-0 opacity-50 mix-blend-overlay">
                    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                        <path fill="currentColor" d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.1,-19.2,95.8,-5.3C93.5,8.6,82.2,21.5,70.6,32.2C59,42.9,47.1,51.4,34.8,58.3C22.5,65.2,9.8,70.5,-1.9,73.8C-13.6,77.1,-24.3,78.4,-34.2,73.8C-44.1,69.2,-53.2,58.7,-61.3,47.4C-69.4,36.1,-76.5,24,-79.1,10.9C-81.7,-2.2,-79.8,-16.3,-72.6,-28.1C-65.4,-39.9,-52.9,-49.4,-40.4,-57.3C-27.9,-65.2,-15.4,-71.5,-0.9,-70C13.6,-68.5,27.2,-59.2,44.7,-76.4Z" transform="translate(100 100)" />
                    </svg>
                </div>
            </div>

            {/* Content */}
            <div className="space-y-1 mb-4">
                <h3 className="text-white text-xl font-medium leading-tight">{title}</h3>
                <p className="text-gray-500 text-xs uppercase tracking-wider">{artist}</p>
            </div>

            {/* Collect Button */}
            <button className="w-full border border-[#F59E0B] rounded-xl py-3 px-4 flex flex-col items-center justify-center hover:bg-[#F59E0B]/10 transition-colors">
                <span className="text-[#F59E0B] text-xs font-bold tracking-widest uppercase mb-0.5">Collect</span>
                <span className="text-gray-400 text-[10px]">
                    <span className="text-white font-medium">{price}</span> {nexusPrice}
                </span>
            </button>
        </div>
    );
};

export default NFTCard;
