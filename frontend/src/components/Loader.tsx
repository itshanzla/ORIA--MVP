import React from 'react';

interface LoaderProps {
    fullScreen?: boolean;
    text?: string;
    size?: 'sm' | 'md' | 'lg';
}

const Loader: React.FC<LoaderProps> = ({ fullScreen = false, text = '', size = 'md' }) => {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16'
    };

    const spinnerSize = sizeClasses[size];

    const spinner = (
        <div className="relative">
            {/* Outer glow */}
            <div className={`absolute inset-0 ${spinnerSize} rounded-full bg-oria-purple/20 blur-xl animate-pulse-soft`} />

            {/* Spinner container */}
            <div className={`relative ${spinnerSize}`}>
                {/* Background ring */}
                <div className="absolute inset-0 rounded-full border-[3px] border-stroke-primary" />

                {/* Gradient spinning ring */}
                <svg
                    className="absolute inset-0 w-full h-full animate-spin"
                    viewBox="0 0 50 50"
                >
                    <defs>
                        <linearGradient id="spinnerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#8B5CF6" />
                            <stop offset="50%" stopColor="#3B82F6" />
                            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <circle
                        cx="25"
                        cy="25"
                        r="22"
                        fill="none"
                        stroke="url(#spinnerGradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray="100"
                        strokeDashoffset="30"
                    />
                </svg>

                {/* Center dot */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-br from-oria-purple to-oria-blue animate-pulse-soft" />
                </div>
            </div>
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface-primary/95 backdrop-blur-sm animate-fade-in">
                {/* Background subtle pattern */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0 bg-gradient-radial from-oria-purple/20 via-transparent to-transparent" />
                </div>

                <div className="relative flex flex-col items-center gap-6">
                    {spinner}

                    {text && (
                        <div className="text-center animate-fade-in-up">
                            <p className="text-body-sm text-content-secondary font-medium">
                                {text}
                            </p>
                            <div className="flex items-center justify-center gap-1 mt-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-oria-purple animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1.5 h-1.5 rounded-full bg-oria-purple animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1.5 h-1.5 rounded-full bg-oria-purple animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-8">
            {spinner}
            {text && (
                <p className="mt-4 text-body-sm text-content-tertiary animate-pulse-soft">
                    {text}
                </p>
            )}
        </div>
    );
};

export default Loader;
