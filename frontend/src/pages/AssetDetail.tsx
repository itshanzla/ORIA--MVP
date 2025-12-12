import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

interface MintedAsset {
    id: string;
    title: string;
    artist: string;
    description?: string;
    genre?: string;
    price: string;
    isLimited?: boolean;
    limitedSupply?: string;
    audioUrl: string;
    audioPath: string;
    coverUrl: string | null;
    coverPath: string | null;
    createdAt: string;
    status: string;
}

const AssetDetail: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [recipientAddress, setRecipientAddress] = useState('');
    const [asset, setAsset] = useState<MintedAsset | null>(null);
    const [loading, setLoading] = useState(true);

    // Load asset from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('oria_assets');
        if (stored) {
            const assets: MintedAsset[] = JSON.parse(stored);
            const found = assets.find(a => a.id === id);
            if (found) {
                setAsset(found);
            }
        }
        setLoading(false);
    }, [id]);

    // Audio event handlers
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleLoadedMetadata = () => setDuration(audio.duration);
        const handleEnded = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [asset]);

    const togglePlayPause = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        const audio = audioRef.current;
        if (!audio || !duration) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audio.currentTime = percent * duration;
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    // Gradient classes for assets without cover images
    const gradientClasses = [
        'from-cyan-500 via-blue-600 to-purple-700',
        'from-rose-500 via-purple-600 to-indigo-600',
        'from-violet-600 via-purple-500 to-fuchsia-500',
        'from-teal-400 via-cyan-500 to-blue-600'
    ];

    const getGradientClass = () => {
        const index = asset?.id ? parseInt(asset.id) % gradientClasses.length : 0;
        return gradientClasses[index];
    };

    if (loading) {
        return (
            <div className="min-h-[100dvh] bg-black flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!asset) {
        return (
            <div className="min-h-[100dvh] bg-black flex flex-col items-center justify-center px-5">
                <svg className="w-16 h-16 text-zinc-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-xl font-semibold text-white mb-2">Asset Not Found</h2>
                <p className="text-zinc-500 text-center mb-6">This asset doesn't exist or has been removed.</p>
                <button
                    onClick={() => navigate('/library')}
                    className="px-6 py-3 bg-purple-600 rounded-xl text-white font-medium"
                >
                    Go to Library
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-[100dvh] bg-black pb-24">
            {/* Hidden Audio Element */}
            <audio ref={audioRef} src={asset.audioUrl} preload="metadata" />

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 pt-12 pb-4 bg-gradient-to-b from-black via-black/80 to-transparent">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 flex items-center justify-center"
                >
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="text-xl font-light tracking-wider">
                    <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-violet-400 bg-clip-text text-transparent">
                        ORIA
                    </span>
                </h1>
                <div className="w-10" />
            </header>

            {/* Main Content */}
            <main className="pt-24 px-5">
                {/* Artwork */}
                <div className={`relative aspect-square rounded-3xl mb-6 overflow-hidden ${
                    !asset.coverUrl ? `bg-gradient-to-br ${getGradientClass()}` : ''
                }`}>
                    {asset.coverUrl ? (
                        <img
                            src={asset.coverUrl}
                            alt={asset.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <>
                            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="white" stopOpacity="0.1" />
                                        <stop offset="100%" stopColor="white" stopOpacity="0.3" />
                                    </linearGradient>
                                </defs>
                                <path d="M0,50 Q20,20 40,50 T80,50 T120,50" fill="none" stroke="url(#wave-gradient)" strokeWidth="0.5" />
                                <ellipse cx="60" cy="40" rx="30" ry="20" fill="white" fillOpacity="0.1" />
                                <ellipse cx="35" cy="65" rx="20" ry="15" fill="white" fillOpacity="0.08" />
                            </svg>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-white/10 blur-3xl" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <svg className="w-20 h-20 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                </svg>
                            </div>
                        </>
                    )}

                    {/* Limited Badge */}
                    {asset.isLimited && (
                        <div className="absolute top-4 left-4">
                            <span className="px-3 py-1.5 bg-zinc-900/80 backdrop-blur-sm text-white text-xs font-medium rounded-md border border-zinc-700">
                                LIMITED ({asset.limitedSupply})
                            </span>
                        </div>
                    )}
                </div>

                {/* Title & Artist */}
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-white mb-2">{asset.title}</h2>
                    <p className="text-zinc-500 text-sm tracking-wider uppercase">{asset.artist}</p>
                </div>

                {/* Price Display */}
                <div className="text-center mb-8">
                    <span className="text-purple-400 text-xl font-semibold">{asset.price} NXS</span>
                </div>

                {/* Audio Player */}
                <div className="mb-8">
                    {/* Progress Bar */}
                    <div
                        className="relative h-1 bg-zinc-800 rounded-full mb-3 cursor-pointer"
                        onClick={handleSeek}
                    >
                        <div
                            className="absolute left-0 top-0 h-full bg-white rounded-full transition-all"
                            style={{ width: `${progressPercent}%` }}
                        />
                        <div
                            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg transition-all"
                            style={{ left: `${progressPercent}%`, marginLeft: '-6px' }}
                        />
                    </div>

                    {/* Time Display */}
                    <div className="flex justify-between text-xs text-zinc-500 mb-6">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-8">
                        {/* Rewind 10s */}
                        <button
                            onClick={() => {
                                if (audioRef.current) {
                                    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
                                }
                            }}
                            className="w-12 h-12 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                            </svg>
                        </button>

                        {/* Play/Pause */}
                        <button
                            onClick={togglePlayPause}
                            className="w-16 h-16 rounded-full border-2 border-white flex items-center justify-center hover:bg-white/10 transition-colors"
                        >
                            {isPlaying ? (
                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            )}
                        </button>

                        {/* Forward 10s */}
                        <button
                            onClick={() => {
                                if (audioRef.current) {
                                    audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10);
                                }
                            }}
                            className="w-12 h-12 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Description */}
                {asset.description && (
                    <div className="mb-8">
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            {asset.description}
                        </p>
                    </div>
                )}

                {/* Asset Info */}
                <div className="mb-8">
                    <h3 className="text-zinc-500 text-xs tracking-wider mb-4">DETAILS</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between py-2 border-b border-zinc-900">
                            <span className="text-zinc-500 text-sm">Created</span>
                            <span className="text-white text-sm">{new Date(asset.createdAt).toLocaleDateString()}</span>
                        </div>
                        {asset.genre && (
                            <div className="flex items-center justify-between py-2 border-b border-zinc-900">
                                <span className="text-zinc-500 text-sm">Genre</span>
                                <span className="text-white text-sm capitalize">{asset.genre}</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between py-2 border-b border-zinc-900">
                            <span className="text-zinc-500 text-sm">Status</span>
                            <span className="text-green-500 text-sm capitalize">{asset.status}</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-zinc-500 text-sm">Network</span>
                            <span className="text-purple-400 text-sm">Nexus Blockchain</span>
                        </div>
                    </div>
                </div>

                {/* Transfer Button */}
                <button
                    onClick={() => setShowTransferModal(true)}
                    className="w-full py-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-medium hover:bg-zinc-800 transition-colors mb-4"
                >
                    Transfer Asset
                </button>
            </main>

            {/* Transfer Modal */}
            {showTransferModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={() => setShowTransferModal(false)}
                    />
                    <div className="relative w-full bg-zinc-900 rounded-t-3xl p-6 pb-10">
                        <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-6" />

                        <h2 className="text-xl font-semibold text-white mb-2">
                            Transfer Asset
                        </h2>
                        <p className="text-sm text-zinc-500 mb-6">
                            Enter the recipient's username or genesis hash
                        </p>

                        <div className="space-y-4">
                            <input
                                type="text"
                                value={recipientAddress}
                                onChange={(e) => setRecipientAddress(e.target.value)}
                                className="w-full bg-black border border-zinc-800 rounded-xl py-4 px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
                                placeholder="@username or genesis hash"
                            />

                            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                                <p className="text-yellow-500 text-sm">
                                    This action is irreversible. Please verify the recipient carefully.
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    setShowTransferModal(false);
                                    navigate('/library');
                                }}
                                className="w-full py-4 bg-purple-600 rounded-xl text-white font-semibold hover:bg-purple-700 transition-colors"
                            >
                                Confirm Transfer
                            </button>

                            <button
                                onClick={() => setShowTransferModal(false)}
                                className="w-full py-3 text-zinc-400 hover:text-white transition-colors"
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

export default AssetDetail;
