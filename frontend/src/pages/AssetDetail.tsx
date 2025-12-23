import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { mintAPI } from '../services/api';

interface Asset {
    id: string;
    title: string;
    artist: string;
    description?: string;
    genre?: string;
    price: number;
    is_limited?: boolean;
    limited_supply?: number;
    audio_url: string;
    audio_path?: string;
    cover_url?: string | null;
    cover_path?: string | null;
    created_at: string;
    status: string;
    nexus_address?: string;
    nexus_txid?: string;
    user_id?: string;
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
    const [asset, setAsset] = useState<Asset | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isOwner, setIsOwner] = useState(false);
    const [audioError, setAudioError] = useState<string | null>(null);
    const [transferring, setTransferring] = useState(false);
    const [transferError, setTransferError] = useState<string | null>(null);

    // Load asset from API
    useEffect(() => {
        const fetchAsset = async () => {
            if (!id) return;

            setLoading(true);
            setError(null);

            try {
                const response = await mintAPI.getAsset(id);
                if (response.data.success && response.data.data?.asset) {
                    const fetchedAsset = response.data.data.asset;
                    setAsset(fetchedAsset);

                    // Check if current user owns this asset
                    const userStr = localStorage.getItem('oria_user');
                    if (userStr) {
                        const user = JSON.parse(userStr);
                        setIsOwner(user.id === fetchedAsset.user_id);
                    }
                } else {
                    setError('Asset not found');
                }
            } catch (err: any) {
                console.error('Failed to fetch asset:', err);
                setError(err.response?.data?.message || 'Failed to load asset');
            } finally {
                setLoading(false);
            }
        };

        fetchAsset();
    }, [id]);

    // Audio event handlers
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !asset?.audio_url) return;

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
            setAudioError(null);
        };
        const handleEnded = () => setIsPlaying(false);
        const handleError = () => {
            setAudioError('Unable to load audio file');
            setIsPlaying(false);
        };
        const handleCanPlay = () => setAudioError(null);

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);
        audio.addEventListener('canplay', handleCanPlay);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
            audio.removeEventListener('canplay', handleCanPlay);
        };
    }, [asset?.audio_url]);

    const togglePlayPause = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play().catch(err => {
                console.error('Playback failed:', err);
                setAudioError('Playback failed. Try again.');
            });
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
        if (!seconds || isNaN(seconds)) return '0:00';
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
        if (!asset?.id) return gradientClasses[0];
        // Use a hash of the ID for consistent gradient
        const hash = asset.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return gradientClasses[hash % gradientClasses.length];
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'confirmed':
                return <span className="text-green-500">Verified on Blockchain</span>;
            case 'confirming':
                return <span className="text-yellow-500">Confirming...</span>;
            case 'registering':
                return <span className="text-blue-500">Registering...</span>;
            case 'failed':
                return <span className="text-red-500">Failed</span>;
            default:
                return <span className="text-zinc-500 capitalize">{status}</span>;
        }
    };

    if (loading) {
        return (
            <div className="min-h-[100dvh] bg-black flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !asset) {
        return (
            <div className="min-h-[100dvh] bg-black flex flex-col items-center justify-center px-5">
                <svg className="w-16 h-16 text-zinc-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-xl font-semibold text-white mb-2">Asset Not Found</h2>
                <p className="text-zinc-500 text-center mb-6">{error || "This asset doesn't exist or has been removed."}</p>
                <button
                    onClick={() => navigate('/discover')}
                    className="px-6 py-3 bg-purple-600 rounded-xl text-white font-medium"
                >
                    Discover Assets
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-[100dvh] bg-black pb-24">
            {/* Hidden Audio Element */}
            {asset.audio_url && (
                <audio
                    ref={audioRef}
                    src={asset.audio_url}
                    preload="metadata"
                    crossOrigin="anonymous"
                />
            )}

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
                    !asset.cover_url ? `bg-gradient-to-br ${getGradientClass()}` : ''
                }`}>
                    {asset.cover_url ? (
                        <img
                            src={asset.cover_url}
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
                    {asset.is_limited && (
                        <div className="absolute top-4 left-4">
                            <span className="px-3 py-1.5 bg-zinc-900/80 backdrop-blur-sm text-white text-xs font-medium rounded-md border border-zinc-700">
                                LIMITED ({asset.limited_supply})
                            </span>
                        </div>
                    )}

                    {/* Blockchain Badge */}
                    {asset.nexus_address && (
                        <div className="absolute top-4 right-4">
                            <span className="px-3 py-1.5 bg-purple-900/80 backdrop-blur-sm text-purple-300 text-xs font-medium rounded-md border border-purple-700">
                                On-Chain
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
                    <span className="text-purple-400 text-xl font-semibold">{asset.price.toFixed(2)} NXS</span>
                </div>

                {/* Audio Player */}
                <div className="mb-8">
                    {audioError ? (
                        <div className="text-center py-4 text-red-400 text-sm">
                            {audioError}
                        </div>
                    ) : (
                        <>
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
                                        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                                            <rect x="6" y="4" width="4" height="16" rx="1" />
                                            <rect x="14" y="4" width="4" height="16" rx="1" />
                                        </svg>
                                    ) : (
                                        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M6 4l15 8-15 8V4z" />
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
                        </>
                    )}
                </div>

                {/* Description */}
                {asset.description && asset.description !== '-' && (
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
                            <span className="text-white text-sm">{new Date(asset.created_at).toLocaleDateString()}</span>
                        </div>
                        {asset.genre && asset.genre !== '-' && (
                            <div className="flex items-center justify-between py-2 border-b border-zinc-900">
                                <span className="text-zinc-500 text-sm">Genre</span>
                                <span className="text-white text-sm capitalize">{asset.genre}</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between py-2 border-b border-zinc-900">
                            <span className="text-zinc-500 text-sm">Status</span>
                            <span className="text-sm">{getStatusBadge(asset.status)}</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-zinc-500 text-sm">Network</span>
                            <span className="text-purple-400 text-sm">Nexus Blockchain</span>
                        </div>
                        {asset.nexus_address && (
                            <div className="flex items-center justify-between py-2 border-t border-zinc-900">
                                <span className="text-zinc-500 text-sm">Address</span>
                                <span className="text-zinc-400 text-xs font-mono truncate ml-4 max-w-[200px]">
                                    {asset.nexus_address.substring(0, 16)}...
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Transfer Button - Show for owner with confirmed or confirming status */}
                {isOwner && (asset.status === 'confirmed' || asset.status === 'confirming') && (
                    <button
                        onClick={() => {
                            setTransferError(null);
                            setShowTransferModal(true);
                        }}
                        className="w-full py-4 bg-purple-600 rounded-xl text-white font-medium hover:bg-purple-700 transition-colors mb-4"
                    >
                        Transfer Asset
                    </button>
                )}

                {/* Debug info - remove in production */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="text-xs text-zinc-600 mb-4">
                        Owner: {isOwner ? 'Yes' : 'No'} | Status: {asset.status}
                    </div>
                )}
            </main>

            {/* Transfer Modal */}
            {showTransferModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={() => !transferring && setShowTransferModal(false)}
                    />
                    <div className="relative w-full bg-zinc-900 rounded-t-3xl p-6 pb-10">
                        <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-6" />

                        <h2 className="text-xl font-semibold text-white mb-2">
                            Transfer Asset
                        </h2>
                        <p className="text-sm text-zinc-500 mb-6">
                            Enter the recipient's username or email
                        </p>

                        <div className="space-y-4">
                            <input
                                type="text"
                                value={recipientAddress}
                                onChange={(e) => setRecipientAddress(e.target.value)}
                                className="w-full bg-black border border-zinc-800 rounded-xl py-4 px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
                                placeholder="Username or email"
                                disabled={transferring}
                            />

                            {transferError && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                    <p className="text-red-400 text-sm">{transferError}</p>
                                </div>
                            )}

                            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                                <p className="text-yellow-500 text-sm">
                                    This action is irreversible. The asset will be transferred to the recipient's account.
                                </p>
                            </div>

                            <button
                                onClick={async () => {
                                    if (!recipientAddress.trim() || !asset) return;

                                    setTransferring(true);
                                    setTransferError(null);

                                    try {
                                        const userStr = localStorage.getItem('oria_user');
                                        const nexusSession = localStorage.getItem('oria_nexus_session');

                                        if (!userStr || !nexusSession) {
                                            setTransferError('Please log in again to transfer assets');
                                            setTransferring(false);
                                            return;
                                        }

                                        const user = JSON.parse(userStr);
                                        const pinHash = user.user_metadata?.pin_hash;
                                        const pin = pinHash ? atob(pinHash) : undefined;

                                        const response = await mintAPI.transfer({
                                            assetId: asset.id,
                                            userId: user.id,
                                            recipientUsername: recipientAddress.trim().replace('@', ''),
                                            nexusSession,
                                            nexusPin: pin
                                        });

                                        if (response.data.success) {
                                            setShowTransferModal(false);
                                            setRecipientAddress('');
                                            // Navigate to library with success message
                                            navigate('/library', { state: { message: 'Asset transferred successfully!' } });
                                        } else {
                                            setTransferError(response.data.message || 'Transfer failed');
                                        }
                                    } catch (err: any) {
                                        console.error('Transfer error:', err);
                                        setTransferError(
                                            err.response?.data?.message ||
                                            err.message ||
                                            'Failed to transfer asset. Please try again.'
                                        );
                                    } finally {
                                        setTransferring(false);
                                    }
                                }}
                                disabled={!recipientAddress.trim() || transferring}
                                className="w-full py-4 bg-purple-600 rounded-xl text-white font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {transferring ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Transferring...
                                    </>
                                ) : (
                                    'Confirm Transfer'
                                )}
                            </button>

                            <button
                                onClick={() => setShowTransferModal(false)}
                                disabled={transferring}
                                className="w-full py-3 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
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
