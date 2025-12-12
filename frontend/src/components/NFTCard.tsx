import React from 'react';
import { useNavigate } from 'react-router-dom';

interface NFTCardProps {
    id?: string;
    title: string;
    artist: string;
    price: string;
    nexusPrice: string;
    imageUrl?: string;
    imageGradient?: string;
    isLimited?: boolean;
    isVerified?: boolean;
    duration?: string;
    plays?: number;
    onCollect?: () => void;
}

const NFTCard: React.FC<NFTCardProps> = ({
    id,
    title,
    artist,
    price,
    nexusPrice,
    imageUrl,
    imageGradient = 'from-oria-purple to-oria-blue',
    isLimited = false,
    isVerified = false,
    duration,
    plays,
    onCollect
}) => {
    const navigate = useNavigate();

    const handleCardClick = () => {
        if (id) {
            navigate(`/asset/${id}`);
        }
    };

    const handleCollect = (e: React.MouseEvent) => {
        e.stopPropagation();
        onCollect?.();
    };

    const formatPlays = (num: number): string => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    return (
        <div
            onClick={handleCardClick}
            className="group relative bg-surface-secondary rounded-2xl overflow-hidden border border-stroke-subtle hover:border-stroke-primary transition-all duration-300 cursor-pointer active:scale-[0.98]"
        >
            {/* Image Container */}
            <div className="relative aspect-square overflow-hidden">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${imageGradient} relative`}>
                        {/* Abstract audio visualization */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-30">
                            <svg viewBox="0 0 100 100" className="w-3/4 h-3/4">
                                <defs>
                                    <linearGradient id={`waveGrad-${id || title}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="white" stopOpacity="0.4" />
                                        <stop offset="100%" stopColor="white" stopOpacity="0.1" />
                                    </linearGradient>
                                </defs>
                                {/* Audio wave bars */}
                                {[15, 25, 35, 45, 55, 65, 75, 85].map((x, i) => (
                                    <rect
                                        key={i}
                                        x={x - 3}
                                        y={50 - (15 + Math.sin(i * 0.8) * 20)}
                                        width="6"
                                        height={(30 + Math.sin(i * 0.8) * 40)}
                                        rx="3"
                                        fill={`url(#waveGrad-${id || title})`}
                                        className="animate-pulse-soft"
                                        style={{ animationDelay: `${i * 100}ms` }}
                                    />
                                ))}
                            </svg>
                        </div>

                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </div>
                )}

                {/* Top badges */}
                <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                    {isLimited && (
                        <span className="badge-gold text-[10px] py-0.5 px-2">
                            Limited
                        </span>
                    )}
                    {duration && (
                        <span className="ml-auto bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-1 rounded-full">
                            {duration}
                        </span>
                    )}
                </div>

                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 hover:bg-white/30 transition-all transform hover:scale-110">
                        <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-3">
                {/* Title & Artist */}
                <div className="mb-3">
                    <div className="flex items-center gap-1.5">
                        <h3 className="text-body-sm font-semibold text-content-primary truncate">
                            {title}
                        </h3>
                        {isVerified && (
                            <svg className="w-4 h-4 text-oria-blue flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        )}
                    </div>
                    <p className="text-caption text-content-tertiary truncate mt-0.5">
                        {artist}
                    </p>
                </div>

                {/* Stats row */}
                {plays !== undefined && (
                    <div className="flex items-center gap-3 mb-3 text-content-muted">
                        <div className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-overline">{formatPlays(plays)}</span>
                        </div>
                    </div>
                )}

                {/* Collect Button */}
                <button
                    onClick={handleCollect}
                    className="w-full h-10 rounded-xl border border-oria-gold/50 bg-oria-gold/5 hover:bg-oria-gold/10 transition-all duration-200 flex items-center justify-center gap-2 group/btn"
                >
                    <span className="text-caption font-bold text-oria-gold uppercase tracking-wider">
                        Collect
                    </span>
                    <div className="flex items-center gap-1 text-content-secondary">
                        <span className="text-caption font-semibold text-content-primary">{price}</span>
                        <span className="text-[10px] text-content-muted">/ {nexusPrice}</span>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default NFTCard;
