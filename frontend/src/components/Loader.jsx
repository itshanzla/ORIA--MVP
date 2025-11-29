import React from 'react';

const Loader = ({ fullScreen = false, text = '' }) => {
    const containerClass = fullScreen
        ? 'fixed inset-0 flex flex-col items-center justify-center bg-black z-50'
        : 'flex flex-col items-center justify-center py-12';

    return (
        <div className={containerClass}>
            <div className="relative w-16 h-16">
                {/* Outer ring */}
                <div className="absolute inset-0 border-4 border-oria-purple/20 rounded-full"></div>

                {/* Spinning gradient ring */}
                <div className="absolute inset-0 border-4 border-transparent border-t-oria-purple border-r-oria-blue rounded-full animate-spin"></div>

                {/* Inner glow */}
                <div className="absolute inset-2 bg-gradient-to-br from-oria-purple/10 to-oria-blue/10 rounded-full blur-sm"></div>
            </div>

            {text && (
                <p className="mt-4 text-sm text-gray-400 animate-pulse">
                    {text}
                </p>
            )}
        </div>
    );
};

export default Loader;
