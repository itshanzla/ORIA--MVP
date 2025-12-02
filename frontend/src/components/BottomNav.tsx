import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-900 px-6 py-4 pb-8 z-50">
            <div className="flex justify-between items-center max-w-md mx-auto">
                <button
                    onClick={() => navigate('/home')}
                    className={`flex flex-col items-center space-y-1 ${isActive('/home') ? 'text-white' : 'text-gray-500'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={isActive('/home') ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span className="text-[10px] font-medium">Home</span>
                </button>

                <button
                    onClick={() => navigate('/discover')}
                    className={`flex flex-col items-center space-y-1 ${isActive('/discover') ? 'text-white' : 'text-gray-500'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="text-[10px] font-medium">Discover</span>
                </button>

                <button
                    onClick={() => navigate('/mint')}
                    className={`flex flex-col items-center space-y-1 ${isActive('/mint') ? 'text-white' : 'text-gray-500'}`}
                >
                    <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center -mt-4 border-2 border-black">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                    <span className="text-[10px] font-medium">Mint</span>
                </button>

                <button
                    onClick={() => navigate('/library')}
                    className={`flex flex-col items-center space-y-1 ${isActive('/library') ? 'text-white' : 'text-gray-500'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span className="text-[10px] font-medium">Library</span>
                </button>
            </div>
        </div>
    );
};

export default BottomNav;
