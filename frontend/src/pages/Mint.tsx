import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { uploadAPI } from '../services/api';

interface AssetFormData {
    title: string;
    description: string;
    artist: string;
    genre: string;
    price: string;
    isLimited: boolean;
    limitedSupply: string;
}

const Mint: React.FC = () => {
    const navigate = useNavigate();
    const audioInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    const [currentStep, setCurrentStep] = useState(1);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [_audioPreview, setAudioPreview] = useState<string>('');
    const [coverPreview, setCoverPreview] = useState<string>('');
    const [isMinting, setIsMinting] = useState(false);
    const [mintStatus, setMintStatus] = useState<string>('');
    const [mintError, setMintError] = useState<string>('');

    const [formData, setFormData] = useState<AssetFormData>({
        title: '',
        description: '',
        artist: '',
        genre: '',
        price: '',
        isLimited: false,
        limitedSupply: ''
    });

    const totalSteps = 5;

    const stepTitles = [
        'Upload Audio',
        'Add Cover Art',
        'Asset Details',
        'Set Price',
        'Review & Mint'
    ];

    const stepDescriptions = [
        'Add the audio file you want to link to your new drop.',
        'Add cover artwork for your audio asset.',
        'Fill in the details about your audio asset.',
        'Set the price for your audio NFT.',
        'Review your asset and mint it on the blockchain.'
    ];

    const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('audio/')) {
            setAudioFile(file);
            setAudioPreview(URL.createObjectURL(file));
            const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
            setFormData(prev => ({ ...prev, title: nameWithoutExt }));
        }
    };

    const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setCoverFile(file);
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleMint = async () => {
        if (!audioFile) {
            setMintError('Audio file is required');
            return;
        }

        setIsMinting(true);
        setMintStatus('Uploading files...');
        setMintError('');

        try {
            // Upload files to Supabase Storage
            const uploadResponse = await uploadAPI.uploadAssetFiles(audioFile, coverFile || undefined);

            if (!uploadResponse.data.success) {
                throw new Error(uploadResponse.data.message || 'Upload failed');
            }

            const { audio, cover } = uploadResponse.data.data;

            setMintStatus('Files uploaded! Registering asset...');

            // Store asset metadata locally for now
            // In production, this would create an asset on Nexus blockchain
            const assetData = {
                id: Date.now().toString(),
                title: formData.title,
                artist: formData.artist,
                description: formData.description,
                genre: formData.genre,
                price: formData.price,
                isLimited: formData.isLimited,
                limitedSupply: formData.limitedSupply,
                audioUrl: audio.url,
                audioPath: audio.path,
                coverUrl: cover?.url || null,
                coverPath: cover?.path || null,
                createdAt: new Date().toISOString(),
                status: 'minted'
            };

            // Save to localStorage (temporary - replace with backend storage)
            const existingAssets = JSON.parse(localStorage.getItem('oria_assets') || '[]');
            existingAssets.push(assetData);
            localStorage.setItem('oria_assets', JSON.stringify(existingAssets));

            setMintStatus('Asset minted successfully!');

            // Navigate to library after short delay
            setTimeout(() => {
                setIsMinting(false);
                navigate('/library');
            }, 1500);

        } catch (error: any) {
            console.error('Minting error:', error);
            setMintError(error.response?.data?.message || error.message || 'Failed to mint asset');
            setIsMinting(false);
        }
    };

    const canProceed = () => {
        switch (currentStep) {
            case 1: return audioFile !== null;
            case 2: return true; // Cover art is optional
            case 3: return formData.title && formData.artist;
            case 4: return formData.price !== '';
            case 5: return true;
            default: return false;
        }
    };

    const handleNext = () => {
        if (currentStep === 5) {
            handleMint();
        } else if (canProceed()) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="flex flex-col items-center">
                        <input
                            ref={audioInputRef}
                            type="file"
                            accept="audio/*"
                            onChange={handleAudioUpload}
                            className="hidden"
                        />
                        <button
                            onClick={() => audioInputRef.current?.click()}
                            className="w-40 h-40 rounded-full border-2 border-cyan-500 flex items-center justify-center mb-8 hover:bg-cyan-500/10 transition-colors"
                        >
                            {audioFile ? (
                                <svg className="w-16 h-16 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ) : (
                                <svg className="w-16 h-16 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                            )}
                        </button>
                        {audioFile && (
                            <div className="text-center mb-4">
                                <p className="text-white font-medium">{audioFile.name}</p>
                                <p className="text-zinc-500 text-sm">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                        )}
                    </div>
                );

            case 2:
                return (
                    <div className="flex flex-col items-center">
                        <input
                            ref={coverInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleCoverUpload}
                            className="hidden"
                        />
                        <button
                            onClick={() => coverInputRef.current?.click()}
                            className="w-40 h-40 rounded-2xl border-2 border-dashed border-zinc-700 flex items-center justify-center mb-8 hover:border-cyan-500 transition-colors overflow-hidden"
                        >
                            {coverPreview ? (
                                <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                            ) : (
                                <svg className="w-12 h-12 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            )}
                        </button>
                        <p className="text-zinc-500 text-sm text-center">
                            {coverFile ? coverFile.name : 'Optional - A cover will be generated if not provided'}
                        </p>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-zinc-400 text-sm mb-2">Title</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
                                placeholder="Enter asset title"
                            />
                        </div>
                        <div>
                            <label className="block text-zinc-400 text-sm mb-2">Artist Name</label>
                            <input
                                type="text"
                                name="artist"
                                value={formData.artist}
                                onChange={handleInputChange}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
                                placeholder="Your artist name"
                            />
                        </div>
                        <div>
                            <label className="block text-zinc-400 text-sm mb-2">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 resize-none"
                                placeholder="Describe your audio asset..."
                            />
                        </div>
                        <div>
                            <label className="block text-zinc-400 text-sm mb-2">Genre</label>
                            <select
                                name="genre"
                                value={formData.genre}
                                onChange={handleInputChange}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-zinc-700"
                            >
                                <option value="">Select genre</option>
                                <option value="electronic">Electronic</option>
                                <option value="hiphop">Hip Hop</option>
                                <option value="pop">Pop</option>
                                <option value="rock">Rock</option>
                                <option value="jazz">Jazz</option>
                                <option value="classical">Classical</option>
                                <option value="ambient">Ambient</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-zinc-400 text-sm mb-2">Price (NXS)</label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleInputChange}
                                step="0.01"
                                min="0"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                            <div>
                                <p className="text-white font-medium">Limited Edition</p>
                                <p className="text-zinc-500 text-sm">Limit the number of copies</p>
                            </div>
                            <button
                                onClick={() => setFormData(prev => ({ ...prev, isLimited: !prev.isLimited }))}
                                className={`w-12 h-7 rounded-full transition-colors ${
                                    formData.isLimited ? 'bg-purple-600' : 'bg-zinc-700'
                                }`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${
                                    formData.isLimited ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                            </button>
                        </div>
                        {formData.isLimited && (
                            <div>
                                <label className="block text-zinc-400 text-sm mb-2">Number of Copies</label>
                                <input
                                    type="number"
                                    name="limitedSupply"
                                    value={formData.limitedSupply}
                                    onChange={handleInputChange}
                                    min="1"
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
                                    placeholder="100"
                                />
                            </div>
                        )}
                    </div>
                );

            case 5:
                return (
                    <div className="space-y-6">
                        {/* Preview Card */}
                        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                            <div className="flex gap-4">
                                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex-shrink-0 overflow-hidden">
                                    {coverPreview ? (
                                        <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <svg className="w-8 h-8 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-white font-semibold truncate">{formData.title || 'Untitled'}</h3>
                                    <p className="text-zinc-500 text-sm">{formData.artist || 'Unknown Artist'}</p>
                                    <p className="text-purple-400 font-medium mt-2">{formData.price || '0'} NXS</p>
                                </div>
                            </div>
                        </div>

                        {/* Details Summary */}
                        <div className="space-y-3">
                            <div className="flex justify-between py-2 border-b border-zinc-900">
                                <span className="text-zinc-500">Audio File</span>
                                <span className="text-white text-sm truncate max-w-[200px]">{audioFile?.name}</span>
                            </div>
                            {formData.description && (
                                <div className="flex justify-between py-2 border-b border-zinc-900">
                                    <span className="text-zinc-500">Description</span>
                                    <span className="text-white text-sm truncate max-w-[200px]">{formData.description}</span>
                                </div>
                            )}
                            {formData.genre && (
                                <div className="flex justify-between py-2 border-b border-zinc-900">
                                    <span className="text-zinc-500">Genre</span>
                                    <span className="text-white text-sm capitalize">{formData.genre}</span>
                                </div>
                            )}
                            {formData.isLimited && (
                                <div className="flex justify-between py-2 border-b border-zinc-900">
                                    <span className="text-zinc-500">Supply</span>
                                    <span className="text-white text-sm">{formData.limitedSupply} copies</span>
                                </div>
                            )}
                            <div className="flex justify-between py-2">
                                <span className="text-zinc-500">Network</span>
                                <span className="text-purple-400 text-sm">Nexus Blockchain</span>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    if (isMinting) {
        return (
            <div className="min-h-[100dvh] bg-black flex flex-col items-center justify-center px-5">
                {mintError ? (
                    <>
                        <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-8">
                            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Upload Failed</h2>
                        <p className="text-red-400 text-center mb-6">{mintError}</p>
                        <button
                            onClick={() => {
                                setIsMinting(false);
                                setMintError('');
                            }}
                            className="px-6 py-3 bg-zinc-800 rounded-xl text-white font-medium"
                        >
                            Try Again
                        </button>
                    </>
                ) : (
                    <>
                        <div className="w-20 h-20 rounded-full border-4 border-purple-600 border-t-transparent animate-spin mb-8" />
                        <h2 className="text-2xl font-bold text-white mb-2">Minting Asset</h2>
                        <p className="text-zinc-500 text-center">{mintStatus || 'Please wait...'}</p>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="min-h-[100dvh] bg-black pb-24">
            {/* Header */}
            <header className="flex items-center justify-between px-5 pt-12 pb-4">
                {currentStep > 1 ? (
                    <button onClick={handleBack} className="w-10 h-10 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                ) : (
                    <div className="w-10" />
                )}
                <h1 className="text-xl font-light tracking-wider">
                    <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-violet-400 bg-clip-text text-transparent">
                        ORIA
                    </span>
                </h1>
                <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500" />
                </div>
            </header>

            {/* Main Content */}
            <main className="px-5 pt-8">
                {/* Step Content */}
                {renderStepContent()}

                {/* Step Indicator */}
                <div className="text-center mt-12 mb-4">
                    <p className="text-zinc-600 text-sm">Step {currentStep} of {totalSteps}</p>
                </div>

                {/* Step Title & Description */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">{stepTitles[currentStep - 1]}</h2>
                    <p className="text-zinc-500">{stepDescriptions[currentStep - 1]}</p>
                </div>

                {/* Next Button */}
                <button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className={`w-full py-4 rounded-xl font-semibold transition-all ${
                        canProceed()
                            ? 'border-2 border-yellow-500 text-yellow-500 hover:bg-yellow-500/10'
                            : 'border-2 border-zinc-800 text-zinc-600 cursor-not-allowed'
                    }`}
                >
                    {currentStep === 5 ? 'Mint Asset' : 'Next'}
                </button>

                {/* Skip button for optional steps */}
                {currentStep === 2 && !coverFile && (
                    <button
                        onClick={handleNext}
                        className="w-full py-3 mt-3 text-zinc-500 hover:text-white transition-colors"
                    >
                        Skip
                    </button>
                )}
            </main>

            <BottomNav />
        </div>
    );
};

export default Mint;
